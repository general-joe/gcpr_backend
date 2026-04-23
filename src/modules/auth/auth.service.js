import NotificationService from "../notification/notification.service.js";
import prisma from "../../config/database.js";
import { hash, compare } from "../../utils/password.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import HttpStatus from "../../utils/http-status.js";
import { sendEmail } from "../../utils/emailSmtp.js";
import UploadService from "../../utils/uploadService.js";
import constants from "../../utils/constants.js";
import {
  OTPMessage,
  SendOTP,
  SendSMS,
  VerifyOTP,
  ResendOTP,
} from "../../utils/hubtel-sms.js";

const extractOtpPayload = (otpResponse) =>
  otpResponse?.data ?? otpResponse ?? {};

class AuthService {
  static async registerUser(rq, userData) {
    if (rq.files?.profileImage) {
      const fileName = `${userData.id}.jpg`;
      userData.profileImage = await UploadService.saveFile(
        rq.files.profileImage[0].buffer,
        fileName,
        constants.PROFILE_BUCKET,
      );
    }

    const normalizedEmail =
      typeof userData.email === "string" && userData.email.trim().length > 0
        ? userData.email.trim().toLowerCase()
        : null;
    const normalizedPhone =
      typeof userData.phoneNumber === "string" &&
      userData.phoneNumber.trim().length > 0
        ? userData.phoneNumber.trim()
        : null;

    const identifierConditions = [];
    if (normalizedEmail) identifierConditions.push({ email: normalizedEmail });
    if (normalizedPhone)
      identifierConditions.push({ phoneNumber: normalizedPhone });

    if (!identifierConditions.length) {
      throw new gcprError(
        HttpStatus.BAD_REQUEST,
        "Email or phone number is required",
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: identifierConditions },
      select: { id: true, email: true, phoneNumber: true },
    });

    if (existingUser) {
      const conflictField =
        normalizedEmail && existingUser.email === normalizedEmail
          ? "email"
          : "phone number";
      throw new gcprError(
        HttpStatus.CONFLICT,
        `User with this ${conflictField} already exists`,
      );
    }

    const hashedPassword = await hash(userData.password);
    const otpMode = userData.otpChannel;
    delete userData.otpChannel;

    userData.email = normalizedEmail;
    userData.phoneNumber = normalizedPhone;

    const newUser = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        dateOfBirth: userData.dateOfBirth
          ? new Date(userData.dateOfBirth)
          : undefined,
      },
    });

    // Notify user of registration
    await NotificationService.createNotification({
      userId: newUser.id,
      type: "IN_APP",
      category: "SYSTEM",
      title: "Welcome!",
      content: "Your account has been created successfully.",
      relatedId: newUser.id,
      relatedModel: "User",
    });

    if (otpMode === constants.OTP_MODES.SMS) {
      // normalize Ghana numbers before SendOTP / SendSMS

      const otpResponse = await SendOTP(newUser.phoneNumber);
   
    WRITE.info("Hubtel raw OTP response", { otpResponse });

    const otpData = extractOtpPayload(otpResponse);

    if (!otpData?.requestId || !otpData?.prefix) {
      throw new Error(
        `Hubtel OTP response missing requestId or prefix: ${JSON.stringify(otpResponse)}`
      );
    }
    

      await prisma.otp.create({
        data: {
          requestId: otpData.requestId,
          prefix: otpData.prefix,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          userId: newUser.id,
        },
      });
    }

    if (otpMode === constants.OTP_MODES.EMAIL) {
      const otpCode = UtilFunctions.genOTP();
      const codeHash = await hash(otpCode);
      const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

      await prisma.otp.create({
        data: {
          codeHash,
          expiresAt,
          userId: newUser.id,
        },
      });

      const emailResult = await sendEmail(newUser.email, "otp", {
        otp: otpCode,
        name: newUser.fullName,
      });
      if (!emailResult.success) {
        console.error(
          "OTP EMAIL FAILED for",
          newUser.email,
          ":",
          emailResult.error,
        );
      } else {
        console.log(
          "OTP EMAIL SENT to",
          newUser.email,
          "messageId:",
          emailResult.messageId,
        );
      }
    }

    return { otpChannel: otpMode };
  }

  static async verifyOtp(identifier, otp) {
    const operationId = `OP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const maxAttempts = 5;

    try {
      WRITE.debug("OTP verification started", {
        operationId,
        identifier,
        timestamp: new Date().toISOString(),
      });

      // Initial check - user and OTP existence
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: identifier }, { phoneNumber: identifier }],
        },
        include: { otp: true },
      });

      if (!user || !user.otp) {
        WRITE.warn("OTP verification failed: User or OTP not found", {
          operationId,
          identifier,
          timestamp: new Date().toISOString(),
        });
        throw new gcprError(HttpStatus.NOT_FOUND, "User or OTP not found");
      }

      WRITE.debug("User and OTP found", {
        operationId,
        userId: user.id,
        otpId: user.otp.id,
        attempts: user.otp.attempts,
      });

      // Check max attempts
      if (user.otp.attempts >= maxAttempts) {
        WRITE.warn("OTP verification failed: Max attempts exceeded", {
          operationId,
          userId: user.id,
          attempts: user.otp.attempts,
          maxAttempts,
          timestamp: new Date().toISOString(),
        });
        throw new gcprError(
          HttpStatus.TOO_MANY_REQUESTS,
          `Too many failed attempts. Please request a new OTP.`,
        );
      }

      // Check OTP expiration
      if (user.otp.expiresAt < new Date()) {
        WRITE.warn("OTP verification failed: OTP expired", {
          operationId,
          userId: user.id,
          expiresAt: user.otp.expiresAt,
          timestamp: new Date().toISOString(),
        });
        throw new gcprError(HttpStatus.GONE, "OTP has expired");
      }

      // Verify OTP with external service or local hash (BEFORE transaction)
      let isValid = false;

      // Handle SMS OTP verification (Hubtel)
      if (user.otp.requestId && user.otp.prefix) {
        WRITE.debug("Verifying SMS OTP with Hubtel", {
          operationId,
          userId: user.id,
          requestId: user.otp.requestId,
        });

        isValid = await VerifyOTP(user.otp.requestId, user.otp.prefix, otp);

        if (!isValid) {
          WRITE.debug("Hubtel OTP verification failed", {
            operationId,
            userId: user.id,
            attempts: user.otp.attempts + 1,
          });
        }
      }
      // Handle EMAIL OTP verification (Database)
      else if (user.otp.codeHash) {
        WRITE.debug("Verifying email OTP locally", {
          operationId,
          userId: user.id,
        });

        isValid = await compare(otp, user.otp.codeHash);

        if (!isValid) {
          WRITE.debug("Email OTP verification failed", {
            operationId,
            userId: user.id,
            attempts: user.otp.attempts + 1,
          });
        }
      } else {
        WRITE.error("OTP verification failed: Invalid OTP configuration", {
          operationId,
          userId: user.id,
          timestamp: new Date().toISOString(),
        });
        throw new gcprError(
          HttpStatus.UNAUTHORIZED,
          "Invalid OTP configuration",
        );
      }

      // If OTP is invalid, increment attempts and fail
      if (!isValid) {
        // Increment attempts (non-critical, don't block if it fails)
        try {
          await prisma.otp.update({
            where: { id: user.otp.id },
            data: { attempts: { increment: 1 } },
          });
        } catch (incrementError) {
          WRITE.warn("Failed to increment OTP attempts", {
            operationId,
            userId: user.id,
            error: incrementError.message,
          });
        }

        WRITE.warn("OTP verification failed: Invalid OTP code", {
          operationId,
          userId: user.id,
          timestamp: new Date().toISOString(),
        });
        throw new gcprError(HttpStatus.UNAUTHORIZED, "Invalid OTP");
      }

      // OTP is valid - now use database transaction for all state changes
      // This prevents race conditions when multiple requests arrive simultaneously
      WRITE.debug("OTP code is valid, starting database transaction", {
        operationId,
        userId: user.id,
      });

      const result = await prisma.$transaction(async (tx) => {
        // Re-fetch the OTP record to ensure it still exists (another request might delete it)
        const currentOtp = await tx.otp.findUnique({
          where: { id: user.otp.id },
        });

        if (!currentOtp) {
          WRITE.warn(
            "OTP record was deleted by another request (race condition handled)",
            {
              operationId,
              userId: user.id,
            },
          );
          throw new gcprError(
            HttpStatus.CONFLICT,
            "OTP verification was already completed. Please log in.",
          );
        }

        // Update user as verified
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { verified: true },
        });

        WRITE.debug("User marked as verified in transaction", {
          operationId,
          userId: user.id,
        });

        // Delete OTP
        await tx.otp.delete({
          where: { id: user.otp.id },
        });

        WRITE.debug("OTP deleted from database", {
          operationId,
          userId: user.id,
        });

        // Create refresh token
        const refreshToken = UtilFunctions.generateRefreshToken();
        await tx.refreshToken.create({
          data: {
            tokenHash: await hash(refreshToken, 10),
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        WRITE.debug("Refresh token created", {
          operationId,
          userId: user.id,
        });

        return {
          user: updatedUser,
          refreshToken,
        };
      });

      // All critical database operations succeeded
      const accessToken = UtilFunctions.generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      WRITE.info("OTP verification completed successfully", {
        operationId,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      // Notify user of verification (fire-and-forget, don't block response)
      try {
        await NotificationService.createNotification({
          userId: user.id,
          type: "IN_APP",
          category: "SYSTEM",
          title: "Account Verified",
          content: "Your account has been verified.",
          relatedId: user.id,
          relatedModel: "User",
        });
        WRITE.debug("Verification notification created", {
          operationId,
          userId: user.id,
        });
      } catch (notificationError) {
        WRITE.warn("Failed to create verification notification", {
          operationId,
          userId: user.id,
          error: notificationError.message,
        });
      }

      // Send confirmation emails/SMS (fire-and-forget)
      if (user.email) {
        sendEmail(user.email, "success", {
          name: user.fullName,
          message: `${user.fullName}, your account has been verified.`,
        }).catch((err) => {
          WRITE.warn("Verification email failed", {
            operationId,
            userId: user.id,
            email: user.email,
            error: err.message,
          });
        });
      }

      if (user.phoneNumber) {
        SendSMS(
          user.phoneNumber,
          `Hello ${user.fullName}, your account has been verified successfully.`,
        ).catch((err) => {
          WRITE.warn("Verification SMS failed", {
            operationId,
            userId: user.id,
            phoneNumber: user.phoneNumber,
            error: err.message,
          });
        });
      }

      return {
        accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      };
    } catch (error) {
      if (error instanceof gcprError) {
        WRITE.warn(`OTP verification error: ${error.message}`, {
          operationId,
          identifier,
          statusCode: error.status,
          timestamp: new Date().toISOString(),
        });
      } else {
        WRITE.error("Unexpected error during OTP verification", {
          operationId,
          identifier,
          error: error.message,
          errorStack: error.stack,
          timestamp: new Date().toISOString(),
        });
      }
      throw error;
    }
  }

  static async forgotPassword(identifier) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phoneNumber: identifier }],
      },
    });

    if (!user) {
      throw new gcprError(HttpStatus.NOT_FOUND, "User not found");
    }

    const otpCode = UtilFunctions.genOTP();
    const codeHash = await hash(otpCode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.otp.deleteMany({ where: { userId: user.id } });

    await prisma.otp.create({
      data: { codeHash, expiresAt, userId: user.id },
    });

    if (identifier.includes("@")) {
      await sendEmail(user.email, "reset", {
        otp: otpCode,
        name: user.fullName,
      });
    } else {
      await SendSMS(
        user.phoneNumber,
        OTPMessage({ user_name: user.fullName, OTP: otpCode }),
      );
    }

    return { message: "Password reset OTP sent" };
  }

  static async resetPassword(identifier, otp, newPassword) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phoneNumber: identifier }],
      },
      include: { otp: true },
    });

    if (!user || !user.otp) {
      throw new gcprError(HttpStatus.NOT_FOUND, "OTP not found");
    }

    const validOtp = await compare(otp, user.otp.codeHash);
    if (!validOtp) {
      throw new gcprError(HttpStatus.UNAUTHORIZED, "Invalid OTP");
    }

    if (user.otp.expiresAt < new Date()) {
      throw new gcprError(HttpStatus.GONE, "OTP expired");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hash(newPassword) },
    });

    await prisma.otp.delete({ where: { id: user.otp.id } });

    // Notify user of password reset
    await NotificationService.createNotification({
      userId: user.id,
      type: "IN_APP",
      category: "SYSTEM",
      title: "Password Reset",
      content: "Your password has been reset successfully.",
      relatedId: user.id,
      relatedModel: "User",
    });

    return { message: "Password reset successful" };
  }

  static async loginUser(identifier, password) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phoneNumber: identifier }],
      },
    });

    if (!user) {
      throw new gcprError(HttpStatus.NOT_FOUND, "User not found");
    }

    const validPassword = await compare(password, user.password);
    if (!validPassword) {
      throw new gcprError(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    const accessToken = UtilFunctions.generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = UtilFunctions.generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        tokenHash: await hash(refreshToken, 10),
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const fetchedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { caregiver: true, serviceProvider: true },
    });

    return { accessToken, refreshToken, user: fetchedUser };
  }

  static async resendOtp(identifier) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phoneNumber: identifier }],
      },
      include: { otp: true },
    });

    if (!user) {
      throw new gcprError(HttpStatus.NOT_FOUND, "User not found");
    }

    if (!user.otp) {
      throw new gcprError(HttpStatus.NOT_FOUND, "No active OTP session found");
    }

    // Handle SMS OTP resend (Hubtel)
    if (user.otp.requestId) {
      try {
        const otpResponse = await ResendOTP(user.otp.requestId);
        const otpData = extractOtpPayload(otpResponse);
        const nextPrefix = otpData.prefix || user.otp.prefix;
        const nextRequestId = otpData.requestId || user.otp.requestId;

        if (!nextPrefix || !nextRequestId) {
          throw new gcprError(
            HttpStatus.BAD_REQUEST,
            "Unable to refresh OTP session. Please request a new OTP.",
          );
        }

        await prisma.otp.update({
          where: { id: user.otp.id },
          data: {
            requestId: nextRequestId,
            prefix: nextPrefix,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            attempts: 0,
          },
        });

        return { message: "OTP resent to your phone number" };
      } catch (error) {
        if (error instanceof gcprError) throw error;

        const errorMessage = error?.message || "Failed to resend SMS OTP";
        const isQuotaError =
          errorMessage.includes("maximum admitted 5 per 1m") ||
          errorMessage.includes('"code":"2001"') ||
          errorMessage.includes("quota exceeded");

        if (isQuotaError) {
          throw new gcprError(
            HttpStatus.TOO_MANY_REQUESTS,
            "Too many OTP resend requests. Please wait 1 minute and try again.",
          );
        }

        throw new gcprError(HttpStatus.BAD_REQUEST, errorMessage);
      }
    }
    // Handle EMAIL OTP resend
    else if (user.otp.codeHash) {
      const otpCode = UtilFunctions.genOTP();
      const codeHash = await hash(otpCode);
      const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

      await prisma.otp.update({
        where: { id: user.otp.id },
        data: {
          codeHash,
          expiresAt,
          attempts: 0,
        },
      });

      await sendEmail(user.email, "otp", { otp: otpCode, name: user.fullName });

      return { message: "OTP resent to your email address" };
    } else {
      throw new gcprError(HttpStatus.BAD_REQUEST, "Invalid OTP configuration");
    }
  }

  static async refreshToken(refreshToken, userId) {
    if (!refreshToken || !userId) {
      throw new gcprError(
        HttpStatus.BAD_REQUEST,
        "Refresh token and user ID are required",
      );
    }

    // Clean up expired tokens to improve performance
    await prisma.refreshToken.deleteMany({
      where: {
        userId,
        expiresAt: { lt: new Date() },
      },
    });

    // Find the refresh token for this user
    const storedTokens = await prisma.refreshToken.findMany({
      where: { userId },
      include: { user: true },
    });

    let matchedToken = null;
    for (const token of storedTokens) {
      const isValid = await compare(refreshToken, token.tokenHash);
      if (isValid) {
        matchedToken = token;
        break;
      }
    }

    if (!matchedToken) {
      throw new gcprError(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
    }

    if (matchedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: matchedToken.id } });
      throw new gcprError(HttpStatus.UNAUTHORIZED, "Refresh token has expired");
    }

    const user = matchedToken.user;

    const newAccessToken = UtilFunctions.generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = UtilFunctions.generateRefreshToken();

    // Delete old token
    await prisma.refreshToken.delete({ where: { id: matchedToken.id } });

    // Create new token using same hashing method as login
    await prisma.refreshToken.create({
      data: {
        tokenHash: await hash(newRefreshToken, 10),
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Clean up old tokens - keep only the 5 most recent tokens per user
    const allUserTokens = await prisma.refreshToken.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (allUserTokens.length > 5) {
      const tokensToDelete = allUserTokens.slice(5);
      await prisma.refreshToken.deleteMany({
        where: {
          id: { in: tokensToDelete.map((t) => t.id) },
        },
      });
    }

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}

export default AuthService;
