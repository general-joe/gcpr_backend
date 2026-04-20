import prisma from "../../config/database.js";
import youtubeApi from "../../utils/youtube-api.js";
import NotificationService from "../notification/notification.service.js";

/**
 * User Service - Handles user-related business logic
 * Integrates YouTube API for video management with role-based access control
 */
class UserService {
  /**
   * Get user profile with all related data
   * @param {string} userId - The ID of the user
   * @returns {Promise<Object>} User profile with caregiver and serviceProvider data
   */
  static async getProfile(userId) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { caregiver: true, serviceProvider: true },
    });
  }

  /**
   * List all videos from the YouTube channel with database caching
   * Available to: ALL USERS (SERVICE_PROVIDER and CAREGIVER)
   *
   * @param {Object} options - Query options
   * @param {number} options.pageSize - Number of videos per page (default: 25)
   * @param {string} options.pageToken - Pagination token for next page
   * @param {string} options.order - Order of videos ('date', 'rating', 'relevance', 'title', 'videoCount', 'viewCount')
   * @returns {Promise<Object>} List of videos with pagination info
   * @throws {Error} If API key is missing or API call fails
   */
  static async listChannelVideos(options = {}) {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    const CACHE_TTL = 3600; // 1 hour cache TTL in seconds

    if (!apiKey || !channelId) {
      throw new Error("YouTube API key or Channel ID not configured");
    }

    const cacheKey = `youtube_channel_videos_${options.order || "date"}_${options.pageSize || 25}`;

    try {
      // Check if valid cache exists
      const cachedEntry = await prisma.videoCache.findUnique({
        where: { cacheKey },
      });

      if (cachedEntry && cachedEntry.isValid) {
        const lastFetchTime = new Date(cachedEntry.lastFetch).getTime();
        const currentTime = new Date().getTime();
        const ageInSeconds = (currentTime - lastFetchTime) / 1000;

        // Return cached data if not expired
        if (ageInSeconds < cachedEntry.ttl) {
          console.log(
            `[Cache HIT] Returning cached videos for key: ${cacheKey}`,
          );
          return {
            success: true,
            videos: cachedEntry.cachedData.videos || [],
            pageInfo: cachedEntry.pageInfo || {},
            fromCache: true,
          };
        }
      }

      // Fetch from YouTube API if no cache or cache expired
      console.log(
        `[Cache MISS] Fetching fresh videos from YouTube API for key: ${cacheKey}`,
      );
      const videoList = await youtubeApi.listChannelVideos(
        apiKey,
        channelId,
        options,
      );

      // Store in cache
      try {
        await prisma.videoCache.upsert({
          where: { cacheKey },
          update: {
            cachedData: videoList,
            pageInfo: videoList.pageInfo || {},
            lastFetch: new Date(),
            isValid: true,
            ttl: CACHE_TTL,
          },
          create: {
            cacheKey,
            cachedData: videoList,
            pageInfo: videoList.pageInfo || {},
            ttl: CACHE_TTL,
            isValid: true,
          },
        });
        console.log(
          `[Cache STORE] Stored videos in cache for key: ${cacheKey}`,
        );
      } catch (cacheError) {
        console.error("Error storing cache:", cacheError);
        // Continue even if cache storage fails - API data is still valid
      }

      return videoList;
    } catch (error) {
      // If API call fails, try to return expired cache as fallback
      try {
        const fallbackCache = await prisma.videoCache.findUnique({
          where: { cacheKey },
        });

        if (fallbackCache && fallbackCache.cachedData) {
          console.warn(
            `[Cache FALLBACK] API call failed, returning expired cache for key: ${cacheKey}`,
          );
          return {
            success: true,
            videos: fallbackCache.cachedData.videos || [],
            pageInfo: fallbackCache.pageInfo || {},
            fromCache: true,
            isExpired: true,
          };
        }
      } catch (fallbackError) {
        console.error("Error retrieving fallback cache:", fallbackError);
      }

      throw error;
    }
  }

  /**
   * Deactivate user account (soft delete)
   * @param {string} userId - The ID of the user
   * @returns {Promise<Object>} Updated user with deactivated status
   */
  static async deactivateAccount(userId) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: "DEACTIVATED"
      }
    });

    // Notify user on account deactivation
    try {
      await NotificationService.createNotification({
        userId,
        type: "IN_APP",
        category: "SYSTEM",
        title: "Account Deactivated",
        content: "Your account has been deactivated. If this was not you, please contact support immediately.",
        relatedId: userId,
        relatedModel: "User",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    } catch (e) {
      console.error("[Notification] Account deactivation notification failed:", e.message);
    }

    return user;
  }
  static async deleteUserAccount(userId) {
    // Soft delete: Mark the account as deleted without removing data
    const user = await prisma.user.delete({
      where: { id: userId }
    });

    // Notify user on account deletion
    try {
      await NotificationService.createNotification({
        userId,
        type: "IN_APP",
        category: "SYSTEM",
        title: "Account Deleted",
        content: "Your account has been deleted. If this was not you, please contact support immediately.",
        relatedId: userId,
        relatedModel: "User",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
    } catch (e) {
      console.error("[Notification] Account deletion notification failed:", e.message);
    }

    return user;
  }
}

export default UserService;
