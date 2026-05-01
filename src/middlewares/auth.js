import UtilFunctions from "../utils/UtilFunctions.js";
import HttpStatus from "../utils/http-status.js";

import jwt from "jsonwebtoken";
import ResponseCodes from "../utils/responseCodes.js";

// for open routes, set user as guest
export function Auth(rq, rs, next) {
  const token = rq.headers.authorization;
  const client = rq.headers["x-client"] || "web";

  if (!token) {
    rs.locals.user = { id: null, role: "guest", client, is_guest: true };
    return next();
  }
  
  try {
    const decoded = jwt.verify(
      token.toString().substring(6).trim(),
      process.env.JWT,
    );
    const role = decoded.role || "guest";
    const is_guest = role === "guest";

    rs.locals.user = {
      id: decoded.id || null,
      client,
      role,
      is_guest,
    };

    WRITE.debug("User authenticated", { userId: decoded.id, role });
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

//  use in router as middleware
//  choose roles to authorize
// authorize(['care_giver', 'service_worker'])

export function authorize(allowedRoles = []) {
  return (rq, rs, next) => {
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

      if (!decoded?.id || !decoded?.role) {
        WRITE.warn("Invalid token payload", {
          ip: rq.ip,
          path: rq.path,
          timestamp: new Date().toISOString(),
        });
        throw new Error("Invalid token payload");
      }
      if (!allowedRoles.includes(decoded.role)) {
        WRITE.warn("Insufficient permissions", {
          userId: decoded.id,
          userRole: decoded.role,
          requiredRoles: allowedRoles,
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
        role: decoded.role,
        client,
        is_guest: decoded.role === "guest",
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
