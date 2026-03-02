import React, { useState, useRef, useEffect } from "react"
import { Phone, Mail, MapPin, ArrowRight, Send, ArrowLeft, Search, Rss, Calculator, TrendingUp, DollarSign, LayoutGrid, HelpCircle, ChevronLeft, ChevronRight, Newspaper } from "lucide-react"

// --- IMPORTATIONS DES DONNÉES ---
import { chapitres } from "./data/temps.ts"
import { formation } from "./data/formation.ts"
import { teletravailData } from "./data/teletravail.ts"
import { sommaireUnifie, rechercherAvecPriorite } from "./data/sommaireUnifie.ts"
import { infoItems } from "./data/info-data.ts"
import { franceInfoRss } from "./data/rss-data.ts"
import AdminPanel from "./components/AdminPanel.tsx"
import AdminLogin from "./components/AdminLogin.tsx"
import CalculateurCIAV2 from "./components/CalculateurCIAV2.tsx"
import CalculateurPrimesV2 from "./components/CalculateurPrimesV2.tsx"
import Calculateur13emeV2 from "./components/Calculateur13emeV2.tsx"
import Metiers from "./components/Metiers.tsx"
import FAQ from "./components/FAQ.tsx"
import LandingPage from "./components/LandingPage.tsx"


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
  currentView: "menu" | "chat" | "calculators" | "metiers" | "faq"
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

  // --- ACTUALITÉS INTERCO CFDT ---
  interface IntercoNewsItem {
    title: string
    link: string
    pubDate: string
    category: string
    description: string
  }
  const [intercoNews, setIntercoNews] = useState<IntercoNewsItem[]>([])
  const [intercoLoading, setIntercoLoading] = useState(true)
  const intercoCarouselRef = useRef<HTMLDivElement>(null)





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

  // --- ACTUALITÉS STATIQUES CFDT INTERCO (fallback) ---
  const intercoFallbackNews: IntercoNewsItem[] = [
    { title: "8 mars, Journée internationale des droits des femmes : la France doit s'engager pour l'égalité !", link: "https://interco.cfdt.fr/8-mars-journee-internationale-des-droits-des-femmes-la-france-doit-sengager-pour-legalite/", pubDate: "Sat, 08 Mar 2026 00:00:00 +0000", category: "Actu générale", description: "Communiqué intersyndical pour la Journée internationale des droits des femmes." },
    { title: "La CFDT réagit à l'annonce de la création de 150 postes en milieu ouvert à la PJJ", link: "https://interco.cfdt.fr/quand-la-protection-judiciaire-de-la-jeunesse-entend-reinventer-le-placement/", pubDate: "Fri, 20 Feb 2026 00:00:00 +0000", category: "Protection judiciaire", description: "Quand la protection judiciaire de la jeunesse entend réinventer le placement." },
    { title: "Défendre l'autonomie et les moyens du CNFPT", link: "https://interco.cfdt.fr/defendre-lautonomie-et-les-moyens-du-cnfpt/", pubDate: "Thu, 12 Feb 2026 00:00:00 +0000", category: "Territoriale", description: "Déclaration CFDT pour défendre l'autonomie et les moyens du CNFPT." },
    { title: "Comment valoriser l'implication des agents et des magistrats ?", link: "https://interco.cfdt.fr/comment-valoriser-limplication-des-agents-et-des-magistrats-et-leur-determination-a-rendre-la-meilleure-justice/", pubDate: "Tue, 10 Feb 2026 00:00:00 +0000", category: "Services judiciaires", description: "Déclaration liminaire Formation spécialisée CSA des services judiciaires." },
    { title: "Se donner l'ambition et les moyens — CSA PJJ du 5 février 2026", link: "https://interco.cfdt.fr/se-donner-lambition-et-les-moyens/", pubDate: "Thu, 05 Feb 2026 00:00:00 +0000", category: "Actu générale", description: "Déclaration préliminaire de la CFDT au CSA PJJ du 5 février 2026." },
    { title: "Un changement de cap clair et concret est demandé !", link: "https://interco.cfdt.fr/un-changement-de-cap-clair-et-concret-est-demande/", pubDate: "Sun, 26 Jan 2026 00:00:00 +0000", category: "Affaires sociales", description: "Déclaration liminaire de la CFDT lors de la rencontre avec la ministre de la Santé." },
    { title: "Déclaration liminaire CFDT au CSA services judiciaires du 19 février", link: "https://interco.cfdt.fr/lacte-de-juger-ne-se-reduit-pas-au-rendu-dune-decision/", pubDate: "Wed, 19 Feb 2026 00:00:00 +0000", category: "Services judiciaires", description: "L'absence de réflexion transverse sur le sens des missions de chacun." },
  ]

  // --- CHARGER LES ACTUALITÉS INTERCO CFDT ---
  useEffect(() => {
    const fetchIntercoNews = async () => {
      try {
        setIntercoLoading(true)
        const apiUrl = import.meta.env.DEV
          ? '/api/interco-rss'
          : `${window.location.origin}${BASE_URL === '/' ? '' : BASE_URL}/api/interco-rss`
        const response = await fetch(apiUrl)
        if (!response.ok) throw new Error(`Erreur serveur: ${response.status}`)
        const data = await response.json()
        const items = (data.items || []).map((item: IntercoNewsItem) => ({
          ...item,
          title: item.title.replace(/^•\s*/, '').trim()
        }))
        if (items.length > 0) {
          setIntercoNews(items)
        } else {
          setIntercoNews(intercoFallbackNews)
        }
      } catch (error) {
        console.warn('Impossible de récupérer les actualités Interco CFDT, utilisation des données par défaut', error)
        setIntercoNews(intercoFallbackNews)
      } finally {
        setIntercoLoading(false)
      }
    }
    fetchIntercoNews()
    const interval = setInterval(fetchIntercoNews, 30 * 60 * 1000)
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

    // Parser la réponse pour extraire les IDs (tolérant à la ponctuation et au texte parasite)
    const responseClean = identificationResponse.toLowerCase().replace(/["']/g, '').replace(/\[/g, '').replace(/\]/g, '').trim()
    
    // Extraire les IDs valides de façon robuste (même si le modèle dit "AUCUNE", fallback local)
    const knownIds = sommaireUnifie.map(s => s.id)
    const idsExtraits = (responseClean === 'aucune' || responseClean.includes('aucune section')) 
      ? [] 
      : knownIds.filter(id => responseClean.includes(id.toLowerCase()))

    // Fallback déterministe local si le modèle n'a pas renvoyé d'IDs exploitables
    const idsLocaux = rechercherAvecPriorite(question, 4).map(section => section.id)
    const idsFinals = Array.from(new Set([...idsExtraits, ...idsLocaux]))
    
    console.log(`[traiterQuestion] Question: "${question}"`)
    console.log(`[traiterQuestion] IDs du modèle (phase 1): [${idsExtraits.join(', ')}]`)
    console.log(`[traiterQuestion] IDs locaux (fallback): [${idsLocaux.join(', ')}]`)
    console.log(`[traiterQuestion] IDs finaux: [${idsFinals.join(', ')}]`)

    // Si aucun ID valide trouvé, fallback sur recherche complète (1 chapitre)
    let contenuCible: string
    if (idsFinals.length === 0) {
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
      contenuCible = chargerContenuSections(idsFinals)
    }

    const systemPrompt = `
Tu es un assistant CFDT pour la Mairie de Gennevilliers.

RÈGLES STRICTES :
1. Réponds UNIQUEMENT en utilisant les documents ci-dessous
2. Ne cherche JAMAIS sur internet, n'utilise JAMAIS tes connaissances externes
3. Sois précis sur les chiffres et délais mentionnés dans les documents
4. Réponds comme un collègue syndical bienveillant
5. Ne mentionne JAMAIS [CHAPITRE X - ARTICLE Y] dans ta réponse. Réponds naturellement.

⚠️ RÈGLE CRITIQUE - INTERPRÈTE LA QUESTION :
- Si l'utilisateur demande "congés bonifiés" → cherche "congé bonifié" dans les documents
- Si l'utilisateur demande "école grève" → cherche "garde d'enfant", "école fermée", "grève"
- Fais des correspondances intelligentes entre les termes utilisés et le contenu des documents

⚠️ RÈGLE CRITIQUE - SI TU TROUVES L'INFO :
- Donne directement la réponse, sans dire "Je ne trouve pas"
- Cite les détails précis des documents
- Même si la question est mal formulée, tente de comprendre et répondre si possible

⚠️ RÈGLE CRITIQUE - SI TU NE TROUVES PAS L'INFO :
- Réponds UNIQUEMENT : "Je ne trouve pas cette information dans nos documents internes. Contactez la CFDT au 01 40 85 64 64."
- ARRÊTE-TOI IMMÉDIATEMENT après cette phrase
- N'ajoute AUCUNE information supplémentaire
- Ne commence JAMAIS par "Je ne trouve pas" puis donne une réponse ensuite

DOCUMENTATION :
${contenuCible}
    `

    // Pour l'instant, pas d'historique de conversation pour éviter les erreurs d'alternance
    // L'API Perplexity exige une alternance stricte user/assistant/user/assistant
    // Chaque question est traitée indépendamment avec le contexte documentaire complet
    const apiMessages = [
      { role: "system", content: systemPrompt },
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
      
      // Détecter STRICTEMENT la réponse de non-trouvaille (évite les faux positifs)
      const normalizedResponse = reponseContent
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()

      const isNotFound =
        normalizedResponse === "je ne trouve pas cette information dans nos documents internes. contactez la cfdt au 01 40 85 64 64." ||
        normalizedResponse.startsWith("je ne trouve pas cette information dans nos documents internes")
      
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
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0 pointer-events-none"
        style={{ backgroundImage: `url('${BASE_URL}unnamed.jpg')`, opacity: 0.3 }}
      ></div>

      {/* Subtle overlay for better text readability */}
      <div className="fixed inset-0 bg-black/20 z-0 pointer-events-none"></div>

      {/* Couches de fond supplémentaires — supprimées (GPU layers plein écran) */}

      {/* HEADER PROFESSIONNEL */}
      <header className="relative bg-gradient-to-r from-slate-900/95 via-purple-900/90 to-slate-900/95 shadow-lg z-10 bg-cover bg-center glass-banner header-bottom-glow" style={{ backgroundImage: `url('${BASE_URL}mairie.jpeg')`, backgroundBlendMode: 'overlay' }}>
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
      <section className="relative bg-gradient-to-r from-orange-600/90 via-red-600/90 to-pink-600/90 text-white overflow-hidden w-full shadow-lg border-b border-orange-400/30 z-10 glass-banner marquee-pausable banner-top-streak">
      <div className="relative h-16 flex items-center overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-32 flex items-center justify-center bg-gradient-to-r from-orange-700 to-red-700 z-20 shadow-lg glass-pill news-pill-glow">
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

                <div className="flex justify-center mb-1 gap-8">
                  <button
                    onClick={() => handleDomainSelection(0)}
                    className="group relative overflow-hidden bg-gradient-to-br from-slate-800/70 via-purple-900/70 to-slate-800/70 backdrop-blur-md border border-purple-500/30 rounded-2xl p-10 hover:border-pink-500/50 hover:shadow-2xl hover:-translate-y-1 w-80 h-96 transition-transform duration-150 glass-card animate-card-enter-1 card-border-sweep btn-ripple"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
                    <div className="relative z-10 flex flex-col items-center gap-6 h-full justify-between">
                      <div className="relative">
                        <span className="absolute -inset-3 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg group-hover:scale-110 transition-opacity duration-150"></span>
                        <div className="relative p-6 bg-gradient-to-br from-purple-500/80 to-pink-500/80 backdrop-blur rounded-2xl shadow-2xl icon-box-spring">
                          <Search className="w-16 h-16 text-white" />
                        </div>
                      </div>
                      <h4 className="text-2xl font-light tracking-tight text-white card-title-purple">
                        Recherche Unifiée
                      </h4>
                      <p className="text-center text-slate-300 font-light text-sm">
                        Temps de travail, formation, télétravail - Recherche dans tous les documents
                      </p>
                      <div className="flex items-center gap-2 text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <span className="font-light text-sm">Accéder à l&apos;assistant</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={(e) => e.preventDefault()}
                    disabled
                    className="group relative overflow-hidden bg-gradient-to-br from-slate-800/70 via-blue-900/70 to-slate-800/70 backdrop-blur-md border border-blue-500/30 rounded-2xl p-10 w-80 h-96 transition-transform duration-150 glass-card animate-card-enter-2 opacity-50 cursor-not-allowed pointer-events-none"
                  >
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="relative z-10 flex flex-col items-center gap-6 h-full justify-between">
                      <div className="relative">
                        <div className="relative p-6 bg-gradient-to-br from-blue-500/50 to-cyan-500/50 backdrop-blur rounded-2xl shadow-2xl">
                          <Calculator className="w-16 h-16 text-white/70" />
                        </div>
                      </div>
                      <h4 className="text-2xl font-light tracking-tight text-white/70 card-title-blue">
                        Calculateurs
                      </h4>
                      <p className="text-center text-slate-300/60 font-light text-sm">
                        Primes IFSE - Calcul CIA - Outils de simulation
                      </p>
                      <div className="flex items-center gap-2 text-cyan-400/60">
                        <span className="font-light text-sm">Bientôt disponible</span>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold shadow-lg z-20">
                      BIENTÔT DISPONIBLE
                    </div>
                  </button>

                  {/* Carte Grilles Indiciaires */}
                  <button
                    onClick={() => setChatState({ ...chatState, currentView: 'metiers' })}
                    className="group relative overflow-hidden bg-gradient-to-br from-slate-800/70 via-emerald-900/70 to-slate-800/70 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-10 hover:border-green-500/50 hover:shadow-2xl hover:-translate-y-1 w-80 h-96 transition-transform duration-150 glass-card animate-card-enter-3 card-border-sweep card-border-sweep-green btn-ripple"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-150"></div>
                    <div className="relative z-10 flex flex-col items-center gap-6 h-full justify-between">
                      <div className="relative">
                        <span className="absolute -inset-3 bg-gradient-to-br from-emerald-400/30 to-green-400/30 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg group-hover:scale-110 transition-opacity duration-150"></span>
                        <div className="relative p-6 bg-gradient-to-br from-emerald-500/80 to-green-500/80 backdrop-blur rounded-2xl shadow-2xl icon-box-spring">
                          <LayoutGrid className="w-16 h-16 text-white" />
                        </div>
                      </div>
                      <h4 className="text-2xl font-light tracking-tight text-white card-title-green">
                        Grilles Indiciaires
                      </h4>
                      <p className="text-center text-slate-300 font-light text-sm">
                        Filières, métiers et grilles de rémunération FPT
                      </p>
                      <div className="flex items-center gap-2 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <span className="font-light text-sm">Voir les grilles</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                </div>

                {/* Bouton Questions Fréquentes */}
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => setChatState({ ...chatState, currentView: 'faq' })}
                    className="group flex items-center gap-3 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-500 hover:via-amber-500 hover:to-yellow-600 text-slate-900 font-medium px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:shadow-yellow-500/30 transition-all duration-150 hover:scale-105 btn-cta animate-cta-enter btn-shine"
                  >
                    <HelpCircle className="w-6 h-6" />
                    <span className="text-lg">Questions Fréquentes</span>
                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                  </button>
                </div>

                {/* --- CARROUSEL ACTUALITÉS INTERCO CFDT --- */}
                {(
                <div className="mt-12 mb-4">
                  <div className="flex items-center gap-3 mb-5 justify-center">
                    <Newspaper className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-light text-white tracking-wide">Actualités <span className="text-blue-300 font-normal">CFDT Interco</span></h3>
                    <a
                      href="https://interco.cfdt.fr/actualites/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-xs text-slate-400 hover:text-blue-300 transition-colors duration-150 underline underline-offset-2"
                    >
                      Voir toutes les actualités →
                    </a>
                  </div>

                  {intercoLoading ? (
                    <div className="flex gap-4 overflow-hidden">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex-none w-72 h-44 bg-slate-800/50 rounded-2xl animate-pulse border border-slate-700/40" />
                      ))}
                    </div>
                  ) : (
                    <div className="relative group/carousel">
                      {/* Flèche gauche */}
                      <button
                        onClick={() => {
                          if (intercoCarouselRef.current) {
                            intercoCarouselRef.current.scrollBy({ left: -320, behavior: 'smooth' })
                          }
                        }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 rounded-full bg-slate-800/90 border border-slate-600/50 flex items-center justify-center text-white shadow-lg opacity-0 group-hover/carousel:opacity-100 hover:bg-slate-700 transition-all duration-150"
                        aria-label="Défiler à gauche"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      {/* Flèche droite */}
                      <button
                        onClick={() => {
                          if (intercoCarouselRef.current) {
                            intercoCarouselRef.current.scrollBy({ left: 320, behavior: 'smooth' })
                          }
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 rounded-full bg-slate-800/90 border border-slate-600/50 flex items-center justify-center text-white shadow-lg opacity-0 group-hover/carousel:opacity-100 hover:bg-slate-700 transition-all duration-150"
                        aria-label="Défiler à droite"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      {/* Dégradés latéraux */}
                      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900/80 to-transparent z-[1] pointer-events-none rounded-l-2xl" />
                      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900/80 to-transparent z-[1] pointer-events-none rounded-r-2xl" />

                      {/* Scrollable track */}
                      <div
                        ref={intercoCarouselRef}
                        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth interco-carousel-track"
                        style={{ scrollbarWidth: 'none' }}
                      >
                        {intercoNews.map((article, i) => {
                          const date = article.pubDate ? new Date(article.pubDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
                          return (
                            <a
                              key={i}
                              href={article.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group/card flex-none w-72 flex flex-col justify-between bg-gradient-to-br from-slate-800/80 via-blue-950/60 to-slate-800/80 backdrop-blur-md border border-blue-500/20 rounded-2xl p-5 hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-150 glass-card"
                            >
                              <div>
                                {article.category && (
                                  <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-3">
                                    {article.category}
                                  </span>
                                )}
                                <p className="text-white font-light text-sm leading-snug group-hover/card:text-blue-200 transition-colors duration-150 line-clamp-3">
                                  {article.title}
                                </p>
                              </div>
                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/40">
                                <span className="text-xs text-slate-400 font-light">{date}</span>
                                <span className="text-xs text-blue-400 flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity duration-150">
                                  Lire <ArrowRight className="w-3 h-3" />
                                </span>
                              </div>
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
                )}
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

      {/* --- SECTION CALCULATEURS FULL-WIDTH --- */}
      {chatState.currentView === 'calculators' && (
      <section className="relative w-full min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 z-20">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-800/95 to-blue-900/95 backdrop-blur-md border-b border-blue-500/30 z-30">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  if (activeCalculator) {
                    setActiveCalculator(null)
                  } else {
                    setChatState({ ...chatState, currentView: 'menu' })
                  }
                }}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-100 font-light"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{activeCalculator ? 'Retour aux calculateurs' : 'Retour au menu'}</span>
              </button>
              <h2 className="text-xl font-light text-white">Calculateurs CFDT</h2>
            </div>
          </div>
        </div>

        {/* Page d'accueil avec les 3 icônes */}
        {!activeCalculator && (
          <div className="max-w-6xl mx-auto px-4 py-12 calc-landing-enter">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-light text-white mb-4">Choisissez un calculateur</h3>
              <p className="text-slate-400 font-light">Cliquez sur une icône pour accéder au calculateur</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Carte Primes IFSE */}
              <button
                onClick={() => setActiveCalculator('primes')}
                className="group relative bg-gradient-to-br from-slate-800/80 to-cyan-900/50 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/20 hover:scale-105 hover:-translate-y-2 transition-transform duration-150 glass-card"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-2xl"></div>
                <div className="relative z-10 flex flex-col items-center gap-6">
                  <div className="p-6 bg-gradient-to-br from-cyan-500/80 to-blue-500/80 rounded-2xl shadow-2xl group-hover:scale-110 transition-transform duration-150">
                    <TrendingUp className="w-16 h-16 text-white" />
                  </div>
                  <h4 className="text-2xl font-light text-white group-hover:text-cyan-200 transition-colors duration-100">Primes IFSE</h4>
                  <p className="text-center text-slate-400 font-light text-sm">Calculez vos primes IFSE 1 et IFSE 2 selon votre grade et direction</p>
                </div>
              </button>

              {/* Carte CIA */}
              <button
                onClick={() => setActiveCalculator('cia')}
                className="group relative bg-gradient-to-br from-slate-800/80 to-orange-900/50 backdrop-blur-md border border-orange-500/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:shadow-orange-500/20 hover:scale-105 hover:-translate-y-2 transition-transform duration-150 glass-card"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-2xl"></div>
                <div className="relative z-10 flex flex-col items-center gap-6">
                  <div className="p-6 bg-gradient-to-br from-orange-500/80 to-amber-500/80 rounded-2xl shadow-2xl group-hover:scale-110 transition-transform duration-150">
                    <Calculator className="w-16 h-16 text-white" />
                  </div>
                  <h4 className="text-2xl font-light text-white group-hover:text-orange-200 transition-colors duration-100">CIA</h4>
                  <p className="text-center text-slate-400 font-light text-sm">Complément Indemnitaire Annuel - Simulez votre prime CIA</p>
                </div>
              </button>

              {/* Carte 13ème Mois */}
              <button
                onClick={() => setActiveCalculator('13eme')}
                className="group relative bg-gradient-to-br from-slate-800/80 to-green-900/50 backdrop-blur-md border border-green-500/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:shadow-green-500/20 hover:scale-105 hover:-translate-y-2 transition-transform duration-150 glass-card"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-2xl"></div>
                <div className="relative z-10 flex flex-col items-center gap-6">
                  <div className="p-6 bg-gradient-to-br from-green-500/80 to-emerald-500/80 rounded-2xl shadow-2xl group-hover:scale-110 transition-transform duration-150">
                    <DollarSign className="w-16 h-16 text-white" />
                  </div>
                  <h4 className="text-2xl font-light text-white group-hover:text-green-200 transition-colors duration-100">13ème Mois</h4>
                  <p className="text-center text-slate-400 font-light text-sm">Calculez votre prime de 13ème mois selon votre situation</p>
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

      <main className="relative max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-2 z-10">
        {chatState.currentView === "chat" && (
          <div
            ref={chatContainerRef}
            className="bg-gradient-to-br from-slate-800/80 via-purple-900/80 to-slate-800/80 backdrop-blur-md border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 glass-card animate-chat-enter"
          >
            <div className="bg-gradient-to-r from-purple-600/70 via-pink-600/70 to-purple-600/70 backdrop-blur text-white p-6 glass-banner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Search className="w-7 h-7 text-pink-200" />
                  <div>
                    <h3 className="text-lg font-light tracking-tight">
                      Assistant CFDT Unifié
                    </h3>
                    <p className="text-purple-100 text-xs font-light">CFDT Gennevilliers</p>
                  </div>
                </div>
                <button
                  onClick={returnToMenu}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm font-light glass-pill"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Retour</span>
                </button>
              </div>
            </div>
            <div className="min-h-[400px] max-h-[700px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-800/40 to-purple-900/40 glass-card">
              {chatState.messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl backdrop-blur-sm font-light glass-card ${message.type === "user" ? "bg-gradient-to-r from-purple-600/70 to-pink-600/70 text-white shadow-lg" : "bg-slate-700/70 text-slate-100 border border-purple-500/30"}`}
                  >
                    <div className="whitespace-pre-wrap break-words text-sm">{message.content}</div>
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
                    className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center gap-2 glass-pill"
                  >
                    <span>❌ Non, retour à l'accueil</span>
                  </button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t border-purple-500/30 bg-gradient-to-r from-slate-800/80 to-purple-900/80 backdrop-blur-md p-4 glass-banner">
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ex: Combien de jours de congés ? Comment utiliser mon CPF ? Télétravail possible ?"
                  className="flex-1 px-4 py-3 border border-purple-500/30 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 outline-none transition-all duration-200 bg-slate-700/70 backdrop-blur-sm text-sm font-light text-slate-100 placeholder-slate-400"
                  disabled={chatState.isProcessing}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || chatState.isProcessing}
                  className={`px-6 py-3 bg-gradient-to-r from-purple-600/70 to-pink-600/70 backdrop-blur-sm text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl font-light${inputValue.trim() && !chatState.isProcessing ? ' send-btn-pulse' : ''}`}
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center gap-3 mb-8">
            <span className="text-pink-400 font-light text-base tracking-wide">CFDT Gennevilliers</span>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-8 mb-6">
            <a
              href="tel:0140856464"
              className="flex items-center gap-2 text-pink-400/90 hover:text-pink-300 transition-all duration-200 hover:scale-110 font-light text-sm"
            >
              <Phone className="w-5 h-5" />
              <span>01 40 85 64 64</span>
            </a>
            <a
              href="mailto:cfdt-interco@ville-gennevilliers.fr"
              className="flex items-center gap-2 text-pink-400/90 hover:text-pink-300 transition-all duration-200 hover:scale-110 font-light text-sm"
            >
              <Mail className="w-5 h-5" />
              <span>cfdt-interco@ville-gennevilliers.fr</span>
            </a>
            <div className="flex items-center gap-2 text-pink-400/90 font-light text-sm">
              <MapPin className="w-5 h-5" />
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
