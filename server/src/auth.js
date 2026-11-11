import jwt from "jsonwebtoken";

const secret = () => process.env.JWT_SECRET || "dev-secret-change-me";

export function signToken(payload) {
  return jwt.sign(payload, secret(), { expiresIn: "7d" });
}

export function setAuthCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// Tenant scoping: orgId always comes from the signed token, never from the request body.
export function requireAuth(req, res, next) {
  try {
    const { userId, orgId } = jwt.verify(req.cookies.token, secret());
    req.user = { userId, orgId };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
