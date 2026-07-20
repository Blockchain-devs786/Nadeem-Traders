import { sql } from "./db";
import crypto from "crypto";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";

export async function getSessionToken() {
  if (typeof window !== "undefined") return null;
  try {
    return getCookie("nadeem_session_token") || null;
  } catch (e) {
    console.error("Failed to read session cookie:", e);
    return null;
  }
}

export async function setSessionToken(token: string, expires: Date) {
  if (typeof window !== "undefined") return;
  try {
    setCookie("nadeem_session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expires,
      path: "/"
    });
  } catch (e) {
    console.error("Failed to set session cookie:", e);
  }
}

export async function clearSessionToken() {
  if (typeof window !== "undefined") return;
  try {
    deleteCookie("nadeem_session_token");
  } catch (e) {
    console.error("Failed to delete session cookie:", e);
  }
}

export async function getGuestToken() {
  if (typeof window !== "undefined") return null;
  try {
    return getCookie("nadeem_guest_token") || null;
  } catch (e) {
    console.error("Failed to read guest cookie:", e);
    return null;
  }
}

export async function setGuestToken(token: string) {
  if (typeof window !== "undefined") return;
  try {
    setCookie("nadeem_guest_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      path: "/"
    });
  } catch (e) {
    console.error("Failed to set guest cookie:", e);
  }
}

export async function clearGuestToken() {
  if (typeof window !== "undefined") return;
  try {
    deleteCookie("nadeem_guest_token");
  } catch (e) {
    console.error("Failed to delete guest cookie:", e);
  }
}

export async function resolveUserOrGuest() {
  const sessionToken = await getSessionToken();
  if (sessionToken) {
    const session = await sql`
      SELECT user_id FROM sessions 
      WHERE id = ${sessionToken} AND active = TRUE AND expires_at > NOW()
    `;
    if (session.length > 0) {
      return { userId: session[0].user_id };
    }
  }

  let guestToken = await getGuestToken();
  if (!guestToken) {
    guestToken = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    await setGuestToken(guestToken);
  }
  return { guestSessionId: guestToken };
}
