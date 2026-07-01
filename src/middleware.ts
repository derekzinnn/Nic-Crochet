import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/session";

/** Guard the admin dashboard: unauthenticated requests bounce to the login. */
export async function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/area-da-nic";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/area-da-nic/painel/:path*"],
};
