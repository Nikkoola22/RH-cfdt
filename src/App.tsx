import React, { useState, useRef, useEffect, useMemo } from "react"
import { Phone, Mail, MapPin, ArrowRight, Send, ArrowLeft, Search, Rss, Calculator, TrendingUp, DollarSign } from "lucide-react"

// --- IMPORTATIONS DES DONNÉES ---
import { sommaire } from "./data/sommaire.ts"
import { chapitres } from "./data/temps.ts"
import { formation } from "./data/formation.ts"
import { teletravailData } from "./data/teletravail.ts"
import { infoItems } from "./data/info-data.ts"
import { ifse1Data, getAllDirections, getIFSE2ByDirection, getDirectionFullName } from "./data/rifseep-data.ts"
import { franceInfoRss } from "./data/rss-data.ts"
import AdminPanel from "./components/AdminPanel.tsx"
import AdminLogin from "./components/AdminLogin.tsx"
import CalculateurCIA from "./components/CalculateurCIA.tsx"
import CalculateurPrimes from "./components/CalculateurPrimes.tsx"
import Calculateur13eme from "./components/Calculateur13eme.tsx"


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

// --- COMPOSANT RSS BANDEAU (mémorisé pour éviter les re-renders) ---
const RssBandeau = React.memo(({ rssItems, rssLoading }: { rssItems: RssItem[], rssLoading: boolean }) => {
  // Mémoriser le contenu pour éviter que l'animation ne se réinitialise
  const content = useMemo(() => {
    if (rssItems.length === 0) {
      return (
        <span className="text-base mx-8 font-light text-slate-100">
          {rssLoading ? "Chargement des articles..." : "Aucun article disponible"}
        </span>
      )
    }
    // Tripler les items pour un défilement continu
    return [...rssItems, ...rssItems, ...rssItems].map((item, index) => (
      <a
        key={`rss-${index}-${item.link}`}
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-lg font-light mx-6 hover:text-cyan-300 transition-all duration-200 cursor-pointer hover:drop-shadow-lg text-white"
      >
        • {item.title}
      </a>
    ))
  }, [rssItems, rssLoading])

  return (
    <section className="relative bg-gradient-to-r from-blue-600/60 via-indigo-600/60 to-blue-600/60 backdrop-blur-md text-white overflow-hidden w-full shadow-lg border-b border-blue-500/30 z-50 -mt-0">
      <div className="relative h-16 flex items-center overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-40 flex items-center justify-center bg-gradient-to-r from-indigo-700 to-blue-700 backdrop-blur z-20 shadow-lg">
          <div className="flex items-center gap-2">
            <Rss className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span className="text-base font-light tracking-wide text-white">ACTU:</span>
          </div>
        </div>
        <div className="animate-marquee-rss whitespace-nowrap flex items-center pl-44">
          {content}
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
  currentView: "menu" | "chat" | "calculators"
  selectedDomain: number | null
  messages: ChatMessage[]
  isProcessing: boolean
}

// --- PARSING DES DONNÉES ---
const sommaireData = typeof sommaire === 'string' ? JSON.parse(sommaire) : sommaire

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

// --- DICTIONNAIRE DE SYNONYMES ---
const synonymes: Record<string, string[]> = {
  "forfait": ["forfait annuel", "jours forfait", "15 jours", "quota annuel"],
  "teletravail": ["télétravail", "travail distance", "domicile", "remote", "travail à distance", "télécommute"],
  "conge": ["congés", "conges", "vacances", "absence", "cp", "autorisation absence", "jours congés", "jours conges", "nb congés", "nombre congés", "combien jours"],
  "conges annuels": ["congés annuels", "conges annuels", "25 jours", "5 fois", "5x"],
  "jours": ["jours", "nombre", "combien", "total", "quotité"],
  "formation": ["stage", "cours", "cpf", "qualification", "apprentissage", "développement", "compétences"],
  "cpf": ["cpf", "compte personnel formation", "compte personnel activité", "cpa"],
  "vae": ["vae", "validation acquis", "validation expérience"],
  "bilan": ["bilan de compétences", "bilan compétences", "évaluation"],
  "horaire": ["horaires", "temps travail", "planning", "heures"],
  "mariage": ["mariage", "pacs", "wedding", "union", "époux", "épouse"],
  "naissance": ["naissance", "accouchement", "enfant", "bébé", "nouveau né"],
  "deuil": ["deuil", "décès", "deces", "enterrement", "obsèques", "obseques", "funérailles", "funerailles", "perte", "mort", "mère", "père", "parent"],
  "rtt": ["RTT", "artt", "temps repo", "jours repos"],
  "astreinte": ["astreinte", "permanence", "garde", "nuit"],
  "maladie": ["maladie", "arrêt maladie", "CLM", "CLD"],
  "cet": ["cet", "compte épargne temps", "épargne", "compte repos"],
  "journee_solidarite": ["journée solidarité", "jour solidarité", "jour supplémentaire"],
  "temps partiel": ["temps partiel", "quotité", "pourcentage"]
}

// --- FONCTION D'EXPANSION DES SYNONYMES ---
const expandirAvecSynonymes = (terme: string): string[] => {
  const termeNettoye = nettoyerChaine(terme)
  const resultats = [termeNettoye]
  
  for (const [motCle, syns] of Object.entries(synonymes)) {
    if (termeNettoye.includes(motCle) || syns.some(syn => termeNettoye.includes(nettoyerChaine(syn)))) {
      resultats.push(motCle, ...syns.map(nettoyerChaine))
    }
  }
  
  return [...new Set(resultats)]
}

// --- FONCTION DE RECHERCHE ---
const trouverContextePertinent = (question: string): string => {
  const questionNettoyee = nettoyerChaine(question)
  const motsQuestionNettoyes = questionNettoyee.split(/\s+/).filter((mot) => mot.length > 0)
  
  // Expansion avec synonymes
  const motsFinalAvecSynonymes = new Set<string>()
  motsQuestionNettoyes.forEach(mot => {
    const syns = expandirAvecSynonymes(mot)
    syns.forEach(syn => motsFinalAvecSynonymes.add(syn))
  })
  
  
  const chapitresTrouves = new Map<number, { score: number }>()

  sommaireData.chapitres.forEach((chapitreItem: any, index: number) => {
    let score = 0
    
    // Utiliser idContenu au lieu de l'index pour la correspondance
    const chapitreId = chapitreItem.idContenu || (index + 1)

    const motsClesChapitre = chapitreItem.mots_cles || []
    const motsClesArticles = (chapitreItem.articles || []).flatMap((article: any) => article.mots_cles || [])

    // Traiter d'abord les mots-clés du chapitre (poids x3)
    motsClesChapitre.forEach((motCle: string) => {
      const motCleNettoye = nettoyerChaine(motCle)
      if (!motCleNettoye) return

      // Booster les mots-clés spécifiques au domaine
      const isSpecificKeyword = ["formation", "cpf", "vae", "bilan compétences", 
                                 "teletravail", "travail distance", "domicile",
                                 "forfait annuel", "15 jours", "4 jours fixes"].includes(motCleNettoye)
      const multiplier = isSpecificKeyword ? 3 : 1

      // Recherche exacte (priorité absolue)
      if (motsFinalAvecSynonymes.has(motCleNettoye)) {
        score += 10 * multiplier * 3
      } 
      // Recherche si mot clé contient un mot de la question
      else if (questionNettoyee.includes(motCleNettoye)) {
        score += 5 * multiplier * 3
      } 
      // Recherche partielle seulement si pas de match exact
      else {
        for (const motQuestion of motsFinalAvecSynonymes) {
          if (motCleNettoye.includes(motQuestion) || motQuestion.includes(motCleNettoye)) {
            score += 2 * multiplier * 3  // Score plus faible pour les matches partiels
            break  // Compter une seule fois par motCle
          }
        }
      }
    })

    // Traiter ensuite les mots-clés des articles (poids x2)
    motsClesArticles.forEach((motCle: string) => {
      const motCleNettoye = nettoyerChaine(motCle)
      if (!motCleNettoye) return

      // Booster les mots-clés spécifiques au domaine
      const isSpecificKeyword = ["formation", "cpf", "vae", "bilan compétences", 
                                 "teletravail", "travail distance", "domicile",
                                 "forfait annuel", "15 jours", "4 jours fixes"].includes(motCleNettoye)
      const multiplier = isSpecificKeyword ? 3 : 1

      // Recherche exacte (priorité absolue)
      if (motsFinalAvecSynonymes.has(motCleNettoye)) {
        score += 10 * multiplier * 2
      } 
      // Recherche si mot clé contient un mot de la question
      else if (questionNettoyee.includes(motCleNettoye)) {
        score += 5 * multiplier * 2
      } 
      // Recherche partielle seulement si pas de match exact
      else {
        for (const motQuestion of motsFinalAvecSynonymes) {
          if (motCleNettoye.includes(motQuestion) || motQuestion.includes(motCleNettoye)) {
            score += 2 * multiplier * 2  // Score plus faible pour les matches partiels
            break  // Compter une seule fois par motCle
          }
        }
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
      sommaireData.chapitres.map((s: any) => s.titre).join(", ")
    )
  }

  const resultatsTries = Array.from(chapitresTrouves.entries())
    .sort(([idA, a], [idB, b]) => {
      // Trier d'abord par score (décroissant)
      if (b.score !== a.score) {
        return b.score - a.score
      }
      // Si scores égaux, favoriser les chapitres qui contiennent "mariage" ou "forfait" exactement
      const chapitreA = sommaireData.chapitres.find((ch: any) => (ch.idContenu || 0) === idA)
      const chapitreB = sommaireData.chapitres.find((ch: any) => (ch.idContenu || 0) === idB)
      const motsDesArticlesA = (chapitreA?.articles || []).map((a: any) => a.titre).join(" ").toLowerCase()
      const motsDesArticlesB = (chapitreB?.articles || []).map((a: any) => a.titre).join(" ").toLowerCase()
      const questionLow = questionNettoyee.toLowerCase()
      
      const scoreArticlesA = motsDesArticlesA.includes(questionLow) ? 1 : 0
      const scoreArticlesB = motsDesArticlesB.includes(questionLow) ? 1 : 0
      
      return scoreArticlesB - scoreArticlesA
    })
    .slice(0, 1)  // Limiter à 1 seul chapitre au lieu de 3 pour éviter le mélange
    .map(([id]) => {
      // Trouver le chapitre correspondant dans le sommaire
      const chapitreData = sommaireData.chapitres.find((ch: any) => (ch.idContenu || 0) === id)
      if (!chapitreData) return null
      
      let contenuTexte = null

      // Gérer les différentes sources selon le sommaire
      if (chapitreData.source === "teletravail") {
        contenuTexte = typeof teletravailData === 'string' ? teletravailData : JSON.stringify(teletravailData)
      } else if (chapitreData.source === "formation") {
        contenuTexte = formation || null
      } else {
        // Par défaut, utiliser les données de temps (chapitres)
        contenuTexte = (chapitres as Record<number, string>)[id] || null
      }

      if (!contenuTexte) {
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
  const [rssItems, setRssItems] = useState<RssItem[]>([])
  const [rssLoading, setRssLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedFunction, setSelectedFunction] = useState<string>("")
  const [selectedDirection, setSelectedDirection] = useState<string>("")
  const [calculatedPrime, setCalculatedPrime] = useState<{ annual: number; monthly: number }>({ annual: 0, monthly: 0 })
  const [selectedIFSE2, setSelectedIFSE2] = useState<Set<number>>(new Set())
  const [activeCalculator, setActiveCalculator] = useState<'primes' | 'cia' | '13eme' | null>(null)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showExpandSearch, setShowExpandSearch] = useState(false)
  const [lastQuestion, setLastQuestion] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // --- EFFETS ---
  useEffect(() => {
    if (chatState.currentView === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [chatState.messages, chatState.currentView])

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
          // Formater les articles avec le bullet point
          const formattedItems = items.slice(0, 5).map((item: any) => ({
            title: item.title.startsWith('•') ? item.title : `• ${item.title}`,
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
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setSelectedFunction("")
    setSelectedDirection("")
    setCalculatedPrime({ annual: 0, monthly: 0 })
  }

  const handleFunctionChange = (functionName: string) => {
    setSelectedFunction(functionName)
    
    // Trouver le montant de la prime basé sur la fonction sélectionnée
    const selectedItem = ifse1Data.find(item => 
      item.category === selectedCategory && item.function === functionName
    )
    
    if (selectedItem) {
      setCalculatedPrime({
        annual: selectedItem.annualAmount,
        monthly: Math.round(selectedItem.monthlyAmount * 100) / 100
      })
    } else {
      setCalculatedPrime({ annual: 0, monthly: 0 })
    }
  }

  const handleDirectionChange = (direction: string) => {
    setSelectedDirection(direction)
    setSelectedIFSE2(new Set()) // Reset IFSE 2 selections when changing direction
  }

  const handleToggleIFSE2 = (index: number) => {
    const newSelected = new Set(selectedIFSE2)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedIFSE2(newSelected)
  }

  // Calculer le total mensuel (IFSE 1 + IFSE 2 sélectionnées)
  const calculateTotalMonthly = () => {
    let total = calculatedPrime.monthly
    if (selectedDirection) {
      const ifse2List = getIFSE2ByDirection(selectedDirection)
      selectedIFSE2.forEach(idx => {
        if (ifse2List[idx]) {
          total += ifse2List[idx].amount
        }
      })
    }
    return total
  }
  const appelPerplexity = async (messages: any[], useExternalModel = false) => {
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

  const traiterQuestion = async (question: string) => {
    // Charger TOUTES les données pour recherche sémantique complète
    const toutLeContenu = `
CHAPITRE 1 - LE TEMPS DE TRAVAIL :
${(chapitres as Record<number, string>)[1] || ''}

CHAPITRE 2 - LES CONGÉS :
${(chapitres as Record<number, string>)[2] || ''}

CHAPITRE 3 - AUTORISATIONS SPÉCIALES D'ABSENCE :
${(chapitres as Record<number, string>)[3] || ''}

CHAPITRE 4 - LES ABSENCES POUR MALADIES ET ACCIDENTS :
${(chapitres as Record<number, string>)[4] || ''}

CHAPITRE 5 - LE RÈGLEMENT FORMATION :
${formation || ''}

CHAPITRE 6 - LE PROTOCOLE TÉLÉTRAVAIL :
${typeof teletravailData === 'string' ? teletravailData : JSON.stringify(teletravailData)}
`

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

DOCUMENTATION COMPLÈTE :
${toutLeContenu}
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
  return (
    <div className="min-h-screen relative">
      {/* Background image with transparency */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url('${BASE_URL}unnamed.jpg')`, opacity: 0.3 }}
      ></div>

      {/* Subtle overlay for better text readability */}
      <div className="fixed inset-0 bg-black/20 z-0"></div>

      {/* HEADER PROFESSIONNEL */}
      <header className="relative bg-gradient-to-r from-slate-900/70 via-purple-900/70 to-slate-900/70 backdrop-blur-md shadow-lg border-b border-purple-500/20 z-10 bg-cover bg-center" style={{ backgroundImage: `url('${BASE_URL}mairie.jpeg')`, backgroundBlendMode: 'overlay' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-purple-900/80 to-slate-900/80 z-0"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 relative z-10">
          <div className="flex items-center justify-between gap-8">
            {/* Logo et texte à gauche */}
            <div className="flex items-center gap-5 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <img
                  src={`${BASE_URL}logo-cfdt.jpg`}
                  alt="Logo CFDT"
                  className="w-32 h-32 object-contain relative transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="space-y-1">
                <h1 className="text-5xl font-light tracking-tight text-white">Atlas</h1>
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
      <section className="relative bg-gradient-to-r from-orange-500/60 via-red-500/60 to-pink-500/60 backdrop-blur-md text-white overflow-hidden w-full shadow-lg border-b border-orange-400/30 z-10">
      <div className="relative h-16 flex items-center overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-32 flex items-center justify-center bg-gradient-to-r from-orange-600 to-red-600 backdrop-blur z-20 shadow-lg">
          <span className="text-base font-light tracking-wide text-white">NEWS:</span>
        </div>
        <div className="animate-marquee whitespace-nowrap flex items-center pl-36">
            {[...infoItems, ...infoItems].map((info, index) => (
              <button
                key={`${info.id}-${index}`}
                onClick={() => handleInfoClick(info)}
                className="text-lg font-light mx-6 hover:text-amber-200 transition-all duration-200 cursor-pointer hover:scale-105 text-white"
              >
                #{info.id}: {info.title}
              </button>
            ))}
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
                  <section className="info-detail bg-gradient-to-br from-slate-800/80 via-purple-900/80 to-slate-800/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-purple-500/30 mb-8 max-w-4xl mx-auto hover:shadow-2xl transition-shadow">
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
                    className="group relative overflow-hidden bg-gradient-to-br from-slate-800/70 via-purple-900/70 to-slate-800/70 backdrop-blur-md border border-purple-500/30 rounded-2xl p-10 transition-all duration-500 hover:border-pink-500/50 hover:shadow-2xl hover:-translate-y-1 w-80 h-96"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10 flex flex-col items-center gap-6 h-full justify-between">
                      <div className="relative">
                        <span className="absolute -inset-3 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-2xl opacity-0 group-hover:opacity-100 transition blur-lg group-hover:scale-110"></span>
                        <div className="relative p-6 bg-gradient-to-br from-purple-500/80 to-pink-500/80 backdrop-blur rounded-2xl shadow-2xl group-hover:rotate-2 group-hover:scale-110 transition-all">
                          <Search className="w-16 h-16 text-white" />
                        </div>
                      </div>
                      <h4 className="text-2xl font-light tracking-tight text-white group-hover:text-pink-200">
                        Recherche Unifiée
                      </h4>
                      <p className="text-center text-slate-300 font-light text-sm">
                        Temps de travail, formation, télétravail - Recherche dans tous les documents
                      </p>
                      <div className="flex items-center gap-2 text-pink-400 opacity-0 group-hover:opacity-100 transition">
                        <span className="font-light text-sm">Accéder à l&apos;assistant</span>
                        <ArrowRight className="w-4 h-4 animate-pulse" />
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setChatState({ ...chatState, currentView: 'calculators' })}
                    className="group relative overflow-hidden bg-gradient-to-br from-slate-800/70 via-blue-900/70 to-slate-800/70 backdrop-blur-md border border-blue-500/30 rounded-2xl p-10 transition-all duration-500 hover:border-cyan-500/50 hover:shadow-2xl hover:-translate-y-1 w-80 h-96"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10 flex flex-col items-center gap-6 h-full justify-between">
                      <div className="relative">
                        <span className="absolute -inset-3 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 rounded-2xl opacity-0 group-hover:opacity-100 transition blur-lg group-hover:scale-110"></span>
                        <div className="relative p-6 bg-gradient-to-br from-blue-500/80 to-cyan-500/80 backdrop-blur rounded-2xl shadow-2xl group-hover:rotate-2 group-hover:scale-110 transition-all">
                          <Calculator className="w-16 h-16 text-white" />
                        </div>
                      </div>
                      <h4 className="text-2xl font-light tracking-tight text-white group-hover:text-cyan-200">
                        Calculateurs
                      </h4>
                      <p className="text-center text-slate-300 font-light text-sm">
                        Primes IFSE - Calcul CIA - Outils de simulation
                      </p>
                      <div className="flex items-center gap-2 text-cyan-400 opacity-0 group-hover:opacity-100 transition">
                        <span className="font-light text-sm">Accéder aux calculateurs</span>
                        <ArrowRight className="w-4 h-4 animate-pulse" />
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

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
                className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-all duration-200 font-light"
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
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-light text-white mb-4">Choisissez un calculateur</h3>
              <p className="text-slate-400 font-light">Cliquez sur une icône pour accéder au calculateur</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Carte Primes IFSE */}
              <button
                onClick={() => setActiveCalculator('primes')}
                className="group relative bg-gradient-to-br from-slate-800/80 to-cyan-900/50 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 hover:scale-105 hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                <div className="relative z-10 flex flex-col items-center gap-6">
                  <div className="p-6 bg-gradient-to-br from-cyan-500/80 to-blue-500/80 rounded-2xl shadow-2xl group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-16 h-16 text-white" />
                  </div>
                  <h4 className="text-2xl font-light text-white group-hover:text-cyan-200 transition-colors">Primes IFSE</h4>
                  <p className="text-center text-slate-400 font-light text-sm">Calculez vos primes IFSE 1 et IFSE 2 selon votre grade et direction</p>
                </div>
              </button>

              {/* Carte CIA */}
              <button
                onClick={() => setActiveCalculator('cia')}
                className="group relative bg-gradient-to-br from-slate-800/80 to-orange-900/50 backdrop-blur-md border border-orange-500/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 hover:scale-105 hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                <div className="relative z-10 flex flex-col items-center gap-6">
                  <div className="p-6 bg-gradient-to-br from-orange-500/80 to-amber-500/80 rounded-2xl shadow-2xl group-hover:scale-110 transition-transform">
                    <Calculator className="w-16 h-16 text-white" />
                  </div>
                  <h4 className="text-2xl font-light text-white group-hover:text-orange-200 transition-colors">CIA</h4>
                  <p className="text-center text-slate-400 font-light text-sm">Complément Indemnitaire Annuel - Simulez votre prime CIA</p>
                </div>
              </button>

              {/* Carte 13ème Mois */}
              <button
                onClick={() => setActiveCalculator('13eme')}
                className="group relative bg-gradient-to-br from-slate-800/80 to-green-900/50 backdrop-blur-md border border-green-500/30 rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 hover:scale-105 hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                <div className="relative z-10 flex flex-col items-center gap-6">
                  <div className="p-6 bg-gradient-to-br from-green-500/80 to-emerald-500/80 rounded-2xl shadow-2xl group-hover:scale-110 transition-transform">
                    <DollarSign className="w-16 h-16 text-white" />
                  </div>
                  <h4 className="text-2xl font-light text-white group-hover:text-green-200 transition-colors">13ème Mois</h4>
                  <p className="text-center text-slate-400 font-light text-sm">Calculez votre prime de 13ème mois selon votre situation</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Contenu du calculateur sélectionné */}
        {activeCalculator === 'primes' && (
          <CalculateurPrimes onClose={() => setActiveCalculator(null)} />
        )}
        {activeCalculator === 'cia' && (
          <CalculateurCIA onClose={() => setActiveCalculator(null)} />
        )}
        {activeCalculator === '13eme' && (
          <Calculateur13eme onClose={() => setActiveCalculator(null)} />
        )}
      </section>
      )}

      <main className="relative max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-2 z-10">
        {chatState.currentView === "chat" && (
          <div
            ref={chatContainerRef}
            className="bg-gradient-to-br from-slate-800/80 via-purple-900/80 to-slate-800/80 backdrop-blur-md border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden hover:shadow-2xl transition-all duration-300"
          >
            <div className="bg-gradient-to-r from-purple-600/70 via-pink-600/70 to-purple-600/70 backdrop-blur text-white p-6">
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
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm font-light"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Retour</span>
                </button>
              </div>
            </div>
            <div className="min-h-[400px] max-h-[700px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-800/40 to-purple-900/40">
              {chatState.messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl backdrop-blur-sm font-light ${message.type === "user" ? "bg-gradient-to-r from-purple-600/70 to-pink-600/70 text-white shadow-lg" : "bg-slate-700/70 text-slate-100 border border-purple-500/30"}`}
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
                  <div className="bg-slate-700/70 backdrop-blur-sm border border-purple-500/30 px-4 py-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
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
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center gap-2"
                  >
                    <span>✅ Oui, rechercher sur Légifrance</span>
                  </button>
                  <button
                    onClick={handleDeclineSearch}
                    className="px-8 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl hover:from-slate-700 hover:to-slate-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center gap-2"
                  >
                    <span>❌ Non, retour à l'accueil</span>
                  </button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t border-purple-500/30 bg-gradient-to-r from-slate-800/80 to-purple-900/80 backdrop-blur-md p-4">
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
                  className="px-6 py-3 bg-gradient-to-r from-purple-600/70 to-pink-600/70 backdrop-blur-sm text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl font-light"
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
      <RssBandeau rssItems={rssItems} rssLoading={rssLoading} />

      <footer 
        className="relative text-slate-400 text-center py-4 mt-0 z-10 border-t border-purple-500/20"
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
              className="px-4 py-2 bg-purple-600/50 border border-purple-500/50 text-purple-300 rounded-lg hover:bg-purple-600/70 transition-all duration-200 font-light text-xs"
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
