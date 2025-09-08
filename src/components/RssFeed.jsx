// Fichier : src/components/RssFeed.jsx (Version finale anti-cache Safari)

import { useEffect, useState } from "react";

// La fonction de parsing reste la même, elle est très bien.
function parseRSS(xmlText) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "text/xml");
    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      throw new Error("Le format du flux RSS est invalide (parsererror).");
    }
    const channel = doc.querySelector("channel");
    if (!channel) {
      throw new Error("Contenu invalide: la balise 'channel' est introuvable.");
    }
    const items = Array.from(channel.querySelectorAll("item")).map((item) => ({
      title: item.querySelector("title")?.textContent || "",
      link: item.querySelector("link")?.textContent || "",
      pubDate: item.querySelector("pubDate")?.textContent || null,
      guid: item.querySelector("guid")?.textContent || item.querySelector("link")?.textContent || "",
    }));
    return { items };
  } catch (e) {
    return { items: [], error: e.message };
  }
}

export default function RssFeed({ apiPath, feedUrl, limit = 10, displayMode = "default" }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!feedUrl || !apiPath) {
      setError("Configuration du composant RssFeed incomplète.");
      setLoading(false);
      return;
    }

    const fetchAndParseFeed = async () => {
      setLoading(true);
      setError("");
      try {
        // --- DÉBUT DE LA CORRECTION SPÉCIFIQUE POUR SAFARI ---
        // On ajoute un paramètre unique `_=` avec le timestamp actuel.
        // Cela force Safari (et tous les autres navigateurs/caches) à considérer
        // cette requête comme nouvelle à chaque fois, rendant le cache inutile.
        const urlAvecCacheBusterClient = `${apiPath}?feedUrl=${encodeURIComponent(feedUrl)}&_=${new Date().getTime()}`;
        
        const response = await fetch(urlAvecCacheBusterClient);
        // --- FIN DE LA CORRECTION ---

        if (!response.ok) {
          const errData = await response.json().catch(() => ({ error: "Réponse d'erreur non-JSON" }));
          throw new Error(errData.details || errData.error || `Le serveur a répondu avec une erreur ${response.status}`);
        }

        const xmlText = await response.text();
        const parsed = parseRSS(xmlText);

        if (parsed.error) {
          throw new Error(parsed.error);
        }
        
        setItems(parsed.items.slice(0, limit));

      } catch (e) {
        setError(`Erreur de chargement du flux : ${e.message}`);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAndParseFeed();
    // On ajoute feedUrl à la liste des dépendances pour que le flux se recharge si l'URL change.
  }, [apiPath, feedUrl, limit]);

  if (loading) return <div role="status" aria-live="polite">Chargement du flux…</div>;
  if (error) return <div role="alert" style={{ color: "#b00020", padding: "10px", background: "#ffebee", borderRadius: "8px" }}>{error}</div>;
  if (!items || items.length === 0) return <div>Aucun article à afficher.</div>;

  // Votre JSX pour le mode "simple" est parfait.
  if (displayMode === "simple") {
    return (
      <div className="animate-marquee whitespace-nowrap flex items-center">
        {[...items, ...items].map((item, index) => (
          <a 
            key={`${item.guid || item.link || index}-${index}`} 
            href={item.link} 
            target="_blank" 
            rel="noreferrer" 
            className="text-2xl text-black font-medium mx-8 hover:text-gray-600 transition-colors cursor-pointer underline decoration-dotted"
          >
            • {item.title}
          </a>
        ))}
      </div>
    );
  }

  // Le reste du JSX pour l'affichage détaillé
  return (
    <section aria-label="Lecteur RSS">
      {/* ... votre JSX pour l'affichage détaillé ... */}
    </section>
  );
}
