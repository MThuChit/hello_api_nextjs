import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "mydefaultjwtsecret";

export function verifyJWT(req) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const token = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("token="))
      ?.split("=")[1];
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (e) {
    return null;
  }
}

export function signJWT(payload, options = { expiresIn: "7d" }) {
  return jwt.sign(payload, JWT_SECRET, options);
}

function normalizeTokenId(id) {
  if (!id) return null;

  if (typeof id === "string" && ObjectId.isValid(id)) {
    return new ObjectId(id);
  }

  if (typeof id === "object") {
    if (typeof id.$oid === "string" && ObjectId.isValid(id.$oid)) {
      return new ObjectId(id.$oid);
    }

    if (typeof id.toString === "function") {
      const maybeId = id.toString();
      if (ObjectId.isValid(maybeId)) {
        return new ObjectId(maybeId);
      }
    }
  }

  return null;
}

export function getUserFilterFromToken(tokenPayload) {
  const idFilter = normalizeTokenId(tokenPayload?.id);
  if (idFilter) {
    return { _id: idFilter };
  }

  if (tokenPayload?.email) {
    return { email: tokenPayload.email };
  }

  return null;
}
