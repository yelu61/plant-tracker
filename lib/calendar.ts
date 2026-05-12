async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function calendarToken(): Promise<string | null> {
  const p = process.env.APP_PASSWORD;
  if (!p) return null;
  return (await sha256(`calendar:${p}`)).slice(0, 24);
}

export async function calendarUrl(origin: string): Promise<string> {
  const token = await calendarToken();
  const u = new URL("/api/calendar/water", origin);
  if (token) u.searchParams.set("token", token);
  return u.toString();
}
