import prisma from '../../config/database.js';
import { hash, compare } from '../../utils/password.js';
import UtilFunctions from '../../utils/UtilFunctions.js';
import HttpStatus from '../../utils/http-status.js';
import { sendEmail } from '../../utils/emailSmtp.js';
import UploadService from '../../utils/uploadService.js';
import constants from '../../utils/constants.js';

class AuthService {
 static async registerUser( rq,userData) {
  if (!_.isEmpty(rq.files)) {
      if (_.has(rq.files, "profileImage")) {
        const fileName = `${userData.id}.jpg`;
        console.log(fileName);
        userData.profileImage = await UploadService.saveFile(
          rq.files.profileImage[0].buffer,
          fileName,
          constants.PROFILE_BUCKET
        );
        console.log(userData.profileImage);
      }
    }
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    throw new gcprError(
      HttpStatus.CONFLICT,
      'User with this email already exists'
    );
  }

  const hashedPassword = await hash(userData.password);

  // Create user
  const newUser = await prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
      dateOfBirth: userData.dateOfBirth
        ? new Date(userData.dateOfBirth)
        : undefined,
    },
  });

  // Generate OTP
  const otpCode = UtilFunctions.genOTP();
  console.log('Generated OTP:', otpCode); // ✅ Verify OTP generation
  const codeHash = await hash(otpCode);
  const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days

  // Insert OTP
  const otpRecord = await prisma.otp.create({
    data: {
      codeHash,
      expiresAt,
      userId: newUser.id,
    },
  });

  console.log('OTP record created:', otpRecord); // ✅ Verify it exists

  // Send OTP via email
  await sendEmail(newUser.email, 'otp', { otp: otpCode });

  return {
    message: 'Check your email for OTP verification',
  };
}

  static async verifyOtp(email, otp) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { otp: true }, 
  });

  if (!user || !user.otp) {
    throw new gcprError(HttpStatus.NOT_FOUND, 'User or OTP not found');
  }

  // Compare the hashed OTP
  const validOtp = await compare(otp, user.otp.codeHash);
  if (!validOtp) {
    // Optional: increment attempts
    await prisma.otp.update({
      where: { id: user.otp.id },
      data: { attempts: { increment: 1 } },
    });
    throw new gcprError(HttpStatus.UNAUTHORIZED, 'Invalid OTP');
  }

  // Check expiration
  if (user.otp.expiresAt < new Date()) {
    throw new gcprError(HttpStatus.GONE, 'OTP has expired');
  }

  await prisma.user.update({
  where: { id: user.id },
  data: { verified: true },
});

await prisma.otp.delete({
  where: { id: user.otp.id },
});

const updatedUser = await prisma.user.findUnique({
  where: { id: user.id },
});


  const accessToken = UtilFunctions.generateAccessToken({
    id: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
  });

const refreshToken = UtilFunctions.generateRefreshToken();

  // Store hashed refresh token
  await prisma.refreshToken.create({
    data: {
      tokenHash: await hash(refreshToken, 10),
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
    },
  });

  // Send success email
  const emailResult = await sendEmail(user.email, 'success', {
    message: `${user.fullName}, your account has been successfully verified, Kindly proceed with your profile creation on the app.`,
  });

  return {
    accessToken,
    refreshToken,
    user: updatedUser
  };
}

static async loginUser(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new gcprError(HttpStatus.NOT_FOUND, 'User not found');
  }

  const validPassword = await compare(password, user.password);
  if (!validPassword) {
    throw new gcprError(HttpStatus.UNAUTHORIZED, 'Invalid credentials');
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
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
    },
  });

  return {
    accessToken,
    refreshToken,
    user
  };
}

static async fogotPassword(email) {
  // Implementation for forgot password
  const user = await prisma.user.findUnique({
    where: { email },
  });
  if (!user) {
    throw new gcprError(HttpStatus.NOT_FOUND, 'User not found');
  }

  const otpCode = UtilFunctions.genOTP();
  const codeHash = await hash(otpCode);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  //remove existing otp if any
  await prisma.otp.deleteMany({
    where: { userId: user.id },
  });

  await prisma.otp.create({
    data: {
      codeHash,
      expiresAt,
      userId: user.id,
    },
  });

  await sendEmail(user.email, 'reset-password', { otp: otpCode });

  return { message: 'Password reset OTP sent to email' };


}

static async resetPassword(email, otp, newPassword) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { otp: true },
  });

  if (!user || !user.otp) {
    throw new gcprError(HttpStatus.NOT_FOUND, 'OTP not found');
  }

  const validOtp = await compare(otp, user.otp.codeHash);
  if (!validOtp) {
    throw new gcprError(HttpStatus.UNAUTHORIZED, 'Invalid OTP');
  }

  if (user.otp.expiresAt < new Date()) {
    throw new gcprError(HttpStatus.GONE, 'OTP expired');
  }

  const hashedPassword = await hash(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  await prisma.otp.delete({
    where: { id: user.otp.id },
  });

  return { message: 'Password reset successful' };
}




}

export default AuthService;
