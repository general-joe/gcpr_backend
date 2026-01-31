import prisma from '../../config/database.js';
import { hash, compare  } from '../../utils/password.js';
import UtilFunctions from '../../utils/UtilFunctions.js';
import HttpStatus from '../../utils/http-status.js';

class AuthService {
    static async registerUser(userData) {
        const checkUserAvailabilty = await prisma.user.findUnique({
            where: {
                email: userData.email,
            },
        });

        if (checkUserAvailabilty) {
            throw new gcprError(HttpStatus.CONFLICT, 'User with this email already exists');
        }
        const hashedPassword = await hash(userData.password);
        const newUser = await prisma.user.create({
            data: {
                ...userData,
                password: hashedPassword,
                dateOfBirth: userData.dateOfBirth
            ? new Date(userData.dateOfBirth)
            : undefined,
            },
        });
        return UtilFunctions._clearNulls(newUser);
    }
}

export default AuthService;