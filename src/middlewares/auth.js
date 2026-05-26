import UtilFunctions from "../utils/UtilFunctions.js";
import HttpStatus from "../utils/http-status.js";
import prisma from "../config/database.js";

import jwt from "jsonwebtoken";
import ResponseCodes from "../utils/responseCodes.js";

// for open routes, set user as guest
export function Auth(rq, rs, next) {
  const token = rq.headers.authorization;
  const client = rq.headers["x-client"] || "web";

  if (!token) {
    rs.locals.user = { id: null, userType: "guest", client, is_guest: true };
    return next();
  }

  try {
    const decoded = jwt.verify(
      token.toString().substring(6).trim(),
      process.env.JWT,
    );
    const userType = decoded.userType || "guest";
    const is_guest = userType === "guest";
    const roles = decoded.roles || [];

    rs.locals.user = {
      id: decoded.id || null,
      client,
      userType,
      is_guest,
      roles,
    };

    WRITE.debug("User authenticated", { userId: decoded.id, userType });
    return next();
  } catch (err) {
    WRITE.warn("Invalid authorization token", {
      error: err.message,
      ip: rq.ip,
      timestamp: new Date().toISOString(),
    });
    return UtilFunctions.outputError(
      rs,
      "The authorization token is invalid",
      {},
      ResponseCodes.INVALID_TOKEN,
      HttpStatus.UNAUTHORIZED,
    );
  }
}

/**
 * Middleware to check user type (CAREGIVER or SERVICE_PROVIDER).
 * Use for routes that distinguish between the two primary user types.
 * authorize(['SERVICE_PROVIDER', 'CAREGIVER'])
 */
export function authorize(allowedUserTypes = []) {
  return async (rq, rs, next) => {
    const authHeader = rq.headers.authorization;

    const client = rq.headers["x-client"] || "web";

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      WRITE.warn("Missing or invalid authorization header", {
        method: rq.method,
        path: rq.path,
        ip: rq.ip,
        timestamp: new Date().toISOString(),
      });
      return UtilFunctions.outputError(
        rs,
        "Authorization token is required",
        {},
        ResponseCodes.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT);

      if (!decoded?.id || !decoded?.userType) {
        WRITE.warn("Invalid token payload", {
          ip: rq.ip,
          path: rq.path,
          timestamp: new Date().toISOString(),
        });
        throw new Error("Invalid token payload");
      }

      // Always allow users with the 'admin' role
      const isAdmin = await prisma.userRole.findFirst({
        where: {
          userId: decoded.id,
          active: true,
          role: { slug: 'admin' },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });
      if (!allowedUserTypes.includes(decoded.userType) && !isAdmin) {
        WRITE.warn("Insufficient user type", {
          userId: decoded.id,
          userType: decoded.userType,
          requiredUserTypes: allowedUserTypes,
          method: rq.method,
          path: rq.path,
          timestamp: new Date().toISOString(),
        });
        return UtilFunctions.outputError(
          rs,
          "You do not have permission to access this resource",
          {},
          ResponseCodes.FORBIDDEN,
          HttpStatus.FORBIDDEN,
        );
      }

      rs.locals.user = {
        id: decoded.id,
        userType: decoded.userType,
        client,
        is_guest: false,
      };

      return next();
    } catch (err) {
      return UtilFunctions.outputError(
        rs,
        "Invalid or expired token",
        {},
        ResponseCodes.INVALID_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }
  };
}

export async function hasRbacRole(userId, allowedSlugs = []) {
  if (!userId || !Array.isArray(allowedSlugs) || allowedSlugs.length === 0) {
    return false;
  }

  const match = await prisma.userRole.findFirst({
    where: {
      userId,
      active: true,
      role: { slug: { in: allowedSlugs } },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  return Boolean(match);
}

export function authorizeOrRbacRole(
  allowedUserTypes = [],
  allowedRoleSlugs = [],
) {
  return async (rq, rs, next) => {
    const authHeader = rq.headers.authorization;
    const client = rq.headers["x-client"] || "web";

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      WRITE.warn("Missing or invalid authorization header", {
        method: rq.method,
        path: rq.path,
        ip: rq.ip,
        timestamp: new Date().toISOString(),
      });
      return UtilFunctions.outputError(
        rs,
        "Authorization token is required",
        {},
        ResponseCodes.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT);

      if (!decoded?.id || !decoded?.userType) {
        WRITE.warn("Invalid token payload", {
          ip: rq.ip,
          path: rq.path,
          timestamp: new Date().toISOString(),
        });
        throw new Error("Invalid token payload");
      }

      // Always allow users with the 'admin' role
      const isAdmin = await prisma.userRole.findFirst({
        where: {
          userId: decoded.id,
          active: true,
          role: { slug: 'admin' },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });
      if (
        allowedUserTypes.includes(decoded.userType) ||
        (await hasRbacRole(decoded.id, allowedRoleSlugs)) ||
        isAdmin
      ) {
        rs.locals.user = {
          id: decoded.id,
          userType: decoded.userType,
          client,
          is_guest: false,
        };
        return next();
      }

      WRITE.warn("Insufficient user type or role", {
        userId: decoded.id,
        userType: decoded.userType,
        requiredUserTypes: allowedUserTypes,
        requiredRoles: allowedRoleSlugs,
        method: rq.method,
        path: rq.path,
        timestamp: new Date().toISOString(),
      });

      return UtilFunctions.outputError(
        rs,
        "You do not have permission to access this resource",
        {},
        ResponseCodes.FORBIDDEN,
        HttpStatus.FORBIDDEN,
      );
    } catch (err) {
      return UtilFunctions.outputError(
        rs,
        "Invalid or expired token",
        {},
        ResponseCodes.INVALID_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }
  };
}

/**
 * RBAC middleware — checks that the authenticated user has at least one
 * of the specified AppRole slugs assigned via the UserRole table.
 * Use for admin/operational routes instead of authorize().
 * requireRbacRole(['ADMIN', 'IT_SUPPORT'])
 */
export function requireRbacRole(allowedSlugs = []) {
  return async (rq, rs, next) => {
    const authHeader = rq.headers.authorization;
    const client = rq.headers["x-client"] || "web";

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return UtilFunctions.outputError(
        rs,
        "Authorization token is required",
        {},
        ResponseCodes.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT);

      if (!decoded?.id || !decoded?.userType) {
        throw new Error("Invalid token payload");
      }

      // Always allow users with the 'admin' role
      const isAdmin = await prisma.userRole.findFirst({
        where: {
          userId: decoded.id,
          active: true,
          role: { slug: 'admin' },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });
      if (isAdmin) {
        rs.locals.user = {
          id: decoded.id,
          userType: decoded.userType,
          client,
          is_guest: false,
        };
        return next();
      }

      // Check RBAC UserRole table for any of the required slugs
      const match = await prisma.userRole.findFirst({
        where: {
          userId: decoded.id,
          active: true,
          role: { slug: { in: allowedSlugs } },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      if (!match) {
        WRITE.warn("RBAC role check failed", {
          userId: decoded.id,
          requiredSlugs: allowedSlugs,
          method: rq.method,
          path: rq.path,
          timestamp: new Date().toISOString(),
        });
        return UtilFunctions.outputError(
          rs,
          "You do not have the required role to access this resource",
          {},
          ResponseCodes.FORBIDDEN,
          HttpStatus.FORBIDDEN,
        );
      }

      rs.locals.user = {
        id: decoded.id,
        userType: decoded.userType,
        client,
        is_guest: false,
      };

      return next();
    } catch (err) {
      return UtilFunctions.outputError(
        rs,
        "Invalid or expired token",
        {},
        ResponseCodes.INVALID_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }
  };
}

/**
 * RBAC middleware — checks that the authenticated user has a specific
 * permission code (via assigned roles or direct UserPermission grants).
 * requirePermission('provider.verify')
 */
export function requirePermission(permissionCode) {
  return async (rq, rs, next) => {
    const authHeader = rq.headers.authorization;
    const client = rq.headers["x-client"] || "web";

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return UtilFunctions.outputError(
        rs,
        "Authorization token is required",
        {},
        ResponseCodes.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT);

      if (!decoded?.id || !decoded?.userType) {
        throw new Error("Invalid token payload");
      }

      // Always allow users with the 'admin' role
      const isAdmin = await prisma.userRole.findFirst({
        where: {
          userId: decoded.id,
          active: true,
          role: { slug: 'admin' },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });
      if (isAdmin) {
        rs.locals.user = {
          id: decoded.id,
          userType: decoded.userType,
          client,
          is_guest: false,
        };
        return next();
      }

      const perm = await prisma.permission.findUnique({
        where: { code: permissionCode },
      });

      if (!perm) {
        return UtilFunctions.outputError(
          rs,
          "Permission not configured on this server",
          {},
          ResponseCodes.FORBIDDEN,
          HttpStatus.FORBIDDEN,
        );
      }

      // Explicit deny takes priority
      const deny = await prisma.userPermission.findFirst({
        where: { userId: decoded.id, permissionId: perm.id, allowed: false },
      });
      if (deny) {
        return UtilFunctions.outputError(
          rs,
          "You do not have permission to perform this action",
          {},
          ResponseCodes.FORBIDDEN,
          HttpStatus.FORBIDDEN,
        );
      }

      // Explicit grant
      const grant = await prisma.userPermission.findFirst({
        where: { userId: decoded.id, permissionId: perm.id, allowed: true },
      });
      if (grant) {
        rs.locals.user = {
          id: decoded.id,
          userType: decoded.userType,
          client,
          is_guest: false,
        };
        return next();
      }

      // Grant via assigned roles
      const roleGrant = await prisma.rolePermission.findFirst({
        where: {
          permissionId: perm.id,
          role: { userRoles: { some: { userId: decoded.id, active: true } } },
        },
      });

      if (!roleGrant) {
        WRITE.warn("Permission check failed", {
          userId: decoded.id,
          permissionCode,
          method: rq.method,
          path: rq.path,
          timestamp: new Date().toISOString(),
        });
        return UtilFunctions.outputError(
          rs,
          "You do not have permission to perform this action",
          {},
          ResponseCodes.FORBIDDEN,
          HttpStatus.FORBIDDEN,
        );
      }

      rs.locals.user = {
        id: decoded.id,
        userType: decoded.userType,
        client,
        is_guest: false,
      };
      return next();
    } catch (err) {
      return UtilFunctions.outputError(
        rs,
        "Invalid or expired token",
        {},
        ResponseCodes.INVALID_TOKEN,
        HttpStatus.UNAUTHORIZED,
      );
    }
  };
}
