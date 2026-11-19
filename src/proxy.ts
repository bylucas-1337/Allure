import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/env";

const PUBLIC_PREFIXES = ["/auth/"];
const ONBOARDING_PATH = "/onboarding";

function isPublicPath(pathname: string) {
  return (
    pathname === "/connexion" ||
    pathname === "/offline.html" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/icons/") ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

function redirectWithCookies(
  request: NextRequest,
  pathname: string,
  response: NextResponse,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Sans configuration, on laisse la page de connexion expliquer le problème.
  if (!hasSupabaseEnv()) {
    if (pathname === "/connexion") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/connexion", request.url));
  }

  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Valide la session et rafraîchit les cookies si nécessaire.
  // En cas de panne réseau, on reste prudent : retour à la connexion.
  let isAuthenticated = false;
  let userId: string | null = null;

  try {
    const { data } = await supabase.auth.getUser();
    isAuthenticated = Boolean(data.user);
    userId = data.user?.id ?? null;
  } catch {
    if (pathname === "/connexion") {
      return response;
    }
    return redirectWithCookies(request, "/connexion", response);
  }

  if (!isAuthenticated && !isPublicPath(pathname)) {
    return redirectWithCookies(request, "/connexion", response);
  }

  if (isAuthenticated && pathname === "/connexion") {
    return redirectWithCookies(request, "/", response);
  }

  // Un compte sans onboarding terminé est orienté vers le parcours de profil.
  // En cas de doute (réseau, table absente), on ne bloque pas : cela évite
  // une boucle de redirection si la base répond mal.
  if (isAuthenticated && userId && !isPublicPath(pathname)) {
    let completed: boolean | null = null;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed_at")
        .eq("user_id", userId)
        .maybeSingle<{ onboarding_completed_at: string | null }>();

      if (!error) {
        completed = Boolean(data?.onboarding_completed_at);
      }
    } catch {
      completed = null;
    }

    const onOnboarding = pathname.startsWith(ONBOARDING_PATH);

    if (completed === false && !onOnboarding) {
      return redirectWithCookies(request, ONBOARDING_PATH, response);
    }

    if (completed === true && onOnboarding) {
      return redirectWithCookies(request, "/", response);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|offline.html|manifest.webmanifest|sw.js).*)",
  ],
};
