import { jwtVerify, SignJWT } from "jose";
import type { Request, Response } from "express";
import { db } from "./db";
import type { UserRole } from "./db";

/**
 * Port of the Floot session layer (helpers/getSetServerSession +
 * helpers/getServerUserSession) with two standalone adaptations:
 *  - cookie renamed floot_built_app_session -> codex_session
 *  - the Secure flag is applied only for https origins, so plain
 *    http://localhost dev works
 */

export const SessionExpirationSeconds = 60 * 60 * 24 * 7; // 1 week
export const CleanupProbability = 0.1;

const encoder = new TextEncoder();

function secret(): Uint8Array {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv) return encoder.encode(fromEnv);
  return encoder.encode("codex-dev-secret-change-me");
}

export interface SessionInfo {
  id: string;
  createdAt: number;
  lastAccessed: number;
  passwordChangeRequired?: boolean;
}

export const CookieName = "codex_session";

export class NotAuthenticatedError extends Error {
  constructor(message?: string) {
    super(message ?? "Not authenticated");
    this.name = "NotAuthenticatedError";
  }
}

export interface ServerUser {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
}

function requestIsSecure(req: Request): boolean {
  if (req.protocol === "https") return true;
  const origin = req.headers.origin;
  if (origin && origin !== "null" && origin.startsWith("https:")) return true;
  const ref = req.headers.referer;
  if (ref && ref.startsWith("https:")) return true;
  return false;
}

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie || "";
  return header.split(";").reduce((cookies: Record<string, string>, cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    const value = rest.join("=");
    if (name && value) cookies[name] = decodeURIComponent(value);
    return cookies;
  }, {});
}

export async function getServerSessionOrThrow(req: Request): Promise<SessionInfo> {
  const sessionCookie = parseCookies(req)[CookieName];
  if (!sessionCookie) throw new NotAuthenticatedError();
  try {
    const { payload } = await jwtVerify(sessionCookie, secret());
    return {
      id: payload.id as string,
      createdAt: payload.createdAt as number,
      lastAccessed: payload.lastAccessed as number,
      passwordChangeRequired: payload.passwordChangeRequired as boolean,
    };
  } catch {
    throw new NotAuthenticatedError();
  }
}

export async function setServerSession(
  req: Request,
  res: Response,
  session: SessionInfo
): Promise<void> {
  const token = await new SignJWT({
    id: session.id,
    createdAt: session.createdAt,
    lastAccessed: session.lastAccessed,
    passwordChangeRequired: session.passwordChangeRequired,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(secret());

  const flags = [
    `${CookieName}=${token}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${SessionExpirationSeconds}`,
  ];
  if (requestIsSecure(req)) flags.splice(2, 0, "Secure");
  res.setHeader("Set-Cookie", flags.join("; "));
}

export function clearServerSession(_req: Request, res: Response): void {
  const flags = [
    `${CookieName}=`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    "Max-Age=0",
  ];
  res.setHeader("Set-Cookie", flags.join("; "));
}

export async function getServerUserSession(req: Request): Promise<{
  user: ServerUser;
  session: SessionInfo;
}> {
  const session = await getServerSessionOrThrow(req);

  // Occasionally clean up expired sessions (same lazy strategy as Floot).
  if (Math.random() < CleanupProbability) {
    const expirationDate = new Date(Date.now() - SessionExpirationSeconds * 1000);
    const before = db.data.sessions.length;
    db.data.sessions = db.data.sessions.filter(
      (s) => new Date(s.lastAccessed) >= expirationDate
    );
    if (db.data.sessions.length !== before) db.save();
  }

  const row = db.data.sessions.find((s) => s.id === session.id);
  if (!row) throw new NotAuthenticatedError();
  const user = db.data.users.find((u) => u.id === row.userId);
  if (!user) throw new NotAuthenticatedError();

  const now = new Date();
  row.lastAccessed = now.toISOString();
  db.save();

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
    session: { ...session, lastAccessed: now.getTime() },
  };
}
