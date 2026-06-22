import { google } from "googleapis";
import axios from "axios";
import prisma from "../../config/database.js";
import gcprError from "../../utils/http-error.js";
import HttpStatus from "../../utils/http-status.js";
import { hash } from "../../utils/password.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import constants from "../../utils/constants.js";
import WRITE from "../../utils/logger.js";

class GoogleService {
  /**
   * Create a new OAuth2 client instance (avoid shared state between requests)
   */
  static createOAuth2Client() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("Google OAuth credentials not configured");
    }

    return new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );
  }

  /**
   * Generate Google OAuth authorization URL
   */
  static generateAuthUrl() {
    const oauth2Client = this.createOAuth2Client();
    const scopes = [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  static async exchangeCodeForTokens(code) {
    try {
      const oauth2Client = this.createOAuth2Client();
      const { tokens } = await oauth2Client.getToken(code);
      
      // Validate that we got the expected scopes (profile/email, not calendar)
      const expectedScopes = [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ];
      
      const grantedScopes = tokens.scope?.split(' ') || [];
      const hasExpectedScopes = expectedScopes.every(scope => grantedScopes.includes(scope));
      
      if (!hasExpectedScopes) {
        WRITE.warn("Google OAuth returned unexpected scopes", {
          grantedScopes,
          expectedScopes,
        });
        throw new gcprError(
          HttpStatus.UNAUTHORIZED,
          "Invalid OAuth scopes. Please use the Google login button to authenticate.",
        );
      }
      
      return tokens;
    } catch (error) {
      WRITE.error("Error exchanging code for tokens", {
        error: error.message,
        code,
      });
      if (error instanceof gcprError) throw error;
      throw new gcprError(
        HttpStatus.UNAUTHORIZED,
        "Failed to authenticate with Google",
      );
    }
  }

  /**
   * Get user info from Google
   */
  static async getUserInfo(tokens) {
    try {
      const oauth2Client = this.createOAuth2Client();
      oauth2Client.setCredentials(tokens);
      const service = google.people({
        version: "v1",
        auth: oauth2Client,
      });

      const response = await service.people.get({
        resourceName: "people/me",
        personFields: "emailAddresses,names,photos",
      });

      const data = response.data;

      return {
        id: data.resourceName,
        email: data.emailAddresses?.[0]?.value,
        firstName: data.names?.[0]?.givenName || "",
        lastName: data.names?.[0]?.familyName || "",
        profileImage: data.photos?.[0]?.url,
      };
    } catch (error) {
      WRITE.error("Error fetching user info from Google", {
        error: error.message,
        errorCode: error.code,
        errorResponse: error.response?.data,
      });
      throw new gcprError(
        HttpStatus.UNAUTHORIZED,
        "Failed to retrieve user information from Google",
      );
    }
  }

  /**
   * Handle Google OAuth callback and user authentication
   */
  static async handleGoogleCallback(code) {
    try {
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code);

      // Get user information
      const googleUser = await this.getUserInfo(tokens);

      if (!googleUser.email) {
        throw new gcprError(
          HttpStatus.BAD_REQUEST,
          "Email not available from Google account",
        );
      }

      const normalizedEmail = googleUser.email.toLowerCase();

      // Check if user exists
      let user = await prisma.user.findFirst({
        where: { email: normalizedEmail },
      });

      // If user doesn't exist, create a new one
      if (!user) {
        const userId = UtilFunctions.genId();
        // Generate a random temporary password
        const tempPassword =
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15);

        user = await prisma.user.create({
          data: {
            id: userId,
            email: normalizedEmail,
            fullName: `${googleUser.firstName} ${googleUser.lastName}`.trim(),
            firstName: googleUser.firstName,
            lastName: googleUser.lastName,
            phoneNumber: `google_${userId}`,
            password: await hash(tempPassword),
            verified: true,
            userType: constants.USER_TYPES.CAREGIVER,
            gender: "OTHER",
            dateOfBirth: new Date(),
          },
        });

        WRITE.info("New user created via Google OAuth", {
          userId: user.id,
          email: normalizedEmail,
        });
      }

      // Generate JWT tokens
      const accessToken = UtilFunctions.generateAccessToken({
        id: user.id,
        email: user.email,
        userType: user.userType,
        roles: user.roles || [],
      });

      const refreshToken = UtilFunctions.generateRefreshToken();

      // Store OAuth tokens (optional - for making API calls on behalf of user)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token,
        },
      });

      WRITE.info("User authenticated via Google OAuth", {
        userId: user.id,
        email: user.email,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
        },
        accessToken,
        refreshToken,
        tokens,
      };
    } catch (error) {
      WRITE.error("Google OAuth callback error", {
        error: error.message,
        code,
      });
      throw error;
    }
  }

  /**
   * Refresh Google access token
   */
  static async refreshGoogleToken(refreshToken) {
    try {
      const oauth2Client = this.createOAuth2Client();
      oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      WRITE.error("Error refreshing Google token", {
        error: error.message,
      });
      throw new gcprError(
        HttpStatus.UNAUTHORIZED,
        "Failed to refresh Google token",
      );
    }
  }
}

export default GoogleService;
