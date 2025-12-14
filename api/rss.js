// Cache mémoire simple pour le flux RSS
let rssCache = {
  data: null,
  timestamp: 0,
  ttl: 5 * 60 * 1000 // 5 minutes
};

export default async function handler(req, res) {
  // Ajouter les headers CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = Date.now();
    // Si le cache est valide, servir depuis le cache
    if (rssCache.data && (now - rssCache.timestamp < rssCache.ttl)) {
      return res.status(200).json({ items: rssCache.data });
    }

    const fetch = (await import('node-fetch')).default;
    const xml2js = await import('xml2js');
    const parser = new xml2js.default.Parser();
    const rssUrl = "https://www.franceinfo.fr/politique.rss";
    console.log(`📡 Récupération du flux RSS: ${rssUrl}`);
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (!response.ok) {
      console.error(`❌ Erreur fetch RSS (${response.status}):`, response.statusText);
      return res.status(response.status).json({ error: 'Erreur récupération RSS' });
    }
    const xmlText = await response.text();
    const jsonData = await parser.parseStringPromise(xmlText);
    const articles = (jsonData.rss?.channel?.[0]?.item || []).slice(0, 10).map((item) => ({
      title: item.title?.[0] || 'Sans titre',
      link: item.link?.[0] || '#',
      pubDate: item.pubDate?.[0] || new Date().toISOString()
    }));
    // Mettre à jour le cache
    rssCache = {
      data: articles,
      timestamp: now,
      ttl: rssCache.ttl
    };
    console.log(`✅ ${articles.length} articles RSS trouvés (cache mis à jour)`);
    res.status(200).json({ items: articles });
  } catch (error) {
    console.error("💥 Erreur RSS:", error);
    res.status(500).json({ error: "Erreur récupération RSS", details: error.message });
  }
}

