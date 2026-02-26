import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Charger .env (placeholders) puis .env.local (valeurs locales sensibles qui remplacent les placeholders)
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const app = express();
const PORT = 3001;

// Middleware CORS spécifique pour le développement
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Augmenter la limite de taille des requêtes JSON (défaut: 100kb)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- RATE LIMITING: 150 requêtes par minute ---
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 150, // 150 requêtes par minute
  message: 'Trop de requêtes depuis cette adresse IP, veuillez réessayer après une minute.',
  standardHeaders: true, // Retourne les infos rate-limit dans les headers
  legacyHeaders: false, // Désactive les anciens headers X-RateLimit-*
});

app.use('/api/', limiter);

// Route pour les completions Perplexity
app.post('/api/completions', async (req, res) => {
  console.log('📝 Requête reçue:', JSON.stringify(req.body, null, 2));
  
  // Vérifier que la clé API existe
  if (!process.env.PERPLEXITY_API_KEY) {
    console.error('❌ PERPLEXITY_API_KEY n\'est pas définie');
    return res.status(500).json({ 
      error: "Configuration manquante", 
      details: "La clé API Perplexity n'est pas configurée. Veuillez ajouter PERPLEXITY_API_KEY dans les variables d'environnement (fichier .env pour le développement local)." 
    });
  }
  
  console.log('🔑 Clé API trouvée:', process.env.PERPLEXITY_API_KEY.substring(0, 10) + '...');
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Modifier la requête pour limiter les recherches externes
    const modifiedBody = {
      ...req.body,
      // Paramètres pour limiter les recherches web
      return_images: false,
      return_related_questions: false,
      max_tokens: 1000,
      temperature: 0.0 // Température très basse pour limiter la créativité
    };
    
    console.log('🚀 Envoi vers Perplexity:', JSON.stringify(modifiedBody, null, 2));
    
    // --- TIMEOUT: 30 secondes ---
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(modifiedBody),
      signal: controller.signal // Ajoute le timeout
    });

    clearTimeout(timeoutId);
    console.log('📡 Statut réponse Perplexity:', response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Erreur Perplexity:', text);
      
      // Gérer spécifiquement les erreurs 401 (non autorisé)
      if (response.status === 401) {
        return res.status(401).json({ 
          error: "Erreur d'authentification", 
          details: "La clé API Perplexity est invalide ou expirée. Veuillez vérifier votre clé API dans les variables d'environnement.",
          hint: "Assurez-vous que la clé commence par 'pplx-' et qu'elle est correctement configurée."
        });
      }
      
      // Pour les autres erreurs, essayer de parser le JSON si possible
      try {
        const errorJson = JSON.parse(text);
        return res.status(response.status).json(errorJson);
      } catch {
        // Si ce n'est pas du JSON (comme du HTML), retourner un message d'erreur structuré
        return res.status(response.status).json({ 
          error: `Erreur API Perplexity (${response.status})`, 
          details: response.statusText,
          raw_response: text.substring(0, 500) // Limiter la taille pour éviter les réponses trop longues
        });
      }
    }

    const data = await response.json();
    console.log('✅ Réponse Perplexity reçue');
    res.status(200).json(data);

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error("⏱️ Timeout: Requête Perplexity dépassée (30s)");
      return res.status(504).json({ error: "Timeout", details: "La requête a dépassé le délai limite de 30 secondes" });
    }
    console.error("💥 Erreur serveur:", error);
    res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
});

// Route pour récupérer les actualités CFDT Interco
app.get('/api/interco-rss', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const xml2js = await import('xml2js');
    const parser = new xml2js.default.Parser();

    const rssUrl = "https://interco.cfdt.fr/feed/rss";
    console.log(`📡 Récupération du flux Interco CFDT: ${rssUrl}`);

    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.error(`❌ Erreur fetch Interco RSS (${response.status}):`, response.statusText);
      return res.status(response.status).json({ error: 'Erreur récupération RSS Interco' });
    }

    const xmlText = await response.text();
    const jsonData = await parser.parseStringPromise(xmlText);

    const articles = (jsonData.rss?.channel?.[0]?.item || []).slice(0, 10).map((item) => ({
      title: item.title?.[0] || 'Sans titre',
      link: item.link?.[0] || '#',
      pubDate: item.pubDate?.[0] || new Date().toISOString(),
      category: Array.isArray(item.category) ? item.category[0] : (item.category || ''),
      description: item.description?.[0]?.replace(/<[^>]*>/g, '').trim().substring(0, 150) || ''
    }));

    console.log(`✅ ${articles.length} actualités Interco CFDT trouvées`);
    res.status(200).json({ items: articles });

  } catch (error) {
    console.error("💥 Erreur Interco RSS:", error);
    res.status(500).json({ error: "Erreur récupération RSS Interco", details: error.message });
  }
});

// Route pour récupérer les flux RSS (évite les problèmes CORS)
app.get('/api/rss', async (req, res) => {
  try {
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
    
    // Extraction des articles
    const articles = (jsonData.rss?.channel?.[0]?.item || []).slice(0, 10).map((item) => ({
      title: item.title?.[0] || 'Sans titre',
      link: item.link?.[0] || '#',
      pubDate: item.pubDate?.[0] || new Date().toISOString()
    }));
    
    console.log(`✅ ${articles.length} articles RSS trouvés`);
    res.status(200).json({ items: articles });
    
  } catch (error) {
    console.error("💥 Erreur RSS:", error);
    res.status(500).json({ error: "Erreur récupération RSS", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur API démarré sur http://localhost:${PORT}`);
});