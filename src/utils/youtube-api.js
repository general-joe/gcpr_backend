/**
 * YouTube API utility functions for managing channel content
 * Provides functions to upload, publish, list, and delete videos from YouTube channels
 */

import axios from "axios";
import fs from "fs";
import path from "path";

const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";

/**
 * Upload and publish a video to a YouTube channel
 * @param {string} apiKey - YouTube API key
 * @param {string} videoTitle - Title of the video
 * @param {string} videoDescription - Description of the video
 * @param {string} videoFilePath - Path to the video file to upload
 * @param {Array} tags - Array of tags for the video
 * @param {string} categoryId - YouTube category ID (default: '22' for nonprofits)
 * @returns {Promise<Object>} - Uploaded video details including video ID
 * */

import { google } from "googleapis";
import { Readable } from "stream";



/**
 * Get all videos from the channel
 * @param {string} apiKey - YouTube API key
 * @param {string} channelId - ID of the YouTube channel
 * @param {Object} options - Query options (pageSize, pageToken, etc.)
 * @returns {Promise<Array>} - Array of video objects
 */
async function listChannelVideos(apiKey, channelId, options = {}) {
  try {
    const pageSize = options.pageSize || 25;
    const pageToken = options.pageToken || "";

    const params = {
      key: apiKey,
      channelId: channelId,
      part: "snippet",
      maxResults: pageSize,
      order: options.order || "date", // date, rating, relevance, title, videoCount, viewCount
      type: "video",
    };
    if (pageToken) {
      params.pageToken = pageToken;
    }

    const response = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
      params,
    });
    const videos = response.data.items.map((item) => {
      const videoId = item.id.videoId;

      return {
        videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.default.url,
        publishedAt: item.snippet.publishedAt,
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`, // ✅ add this
      };
    });
    return {
      success: true,
      videos: videos,
      totalResults: response.data.pageInfo.totalResults,
      pageInfo: {
        totalResults: response.data.pageInfo.totalResults,
        resultsPerPage: response.data.pageInfo.resultsPerPage,
        nextPageToken: response.data.nextPageToken || null,
        prevPageToken: response.data.prevPageToken || null,
      },
    };
  } catch (error) {
    console.log("Error listing channel videos:", error.response?.data || error);
    throw new Error(`Failed to list channel videos: ${error.message}`);
  }
}

export default {
  listChannelVideos,

};
