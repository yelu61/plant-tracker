import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const store = await cookies();
  store.delete("auth");
  return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
}
