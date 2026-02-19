import prisma from "../../config/database.js";

class UserService {
  static async getProfile(userId) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { caregiver: true, serviceProvider: true },
    });
  }
}

export default UserService;
