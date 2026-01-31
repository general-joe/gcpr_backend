import UtilFunctions from "../utils/UtilFunctions.js";
import HttpStatus from "../utils/http-status.js";

import jwt from "jsonwebtoken";
import ResponseCodes from "../utils/responseCodes.js";

// for open routes, set user as guest
export function Auth(rq, rs, next) {
  const token = rq.headers.authorization;
  const client = rq.headers["x-client"] || "web";
  const key = rq.headers["x-api-key"];
  if (!token) {
    rs.locals.user = { id: null, role: "guest", client, is_guest: true };
    return next();
  }
  if (key !== process.env.API_KEY) {
    return UtilFunctions.outputError(
      rs,
      "Authorization token and API key are required for authentication",
      {},
      ResponseCodes.UNAUTHORIZED,
      HttpStatus.UNAUTHORIZED,
    );
  }
  WRITE.info(rq.method);
  WRITE.info(rq.baseUrl + rq.url);
  WRITE.info(rq.body);
  WRITE.info("---");

  try {
    const decoded = jwt.verify(
      token.toString().substring(6).trim(),
      process.env.JWT,
    );
    WRITE.info(`User id ${decoded.id}`);

    const role = decoded.role || "guest";
    const is_guest = role === "guest";

    rs.locals.user = {
      id: decoded.id || null,
      client,
      role,
      is_guest,
    };

    return next();
  } catch (err) {
    return UtilFunctions.outputError(
      rs,
      "The authorization token is invalid",
      {},
      ResponseCodes.INVALID_TOKEN,
      HttpStatus.UNAUTHORIZED,
    );
  }
}


// for protected routes, block guest users
export function AuthProtected(rq, rs, next) {
  if (rs.locals.user && rs.locals.user.is_guest) {
    return UtilFunctions.outputError(
      rs,
      "You must be logged in to access this resource",
      {},
      ResponseCodes.UNAUTHORIZED,
      HttpStatus.UNAUTHORIZED,
    );
  }
  return next();
}

