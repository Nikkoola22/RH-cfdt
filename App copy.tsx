import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Clock, GraduationCap, Users, Phone, Mail, MapPin, ArrowRight, Sparkles, Send, ArrowLeft } from "lucide-react"
import RssFeed from "./components/RssFeed"

// --- IMPORTATIONS DES DONNÉES ---
import { sommaire } from "../lib/sommaire.ts"
import { chapitres } from "../lib/temps.ts"
import { formation } from "../lib/formation.ts"
import { infoItems } from "../lib/info-data.ts"

// --- TYPES ---
interface ChatMessage {
  type: "user" | "assistant"
  content: string
  timestamp: Date
}
interface InfoItem {
  id: number
  title: string
  content: string
}
interface ChatbotState {
  currentView: "menu" | "chat"
  selectedDomain: number | null
  messages: ChatMessage[]
  isProcessing: boolean
}

// --- CONFIGURATION API ---
const API_KEY = "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" // IMPORTANT: Sécurisez cette clé !
const API_URL = "https://api.perplexity.ai/chat/completions"

// --- RSS FEEDS CONFIGURATION ---
const FEEDS = [{ label: "France Info — Politique", url: "https://www.franceinfo.fr/politique.rss" }]

// --- PARSING DES DONNÉES ---
const sommaireData = JSON.parse(sommaire)

// --- FONCTION DE NETTOYAGE ---
const nettoyerChaine = (chaine: string): string => {
  if (typeof chaine !== "string") return ""
  return chaine
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/gi, "")
    .trim()
}

// --- FONCTION DE RECHERCHE ---
const trouverContextePertinent = (question: string): string => {
  const questionNettoyee = nettoyerChaine(question)
  const motsQuestionNettoyes = questionNettoyee.split(/\s+/).filter((mot) => mot.length > 0)
  const chapitresTrouves = new Map<number, { score: number }>()

  sommaireData.chapitres.forEach((chapitreItem, index) => {
    let score = 0
    const chapitreId = index + 1

    const motsClesChapitre = chapitreItem.mots_cles || []
    const motsClesArticles = (chapitreItem.articles || []).flatMap((article) => article.mots_cles || [])
    const tousLesMotsCles = [...motsClesChapitre, ...motsClesArticles]

    tousLesMotsCles.forEach((motCle) => {
      const motCleNettoye = nettoyerChaine(motCle)
      if (!motCleNettoye) return

      if (motsQuestionNettoyes.includes(motCleNettoye)) {
        score += 10
      } else if (questionNettoyee.includes(motCleNettoye)) {
        score += 5
      }
    })

    if (score > 0) {
      const chapitreExistant = chapitresTrouves.get(chapitreId) || { score: 0 }
      chapitreExistant.score += score
      chapitresTrouves.set(chapitreId, chapitreExistant)
    }
  })

  if (chapitresTrouves.size === 0) {
    return (
      "Aucun chapitre spécifique trouvé pour cette question. Voici un aperçu général des thèmes: " +
      sommaireData.chapitres.map((s) => s.titre).join(", ")
    )
  }

  const resultatsTries = Array.from(chapitresTrouves.entries())
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, 3)
    .map(([id]) => {
      const chapitreData = sommaireData.chapitres[id - 1]
      const contenuTexte = chapitres[id] || null

      if (!contenuTexte) {
        console.warn(`Le contenu pour le chapitre ID ${id} (${chapitreData.titre}) n'a pas été trouvé dans temps.ts.`)
        return null
      }
      return `Source: ${chapitreData.titre}\nContenu: ${contenuTexte}`
    })
    .filter(Boolean)

  if (resultatsTries.length === 0) {
    return "Aucun contenu textuel trouvé pour les chapitres pertinents."
  }

  return resultatsTries.join("\n\n---\n\n")
}

function App() {
  // --- ÉTATS & REFS ---
  const [chatState, setChatState] = useState<ChatbotState>({
    currentView: "menu",
    selectedDomain: null,
    messages: [],
    isProcessing: false,
  })
  const [inputValue, setInputValue] = useState("")
  const [selectedInfo, setSelectedInfo] = useState<InfoItem | null>(null)
  const [selectedFeed, setSelectedFeed] = useState(FEEDS[0].url)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // --- EFFETS ---
  useEffect(() => {
    if (chatState.currentView === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatState.messages, chatState.currentView])

  // --- FONCTIONS DE GESTION ---
  const handleInfoClick = (info: InfoItem) => setSelectedInfo(info)

  const handleDomainSelection = (domainId: number) => {
    setChatState({
      currentView: "chat",
      selectedDomain: domainId,
      messages: [
        {
          type: "assistant",
          content:
            domainId === 0
              ? "Bonjour ! Je peux vous aider avec vos questions sur les horaires, congés, ARTT, temps partiel, heures supplémentaires, absences, etc."
              : "Bonjour ! Je peux vous renseigner sur le CPF, les congés de formation, la VAE, les concours, les bilans de compétences, etc. Quelle est votre question ?",
          timestamp: new Date(),
        },
      ],
      isProcessing: false,
    })

    setTimeout(() => {
      if (chatContainerRef.current) {
        const headerHeight = 200 // Approximate header height
        const chatPosition = chatContainerRef.current.offsetTop
        const scrollPosition = Math.max(0, chatPosition - headerHeight)

        window.scrollTo({
          top: scrollPosition,
          behavior: "smooth",
        })
      }
      inputRef.current?.focus()
    }, 100)
  }

  const returnToMenu = () => {
    setChatState({ currentView: "menu", selectedDomain: null, messages: [], isProcessing: false })
    setInputValue("")
    setSelectedInfo(null)
  }

  // --- LOGIQUE DU CHATBOT (API) ---
  const appelPerplexity = async (messages: any[]) => {
    const data = { model: "sonar-pro", messages }
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const errorBody = await response.text()
      console.error("Détail de l'erreur API:", errorBody)
      throw new Error(`Erreur API (${response.status}): ${response.statusText}`)
    }
    const result = await response.json()
    return result.choices[0].message.content
  }

  const traiterQuestion = async (question: string) => {
    let contexteInterne = ""
    if (chatState.selectedDomain === 0) {
      contexteInterne = trouverContextePertinent(question)
    } else {
      contexteInterne = JSON.stringify(formation, null, 2)
    }

    const systemPrompt = `
        Tu es un assistant syndical spécialiste pour la mairie de Gennevilliers.
        Ta mission est de répondre aux questions des agents en te basant EXCLUSIVEMENT sur la documentation fournie ci-dessous.
        NE JAMAIS utiliser tes connaissances générales.
        Si la réponse ne se trouve pas dans la documentation, réponds : "Je ne trouve pas l'information dans les documents à ma disposition. Veuillez contacter le 64 64 pour plus de détails."
        Sois précis et cite le titre du chapitre si possible.
        --- DEBUT DE LA DOCUMENTATION PERTINENTE ---
        ${contexteInterne}
        --- FIN DE LA DOCUMENTATION PERTINENTE ---
    `

    const conversationHistory = chatState.messages.slice(1).map((msg) => ({
      role: msg.type === "user" ? "user" : "assistant",
      content: msg.content,
    }))

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: question },
    ]

    const reponseAssistant = await appelPerplexity(apiMessages)
    return reponseAssistant
  }

  const handleSendMessage = async () => {
    const question = inputValue.trim()
    if (!question || chatState.isProcessing) return
    const userMessage: ChatMessage = { type: "user", content: question, timestamp: new Date() }
    setChatState((prevState) => ({ ...prevState, messages: [...prevState.messages, userMessage], isProcessing: true }))
    setInputValue("")
    try {
      const reponseContent = await traiterQuestion(question)
      const assistantMessage: ChatMessage = { type: "assistant", content: reponseContent, timestamp: new Date() }
      setChatState((prevState) => ({ ...prevState, messages: [...prevState.messages, assistantMessage] }))
    } catch (error) {
      console.error("Erreur lors du traitement de la question:", error)
      const errorMessage: ChatMessage = {
        type: "assistant",
        content:
          "Désolé, une erreur est survenue. Veuillez réessayer ou contacter un représentant si le problème persiste.",
        timestamp: new Date(),
      }
      setChatState((prevState) => ({ ...prevState, messages: [...prevState.messages, errorMessage] }))
    } finally {
      setChatState((prevState) => ({ ...prevState, isProcessing: false }))
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // --- RENDU DU COMPOSANT ---
  return (
    <div className="min-h-screen relative">
      {/* New abstract gradient background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url('/abstract-gradient-bg.png')` }}
      ></div>

      {/* Subtle overlay for better text readability */}
      <div className="fixed inset-0 bg-black/10 z-0"></div>

      {/* NOUVEL EN-TÊTE INTÉGRÉ ICI */}
      <header className="relative bg-gradient-to-r from-white/95 via-orange-50/95 to-white/95 shadow-2xl border-b-4 border-orange-500 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center sm:text-left flex flex-col sm:flex-row items-center gap-6 justify-between">
          {/* Bloc gauche */}
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
          {/* Logo à droite avec halo orange */}
          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-r from-orange-400 via-orange-500 to-red-400 rounded-full blur-2xl opacity-90 animate-pulse"></div>
            <div className="absolute -inset-6 bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500 rounded-full blur-xl opacity-70"></div>
            <div className="absolute -inset-4 bg-gradient-to-r from-orange-200 via-orange-300 to-orange-400 rounded-full blur-lg opacity-50"></div>
            <div className="relative bg-white rounded-full p-2 shadow-lg">
              <img
                src="/logo-cfdt-orange.png"
                alt="Logo CFDT"
                className="relative w-44 h-44 object-contain z-20"
                style={{ maxHeight: "176px" }}
              />
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
                <div className="animate-marquee whitespace-nowrap flex items-center pl-44">
                  {[...infoItems, ...infoItems].map((info, index) => (
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
            </section>

            {selectedInfo && (
              <section className="info-detail bg-white p-6 rounded-lg shadow-md mt-8 max-w-4xl mx-auto">
                <h3 className="text-xl font-bold mb-4">{selectedInfo.title}</h3>
                <p>{selectedInfo.content}</p>
                <button
                  onClick={() => setSelectedInfo(null)}
                  className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Fermer
                </button>
              </section>
            )}

            <section className="text-center my-16">
              <h3 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-purple-700 bg-clip-text text-transparent mb-4">
                Choisissez votre domaine d&apos;assistance
              </h3>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto">
                Sélectionnez le service qui correspond à vos besoins. Nos assistants IA spécialisés vous aideront.
              </p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
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
                    <span className="font-semibold">Accéder à l&apos;assistant</span>
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
                    CPF, congés formation, VAE, concours, bilan de compétences…
                  </p>
                  <div className="flex items-center gap-2 text-purple-500 opacity-0 group-hover:opacity-100 transition">
                    <span className="font-semibold">Accéder à l&apos;assistant</span>
                    <ArrowRight className="w-4 h-4 animate-pulse" />
                  </div>
                </div>
              </button>
            </div>
          </>
        )}

        {chatState.currentView === "chat" && (
          <div
            ref={chatContainerRef}
            className="bg-white/95 border-2 border-blue-200 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-orange-500 to-blue-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {chatState.selectedDomain === 0 ? (
                    <Clock className="w-8 h-8" />
                  ) : (
                    <GraduationCap className="w-8 h-8" />
                  )}
                  <div>
                    <h3 className="text-xl font-bold">
                      {chatState.selectedDomain === 0 ? "Assistant Temps de Travail" : "Assistant Formation"}
                    </h3>
                    <p className="text-blue-100 text-sm">CFDT Gennevilliers</p>
                  </div>
                </div>
                <button
                  onClick={returnToMenu}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Retour</span>
                </button>
              </div>
            </div>
            <div className="min-h-[300px] max-h-[500px] overflow-y-auto p-6 space-y-4">
              {chatState.messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${message.type === "user" ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white" : "bg-gray-100 text-gray-800 border"}`}
                  >
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                    <div className={`text-xs mt-2 ${message.type === "user" ? "text-blue-100" : "text-gray-500"}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
              {chatState.isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 border px-4 py-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <span className="text-gray-600 ml-2">L&apos;assistant réfléchit...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t bg-gray-50 p-4">
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    chatState.selectedDomain === 0 ? "Ex: Quels sont mes horaires ?" : "Ex: Comment utiliser mon CPF ?"
                  }
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                  disabled={chatState.isProcessing}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || chatState.isProcessing}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Envoyer</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="relative bg-blue-100/50 text-blue-800 text-center p-8 mx-4 mt-16 rounded-2xl shadow-lg z-40">
          <div className="flex justify-center mb-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>
          <h4 className="text-2xl font-bold mb-6">Flux d'actualités</h4>

          <div className="mb-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Source label without feed selector */}
            <div className="font-semibold text-blue-700">Source: France Info </div>
          </div>

          <div className="bg-green-400 text-white overflow-hidden rounded-xl shadow-inner">
            <div className="relative h-16 flex items-center overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-32 flex items-center justify-center bg-green-500 z-20 shadow-md">
                <span className="text-lg font-bold">ACTU:</span>
              </div>
              <div className="pl-36">
                <RssFeed apiPath="/api/fresh-rss" feedUrl={FEEDS[0].url} limit={10} displayMode="simple" />
              </div>
            </div>
          </div>
        </section>

        <section className="relative bg-gradient-to-r from-orange-300 to-red-600 text-white text-center p-8 mx-4 mt-16 rounded-2xl shadow-2xl z-10">
          <h4 className="text-2xl font-bold mb-6">Un humain ? Appelez le 64 64</h4>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <a
              href="tel:0140856464"
              className="flex items-center gap-3 bg-white/20 px-4 py-3 rounded-lg hover:bg-white/30 transition-colors"
            >
              <Phone className="w-5 h-5 animate-pulse" />
              01 40 85 64 64
            </a>
            <a
              href="mailto:cfdt-interco@ville-gennevilliers.fr"
              className="flex items-center gap-3 bg-white/20 px-4 py-3 rounded-lg hover:bg-white/30 transition-colors break-all"
            >
              <Mail className="w-5 h-5 animate-pulse" />
              cfdt-interco@ville-gennevilliers.fr
            </a>
            <span className="flex items-center gap-3 bg-white/20 px-4 py-3 rounded-lg">
              <MapPin className="w-5 h-5 animate-pulse" />
              177 av. Gabriel-Péri
            </span>
          </div>
        </section>
      </main>

      <footer className="relative bg-gray-900/95 text-gray-400 text-center py-8 mt-20 z-10">
        <div className="flex justify-center items-center gap-3 mb-3">
          <Users className="w-8 h-8 text-orange-300" />
          <span className="text-orange-300 font-medium">CFDT Gennevilliers</span>
        </div>
        <p className="text-xs">
          Centre administratif Waldeck-L&apos;Huillier — 177 av. Gabriel-Péri — 92237 Gennevilliers Cedex
        </p>
      </footer>
    </div>
  );
}


export default App;
