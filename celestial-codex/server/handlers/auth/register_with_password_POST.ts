import type { Request, Response } from "express";
import superjson from "superjson";
import { randomBytes } from "node:crypto";
import { db } from "../../db";
import { schema } from "../../../src/endpoints/auth/register_with_password_POST.schema";
import {
  setServerSession,
  SessionExpirationSeconds,
} from "../../session";
import { sendJson } from "../../lib/http";
import { generatePasswordHash } from "../../lib/generatePasswordHash";

function adminEmails(): string[] {
  return (process.env.CODEX_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function handle(req: Request, res: Response) {
  try {
    const json = superjson.parse(req.body as string);
    const { email, password, displayName } = schema.parse(json);

    const existingUser = db.data.users.find((u) => u.email === email);
    if (existingUser) {
      sendJson(res, { message: "email already in use" }, 409);
      return;
    }

    const passwordHash = await generatePasswordHash(password);
    const now = new Date().toISOString();

    const id = db.nextId("users");
    db.data.users.push({
      id,
      email,
      displayName,
      avatarUrl: null,
      role: adminEmails().includes(email.toLowerCase()) ? "admin" : "user",
      createdAt: now,
      updatedAt: now,
    });
    db.data.userPasswords.push({
      id: db.nextId("userPasswords"),
      userId: id,
      passwordHash,
      createdAt: now,
    });
    db.save();

    const sessionId = randomBytes(32).toString("hex");
    const at = new Date();
    const expiresAt = new Date(at.getTime() + SessionExpirationSeconds * 1000);
    db.data.sessions.push({
      id: sessionId,
      userId: id,
      createdAt: at.toISOString(),
      lastAccessed: at.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
    db.save();

    const user = db.data.users.find((u) => u.id === id)!;

    await setServerSession(req, res, {
      id: sessionId,
      createdAt: at.getTime(),
      lastAccessed: at.getTime(),
    });
    sendJson(res, {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    console.error("Registration error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Registration failed";
    sendJson(res, { message: errorMessage }, 400);
  }
}
