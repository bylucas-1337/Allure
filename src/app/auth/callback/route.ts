import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/connexion?etat=erreur", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Échec de l’échange du lien de connexion Supabase.", error);
    return NextResponse.redirect(new URL("/connexion?etat=erreur", request.url));
  }

  return NextResponse.redirect(new URL("/", request.url));
}
