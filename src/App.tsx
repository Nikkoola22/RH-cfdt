import React, { useState, useRef, useEffect } from "react"
import { Phone, Mail, MapPin, ArrowRight, Send, ArrowLeft, Search, Rss, Calculator, TrendingUp, DollarSign, LayoutGrid, HelpCircle, Link, BookOpen, Scale, FileText, Building2 } from "lucide-react"

// --- IMPORTATIONS DES DONNÉES ---
import { chapitres } from "./data/temps.ts"
import { formation } from "./data/formation.ts"
import { teletravailData } from "./data/teletravail.ts"
import { sommaireUnifie } from "./data/sommaireUnifie.ts"
import { infoItems } from "./data/info-data.ts"
import {  } from "./data/rifseep-data.ts"
import { franceInfoRss } from "./data/rss-data.ts"
import AdminPanel from "./components/AdminPanel.tsx"
import AdminLogin from "./components/AdminLogin.tsx"
import CalculateurCIAV2 from "./components/CalculateurCIAV2.tsx"
import CalculateurPrimesV2 from "./components/CalculateurPrimesV2.tsx"
import Calculateur13emeV2 from "./components/Calculateur13emeV2.tsx"
import Metiers from "./components/Metiers.tsx"
import FAQ from "./components/FAQ.tsx"
import LandingPage from "./components/LandingPage.tsx"
import IntercoCarousel from "./components/IntercoCarousel.tsx"


// --- CONFIGURATION BASE URL POUR GITHUB PAGES ---
const BASE_URL = import.meta.env.BASE_URL

// --- CONFIGURATION API PERPLEXITY ---
const BACKEND_API_URL = import.meta.env.DEV 
  ? "http://localhost:3001/api/completions" 
  : "/api/completions"

// --- RSS ITEM TYPE ---
interface RssItem {
  title: string
  link: string
  pubDate: string
}

const MARQUEE_SPEED = 80

const updateMarqueeDuration = (el: HTMLDivElement | null) => {
  if (!el) return
  const width = el.scrollWidth / 2
  if (!width || Number.isNaN(width)) return
  const duration = Math.min(120, Math.max(20, width / MARQUEE_SPEED))
  el.style.setProperty("--marquee-duration", `${duration}s`)
  el.style.animation = "none"
  void el.offsetHeight
  el.style.animation = ""
}

// --- COMPOSANT RSS BANDEAU (mémorisé pour éviter les re-renders) ---
const RssBandeau = React.memo(({ rssItems, rssLoading, marqueeRef }: { rssItems: RssItem[], rssLoading: boolean, marqueeRef: React.RefObject<HTMLDivElement> }) => {
  // Générer le contenu des items
  const renderItems = (keyPrefix: string) => {
    if (rssItems.length === 0) {
      return (
        <span className="text-base mx-8 font-light text-slate-100">
          {rssLoading ? "Chargement des articles..." : "Aucun article disponible"}
        </span>
      )
    }
    return rssItems.map((item, index) => (
      <React.Fragment key={`${keyPrefix}-${index}`}>
        <span className={`marquee-diamond${index % 3 === 0 ? ' marquee-diamond-twinkle' : ''}`} aria-hidden="true" />
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg font-light mx-6 hover:text-cyan-300 cursor-pointer text-white transition-colors duration-100 inline-block"
        >
          {item.title}
        </a>
      </React.Fragment>
    ))
  }

  return (
    <section className="relative bg-gradient-to-r from-blue-600/60 via-indigo-600/60 to-blue-600/60 backdrop-blur-md text-white overflow-hidden w-full shadow-lg border-b border-blue-500/30 z-50 glass-banner marquee-pausable">
      <div className="relative h-16 flex items-center overflow-hidden">
        {/* Label ACTU fixe à gauche */}
        <div className="absolute left-0 top-0 h-full w-40 flex items-center justify-center bg-gradient-to-r from-indigo-700 to-blue-700 backdrop-blur z-20 shadow-lg glass-pill actu-pill-glow">
          <div className="flex items-center gap-2">
            <Rss className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span className="text-base font-light tracking-wide text-white">ACTU:</span>
          </div>
        </div>
        {/* Container du défilement - 2 copies pour boucle infinie */}
        <div ref={marqueeRef} className="marquee-track animate-marquee ml-44">
          <div className="marquee-group">
            {renderItems('a')}
          </div>
          <div className="marquee-group">
            {renderItems('b')}
          </div>
        </div>
      </div>
    </section>
  )
})
RssBandeau.displayName = 'RssBandeau'

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
  currentView: "menu" | "chat" | "calculators" | "metiers" | "faq" | "liens-utiles"
  selectedDomain: number | null
  messages: ChatMessage[]
  isProcessing: boolean
}

function App() {
  // --- LANDING PAGE ---
  const [showLanding, setShowLanding] = useState(true)

  // --- ÉTATS & REFS ---
  const [chatState, setChatState] = useState<ChatbotState>({
    currentView: "menu",
    selectedDomain: null,
    messages: [],
    isProcessing: false,
  })
  const [inputValue, setInputValue] = useState("")
  const [selectedInfo, setSelectedInfo] = useState<InfoItem | null>(null)
  const [rssItems, setRssItems] = useState<RssItem[]>([])
  const [rssLoading, setRssLoading] = useState(false)





  const [activeCalculator, setActiveCalculator] = useState<'primes' | 'cia' | '13eme' | null>(null)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showExpandSearch, setShowExpandSearch] = useState(false)
  const [lastQuestion, setLastQuestion] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const newsMarqueeRef = useRef<HTMLDivElement>(null)
  const rssMarqueeRef = useRef<HTMLDivElement>(null)

  // --- EFFETS ---
  useEffect(() => {
    if (chatState.currentView === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatState.messages, chatState.currentView])

  useEffect(() => {
    const sync = () => {
      updateMarqueeDuration(newsMarqueeRef.current)
      updateMarqueeDuration(rssMarqueeRef.current)
    }
    const raf = requestAnimationFrame(sync)
    const handleResize = () => sync()
    window.addEventListener("resize", handleResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", handleResize)
    }
  }, [rssItems.length, rssLoading])


  // --- CHARGER LES ARTICLES RSS ---
  useEffect(() => {
    const fetchRssFeeds = async () => {
      try {
        setRssLoading(true)
        
        // Sur GitHub Pages, utiliser les données par défaut
        if (BASE_URL !== '/') {
          setRssItems(franceInfoRss)
          setRssLoading(false)
          return
        }
        
        // Construire l'URL de l'API selon l'environnement
        const apiUrl = import.meta.env.DEV && BASE_URL === '/' 
          ? '/api/rss' 
          : `${window.location.origin}${BASE_URL}api/rss`
        const response = await fetch(apiUrl)
        
        if (!response.ok) {
          console.warn(`Erreur backend: ${response.status}`)
          throw new Error(`Erreur serveur: ${response.status}`)
        }
        
        const data = await response.json()
        const items = data.items || []
        
        if (items.length > 0) {
          // Formater les articles (sans bullet, ajouté au rendu)
          const formattedItems = items.slice(0, 5).map((item: { title?: string; link?: string; pubDate?: string }) => ({
            title: (item.title || '').replace(/^•\s*/, '').trim(),
            link: item.link || '#',
            pubDate: item.pubDate || new Date().toISOString()
          }))
          setRssItems(formattedItems)
        } else {
          throw new Error('Aucun article trouvé')
        }
      } catch (error) {
        console.warn('Impossible de récupérer les flux RSS via le backend, utilisation des données par défaut', error)
        setRssItems(franceInfoRss)
      } finally {
        setRssLoading(false)
      }
    }
    
    fetchRssFeeds()
    
    // Rafraîchir tous les 30 minutes
    const interval = setInterval(fetchRssFeeds, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // --- FONCTIONS DE GESTION ---
  const handleInfoClick = (info: InfoItem) => setSelectedInfo(info)

  const handleDomainSelection = (domainId: number) => {
    setChatState({
      currentView: "chat",
      selectedDomain: domainId,
      messages: [
        {
          type: "assistant",
          content: "Bonjour ! Je suis votre assistant CFDT unifié. Je peux vous aider avec toutes vos questions sur le temps de travail, la formation, le télétravail et bien plus encore. Que souhaitez-vous savoir ?",
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

  // --- LOGIQUE DU CALCULATEUR DE PRIMES ---
  const appelPerplexity = async (messages: { role: string; content: string }[], useExternalModel = false) => {
    try {
      // Utiliser "sonar" pour recherche externe (meilleur respect des instructions FPT)
      // Utiliser "sonar-pro" pour recherche interne
      const model = useExternalModel ? "sonar" : "sonar-pro"
      const data = { model, messages }
      const response = await fetch(BACKEND_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorBody = await response.text()
        console.error("Détail de l'erreur API:", errorBody)
        throw new Error(`Erreur API (${response.status}): ${response.statusText}`)
      }
      
      const result = await response.json()
      return result.choices[0].message.content
    } catch (error) {
      console.error("Erreur lors du traitement de la question:", error)
      return "Je ne trouve pas cette information dans nos documents internes. Contactez la CFDT au 01 40 85 64 64 pour plus de détails."
    }
  }

  // Fonction de recherche élargie sur Légifrance (Code général de la fonction publique)
  const rechercherLegifrance = async (question: string) => {
    const systemPrompt = `
🚨 INSTRUCTION CRITIQUE : Tu réponds UNIQUEMENT sur la FONCTION PUBLIQUE TERRITORIALE (FPT).
Si ta réponse contient "Code du travail" ou "L1226" ou "salarié" ou "employeur privé" = ERREUR GRAVE.

👤 CONTEXTE : Agent territorial (fonctionnaire ou contractuel) d'une MAIRIE française.

📚 SOURCES LÉGALES OBLIGATOIRES - RECHERCHE UNIQUEMENT DANS :

▶ FONCTIONNAIRES TERRITORIAUX :
• Code général de la fonction publique (CGFP) Articles L822-1 à L822-12 pour les congés maladie
  URL: https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000044416551
• Décret n°87-602 du 30 juillet 1987 (congés maladie fonctionnaires territoriaux)
  URL: https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000520911

▶ AGENTS CONTRACTUELS TERRITORIAUX :
• Décret n°88-145 du 15 février 1988 (agents non titulaires territoriaux)
  URL: https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000871608

📋 RÉPONSE STRUCTURÉE OBLIGATOIRE :

## Pour les FONCTIONNAIRES titulaires :
[Citer CGFP + Décret 87-602 avec articles précis]

## Pour les CONTRACTUELS :
[Citer Décret 88-145 avec articles précis]

💡 EXEMPLE - Congé Longue Maladie (CLM) fonctionnaire territorial :
- Durée : 3 ans maximum (Article 57 ancien statut → CGFP L822-4)
- Rémunération : 1 an plein traitement + 2 ans demi-traitement
- Conditions : Maladie rendant nécessaire un traitement et repos prolongés

Question : ${question}
`

    const apiMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `FONCTION PUBLIQUE TERRITORIALE UNIQUEMENT.
Question d'un agent territorial : ${question}

⚠️ INTERDIT : Code du travail, droit privé, convention collective.
✅ OBLIGATOIRE : CGFP, Décret 87-602, Décret 88-145.` },
    ]

    return await appelPerplexity(apiMessages, true) // true = recherche externe, utilise modèle "sonar"
  }

  // Gérer le clic sur "Oui" pour élargir la recherche
  const handleExpandSearch = async () => {
    setShowExpandSearch(false)
    if (!lastQuestion) return

    setChatState((prevState) => ({ ...prevState, isProcessing: true }))
    
    const searchingMessage: ChatMessage = {
      type: "assistant",
      content: "🔍 Je recherche dans le Code général de la fonction publique sur Légifrance...",
      timestamp: new Date(),
    }
    setChatState((prevState) => ({ ...prevState, messages: [...prevState.messages, searchingMessage] }))

    try {
      const reponse = await rechercherLegifrance(lastQuestion)
      const resultMessage: ChatMessage = {
        type: "assistant",
        content: `📚 **Résultat de la recherche Légifrance :**\n\n${reponse}`,
        timestamp: new Date(),
      }
      setChatState((prevState) => ({ ...prevState, messages: [...prevState.messages, resultMessage] }))
    } catch (error) {
      console.error("Erreur recherche Légifrance:", error)
      const errorMessage: ChatMessage = {
        type: "assistant",
        content: "Désolé, une erreur est survenue lors de la recherche sur Légifrance. Contactez la CFDT au 01 40 85 64 64.",
        timestamp: new Date(),
      }
      setChatState((prevState) => ({ ...prevState, messages: [...prevState.messages, errorMessage] }))
    } finally {
      setChatState((prevState) => ({ ...prevState, isProcessing: false }))
      setLastQuestion("")
    }
  }

  // Gérer le clic sur "Non" pour revenir à l'accueil
  const handleDeclineSearch = () => {
    setShowExpandSearch(false)
    setLastQuestion("")
    returnToMenu()
  }

  // --- RECHERCHE OPTIMISÉE EN 2 ÉTAPES ---
  // Étape 1 : Identifier les sections pertinentes via le sommaire léger (~500 tokens)
  // Étape 2 : Charger uniquement le contenu des sections identifiées
  // Économie : ~80% de tokens par requête

  const genererSommaireTexte = () => {
    return sommaireUnifie.map(s => 
      `[${s.id}] ${s.titre} - ${s.resume || s.motsCles.join(', ')}`
    ).join('\n')
  }

  const chargerContenuSections = (sectionIds: string[]): string => {
    const chapitresACharger = new Set<number>()
    let chargerFormation = false
    let chargerTeletravail = false

    sectionIds.forEach(id => {
      const section = sommaireUnifie.find(s => s.id === id)
      if (section) {
        if (section.source === 'temps' && section.chapitre) {
          chapitresACharger.add(section.chapitre)
        } else if (section.source === 'formation') {
          chargerFormation = true
        } else if (section.source === 'teletravail') {
          chargerTeletravail = true
        }
      }
    })

    let contenu = ''
    if (chapitresACharger.size > 0) {
      const titres = ['', 'LE TEMPS DE TRAVAIL', 'LES CONGÉS', "AUTORISATIONS SPÉCIALES D'ABSENCE", 'LES ABSENCES POUR MALADIES ET ACCIDENTS']
      chapitresACharger.forEach(ch => {
        contenu += `\n\n=== ${titres[ch] || 'CHAPITRE ' + ch} ===\n${(chapitres as Record<number, string>)[ch] || ''}`
      })
    }
    if (chargerFormation) {
      contenu += `\n\n=== RÈGLEMENT FORMATION ===\n${formation || ''}`
    }
    if (chargerTeletravail) {
      contenu += `\n\n=== PROTOCOLE TÉLÉTRAVAIL ===\n${typeof teletravailData === 'string' ? teletravailData : JSON.stringify(teletravailData)}`
    }
    return contenu.trim()
  }

  const traiterQuestion = async (question: string) => {
    // ÉTAPE 1 : Identifier les sections pertinentes avec le sommaire léger
    const sommaire = genererSommaireTexte()
    const identificationPrompt = `Tu es un assistant qui identifie les sections pertinentes pour répondre à une question.

SOMMAIRE DES DOCUMENTS DISPONIBLES :
${sommaire}

QUESTION : ${question}

RÈGLES :
- Réponds UNIQUEMENT avec les IDs des sections pertinentes, séparés par des virgules
- Choisis 1 à 4 sections maximum, les plus pertinentes
- Si aucune section ne correspond, réponds "AUCUNE"
- Format attendu : temps_ch2_conges_annuels, temps_ch2_rtt

IDs des sections pertinentes :`

    const identificationResponse = await appelPerplexity([
      { role: "user", content: identificationPrompt }
    ])

    // Parser la réponse pour extraire les IDs
    const responseClean = identificationResponse.toLowerCase().replace(/["']/g, '').replace(/\[/g, '').replace(/\]/g, '').trim()
    
    if (responseClean === 'aucune' || responseClean.includes('aucune section')) {
      return "Je ne trouve pas cette information dans nos documents internes. Contactez la CFDT au 01 40 85 64 64 pour plus de détails."
    }

    // Extraire les IDs valides
    const idsExtraits = responseClean.split(/[,\s]+/).filter(id => 
      sommaireUnifie.some(s => s.id === id.trim())
    )

    // Si aucun ID valide trouvé, fallback sur recherche complète (1 chapitre)
    let contenuCible: string
    if (idsExtraits.length === 0) {
      // Fallback : charger tout (ancien comportement)
      contenuCible = `
CHAPITRE 1 - LE TEMPS DE TRAVAIL :\n${(chapitres as Record<number, string>)[1] || ''}

CHAPITRE 2 - LES CONGÉS :\n${(chapitres as Record<number, string>)[2] || ''}

CHAPITRE 3 - AUTORISATIONS SPÉCIALES D'ABSENCE :\n${(chapitres as Record<number, string>)[3] || ''}

CHAPITRE 4 - LES ABSENCES POUR MALADIES ET ACCIDENTS :\n${(chapitres as Record<number, string>)[4] || ''}

RÈGLEMENT FORMATION :\n${formation || ''}

PROTOCOLE TÉLÉTRAVAIL :\n${typeof teletravailData === 'string' ? teletravailData : JSON.stringify(teletravailData)}`
    } else {
      // ÉTAPE 2 : Charger uniquement les sections identifiées
      contenuCible = chargerContenuSections(idsExtraits)
    }

    const systemPrompt = `
Tu es un assistant CFDT pour la Mairie de Gennevilliers.

RÈGLES STRICTES :
1. Réponds UNIQUEMENT en utilisant les documents ci-dessous
2. Ne cherche JAMAIS sur internet, n'utilise JAMAIS tes connaissances externes
3. Sois précis sur les chiffres et délais mentionnés dans les documents
4. Réponds comme un collègue syndical bienveillant
5. Ne mentionne JAMAIS [CHAPITRE X - ARTICLE Y] dans ta réponse. Réponds naturellement.

⚠️ RÈGLE CRITIQUE - SI TU TROUVES L'INFO :
- Donne directement la réponse, sans dire "Je ne trouve pas"
- Cite les détails précis des documents

⚠️ RÈGLE CRITIQUE - SI TU NE TROUVES PAS L'INFO :
- Réponds UNIQUEMENT : "Je ne trouve pas cette information dans nos documents internes. Contactez la CFDT au 01 40 85 64 64."
- ARRÊTE-TOI IMMÉDIATEMENT après cette phrase
- N'ajoute AUCUNE information supplémentaire
- Ne commence JAMAIS par "Je ne trouve pas" puis donne une réponse ensuite

DOCUMENTATION :
${contenuCible}
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

    return await appelPerplexity(apiMessages)
  }

  const handleSendMessage = async () => {
    const question = inputValue.trim()
    if (!question || chatState.isProcessing) return
    const userMessage: ChatMessage = { type: "user", content: question, timestamp: new Date() }
    setChatState((prevState) => ({ ...prevState, messages: [...prevState.messages, userMessage], isProcessing: true }))
    setInputValue("")
    setShowExpandSearch(false)
    try {
      const reponseContent = await traiterQuestion(question)
      
      // Détecter si la réponse indique qu'on n'a pas trouvé l'info
      const notFoundPatterns = [
        "je ne trouve pas",
        "pas cette information",
        "pas trouvé",
        "aucune information",
        "documents internes",
        "contactez la cfdt"
      ]
      const isNotFound = notFoundPatterns.some(pattern => 
        reponseContent.toLowerCase().includes(pattern)
      )
      
      if (isNotFound) {
        // Proposer d'élargir la recherche
        const assistantMessage: ChatMessage = {
          type: "assistant",
          content: "🔎 Il ne semble pas y avoir cette information dans les documents INTERNES de Gennevilliers.\n\nVoulez-vous que j'élargisse ma recherche dans le Code général de la fonction publique (Légifrance) ?",
          timestamp: new Date(),
        }
        setChatState((prevState) => ({ ...prevState, messages: [...prevState.messages, assistantMessage] }))
        setShowExpandSearch(true)
        setLastQuestion(question)
      } else {
        const assistantMessage: ChatMessage = { type: "assistant", content: reponseContent, timestamp: new Date() }
        setChatState((prevState) => ({ ...prevState, messages: [...prevState.messages, assistantMessage] }))
      }
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
  if (showLanding) {
    return (
      <LandingPage
        onEnter={() => setShowLanding(false)}
        onQuizz={() => {
          setShowLanding(false)
          setChatState(s => ({ ...s, currentView: 'faq' }))
        }}
      />
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Background image with transparency */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url('${BASE_URL}unnamed.jpg')`, opacity: 0.3 }}
      ></div>

      {/* Subtle overlay for better text readability */}
      <div className="fixed inset-0 bg-black/20 z-0"></div>

      {/* Couches de fond supplémentaires */}
      <div className="bg-blob-3" aria-hidden="true" />
      <div className="bg-noise"  aria-hidden="true" />
      <div className="bg-aurora" aria-hidden="true" />

      {/* HEADER PROFESSIONNEL */}
      <header className="relative bg-gradient-to-r from-slate-900/70 via-purple-900/70 to-slate-900/70 backdrop-blur-md shadow-lg z-10 bg-cover bg-center glass-banner header-bottom-glow" style={{ backgroundImage: `url('${BASE_URL}mairie.jpeg')`, backgroundBlendMode: 'overlay' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-purple-900/80 to-slate-900/80 z-0"></div>
        {/* Scan line traversant le header */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
          <div
            className="absolute top-0 left-0 h-full w-20"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.07), transparent)',
              animation: 'header-scan 12s ease-in-out 3s infinite',
              willChange: 'transform',
            }}
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 relative z-10">
          <div className="flex items-center justify-between gap-8">
            {/* Logo et texte à gauche */}
            <div className="flex items-center gap-5 group">
              <div className="relative logo-glow-ambient">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <img
                  src={`${BASE_URL}logo-cfdt.jpg`}
                  alt="Logo CFDT"
                  className="w-32 h-32 object-contain relative transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="space-y-1">
                <h1 className="text-5xl font-light tracking-tight text-shimmer">Atlas</h1>
                <p className="text-base text-slate-300 font-light">Assistant syndical CFDT</p>
              </div>
            </div>
            
            {/* Texte centre */}
            <div className="text-center flex-grow">
              <h2 className="text-2xl font-light text-slate-100 tracking-tight">Mairie de Gennevilliers</h2>
              <p className="text-base text-slate-400 mt-2 font-light">Chatbot d'assistance pour les agents municipaux</p>
            </div>
            
            {/* Contact à droite */}
            <div className="flex items-center gap-4 text-right">
            </div>
          </div>
        </div>
      </header>

      {/* Bandeau NEWS FPT - Pleine largeur sous le header */}
      <section className="relative bg-gradient-to-r from-orange-500/60 via-red-500/60 to-pink-500/60 backdrop-blur-md text-white overflow-hidden w-full shadow-lg border-b border-orange-400/30 z-10 glass-banner marquee-pausable banner-top-streak">
      <div className="relative h-16 flex items-center overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-32 flex items-center justify-center bg-gradient-to-r from-orange-600 to-red-600 backdrop-blur z-20 shadow-lg glass-pill news-pill-glow">
          <span className="text-base font-light tracking-wide text-white">NEWS:</span>
        </div>
        <div ref={newsMarqueeRef} className="marquee-track animate-marquee pl-36">
          <div className="marquee-group">
            {infoItems.map((info, index) => (
              <React.Fragment key={`news-a-${info.id}-${index}`}>
                <span className={`marquee-diamond${index % 3 === 0 ? ' marquee-diamond-twinkle' : ''}`} aria-hidden="true" />
                <button
                  onClick={() => handleInfoClick(info)}
                  className="text-lg font-light mx-4 hover:text-amber-200 cursor-pointer hover:scale-105 text-white transition-transform duration-100"
                >
                  {info.title}
                </button>
              </React.Fragment>
            ))}
          </div>
          <div className="marquee-group">
            {infoItems.map((info, index) => (
              <React.Fragment key={`news-b-${info.id}-${index}`}>
                <span className={`marquee-diamond${index % 3 === 0 ? ' marquee-diamond-twinkle' : ''}`} aria-hidden="true" />
                <button
                  onClick={() => handleInfoClick(info)}
                  className="text-lg font-light mx-4 hover:text-amber-200 cursor-pointer hover:scale-105 text-white transition-transform duration-100"
                >
                  {info.title}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
        </div>
      </section>

      <main className="relative max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 z-10">
        {chatState.currentView === "menu" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
              {/* Colonne principale - pleine largeur */}
              <div className="lg:col-span-1">
                {selectedInfo && (
                  <section className="info-detail bg-gradient-to-br from-slate-800/80 via-purple-900/80 to-slate-800/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-purple-500/30 mb-8 max-w-4xl mx-auto hover:shadow-2xl transition-shadow glass-card">
                    <h3 className="text-3xl font-light bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-4">{selectedInfo.title}</h3>
                    <p className="text-slate-200 leading-relaxed">{selectedInfo.content}</p>
                    <button
                      onClick={() => setSelectedInfo(null)}
                      className="mt-6 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Fermer
                    </button>
                  </section>
                )}

                <div className="flex flex-col sm:flex-row justify-center mb-1 gap-4 sm:gap-6 lg:gap-8 px-2 sm:px-0">
                  <button
                    onClick={() => handleDomainSelection(0)}
                    className="group relative overflow-hidden bg-gradient-to-br from-slate-800/70 via-purple-900/70 to-slate-800/70 backdrop-blur-md border border-purple-500/30 rounded-2xl p-6 sm:p-10 hover:border-pink-500/50 hover:shadow-2xl hover:-translate-y-1 w-full sm:w-80 h-auto sm:h-96 transition-transform duration-150 glass-card animate-card-enter-1 card-border-sweep btn-ripple"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
                    <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 h-full justify-between">
                      <div className="relative">
                        <span className="absolute -inset-3 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg group-hover:scale-110 transition-opacity duration-150"></span>
                        <div className="relative p-4 sm:p-6 bg-gradient-to-br from-purple-500/80 to-pink-500/80 backdrop-blur rounded-2xl shadow-2xl icon-box-spring">
                          <Search className="w-12 sm:w-16 h-12 sm:h-16 text-white" />
                        </div>
                      </div>
                      <h4 className="text-lg sm:text-2xl font-light tracking-tight text-white card-title-purple">
                        Recherche Unifiée
                      </h4>
                      <p className="text-center text-slate-300 font-light text-xs sm:text-sm">
                        Temps de travail, formation, télétravail - Recherche dans tous les documents
                      </p>
                      <div className="flex items-center gap-2 text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <span className="font-light text-xs sm:text-sm">Accéder à l&apos;assistant</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setChatState({ ...chatState, currentView: 'calculators' })}
                    className="group relative overflow-hidden bg-gradient-to-br from-slate-800/70 via-blue-900/70 to-slate-800/70 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6 sm:p-10 hover:border-cyan-500/50 hover:shadow-2xl hover:-translate-y-1 w-full sm:w-80 h-auto sm:h-96 transition-transform duration-150 glass-card animate-card-enter-2 card-border-sweep card-border-sweep-blue btn-ripple"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
                    <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 h-full justify-between">
                      <div className="relative">
                        <span className="absolute -inset-3 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg group-hover:scale-110 transition-opacity duration-150"></span>
                        <div className="relative p-4 sm:p-6 bg-gradient-to-br from-blue-500/80 to-cyan-500/80 backdrop-blur rounded-2xl shadow-2xl icon-box-spring">
                          <Calculator className="w-12 sm:w-16 h-12 sm:h-16 text-white" />
                        </div>
                      </div>
                      <h4 className="text-lg sm:text-2xl font-light tracking-tight text-white card-title-blue">
                        Calculateurs
                      </h4>
                      <p className="text-center text-slate-300 font-light text-xs sm:text-sm">
                        Primes IFSE - Calcul CIA - Outils de simulation
                      </p>
                      <div className="flex items-center gap-2 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <span className="font-light text-xs sm:text-sm">Accéder aux calculateurs</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </button>

                  {/* Carte Grilles Indiciaires */}
                  <button
                    onClick={() => setChatState({ ...chatState, currentView: 'metiers' })}
                    className="group relative overflow-hidden bg-gradient-to-br from-slate-800/70 via-emerald-900/70 to-slate-800/70 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-6 sm:p-10 hover:border-green-500/50 hover:shadow-2xl hover:-translate-y-1 w-full sm:w-80 h-auto sm:h-96 transition-transform duration-150 glass-card animate-card-enter-3 card-border-sweep card-border-sweep-green btn-ripple"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
                    <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 h-full justify-between">
                      <div className="relative">
                        <span className="absolute -inset-3 bg-gradient-to-br from-emerald-400/30 to-green-400/30 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg group-hover:scale-110 transition-opacity duration-150"></span>
                        <div className="relative p-4 sm:p-6 bg-gradient-to-br from-emerald-500/80 to-green-500/80 backdrop-blur rounded-2xl shadow-2xl icon-box-spring">
                          <LayoutGrid className="w-12 sm:w-16 h-12 sm:h-16 text-white" />
                        </div>
                      </div>
                      <h4 className="text-lg sm:text-2xl font-light tracking-tight text-white card-title-green">
                        Grilles Indiciaires
                      </h4>
                      <p className="text-center text-slate-300 font-light text-xs sm:text-sm">
                        Filières, métiers et grilles de rémunération FPT
                      </p>
                      <div className="flex items-center gap-2 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <span className="font-light text-xs sm:text-sm">Voir les grilles</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                </div>

                {/* Boutons Questions Fréquentes et Liens utiles */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 px-2 sm:px-0">
                  <button
                    onClick={() => setChatState({ ...chatState, currentView: 'faq' })}
                    className="group flex items-center gap-3 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-500 hover:via-amber-500 hover:to-yellow-600 text-slate-900 font-medium px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:shadow-yellow-500/30 transition-all duration-150 hover:scale-105 btn-cta animate-cta-enter btn-shine"
                  >
                    <HelpCircle className="w-6 h-6" />
                    <span className="text-lg">Questions Fréquentes</span>
                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                  </button>

                  <button
                    onClick={() => setChatState({ ...chatState, currentView: 'liens-utiles' })}
                    className="group flex items-center gap-3 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 hover:from-blue-500 hover:via-cyan-500 hover:to-blue-600 text-slate-900 font-medium px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-150 hover:scale-105 btn-cta animate-cta-enter btn-shine"
                  >
                    <Link className="w-6 h-6" />
                    <span className="text-lg">Liens utiles</span>
                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                  </button>
                </div>

                {/* Carrousel Actualités Interco CFDT */}
                <IntercoCarousel />
              </div>
            </div>
          </>
        )}
      </main>

      {/* --- SECTION GRILLES INDICIAIRES / MÉTIERS --- */}
      {chatState.currentView === 'metiers' && (
        <Metiers onClose={() => setChatState({ ...chatState, currentView: 'menu' })} />
      )}

      {/* --- SECTION FAQ --- */}
      {chatState.currentView === 'faq' && (
        <FAQ onBack={() => setChatState({ ...chatState, currentView: 'menu' })} />
      )}

      {/* --- SECTION LIENS UTILES --- */}
      {chatState.currentView === 'liens-utiles' && (
        <section className="relative w-full min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 z-20">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-slate-800/95 to-purple-900/95 backdrop-blur-md border-b border-purple-500/30 z-30">
            <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => setChatState({ ...chatState, currentView: 'menu' })}
                  className="flex items-center gap-1 sm:gap-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 hover:text-white px-2 sm:px-4 py-2 rounded-lg transition-colors duration-100 font-light text-xs sm:text-sm"
                >
                  <ArrowLeft className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Retour au menu</span>
                  <span className="sm:hidden">Retour</span>
                </button>
                <h2 className="text-base sm:text-xl font-light text-white">Liens utiles</h2>
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="max-w-6xl mx-auto px-2 sm:px-4 py-8 sm:py-12">
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 lg:gap-8">
              {/* Carte Juridique */}
              <button
                onClick={() => window.open('https://www.cfdt-interco12.fr/actualites/actualites-jurdiques/', '_blank')}
                className="group relative overflow-hidden bg-gradient-to-br from-slate-800/70 via-red-900/70 to-slate-800/70 backdrop-blur-md border border-red-500/30 rounded-2xl p-6 sm:p-10 hover:border-rose-500/50 hover:shadow-2xl hover:-translate-y-1 w-full sm:w-80 h-auto sm:h-96 transition-transform duration-150 glass-card"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
                <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 h-full justify-between">
                  <div className="relative">
                    <span className="absolute -inset-3 bg-gradient-to-br from-red-400/30 to-rose-400/30 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg group-hover:scale-110 transition-opacity duration-150"></span>
                    <div className="relative p-4 sm:p-6 bg-gradient-to-br from-red-500/80 to-rose-500/80 backdrop-blur rounded-2xl shadow-2xl">
                      <Scale className="w-12 sm:w-16 h-12 sm:h-16 text-white" />
                    </div>
                  </div>
                  <h4 className="text-lg sm:text-2xl font-light tracking-tight text-white">
                    Juridique
                  </h4>
                  <p className="text-center text-slate-300 font-light text-xs sm:text-sm">
                    Droits et obligations des agents publics
                  </p>
                  <div className="flex items-center gap-2 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <span className="font-light text-xs sm:text-sm">En savoir plus</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Carte Formation */}
              <button
                onClick={() => window.open('https://www.cnfpt.fr/catalogue/catalogues/region84/#page/1', '_blank')}
                className="group relative overflow-hidden bg-gradient-to-br from-slate-800/70 via-violet-900/70 to-slate-800/70 backdrop-blur-md border border-violet-500/30 rounded-2xl p-6 sm:p-10 hover:border-purple-500/50 hover:shadow-2xl hover:-translate-y-1 w-full sm:w-80 h-auto sm:h-96 transition-transform duration-150 glass-card"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-transparent to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
                <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 h-full justify-between">
                  <div className="relative">
                    <span className="absolute -inset-3 bg-gradient-to-br from-violet-400/30 to-purple-400/30 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg group-hover:scale-110 transition-opacity duration-150"></span>
                    <div className="relative p-4 sm:p-6 bg-gradient-to-br from-violet-500/80 to-purple-500/80 backdrop-blur rounded-2xl shadow-2xl">
                      <BookOpen className="w-12 sm:w-16 h-12 sm:h-16 text-white" />
                    </div>
                  </div>
                  <h4 className="text-lg sm:text-2xl font-light tracking-tight text-white">
                    Formation
                  </h4>
                  <p className="text-center text-slate-300 font-light text-xs sm:text-sm">
                    Plans et ressources de formation professionnelle
                  </p>
                  <div className="flex items-center gap-2 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <span className="font-light text-xs sm:text-sm">En savoir plus</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Carte Guide des Primes */}
              <button
                onClick={() => window.open('https://www.cdg31.fr/sites/default/files/guide_des_primes_2025.pdf', '_blank')}
                className="group relative overflow-hidden bg-gradient-to-br from-slate-800/70 via-amber-900/70 to-slate-800/70 backdrop-blur-md border border-amber-500/30 rounded-2xl p-6 sm:p-10 hover:border-yellow-500/50 hover:shadow-2xl hover:-translate-y-1 w-full sm:w-80 h-auto sm:h-96 transition-transform duration-150 glass-card"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-transparent to-yellow-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
                <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 h-full justify-between">
                  <div className="relative">
                    <span className="absolute -inset-3 bg-gradient-to-br from-amber-400/30 to-yellow-400/30 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg group-hover:scale-110 transition-opacity duration-150"></span>
                    <div className="relative p-4 sm:p-6 bg-gradient-to-br from-amber-500/80 to-yellow-500/80 backdrop-blur rounded-2xl shadow-2xl">
                      <DollarSign className="w-12 sm:w-16 h-12 sm:h-16 text-white" />
                    </div>
                  </div>
                  <h4 className="text-lg sm:text-2xl font-light tracking-tight text-white">
                    Guide des Primes
                  </h4>
                  <p className="text-center text-slate-300 font-light text-xs sm:text-sm">
                    Détails et conditions de versement des primes
                  </p>
                  <div className="flex items-center gap-2 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <span className="font-light text-xs sm:text-sm">En savoir plus</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Carte Légifrance */}
              <button
                onClick={() => window.open('https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000044416551/', '_blank')}
                className="group relative overflow-hidden bg-gradient-to-br from-slate-800/70 via-blue-900/70 to-slate-800/70 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6 sm:p-10 hover:border-cyan-500/50 hover:shadow-2xl hover:-translate-y-1 w-full sm:w-80 h-auto sm:h-96 transition-transform duration-150 glass-card"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
                <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 h-full justify-between">
                  <div className="relative">
                    <span className="absolute -inset-3 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg group-hover:scale-110 transition-opacity duration-150"></span>
                    <div className="relative p-4 sm:p-6 bg-gradient-to-br from-blue-500/80 to-cyan-500/80 backdrop-blur rounded-2xl shadow-2xl">
                      <FileText className="w-12 sm:w-16 h-12 sm:h-16 text-white" />
                    </div>
                  </div>
                  <h4 className="text-lg sm:text-2xl font-light tracking-tight text-white">
                    Légifrance
                  </h4>
                  <p className="text-center text-slate-300 font-light text-xs sm:text-sm">
                    Code général de la fonction publique
                  </p>
                  <div className="flex items-center gap-2 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <span className="font-light text-xs sm:text-sm">Accéder</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Carte Recherche Jurisprudence */}
              <button
                onClick={() => window.open('https://opendata.justice-administrative.fr/recherche', '_blank')}
                className="group relative overflow-hidden bg-gradient-to-br from-slate-800/70 via-emerald-900/70 to-slate-800/70 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-6 sm:p-10 hover:border-teal-500/50 hover:shadow-2xl hover:-translate-y-1 w-full sm:w-80 h-auto sm:h-96 transition-transform duration-150 glass-card"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
                <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 h-full justify-between">
                  <div className="relative">
                    <span className="absolute -inset-3 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg group-hover:scale-110 transition-opacity duration-150"></span>
                    <div className="relative p-4 sm:p-6 bg-gradient-to-br from-emerald-500/80 to-teal-500/80 backdrop-blur rounded-2xl shadow-2xl">
                      <Search className="w-12 sm:w-16 h-12 sm:h-16 text-white" />
                    </div>
                  </div>
                  <h4 className="text-lg sm:text-2xl font-light tracking-tight text-white">
                    Jurisprudence
                  </h4>
                  <p className="text-center text-slate-300 font-light text-xs sm:text-sm">
                    Décisions et jurisprudence administrative
                  </p>
                  <div className="flex items-center gap-2 text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <span className="font-light text-xs sm:text-sm">Rechercher</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>

              {/* Carte CIG */}
              <button
                onClick={() => window.open('https://www.cig929394.fr', '_blank')}
                className="group relative overflow-hidden bg-gradient-to-br from-slate-800/70 via-pink-900/70 to-slate-800/70 backdrop-blur-md border border-pink-500/30 rounded-2xl p-6 sm:p-10 hover:border-fuchsia-500/50 hover:shadow-2xl hover:-translate-y-1 w-full sm:w-80 h-auto sm:h-96 transition-transform duration-150 glass-card"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-transparent to-fuchsia-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
                <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 h-full justify-between">
                  <div className="relative">
                    <span className="absolute -inset-3 bg-gradient-to-br from-pink-400/30 to-fuchsia-400/30 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg group-hover:scale-110 transition-opacity duration-150"></span>
                    <div className="relative p-4 sm:p-6 bg-gradient-to-br from-pink-500/80 to-fuchsia-500/80 backdrop-blur rounded-2xl shadow-2xl">
                      <Building2 className="w-12 sm:w-16 h-12 sm:h-16 text-white" />
                    </div>
                  </div>
                  <h4 className="text-lg sm:text-2xl font-light tracking-tight text-white">
                    CIG
                  </h4>
                  <p className="text-center text-slate-300 font-light text-xs sm:text-sm">
                    Centre de gestion - Ressources pour agents publics
                  </p>
                  <div className="flex items-center gap-2 text-fuchsia-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <span className="font-light text-xs sm:text-sm">Visiter</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* --- SECTION CALCULATEURS FULL-WIDTH --- */}
      {chatState.currentView === 'calculators' && (
      <section className="relative w-full min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 z-20">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-800/95 to-blue-900/95 backdrop-blur-md border-b border-blue-500/30 z-30">
          <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  if (activeCalculator) {
                    setActiveCalculator(null)
                  } else {
                    setChatState({ ...chatState, currentView: 'menu' })
                  }
                }}
                className="flex items-center gap-1 sm:gap-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 hover:text-white px-2 sm:px-4 py-2 rounded-lg transition-colors duration-100 font-light text-xs sm:text-sm whitespace-nowrap"
              >
                <ArrowLeft className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">{activeCalculator ? 'Retour aux calculateurs' : 'Retour au menu'}</span>
                <span className="sm:hidden">{activeCalculator ? 'Retour' : 'Menu'}</span>
              </button>
              <h2 className="text-base sm:text-xl font-light text-white">Calculateurs CFDT</h2>
            </div>
          </div>
        </div>

        {/* Page d'accueil avec les 3 icônes */}
        {!activeCalculator && (
          <div className="max-w-6xl mx-auto px-2 sm:px-4 py-6 sm:py-12 calc-landing-enter">
            <div className="text-center mb-6 sm:mb-12">
              <h3 className="text-2xl sm:text-3xl font-light text-white mb-2 sm:mb-4">Choisissez un calculateur</h3>
              <p className="text-slate-400 font-light text-sm sm:text-base">Cliquez sur une icône pour accéder au calculateur</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
              {/* Carte Primes IFSE */}
              <button
                onClick={() => setActiveCalculator('primes')}
                className="group relative bg-gradient-to-br from-slate-800/80 to-cyan-900/50 backdrop-blur-md border border-cyan-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/20 hover:scale-105 hover:-translate-y-2 transition-transform duration-150 glass-card"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-xl sm:rounded-2xl"></div>
                <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-6">
                  <div className="p-3 sm:p-6 bg-gradient-to-br from-cyan-500/80 to-blue-500/80 rounded-xl sm:rounded-2xl shadow-2xl group-hover:scale-110 transition-transform duration-150">
                    <TrendingUp className="w-8 sm:w-16 h-8 sm:h-16 text-white" />
                  </div>
                  <h4 className="text-lg sm:text-2xl font-light text-white group-hover:text-cyan-200 transition-colors duration-100">Primes IFSE</h4>
                  <p className="text-center text-slate-400 font-light text-xs sm:text-sm">Calculez vos primes IFSE 1 et IFSE 2 selon votre grade et direction</p>
                </div>
              </button>

              {/* Carte CIA */}
              <button
                onClick={() => setActiveCalculator('cia')}
                className="group relative bg-gradient-to-br from-slate-800/80 to-orange-900/50 backdrop-blur-md border border-orange-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-xl hover:shadow-2xl hover:shadow-orange-500/20 hover:scale-105 hover:-translate-y-2 transition-transform duration-150 glass-card"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-xl sm:rounded-2xl"></div>
                <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-6">
                  <div className="p-3 sm:p-6 bg-gradient-to-br from-orange-500/80 to-amber-500/80 rounded-xl sm:rounded-2xl shadow-2xl group-hover:scale-110 transition-transform duration-150">
                    <Calculator className="w-8 sm:w-16 h-8 sm:h-16 text-white" />
                  </div>
                  <h4 className="text-lg sm:text-2xl font-light text-white group-hover:text-orange-200 transition-colors duration-100">CIA</h4>
                  <p className="text-center text-slate-400 font-light text-xs sm:text-sm">Complément Indemnitaire Annuel - Simulez votre prime CIA</p>
                </div>
              </button>

              {/* Carte 13ème Mois */}
              <button
                onClick={() => setActiveCalculator('13eme')}
                className="group relative bg-gradient-to-br from-slate-800/80 to-green-900/50 backdrop-blur-md border border-green-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-xl hover:shadow-2xl hover:shadow-green-500/20 hover:scale-105 hover:-translate-y-2 transition-transform duration-150 glass-card"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-xl sm:rounded-2xl"></div>
                <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-6">
                  <div className="p-3 sm:p-6 bg-gradient-to-br from-green-500/80 to-emerald-500/80 rounded-xl sm:rounded-2xl shadow-2xl group-hover:scale-110 transition-transform duration-150">
                    <DollarSign className="w-8 sm:w-16 h-8 sm:h-16 text-white" />
                  </div>
                  <h4 className="text-lg sm:text-2xl font-light text-white group-hover:text-green-200 transition-colors duration-100">13ème Mois</h4>
                  <p className="text-center text-slate-400 font-light text-xs sm:text-sm">Calculez votre prime de 13ème mois selon votre situation</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Contenu du calculateur sélectionné */}
        {activeCalculator === 'primes' && (
          <div className="calc-tool-enter"><CalculateurPrimesV2 onClose={() => setActiveCalculator(null)} /></div>
        )}
        {activeCalculator === 'cia' && (
          <div className="calc-tool-enter"><CalculateurCIAV2 onClose={() => setActiveCalculator(null)} /></div>
        )}
        {activeCalculator === '13eme' && (
          <div className="calc-tool-enter"><Calculateur13emeV2 onClose={() => setActiveCalculator(null)} /></div>
        )}
      </section>
      )}

      <main className="relative max-w-full mx-auto px-2 sm:px-4 lg:px-8 py-2 z-10">
        {chatState.currentView === "chat" && (
          <div
            ref={chatContainerRef}
            className="bg-gradient-to-br from-slate-800/80 via-purple-900/80 to-slate-800/80 backdrop-blur-md border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 glass-card animate-chat-enter max-w-4xl mx-auto"
          >
            <div className="bg-gradient-to-r from-purple-600/70 via-pink-600/70 to-purple-600/70 backdrop-blur text-white p-3 sm:p-6 glass-banner">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <Search className="w-5 sm:w-7 h-5 sm:h-7 text-pink-200 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-lg font-light tracking-tight truncate">
                      Assistant CFDT Unifié
                    </h3>
                    <p className="text-purple-100 text-xs font-light">CFDT Gennevilliers</p>
                  </div>
                </div>
                <button
                  onClick={returnToMenu}
                  className="flex items-center gap-1 sm:gap-2 bg-white/20 hover:bg-white/30 px-2 sm:px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm font-light glass-pill flex-shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Retour</span>
                </button>
              </div>
            </div>
            <div className="min-h-[300px] sm:min-h-[400px] max-h-[500px] sm:max-h-[700px] overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 bg-gradient-to-b from-slate-800/40 to-purple-900/40 glass-card">
              {chatState.messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs sm:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-xl backdrop-blur-sm font-light glass-card text-sm sm:text-base ${message.type === "user" ? "bg-gradient-to-r from-purple-600/70 to-pink-600/70 text-white shadow-lg" : "bg-slate-700/70 text-slate-100 border border-purple-500/30"}`}
                  >
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                    <div className={`text-xs mt-2 ${message.type === "user" ? "text-purple-100" : "text-slate-400"}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
              {chatState.isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-slate-700/70 backdrop-blur-sm border border-purple-500/30 px-4 py-3 rounded-xl glass-card">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full typing-dot-1"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full typing-dot-2"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full typing-dot-3"></div>
                      <span className="text-slate-200 ml-2 text-sm font-light">L&apos;assistant réfléchit...</span>
                    </div>
                  </div>
                </div>
              )}
              {/* Boutons Oui/Non pour élargir la recherche */}
              {showExpandSearch && !chatState.isProcessing && (
                <div className="flex justify-center gap-4 mt-4 mb-2">
                  <button
                    onClick={handleExpandSearch}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center gap-2 btn-cta"
                  >
                    <span>✅ Oui, rechercher sur Légifrance</span>
                  </button>
                  <button
                    onClick={handleDeclineSearch}
                    className="px-8 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center gap-2 glass-pill"
                  >
                    <span>❌ Non, retour à l'accueil</span>
                  </button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t border-purple-500/30 bg-gradient-to-r from-slate-800/80 to-purple-900/80 backdrop-blur-md p-2 sm:p-4 glass-banner">
              <div className="flex gap-2 sm:gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Posez votre question..."
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-purple-500/30 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 outline-none transition-all duration-200 bg-slate-700/70 backdrop-blur-sm text-xs sm:text-sm font-light text-slate-100 placeholder-slate-400"
                  disabled={chatState.isProcessing}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || chatState.isProcessing}
                  className={`px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600/70 to-pink-600/70 backdrop-blur-sm text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-1 sm:gap-2 shadow-lg hover:shadow-xl font-light flex-shrink-0${inputValue.trim() && !chatState.isProcessing ? ' send-btn-pulse' : ''}`}
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Envoyer</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* --- BANDEAU RSS DÉFILANT --- */}
      <RssBandeau rssItems={rssItems} rssLoading={rssLoading} marqueeRef={rssMarqueeRef} />

      <footer 
        className="relative text-slate-400 text-center py-4 mt-0 z-10 border-t border-purple-500/20 glass-banner footer-glass"
        style={{
          backgroundImage: `
            linear-gradient(to right, 
              rgba(15, 23, 42, 0.85), 
              rgba(88, 28, 135, 0.85), 
              rgba(15, 23, 42, 0.85)
            ),
            url('${BASE_URL}mairie.jpeg')
          `,
          backgroundPosition: 'center bottom',
          backgroundSize: 'cover',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="max-w-6xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
            <span className="text-pink-400 font-light text-sm sm:text-base tracking-wide">CFDT Gennevilliers</span>
          </div>
          <div className="flex flex-col gap-3 sm:gap-8 mb-4 sm:mb-6">
            <a
              href="tel:0140856464"
              className="flex items-center justify-center sm:justify-start gap-2 text-pink-400/90 hover:text-pink-300 transition-all duration-200 hover:scale-105 font-light text-xs sm:text-sm"
            >
              <Phone className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
              <span>01 40 85 64 64</span>
            </a>
            <a
              href="mailto:cfdt-interco@ville-gennevilliers.fr"
              className="flex items-center justify-center sm:justify-start gap-2 text-pink-400/90 hover:text-pink-300 transition-all duration-200 hover:scale-105 font-light text-xs sm:text-sm break-all"
            >
              <Mail className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
              <span>cfdt-interco@ville-gennevilliers.fr</span>
            </a>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-pink-400/90 font-light text-xs sm:text-sm">
              <MapPin className="w-4 sm:w-5 h-4 sm:h-5 flex-shrink-0" />
              <span>177 av. Gabriel-Péri</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-light">
            92237 Gennevilliers Cedex
          </p>
          
          {/* Bouton Admin */}
          <div className="mt-8 pt-8 border-t border-purple-500/20">
            <button
              onClick={() => {
                // Vérifier si déjà authentifié
                const isAuth = localStorage.getItem('admin_authenticated') === 'true';
                if (isAuth) {
                  setShowAdminPanel(true);
                } else {
                  setShowAdminLogin(true);
                }
              }}
              className="px-4 py-2 bg-purple-600/50 border border-purple-500/50 text-purple-300 rounded-lg hover:bg-purple-600/70 transition-all duration-200 font-light text-xs glass-pill"
            >
              Accès Administrateur
            </button>
          </div>
        </div>
      </footer>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <AdminLogin 
          onClose={() => setShowAdminLogin(false)} 
          onSuccess={() => {
            setShowAdminLogin(false);
            setShowAdminPanel(true);
          }}
        />
      )}

      {/* Admin Panel Modal */}
      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
    </div>
  );
}


export default App;
