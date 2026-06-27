import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Next.js 16 proxy (formerly middleware). Runs on every request matched below
// and gates the whole app behind a valid signed session cookie. The /login
// route and static assets are excluded via the matcher.
const secret = new TextEncoder().encode(process.env.SESSION_SECRET || "");

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  let valid = false;
  if (token && secret.length) {
    try {
      await jwtVerify(token, secret);
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (!valid) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Everything except login, Next internals, product images, and app icons.
  matcher: ["/((?!login|_next/static|_next/image|items/|favicon.ico|icon|apple-icon).*)"],
};
