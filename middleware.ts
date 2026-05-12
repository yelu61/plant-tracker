import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!_next|favicon\\.ico|icon\\.svg|manifest\\.json|sw\\.js|uploads|api/auth|api/calendar|login).*)",
  ],
};

export async function middleware(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();

  const cookie = req.cookies.get("auth")?.value;
  const expected = await sha256(password);
  if (cookie === expected) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  if (req.nextUrl.pathname !== "/") {
    url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  } else {
    url.searchParams.delete("next");
  }
  return NextResponse.redirect(url);
}

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
