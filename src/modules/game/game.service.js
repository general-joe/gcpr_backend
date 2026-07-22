import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import gcprError from "../../utils/http-error.js";
import {
  assertPatientAccess,
  getServiceProviderForUser,
} from "../../services/clinical/clinicalAccess.service.js";

const CPC_GAMES_BASE_URL = "https://www.cerebralpalsycenter.com/games/";

const CPC_GAME_TILES = [
  {
    slug: "touch-anywhere",
    title: "Touch Anywhere",
    ageRange: "3-6",
    focusedSkill: "Cause and effect",
    description:
      "Whole-screen single-action game for early intentional movement and first switch use.",
  },
  {
    slug: "bubble-pop",
    title: "Bubble Pop",
    ageRange: "3-9",
    focusedSkill: "Targeting and visual tracking",
    description:
      "Slow bubble popping activity that supports deliberate targeting and switch scanning practice.",
  },
  {
    slug: "music-pads",
    title: "Music Pads",
    ageRange: "3-6",
    focusedSkill: "Creative cause and effect",
    description:
      "Large stationary pads provide instant sound and light feedback for open creative play.",
  },
  {
    slug: "count-it",
    title: "Count It",
    ageRange: "6-9",
    focusedSkill: "Early numeracy",
    description:
      "Low-pressure counting and number recognition game with no timer or penalty.",
  },
  {
    slug: "memory-match",
    title: "Memory Match",
    ageRange: "6-9",
    focusedSkill: "Working memory and turn-taking",
    description:
      "Small no-fail card matching board for memory, attention, and shared play.",
  },
  {
    slug: "shape-sorter",
    title: "Shape Sorter",
    ageRange: "6-9",
    focusedSkill: "Matching and spatial sense",
    description:
      "Tap-to-pick and tap-to-place shape matching activity that avoids sustained drag demands.",
  },
  {
    slug: "odd-one-out",
    title: "Odd One Out",
    ageRange: "9-12",
    focusedSkill: "Visual discrimination",
    description:
      "Find the different item in a calm grid; supports focused attention and categorization.",
  },
  {
    slug: "pattern-echo",
    title: "Pattern Echo",
    ageRange: "9-12",
    focusedSkill: "Sequential memory",
    description:
      "No-fail Simon-style sequence game for attention, memory, and impulse control.",
  },
  {
    slug: "star-light",
    title: "Star Light",
    ageRange: "9-12+",
    focusedSkill: "Calm spatial exploration",
    description:
      "Any-order constellation activity for relaxed spatial exploration and completion confidence.",
  },
  {
    slug: "paint-grid",
    title: "Paint Grid",
    ageRange: "12+",
    focusedSkill: "Creative expression",
    description:
      "Open-ended grid painting activity for planning, color choice, and creative agency.",
  },
];

const BUILT_IN_GAMES = [
  {
    id: "builtin-cboard-aac",
    title: "Cboard AAC Communication Board",
    description:
      "Open-source augmentative and alternative communication board using symbols and text-to-speech for children and adults with speech and language impairments.",
    source: "EXTERNAL",
    externalProvider: "cboard",
    externalId: "cboard-aac",
    files: ["https://app.cboard.io/"],
    thumbnail: "https://www.cboard.io/favicon.ico",
    tags: ["aac", "communication", "speech", "symbols", "text-to-speech"],
    isPublished: true,
    publishedAt: null,
    metadata: {
      builtIn: true,
      activityType: "AAC_COMMUNICATION",
      launchUrl: "https://app.cboard.io/",
      launchMode: "IN_APP_WEBVIEW",
      shouldOpenExternally: false,
      websiteUrl: "https://www.cboard.io/en/",
      supportedPlatforms: ["web", "desktop", "tablet", "mobile"],
      offlineSupport: "Chrome desktop and Android",
      selectableMetrics: [
        "communicationAttempts",
        "successfulSelections",
        "promptedSelections",
        "symbolsUsed",
        "frustrationEvents",
      ],
    },
    uploaderUserId: null,
    uploaderProviderId: null,
    allowedRoleSlugs: ["service_provider", "caregiver"],
    createdAt: null,
    updatedAt: null,
    removedAt: null,
  },
  {
    id: "builtin-cpc-accessible-games",
    title: "Cerebral Palsy Center Accessible Games Hub",
    description:
      "Free calm accessible games for children with cerebral palsy, playable by switch, keyboard, touch, or mouse with no timers, no losing, no sign-up, no ads, and no tracking.",
    source: "EXTERNAL",
    externalProvider: "cerebralpalsycenter",
    externalId: "accessible-games-hub",
    files: [CPC_GAMES_BASE_URL],
    thumbnail: "https://www.cerebralpalsycenter.com/images/cpc-icon.png",
    tags: ["accessible-games", "cerebral-palsy", "switch", "keyboard", "touch", "mouse"],
    isPublished: true,
    publishedAt: null,
    metadata: {
      builtIn: true,
      activityType: "ACCESSIBLE_GAME_COLLECTION",
      launchUrl: CPC_GAMES_BASE_URL,
      launchMode: "IN_APP_WEBVIEW",
      shouldOpenExternally: false,
      guideUrl: `${CPC_GAMES_BASE_URL}overview/`,
      supportedInputs: ["single switch", "two switches", "keyboard", "touch", "mouse"],
      accessibilityFeatures: [
        "no timers",
        "no fail state",
        "large targets",
        "adjustable scan speed",
        "high contrast",
        "reduced motion",
        "optional sound",
        "offline capable",
      ],
      selectableMetrics: [
        "attempts",
        "successfulRounds",
        "independentActivations",
        "promptsNeeded",
        "engagementRating",
        "frustrationEvents",
      ],
    },
    uploaderUserId: null,
    uploaderProviderId: null,
    allowedRoleSlugs: ["service_provider", "caregiver"],
    createdAt: null,
    updatedAt: null,
    removedAt: null,
  },
  ...CPC_GAME_TILES.map((game) => ({
    id: `builtin-cpc-${game.slug}`,
    title: `CPC Accessible Game: ${game.title}`,
    description: game.description,
    source: "EXTERNAL",
    externalProvider: "cerebralpalsycenter",
    externalId: game.slug,
    files: [`${CPC_GAMES_BASE_URL}#${game.slug}`],
    thumbnail: "https://www.cerebralpalsycenter.com/images/cpc-icon.png",
    tags: ["accessible-games", "cerebral-palsy", game.slug, game.focusedSkill.toLowerCase()],
    isPublished: true,
    publishedAt: null,
    metadata: {
      builtIn: true,
      activityType: "ACCESSIBLE_GAME",
      launchUrl: `${CPC_GAMES_BASE_URL}#${game.slug}`,
      launchMode: "IN_APP_WEBVIEW",
      shouldOpenExternally: false,
      guideUrl: `${CPC_GAMES_BASE_URL}overview/`,
      ageRange: game.ageRange,
      focusedSkill: game.focusedSkill,
      supportedInputs: ["single switch", "two switches", "keyboard", "touch", "mouse"],
      accessibilityFeatures: ["no timers", "no fail state", "no ads", "no tracking"],
      selectableMetrics: [
        "attempts",
        "successfulRounds",
        "independentActivations",
        "promptsNeeded",
        "engagementRating",
        "frustrationEvents",
      ],
    },
    uploaderUserId: null,
    uploaderProviderId: null,
    allowedRoleSlugs: ["service_provider", "caregiver"],
    createdAt: null,
    updatedAt: null,
    removedAt: null,
  })),
];

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

function getBuiltInGame(gameId) {
  return BUILT_IN_GAMES.find((game) => game.id === gameId) || null;
}

function normalizeDate(value, fallback = new Date()) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new gcprError(HttpStatus.BAD_REQUEST, "Invalid date value");
  }
  return date;
}

function calculateChange(firstValue, lastValue) {
  if (
    firstValue === null ||
    firstValue === undefined ||
    lastValue === null ||
    lastValue === undefined
  ) {
    return null;
  }
  return lastValue - firstValue;
}

function normalizeDuration(durationMinutes) {
  if (durationMinutes === undefined || durationMinutes === null || durationMinutes === "") return null;
  const duration = Number(durationMinutes);
  if (!Number.isFinite(duration) || duration < 0) {
    throw new gcprError(HttpStatus.BAD_REQUEST, "durationMinutes must be a non-negative number");
  }
  return Math.round(duration);
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

    if (source) where.source = source.toUpperCase();
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

  static async listSelectableGames(user, query = {}) {
    const result = await GameService.listGames(user, query);
    const source = query.source?.toUpperCase();
    const tag = query.tag;
    const builtIns = BUILT_IN_GAMES.filter((game) => {
      if (source && game.source !== source) return false;
      if (tag && !game.tags.includes(tag)) return false;
      return true;
    }).map(enrichGame);

    return {
      data: [...builtIns, ...result.data],
      pagination: {
        ...result.pagination,
        total: result.pagination.total + builtIns.length,
        totalPages: Math.ceil((result.pagination.total + builtIns.length) / result.pagination.limit),
      },
    };
  }

  static async getGameById(user, gameId) {
    const builtInGame = getBuiltInGame(gameId);
    if (builtInGame) return enrichGame(builtInGame);

    const where = { id: gameId, removedAt: null };
    if (user.userType === "CAREGIVER") where.isPublished = true;

    const game = await prisma.gameResource.findFirst({ where });
    if (!game) throw new gcprError(HttpStatus.NOT_FOUND, "Game resource not found");

    return enrichGame(game);
  }

  static async assignGame(user, gameId, data = {}) {
    const { patientId, goals, frequency, dueDate, note } = data;
    if (!patientId) throw new gcprError(HttpStatus.BAD_REQUEST, "patientId is required");

    const provider = await getServiceProviderForUser(user.id);
    if (!provider) throw new gcprError(HttpStatus.NOT_FOUND, "Service provider profile not found");

    await assertPatientAccess(user, patientId);
    const game = await GameService.getGameById(user, gameId);

    return prisma.activityParticipationLog.create({
      data: {
        patientId,
        providerId: provider.id,
        activityName: game.title,
        activityCategory: "GAME_ASSIGNMENT",
        participatedOn: new Date(),
        durationMinutes: 0,
        outcome: "ASSIGNED",
        metadata: {
          type: "GAME_ASSIGNMENT",
          gameId,
          source: game.source,
          externalProvider: game.externalProvider,
          launchUrl: game.embedUrl || game.metadata?.launchUrl || game.files?.[0] || null,
          goals: Array.isArray(goals) ? goals : [],
          frequency: frequency || null,
          dueDate: dueDate || null,
          note: note || null,
        },
      },
    });
  }

  static async listPatientAssignments(user, patientId) {
    await assertPatientAccess(user, patientId);

    return prisma.activityParticipationLog.findMany({
      where: {
        patientId,
        activityCategory: "GAME_ASSIGNMENT",
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async logParticipation(user, gameId, data = {}) {
    const { patientId, participatedOn, durationMinutes, outcome, metrics, note } = data;
    if (!patientId) throw new gcprError(HttpStatus.BAD_REQUEST, "patientId is required");

    await assertPatientAccess(user, patientId);
    const game = await GameService.getGameById(user, gameId);
    let provider = await getServiceProviderForUser(user.id);

    if (!provider) {
      const assignments = await prisma.activityParticipationLog.findMany({
        where: {
          patientId,
          activityCategory: "GAME_ASSIGNMENT",
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      const assignment = assignments.find((item) => item.metadata?.gameId === gameId);
      if (assignment?.metadata?.gameId === gameId) {
        provider = { id: assignment.providerId };
      }
    }

    if (!provider) {
      throw new gcprError(HttpStatus.BAD_REQUEST, "A service provider assignment is required before caregiver logging");
    }

    return prisma.activityParticipationLog.create({
      data: {
        patientId,
        providerId: provider.id,
        activityName: game.title,
        activityCategory: "GAME_PLAY",
        participatedOn: normalizeDate(participatedOn),
        durationMinutes: normalizeDuration(durationMinutes),
        outcome: outcome || null,
        metadata: {
          type: "GAME_PLAY",
          gameId,
          source: game.source,
          externalProvider: game.externalProvider,
          metrics: metrics && typeof metrics === "object" ? metrics : {},
          note: note || null,
        },
      },
    });
  }

  static async getImprovementSummary(user, patientId, query = {}) {
    await assertPatientAccess(user, patientId);

    const where = {
      patientId,
      activityCategory: "GAME_PLAY",
    };
    if (query.from || query.to) {
      where.participatedOn = {};
      if (query.from) where.participatedOn.gte = normalizeDate(query.from);
      if (query.to) where.participatedOn.lte = normalizeDate(query.to);
    }

    const logs = await prisma.activityParticipationLog.findMany({
      where,
      orderBy: { participatedOn: "asc" },
    });

    const filteredLogs = query.gameId
      ? logs.filter((log) => log.metadata?.gameId === query.gameId)
      : logs;

    const byGame = new Map();
    for (const log of filteredLogs) {
      const key = log.metadata?.gameId || "unknown";
      const current = byGame.get(key) || {
        gameId: key,
        activityName: log.activityName,
        sessions: 0,
        totalDurationMinutes: 0,
        firstSessionAt: log.participatedOn,
        lastSessionAt: log.participatedOn,
        firstMetrics: log.metadata?.metrics || {},
        lastMetrics: log.metadata?.metrics || {},
      };

      current.sessions += 1;
      current.totalDurationMinutes += log.durationMinutes || 0;
      current.lastSessionAt = log.participatedOn;
      current.lastMetrics = log.metadata?.metrics || {};
      byGame.set(key, current);
    }

    const summaries = [...byGame.values()].map((summary) => {
      const metricChanges = {};
      for (const metricName of new Set([
        ...Object.keys(summary.firstMetrics),
        ...Object.keys(summary.lastMetrics),
      ])) {
        const firstValue = summary.firstMetrics[metricName];
        const lastValue = summary.lastMetrics[metricName];
        metricChanges[metricName] = {
          first: firstValue ?? null,
          last: lastValue ?? null,
          change:
            typeof firstValue === "number" && typeof lastValue === "number"
              ? calculateChange(firstValue, lastValue)
              : null,
        };
      }

      return { ...summary, metricChanges };
    });

    return {
      patientId,
      totalSessions: filteredLogs.length,
      totalDurationMinutes: filteredLogs.reduce((total, log) => total + (log.durationMinutes || 0), 0),
      games: summaries,
    };
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
