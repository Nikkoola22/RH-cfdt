// Fichier : /api/rss/route.js (Version finale pour Vercel / Bolt)

import { NextResponse } from 'next/server';

// Instruction pour Vercel/Next.js : cette route est 100% dynamique.
// Elle ne doit jamais être pré-calculée ou mise en cache statiquement.
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const feedUrl = searchParams.get('feedUrl');

  if (!feedUrl) {
    return NextResponse.json({ error: 'Le paramètre feedUrl est manquant' }, { status: 400 });
  }

  try {
    // On garde le "cache buster" par sécurité, c'est une bonne pratique.
    const urlAvecCacheBuster = `${feedUrl}?_=${new Date().getTime()}`;
    
    const response = await fetch(urlAvecCacheBuster, {
      // On redit à fetch de ne pas utiliser son propre cache interne.
      cache: 'no-store', 
    });

    if (!response.ok) {
      throw new Error(`Le serveur du flux a répondu avec le statut : ${response.status}`);
    }

    const xmlText = await response.text();
    
    // --- DÉBUT DE LA MODIFICATION SPÉCIFIQUE À VERCEL ---
    // On crée des en-têtes de réponse pour donner des ordres stricts à Vercel.
    const headers = new Headers();
    headers.set('Content-Type', 'application/xml');
    
    // C'est l'en-tête le plus important. Il dit à Vercel et aux navigateurs :
    // "Ne mettez jamais cette réponse en cache. Demandez-la à nouveau à chaque fois."
    headers.set('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
    
    // En-têtes additionnels pour les anciens systèmes de cache.
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    
    // On renvoie la réponse avec ces nouveaux en-têtes.
    return new Response(xmlText, { status: 200, headers });
    // --- FIN DE LA MODIFICATION ---

  } catch (error) {
    console.error(`Erreur API pour le flux ${feedUrl}:`, error);
    return NextResponse.json(
      { error: "Impossible de récupérer le flux RSS.", details: error.message },
      { status: 502 }
    );
  }
}
