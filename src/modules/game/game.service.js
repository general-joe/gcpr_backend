import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";

function extractYoutubeVideoId(url) {
  if (!url) return null;
  // Handle youtu.be/ID
  const shortMatch = url.match(/youtu\.be\/([^?#&]+)/);
  if (shortMatch) return shortMatch[1];
  // Handle youtube.com/watch?v=ID
  const longMatch = url.match(/[?&]v=([^?#&]+)/);
  if (longMatch) return longMatch[1];
  // Handle youtube.com/embed/ID
  const embedMatch = url.match(/\/embed\/([^?#&]+)/);
  if (embedMatch) return embedMatch[1];
  return null;
}

function enrichGame(game) {
  if (!game) return game;
  let embedUrl = null;
  if (game.source === "YOUTUBE" && game.externalId) {
    embedUrl = `https://www.youtube.com/embed/${game.externalId}`;
  } else if (game.source === "EXTERNAL" && game.files && game.files[0]) {
    embedUrl = game.files[0];
  }
  return { ...game, embedUrl };
}

class GameService {
  static async requireServiceProvider(userId) {
    const sp = await prisma.serviceProvider.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (!sp) throw new gcprError(HttpStatus.NOT_FOUND, "Service provider profile not found");
    return sp;
  }

  static async createGame(user, data, file) {
    const sp = await GameService.requireServiceProvider(user.id);

    let externalId = null;
    let externalProvider = null;
    let files = [];
    let thumbnail = data.thumbnail || null;

    if (data.source === "YOUTUBE") {
      if (!data.externalUrl) throw new gcprError(HttpStatus.BAD_REQUEST, "externalUrl is required for YouTube source");
      externalId = extractYoutubeVideoId(data.externalUrl);
      if (!externalId) throw new gcprError(HttpStatus.BAD_REQUEST, "Invalid YouTube URL");
      externalProvider = "youtube";
    } else if (data.source === "EXTERNAL") {
      if (!data.externalUrl) throw new gcprError(HttpStatus.BAD_REQUEST, "externalUrl is required for EXTERNAL source");
      files = [data.externalUrl];
      externalProvider = "external";
    } else if (data.source === "UPLOADED") {
      if (!file) throw new gcprError(HttpStatus.BAD_REQUEST, "File upload is required for UPLOADED source");
      files = [file.path || file.location || file.filename || `uploads/${file.originalname}`];
    }

    const game = await prisma.gameResource.create({
      data: {
        title: data.title,
        description: data.description || null,
        source: data.source || "UPLOADED",
        externalProvider,
        externalId,
        files,
        thumbnail,
        tags: data.tags || [],
        allowedRoleSlugs: data.allowedRoleSlugs || [],
        metadata: data.metadata || {},
        uploaderUserId: user.id,
        uploaderProviderId: sp.id,
        isPublished: false
      }
    });

    return enrichGame(game);
  }

  static async listGames(user, query = {}) {
    const { source, tag, page = 1, limit = 20 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = { removedAt: null };

    if (user.userType === "CAREGIVER") {
      where.isPublished = true;
    }

    if (source) where.source = source;
    if (tag) where.tags = { has: tag };

    const [games, total] = await Promise.all([
      prisma.gameResource.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" }
      }),
      prisma.gameResource.count({ where })
    ]);

    return {
      data: games.map(enrichGame),
      pagination: { total, page: parseInt(page), limit: take, totalPages: Math.ceil(total / take) }
    };
  }

  static async getGameById(user, gameId) {
    const where = { id: gameId, removedAt: null };
    if (user.userType === "CAREGIVER") where.isPublished = true;

    const game = await prisma.gameResource.findFirst({ where });
    if (!game) throw new gcprError(HttpStatus.NOT_FOUND, "Game resource not found");

    return enrichGame(game);
  }

  static async updateGame(user, gameId, data) {
    const sp = await GameService.requireServiceProvider(user.id);
    const game = await prisma.gameResource.findFirst({ where: { id: gameId, removedAt: null } });
    if (!game) throw new gcprError(HttpStatus.NOT_FOUND, "Game resource not found");
    if (game.uploaderProviderId !== sp.id) throw new gcprError(HttpStatus.FORBIDDEN, "You can only update your own games");

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;
    if (data.allowedRoleSlugs !== undefined) updateData.allowedRoleSlugs = data.allowedRoleSlugs;

    return enrichGame(await prisma.gameResource.update({ where: { id: gameId }, data: updateData }));
  }

  static async deleteGame(user, gameId) {
    const sp = await GameService.requireServiceProvider(user.id);
    const game = await prisma.gameResource.findFirst({ where: { id: gameId, removedAt: null } });
    if (!game) throw new gcprError(HttpStatus.NOT_FOUND, "Game resource not found");
    if (game.uploaderProviderId !== sp.id) throw new gcprError(HttpStatus.FORBIDDEN, "You can only delete your own games");

    return prisma.gameResource.update({ where: { id: gameId }, data: { removedAt: new Date() } });
  }

  static async publishGame(user, gameId) {
    const sp = await GameService.requireServiceProvider(user.id);
    const game = await prisma.gameResource.findFirst({ where: { id: gameId, removedAt: null } });
    if (!game) throw new gcprError(HttpStatus.NOT_FOUND, "Game resource not found");
    if (game.uploaderProviderId !== sp.id) throw new gcprError(HttpStatus.FORBIDDEN, "You can only publish your own games");

    return enrichGame(await prisma.gameResource.update({
      where: { id: gameId },
      data: { isPublished: true, publishedAt: new Date() }
    }));
  }

  static async unpublishGame(user, gameId) {
    const sp = await GameService.requireServiceProvider(user.id);
    const game = await prisma.gameResource.findFirst({ where: { id: gameId, removedAt: null } });
    if (!game) throw new gcprError(HttpStatus.NOT_FOUND, "Game resource not found");
    if (game.uploaderProviderId !== sp.id) throw new gcprError(HttpStatus.FORBIDDEN, "You can only unpublish your own games");

    return enrichGame(await prisma.gameResource.update({
      where: { id: gameId },
      data: { isPublished: false }
    }));
  }
}

export default GameService;
