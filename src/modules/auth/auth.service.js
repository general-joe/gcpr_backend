import prisma from '../../config/database.js';
import { hash, compare } from '../../utils/password.js';
import UtilFunctions from '../../utils/UtilFunctions.js';
import HttpStatus from '../../utils/http-status.js';
import { sendEmail } from '../../utils/emailSmtp.js';

class AuthService {
 static async registerUser(userData) {
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

  // Delete OTP after successful verification
  await prisma.otp.delete({
    where: { id: user.otp.id },
  });

  // Send success email
  const emailResult = await sendEmail(user.email, 'success', {
    message: `${user.fullName}, your account has been successfully verified!`,
  });



  return {
    message: 'OTP verified successfully',
  };
}

 static async loginUser(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      caregiver: true,
      serviceProvider: true,
    },
  });

  if (!user) {
    throw new gcprError(HttpStatus.NOT_FOUND, 'User not found');
  }

  const validPassword = await compare(password, user.password);
  if (!validPassword) {
    throw new gcprError(HttpStatus.UNAUTHORIZED, 'Invalid credentials');
  }

  // Access token
  const accessToken = UtilFunctions.generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  // Refresh token
  const refreshToken = UtilFunctions.generateRefreshToken();

  // Store hashed refresh token
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
    user,
  };
}
}

export default AuthService;
