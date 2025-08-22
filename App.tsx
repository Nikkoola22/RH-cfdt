import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Clock, GraduationCap, Users, Phone, Mail, MapPin, ArrowRight, Sparkles, Send, ArrowLeft, Home, Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";

// --- IMPORTATIONS DES DONNÉES ---
import { sommaire } from "./data/sommaire.ts";
import { chapitres } from "./data/temps.ts";
import { formation } from "./data/formation.ts";
import { teletravailData } from "./data/teletravail.ts";
import { infoItems } from "./data/info-data.ts";
import { podcastEpisodes, type PodcastEpisode } from "./data/podcasts/mp3.ts";

// --- TYPES ---
interface ChatMessage {
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface InfoItem {
  id: number;
  title: string;
  content: string;
}

interface ChatbotState {
  currentView: "menu" | "chat";
  selectedDomain: number | null;
  messages: ChatMessage[];
  isProcessing: boolean;
}

// --- CONFIGURATION API ---
const API_KEY = "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";
const API_URL = "https://api.perplexity.ai/chat/completions";

// --- URL DU FLUX RSS ET DONNÉES DE SECOURS ---
const fluxOriginal = "https://www.franceinfo.fr/politique.rss";
const proxyUrl = "https://corsproxy.io/?";
const FLUX_ACTUALITES_URL = proxyUrl + encodeURIComponent(fluxOriginal);

// Données de secours si le flux RSS ne fonctionne pas
const actualitesSecours = [
  {
    title: "Réforme des retraites : nouvelles négociations prévues",
    link: "#",
    pubDate: new Date().toISOString(),
    guid: "1",
  },
  {
    title: "Budget 2024 : les principales mesures votées",
    link: "#",
    pubDate: new Date().toISOString(),
    guid: "2",
  },
  {
    title: "Fonction publique : accord sur les salaires",
    link: "#",
    pubDate: new Date().toISOString(),
    guid: "3",
  },
  {
    title: "Télétravail : nouvelles directives gouvernementales",
    link: "#",
    pubDate: new Date().toISOString(),
    guid: "4",
  },
  {
    title: "Dialogue social : rencontre avec les syndicats",
    link: "#",
    pubDate: new Date().toISOString(),
    guid: "5",
  },
];

// --- PARSING DES DONNÉES ---
const sommaireData = JSON.parse(sommaire);

// --- FONCTION DE NETTOYAGE ---
const nettoyerChaine = (chaine: string): string => {
  if (typeof chaine !== "string") return "";
  return chaine
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, "")
    .trim();
};

// --- NOUVEAU COMPOSANT NEWS TICKER ---
const NewsTicker: React.FC = () => {
  const [actualites, setActualites] = useState(actualitesSecours);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const chargerFluxRSS = async () => {
      try {
        const response = await fetch(FLUX_ACTUALITES_URL);
        if (!response.ok) throw new Error("Échec du chargement");

        const xmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, "text/xml");

        const items = Array.from(doc.querySelectorAll("item"))
          .slice(0, 10)
          .map((item, index) => ({
            title: item.querySelector("title")?.textContent || `Actualité ${index + 1}`,
            link: item.querySelector("link")?.textContent || "#",
            pubDate: item.querySelector("pubDate")?.textContent || new Date().toISOString(),
            guid: item.querySelector("guid")?.textContent || `${index}`,
          }));

        if (items.length > 0) {
          setActualites(items);
        }
      } catch (error) {
        console.log("Utilisation des données de secours pour les actualités");
      } finally {
        setLoading(false);
      }
    };
    chargerFluxRSS();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 bg-blue-900/80 rounded-lg">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        <span className="ml-2 text-white text-sm">Chargement des actualités...</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-blue-900/80 rounded-lg overflow-hidden border border-blue-500/30 shadow-inner">
      <div className="flex items-center whitespace-nowrap py-3 ticker-container">
        <div className="flex animate-ticker hover:[animation-play-state:paused]">
          {[...actualites, ...actualites].map((item, index) => (
            <a
              key={`${item.guid}-${index}`}
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center mx-6 text-white hover:text-blue-200 transition-colors no-underline"
            >
              <span className="mr-2 text-yellow-300">📰</span>
              <span className="font-medium text-sm sm:text-base">{item.title}</span>
              <span className="mx-4 text-blue-300">•</span>
            </a>
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-container {
          overflow: hidden;
          white-space: nowrap;
        }
        .animate-ticker {
          display: inline-flex;
          animation: ticker 40s linear infinite;
        }
      `}</style>
    </div>
  );
};

// --- FONCTION DE RECHERCHE ---
const trouverContextePertinent = (question: string): string => {
  const questionNettoyee = nettoyerChaine(question);
  const motsQuestionNettoyes = questionNettoyee.split(/\s+/).filter((mot) => mot.length > 0);
  const chapitresTrouves = new Map<number, { score: number }>();

  sommaireData.chapitres.forEach((chapitreItem, index) => {
    let score = 0;
    const chapitreId = index + 1;
    const motsClesChapitre = chapitreItem.mots_cles || [];
    const motsClesArticles = (chapitreItem.articles || []).flatMap((article) => article.mots_cles || []);
    const tousLesMotsCles = [...motsClesChapitre, ...motsClesArticles];

    tousLesMotsCles.forEach((motCle) => {
      const motCleNettoye = nettoyerChaine(motCle);
      if (!motCleNettoye) return;
      if (motsQuestionNettoyes.includes(motCleNettoye)) {
        score += 10;
      } else if (questionNettoyee.includes(motCleNettoye)) {
        score += 5;
      }
    });

    if (score > 0) {
      const chapitreExistant = chapitresTrouves.get(chapitreId) || { score: 0 };
      chapitreExistant.score += score;
      chapitresTrouves.set(chapitreId, chapitreExistant);
    }
  });

  if (chapitresTrouves.size === 0) {
    return (
      "Aucun chapitre spécifique trouvé pour cette question. Voici un aperçu général des thèmes: " +
      sommaireData.chapitres.map((s) => s.titre).join(", ")
    );
  }

  const resultatsTries = Array.from(chapitresTrouves.entries())
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, 3)
    .map(([id]) => {
      const chapitreData = sommaireData.chapitres[id - 1];
      const contenuTexte = chapitres[id] || null;
      if (!contenuTexte) {
        console.warn(`Le contenu pour le chapitre ID ${id} (${chapitreData.titre}) n'a pas été trouvé dans temps.ts.`);
        return null;
      }
      return `Source: ${chapitreData.titre}\nContenu: ${contenuTexte}`;
    })
    .filter(Boolean);

  if (resultatsTries.length === 0) {
    return "Aucun contenu textuel trouvé pour les chapitres pertinents.";
  }

  return resultatsTries.join("\n\n---\n\n");
};

// --- COMPOSANT LECTEUR DE PODCAST CORRIGÉ ---
const PodcastPlayer: React.FC = () => {
  const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
    setIsLoading(false);

    const updateTime = () => {
      if (audio.currentTime !== undefined && !isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };

    const handleLoadedData = () => {
      setIsLoading(false);
    };

    const handleLoadedMetadata = () => {
      updateDuration();
      setIsLoading(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      const currentIndex = podcastEpisodes.findIndex((ep) => ep.id === currentEpisode?.id);
      if (currentIndex < podcastEpisodes.length - 1) {
        setCurrentEpisode(podcastEpisodes[currentIndex + 1]);
      }
    };

    const handleError = (e: Event) => {
      setIsLoading(false);
      setIsPlaying(false);
      const target = e.target as HTMLAudioElement;
      if (target && target.error) {
        console.error("Code d'erreur:", target.error.code);
        console.error("Message d'erreur:", target.error.message);
      }
      setError("Impossible de charger ce podcast. Vérifiez votre connexion.");
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("pause", handlePause);
    audio.volume = volume;

    if (currentEpisode) {
      audio.load();
    }

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("pause", handlePause);
    };
  }, [currentEpisode, volume]);

  const playPause = async () => {
    const audio = audioRef.current;
    if (!audio || !currentEpisode) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        setError(null);

        if (audio.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
          audio.load();
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              cleanup();
              reject(new Error("Timeout lors du chargement"));
            }, 10000);

            const handleCanPlay = () => {
              cleanup();
              resolve();
            };

            const handleError = (e: Event) => {
              cleanup();
              reject(e);
            };

            const cleanup = () => {
              clearTimeout(timeout);
              audio.removeEventListener("canplay", handleCanPlay);
              audio.removeEventListener("canplaythrough", handleCanPlay);
              audio.removeEventListener("error", handleError);
            };

            audio.addEventListener("canplay", handleCanPlay);
            audio.addEventListener("canplaythrough", handleCanPlay);
            audio.addEventListener("error", handleError);
          });
        }

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
          setIsLoading(false);
        }
      }
    } catch (error) {
      let errorMessage = "Impossible de lire ce podcast.";
      if (error instanceof Error) {
        if (error.name === "NotSupportedError") {
          errorMessage = "Format audio non supporté.";
        } else if (error.name === "NotAllowedError") {
          errorMessage = "Lecture bloquée par le navigateur. Cliquez d'abord sur la page.";
        } else if (error.message.includes("network")) {
          errorMessage = "Problème de connexion réseau.";
        }
      }
      setError(errorMessage);
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const selectEpisode = (episode: PodcastEpisode) => {
    setCurrentEpisode(episode);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
    setIsLoading(false);
  };

  const skipToNext = () => {
    const currentIndex = podcastEpisodes.findIndex((ep) => ep.id === currentEpisode?.id);
    if (currentIndex < podcastEpisodes.length - 1) {
      selectEpisode(podcastEpisodes[currentIndex + 1]);
    }
  };

  const skipToPrevious = () => {
    const currentIndex = podcastEpisodes.findIndex((ep) => ep.id === currentEpisode?.id);
    if (currentIndex > 0) {
      selectEpisode(podcastEpisodes[currentIndex - 1]);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || isNaN(duration) || duration === 0) return;

    const percentage = parseFloat(e.target.value);
    const newTime = (percentage / 100) * duration;
    if (isFinite(newTime) && newTime >= 0 && newTime <= duration) {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const getProgressPercentage = () => {
    if (!duration || isNaN(duration) || duration === 0) return 0;
    return (currentTime / duration) * 100;
  };

  return (
    <div className={`fixed left-4 top-1/2 transform -translate-y-1/2 z-50 transition-all duration-300 ${isMinimized ? "w-60" : "w-72"}`}>
      <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl shadow-2xl border border-purple-500/30 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between">
          <h3 className={`font-bold text-white ${isMinimized ? "text-sm" : "block"}`}>
            {isMinimized ? "🎧 Podcasts" : "🎧 Podcasts CFDT"}
          </h3>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white hover:text-purple-200 transition-colors text-lg"
          >
            {isMinimized ? "⬜" : "➖"}
          </button>
        </div>

        {!isMinimized && (
          <>
            <div className="max-h-64 overflow-y-auto p-4 space-y-2 podcast-episodes">
              {podcastEpisodes.map((episode) => (
                <button
                  key={episode.id}
                  onClick={() => selectEpisode(episode)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                    currentEpisode?.id === episode.id
                      ? "bg-purple-600 text-white shadow-lg"
                      : "bg-white/10 text-gray-200 hover:bg-white/20"
                  }`}
                >
                  <div className="font-medium text-sm">{episode.title}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {episode.duration} • {episode.description}
                  </div>
                  {episode.date && (
                    <div className="text-xs opacity-60 mt-1">
                      📅 {episode.date}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {currentEpisode && (
              <div className="p-4 border-t border-purple-500/30">
                <div className="text-white text-sm font-medium mb-2 truncate">
                  {currentEpisode.title}
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-2 mb-4">
                    <div className="text-red-200 text-xs">{error}</div>
                  </div>
                )}

                {isLoading && (
                  <div className="flex items-center justify-center mb-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span className="text-white text-xs ml-2">Chargement...</span>
                  </div>
                )}

                <div className="mb-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={getProgressPercentage()}
                    onChange={handleSeek}
                    className="w-full h-2 bg-purple-300 rounded-lg appearance-none cursor-pointer slider"
                    disabled={!duration || isNaN(duration) || duration === 0}
                  />
                  <div className="flex justify-between text-xs text-gray-300 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-4 mb-4">
                  <button
                    onClick={skipToPrevious}
                    className="text-white hover:text-purple-200 transition-colors disabled:opacity-50"
                    disabled={!currentEpisode || podcastEpisodes.findIndex((ep) => ep.id === currentEpisode.id) === 0}
                  >
                    <SkipBack className="w-6 h-6" />
                  </button>

                  <button
                    onClick={playPause}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 transition-colors disabled:opacity-50"
                    disabled={!currentEpisode || isLoading}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>

                  <button
                    onClick={skipToNext}
                    className="text-white hover:text-purple-200 transition-colors disabled:opacity-50"
                    disabled={!currentEpisode || podcastEpisodes.findIndex((ep) => ep.id === currentEpisode.id) === podcastEpisodes.length - 1}
                  >
                    <SkipForward className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-gray-300" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume * 100}
                    onChange={handleVolumeChange}
                    className="flex-1 h-2 bg-purple-300 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                <audio
                  ref={audioRef}
                  src={currentEpisode.url}
                  preload="metadata"
                  controls={false}
                  style={{ display: "none" }}
                  crossOrigin="anonymous"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// --- COMPOSANT PRINCIPAL APP ---
function App() {
  const [chatState, setChatState] = useState<ChatbotState>({
    currentView: "menu",
    selectedDomain: null,
    messages: [],
    isProcessing: false,
  });
  const [inputValue, setInputValue] = useState("");
  const [selectedInfo, setSelectedInfo] = useState<InfoItem | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToChat = () => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        const headerHeight = 150;
        const chatPosition = chatContainerRef.current.offsetTop;
        const scrollPosition = Math.max(0, chatPosition - headerHeight);
        window.scrollTo({
          top: scrollPosition,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  const handleInfoClick = (info: InfoItem) => setSelectedInfo(info);

  const handleDomainSelection = (domainId: number) => {
    const welcomeMessages = {
      0: "Bonjour ! Je peux vous aider avec vos questions sur les horaires, congés, ARTT, temps partiel, heures supplémentaires, absences, etc.",
      1: "Bonjour ! Je peux vous renseigner sur le CPF, les congés de formation, la VAE, les concours, les bilans de compétences, etc. Quelle est votre question ?",
      2: "Bonjour ! Je suis l'assistant spécialiste du télétravail. Posez-moi vos questions sur la charte, les jours autorisés, les indemnités, etc.",
    };

    setChatState({
      currentView: "chat",
      selectedDomain: domainId,
      messages: [
        {
          type: "assistant",
          content: welcomeMessages[domainId],
          timestamp: new Date(),
        },
      ],
      isProcessing: false,
    });

    scrollToChat();
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  const returnToMenu = () => {
    setChatState({ currentView: "menu", selectedDomain: null, messages: [], isProcessing: false });
    setInputValue("");
    setSelectedInfo(null);
  };

  const appelPerplexity = async (messages: any[]) => {
    const data = { model: "sonar-pro", messages };
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Détail de l'erreur API:", errorBody);
      throw new Error(`Erreur API (${response.status}): ${response.statusText}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
  };

  const traiterQuestion = async (question: string) => {
    let contexteInterne = "";
    if (chatState.selectedDomain === 0) {
      contexteInterne = trouverContextePertinent(question);
    } else if (chatState.selectedDomain === 1) {
      contexteInterne = JSON.stringify(formation, null, 2);
    } else if (chatState.selectedDomain === 2) {
      contexteInterne = teletravailData;
    }

    const systemPrompt = `
      Tu es un collègue syndical spécialiste pour la mairie de Gennevilliers.
      Ta mission est de répondre aux questions des agents en te basant EXCLUSIVEMENT sur la documentation fournie ci-dessous.
      NE JAMAIS utiliser tes connaissances générales.
      Si la réponse ne se trouve pas dans la documentation, réponds : "Je ne trouve pas l'information dans les documents à ma disposition. Veuillez contacter le 64 64 pour plus de détails."
      Sois précis, utilise un ton AMICAL et cite le titre du chapitre si possible.
      --- DEBUT DE LA DOCUMENTATION PERTINENTE ---
      ${contexteInterne}
      --- FIN DE LA DOCUMENTATION PERTINENTE ---
    `;

    const conversationHistory = chatState.messages.slice(1).map((msg) => ({
      role: msg.type === "user" ? "user" : "assistant",
      content: msg.content,
    }));

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: question },
    ];

    const reponseAssistant = await appelPerplexity(apiMessages);
    return reponseAssistant;
  };

  const handleSendMessage = async () => {
    const question = inputValue.trim();
    if (!question || chatState.isProcessing) return;

    scrollToChat();
    const userMessage: ChatMessage = { type: "user", content: question, timestamp: new Date() };
    setChatState((prevState) => ({ ...prevState, messages: [...prevState.messages, userMessage], isProcessing: true }));
    setInputValue("");

    try {
      const reponseContent = await traiterQuestion(question);
      const assistantMessage: ChatMessage = { type: "assistant", content: reponseContent, timestamp: new Date() };
      setChatState((prevState) => ({ ...prevState, messages: [...prevState.messages, assistantMessage] }));
    } catch (error) {
      console.error("Erreur lors du traitement de la question:", error);
      const errorMessage: ChatMessage = {
        type: "assistant",
        content: "Désolé, une erreur est survenue. Veuillez réessayer ou contacter un représentant si le problème persiste.",
        timestamp: new Date(),
      };
      setChatState((prevState) => ({ ...prevState, messages: [...prevState.messages, errorMessage] }));
    } finally {
      setChatState((prevState) => ({ ...prevState, isProcessing: false }));
      scrollToChat();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0" style={{ backgroundImage: `url('/unnamed.png')` }}></div>
      <div className="fixed inset-0 bg-black/10 z-0"></div>

      <PodcastPlayer />

      <header className="relative bg-gradient-to-r from-white/95 via-orange-50/95 to-white/95 shadow-2xl border-b-4 border-orange-500 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center sm:text-left flex flex-col sm:flex-row items-center gap-6 justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-6 flex-grow">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-400 via-red-400 to-orange-500 rounded-full blur-lg opacity-70 animate-pulse"></div>
              <div className="relative p-6 bg-gradient-to-br from-white to-orange-50 rounded-full shadow-2xl">
                <Users className="w-20 h-20 text-orange-500" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 bg-clip-text text-transparent drop-shadow-sm">
                Atlas: Chatbot CFDT
              </h1>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Mairie de GENNEVILLIERS
              </h2>
              <p className="mt-4 flex justify-center sm:justify-start items-center gap-2 text-lg text-gray-700">
                <Users className="text-orange-500 w-5 h-5 animate-pulse" />
                Assistant syndical CFDT pour les agents municipaux
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-r from-orange-400 via-orange-500 to-red-400 rounded-full blur-2xl opacity-90 animate-pulse"></div>
            <div className="absolute -inset-6 bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500 rounded-full blur-xl opacity-70"></div>
            <div className="absolute -inset-4 bg-gradient-to-r from-orange-200 via-orange-300 to-orange-400 rounded-full blur-lg opacity-50"></div>
            <div className="relative bg-white rounded-full p-2 shadow-lg">
              <img src="/logo-cfdt.png" alt="Logo CFDT" className="relative w-44 h-44 object-contain z-20" style={{ maxHeight: "176px" }} />
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 z-10">
        {chatState.currentView === "menu" && (
          <>
            <section className="relative bg-orange-300 text-black overflow-hidden mx-4 rounded-2xl shadow-lg z-10">
              <div className="relative h-20 flex items-center overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-40 flex items-center justify-center bg-orange-400 z-20 shadow-md">
                  <span className="text-2xl font-bold">NEWS FTP:</span>
                </div>
                <div className="animate-marquee whitespace-nowrap flex items-center pl-44" style={{ animation: "marquee 30s linear infinite" }}>
                  {[...infoItems, ...infoItems, ...infoItems].map((info, index) => (
                    <button
                      key={`${info.id}-${index}`}
                      onClick={() => handleInfoClick(info)}
                      className="text-2xl font-medium mx-8 hover:text-blue-200 transition-colors cursor-pointer underline decoration-dotted"
                    >
                      #{info.id}: {info.title}
                    </button>
                  ))}
                </div>
              </div>
              <style jsx>{`
                @keyframes marquee {
                  0% { transform: translateX(0%); }
                  100% { transform: translateX(-33.33%); }
                }
              `}</style>
            </section>

            {selectedInfo && (
              <section className="info-detail bg-white p-6 rounded-lg shadow-md mt-8 max-w-4xl mx-auto">
                <h3 className="text-xl font-bold mb-4">{selectedInfo.title}</h3>
                <p>{selectedInfo.content}</p>
                <button onClick={() => setSelectedInfo(null)} className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                  Fermer
                </button>
              </section>
            )}

            <section className="text-center my-8">
              <h3 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-purple-700 bg-clip-text text-transparent mb-4">
                Choisissez votre domaine d’assistance
              </h3>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Sélectionnez le service qui correspond à vos besoins. Nos assistants IA spécialisés vous aideront.
              </p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <button
                onClick={() => handleDomainSelection(0)}
                className="group relative overflow-hidden bg-white/95 border-2 border-orange-200 rounded-3xl p-10 transition-all duration-500 hover:border-orange-400 hover:shadow-2xl hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10 flex flex-col items-center gap-6">
                  <div className="relative">
                    <span className="absolute -inset-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl opacity-20 transition blur-lg group-hover:scale-110"></span>
                    <div className="relative p-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl shadow-2xl group-hover:rotate-3 group-hover:scale-110 transition-all">
                      <Clock className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-800 group-hover:text-orange-700">
                    Règlement du Temps de Travail
                  </h4>
                  <p className="text-center text-gray-600">
                    Horaires, congés, ARTT, temps partiel, heures sup, absences…
                  </p>
                  <div className="flex items-center gap-2 text-orange-500 opacity-0 group-hover:opacity-100 transition">
                    <span className="font-semibold">Accéder à l’assistant</span>
                    <ArrowRight className="w-4 h-4 animate-pulse" />
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleDomainSelection(1)}
                className="group relative overflow-hidden bg-white/95 border-2 border-purple-200 rounded-3xl p-10 transition-all duration-500 hover:border-purple-400 hover:shadow-2xl hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10 flex flex-col items-center gap-6">
                  <div className="relative">
                    <span className="absolute -inset-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-3xl opacity-20 transition blur-lg group-hover:scale-110"></span>
                    <div className="relative p-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-3xl shadow-2xl group-hover:rotate-3 group-hover:scale-110 transition-all">
                      <GraduationCap className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-800 group-hover:text-purple-700">
                    Formation Professionnelle
                  </h4>
                  <p className="text-center text-gray-600">
                    CPF, congés formation, VAE, concours, bilans de compétences…
                  </p>
                  <div className="flex items-center gap-2 text-purple-500 opacity-0 group-hover:opacity-100 transition">
                    <span className="font-semibold">Accéder à l’assistant</span>
                    <ArrowRight className="w-4 h-4 animate-pulse" />
                  </div>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <button
                onClick={() => handleDomainSelection(2)}
                className="group relative overflow-hidden bg-white/95 border-2 border-green-200 rounded-3xl p-10 transition-all duration-500 hover:border-green-400 hover:shadow-2xl hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-teal-50 to-green-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10 flex flex-col items-center gap-6">
                  <div className="relative">
                    <span className="absolute -inset-3 bg-gradient-to-br from-green-500 to-teal-600 rounded-3xl opacity-20 transition blur-lg group-hover:scale-110"></span>
                    <div className="relative p-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-3xl shadow-2xl group-hover:rotate-3 group-hover:scale-110 transition-all">
                      <Home className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-800 group-hover:text-green-700">
                    Télétravail
                  </h4>
                  <p className="text-center text-gray-600">
                    Charte, jours autorisés, indemnités, modalités…
                  </p>
                  <div className="flex items-center gap-2 text-green-500 opacity-0 group-hover:opacity-100 transition">
                    <span className="font-semibold">Accéder à l’assistant</span>
                    <ArrowRight className="w-4 h-4 animate-pulse" />
                  </div>
                </div>
              </button>

              <div className="group relative overflow-hidden bg-white/95 border-2 border-blue-200 rounded-3xl p-10 transition-all duration-500 hover:border-blue-400 hover:shadow-2xl hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10 flex flex-col items-center gap-6">
                  <div className="relative">
                    <span className="absolute -inset-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl opacity-20 transition blur-lg group-hover:scale-110"></span>
                    <div className="relative p-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl group-hover:rotate-3 group-hover:scale-110 transition-all">
                      <Sparkles className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-800 group-hover:text-blue-700">
                    Actualités Politiques
                  </h4>
                  <div className="w-full">
                    <NewsTicker />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {chatState.currentView === "chat" && (
          <div ref={chatContainerRef} className="bg-white/95 rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={returnToMenu} className="text-white hover:text-orange-200 transition-colors">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {chatState.selectedDomain === 0 && "Assistant Temps de Travail"}
                    {chatState.selectedDomain === 1 && "Assistant Formation"}
                    {chatState.selectedDomain === 2 && "Assistant Télétravail"}
                  </h3>
                  <p className="text-orange-100 text-sm">Posez vos questions, je suis là pour vous aider</p>
                </div>
              </div>
              <div className="text-white">
                <Users className="w-8 h-8" />
              </div>
            </div>

            <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
              {chatState.messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg ${
                      message.type === "user"
                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                        : "bg-white border border-gray-200 text-gray-800"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs mt-2 opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {chatState.isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                      <span className="text-sm text-gray-600">L’assistant réfléchit...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tapez votre question ici..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={chatState.isProcessing}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || chatState.isProcessing}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-2xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Envoyer</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-16 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center md:text-left">
              <h4 className="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Contact CFDT
              </h4>
              <div className="space-y-4">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <Phone className="w-5 h-5 text-orange-400" />
                  <span>01 40 85 64 64</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <Mail className="w-5 h-5 text-orange-400" />
                  <span>cfdt-interco@ville-gennevilliers.fr</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <MapPin className="w-5 h-5 text-orange-400" />
                  <span>Mairie de Gennevilliers</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h4 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Services
              </h4>
              <ul className="space-y-3 text-gray-300">
                <li>Sante</li>
                <li>Retraite</li>
                <li>Juridique</li>
                <li>Accompagnement syndical</li>
              </ul>
            </div>

            <div className="text-center md:text-right">
              <h4 className="text-2xl font-bold mb-6 bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                Horaires
              </h4>
              <div className="space-y-3 text-gray-300">
                <div>Lundi - Vendredi</div>
                <div className="font-semibold text-white">9h00 - 17h00</div>
                <div className="text-sm">Permanences sur RDV</div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 text-center">
            <p className="text-gray-400">© 2025 CFDT Gennevilliers - Assistant IA pour les agents municipaux</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
