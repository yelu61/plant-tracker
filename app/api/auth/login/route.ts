import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(req: Request) {
  const form = await req.formData();
  const password = String(form.get("password") ?? "");
  const next = sanitizeNext(String(form.get("next") ?? "/"));
  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    return NextResponse.redirect(new URL(next, req.url), { status: 303 });
  }
  if (password !== expected) {
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "1");
    if (next !== "/") url.searchParams.set("next", next);
    return NextResponse.redirect(url, { status: 303 });
  }
  const hash = await sha256(expected);
  const store = await cookies();
  store.set("auth", hash, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return NextResponse.redirect(new URL(next, req.url), { status: 303 });
}

function sanitizeNext(s: string): string {
  if (!s.startsWith("/") || s.startsWith("//")) return "/";
  return s;
}
