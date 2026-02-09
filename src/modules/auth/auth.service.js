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

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: userData.email }, { phoneNumber: userData.phoneNumber }],
      },
    });

    if (existingUser) {
      throw new gcprError(
        HttpStatus.CONFLICT,
        "User with this email or phone number already exists",
      );
    }

    const hashedPassword = await hash(userData.password);
    const otpMode = userData.otpChannel;
    delete userData.otpChannel;

    const newUser = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        dateOfBirth: userData.dateOfBirth
          ? new Date(userData.dateOfBirth)
          : undefined,
      },
    });

    if (otpMode === constants.OTP_MODES.SMS) {
      const otpResponse = await SendOTP(newUser.phoneNumber);
      await prisma.otp.create({
        data: {
          requestId: otpResponse.data.requestId,
          prefix: otpResponse.data.prefix,
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

      await sendEmail(newUser.email, "otp", { otp: otpCode });
    }

    return { otpChannel: otpMode };
  }

  static async verifyOtp(identifier, otp) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phoneNumber: identifier }],
      },
      include: { otp: true },
    });

    if (!user || !user.otp) {
      throw new gcprError(HttpStatus.NOT_FOUND, "User or OTP not found");
    }

    if (user.otp.expiresAt < new Date()) {
      throw new gcprError(HttpStatus.GONE, "OTP has expired");
    }

    // Handle SMS OTP verification (Hubtel)
    if (user.otp.requestId && user.otp.prefix) {
      try {
        const isValid = await VerifyOTP(
          user.otp.requestId,
          user.otp.prefix,
          otp,
        );
        if (!isValid) {
          throw new Error("Invalid OTP from Hubtel");
        }
      } catch (error) {
        throw new gcprError(HttpStatus.UNAUTHORIZED, "Invalid OTP");
      }
    }
    // Handle EMAIL OTP verification (Database)
    else if (user.otp.codeHash) {
      const validOtp = await compare(otp, user.otp.codeHash);
      if (!validOtp) {
        await prisma.otp.update({
          where: { id: user.otp.id },
          data: { attempts: { increment: 1 } },
        });
        throw new gcprError(HttpStatus.UNAUTHORIZED, "Invalid OTP");
      }
    } else {
      throw new gcprError(HttpStatus.UNAUTHORIZED, "Invalid OTP configuration");
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { verified: true },
    });

    await prisma.otp.delete({ where: { id: user.otp.id } });

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

    if (user.email) {
      await sendEmail(user.email, "success", {
        message: `${user.fullName}, your account has been verified.`,
      });
    }

    if (user.phoneNumber) {
      await SendSMS(
        user.phoneNumber,
        `Hello ${user.fullName}, your account has been verified successfully.`,
      );
    }

    return { accessToken, refreshToken, user: updatedUser };
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
      await sendEmail(user.email, "reset-password", { otp: otpCode });
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
}

export default AuthService;
