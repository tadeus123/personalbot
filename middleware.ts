import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/auth") ||
    request.nextUrl.pathname === "/login";
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isPublicApi =
    request.nextUrl.pathname.startsWith("/api/discover") ||
    request.nextUrl.pathname.startsWith("/api/bots/") ||
    request.nextUrl.pathname.startsWith("/api/conversations") ||
    request.nextUrl.pathname.startsWith("/api/well-known") ||
    request.nextUrl.pathname.startsWith("/api/beacon");

  if (isDashboard && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Add CORS for bot API routes
  if (isPublicApi) {
    supabaseResponse.headers.set("Access-Control-Allow-Origin", "*");
    supabaseResponse.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS"
    );
    supabaseResponse.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Bot-Api-Key"
    );
  }

  if (request.method === "OPTIONS" && isPublicApi) {
    return new NextResponse(null, {
      status: 204,
      headers: supabaseResponse.headers,
    });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/:path*",
    "/login",
    "/api/discover/:path*",
    "/api/bots/:path*",
    "/api/conversations/:path*",
    "/api/well-known/:path*",
    "/api/beacon/:path*",
  ],
};
