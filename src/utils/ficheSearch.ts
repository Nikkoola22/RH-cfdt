import { ficheIndex, FicheIndexEntry } from '../data/bip-index'
import { 
  getAllBipFiches,
  searchSelectiveBipByFileAndKeywords,
  BipFiche 
} from '../data/bip-loader'
import { BIP_FILE_CATEGORIES } from '../data/bip-files'

export interface SearchResult {
  results: FicheIndexEntry[] | BipFiche[]
  totalMatches: number
  query: string
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function countUniqueMatches(text: string, keywords: string[]): number {
  const normalizedText = normalizeText(text)
  let count = 0
  keywords.forEach((keyword) => {
    if (normalizedText.includes(keyword)) count += 1
  })
  return count
}

function canonicalKeyFromBipFiche(fiche: BipFiche): string {
  const code = normalizeText((fiche as { code?: string }).code || '')
  const title = normalizeText(fiche.titre || '')
  return code || title
}

function canonicalKeyFromIndexFiche(fiche: FicheIndexEntry): string {
  const code = normalizeText((fiche as { code?: string }).code || '')
  const title = normalizeText(getFicheTitle(fiche))
  return code || title
}

function deduplicateBipResults(items: BipFiche[]): BipFiche[] {
  const seen = new Set<string>()
  const deduped: BipFiche[] = []

  items.forEach((item) => {
    const key = canonicalKeyFromBipFiche(item)
    if (!key || seen.has(key)) return
    seen.add(key)
    deduped.push(item)
  })

  return deduped
}

function deduplicateIndexResults(items: FicheIndexEntry[]): FicheIndexEntry[] {
  const seen = new Set<string>()
  const deduped: FicheIndexEntry[] = []

  items.forEach((item) => {
    const key = canonicalKeyFromIndexFiche(item)
    if (!key || seen.has(key)) return
    seen.add(key)
    deduped.push(item)
  })

  return deduped
}

type IntentRule = {
  triggerKeywords: string[]
  targetSections: string[]
}

const INTENT_RULES: IntentRule[] = [
  {
    triggerKeywords: ['conge', 'absence', 'rtt', 'ferie', 'vacance'],
    targetSections: ['conges-et-absences', 'conges-absences'],
  },
  {
    triggerKeywords: ['maladie', 'arret', 'indemnite', 'inaptitude', 'medical', 'sante'],
    targetSections: ['indisponibilite-physique-et-securite-sociale', 'conges-et-absences'],
  },
  {
    triggerKeywords: ['accident', 'trajet', 'service', 'professionnelle'],
    targetSections: ['indisponibilite-physique-et-securite-sociale'],
  },
  {
    triggerKeywords: ['discipline', 'sanction', 'blame', 'licenciement', 'faute'],
    targetSections: ['discipline2', 'agents-contractuels'],
  },
  {
    triggerKeywords: ['teletravail', 'horaire', 'temps', 'travail'],
    targetSections: ['conditions-d-exercice-des-fonctions-et-duree-du-travail'],
  },
  {
    triggerKeywords: ['carriere', 'avancement', 'promotion', 'titularisation', 'mobilite'],
    targetSections: ['carriere'],
  },
]

function computeIntentBoost(
  normalizedQueryKeywords: string[],
  sectionText: string,
  titleText: string,
): number {
  let boost = 0
  const normalizedSection = normalizeText(sectionText)
  const normalizedTitle = normalizeText(titleText)

  INTENT_RULES.forEach((rule) => {
    const intentActivated = rule.triggerKeywords.some(trigger =>
      normalizedQueryKeywords.some(keyword => keyword.includes(trigger) || trigger.includes(keyword)),
    )

    if (!intentActivated) return

    const sectionMatch = rule.targetSections.some(target =>
      normalizedSection.includes(normalizeText(target)),
    )

    if (sectionMatch) {
      boost += 5
      return
    }

    const titleMatch = rule.triggerKeywords.some(trigger => normalizedTitle.includes(trigger))
    if (titleMatch) boost += 2
  })

  return boost
}

function getFicheTitle(fiche: FicheIndexEntry): string {
  return ((fiche as { titre?: string }).titre || (fiche as { title?: string }).titre || '').toLowerCase()
}

function getFicheCategory(fiche: FicheIndexEntry): string {
  return ((fiche as { categorie?: string }).categorie || (fiche as { section?: string }).section || '').toLowerCase()
}

function getFicheKeywords(fiche: FicheIndexEntry): string[] {
  return Array.isArray(fiche.motsCles) ? fiche.motsCles : []
}

let bipDataCache: BipFiche[] = []
let bipDataInitialized = false
let bipDataLoadingPromise: Promise<void> | null = null

/**
 * Initialize BIP data (async, loads in background)
 */
function initializeBipDataAsync(): Promise<void> {
  if (!bipDataLoadingPromise) {
    bipDataLoadingPromise = (async () => {
      try {
        const data = await getAllBipFiches();
        bipDataCache = data;
        bipDataInitialized = true;
        console.log(`✅ Dados BIP carregados: ${bipDataCache.length} fiches`);
      } catch (error) {
        console.warn('Erro ao carregar dados BIP:', error);
      }
    })();
  }
  return bipDataLoadingPromise;
}

// Start loading BIP data immediately
initializeBipDataAsync().catch(console.error);



/**
 * Identifie les fichiers BIP pertinents basés sur les mots-clés
 * Utilise une logique simple de matching plutôt que l'API pour performance
 */
function identifierFichiersBipPertinents(keywords: string[]): string[] {
  if (!keywords || keywords.length === 0) {
    return []
  }

  const normalizedKeywords = keywords
    .map(k => k.toLowerCase().trim())
    .filter(k => k.length > 0)

  // Scorer chaque catégorie
  const scored = BIP_FILE_CATEGORIES.map(category => {
    let score = 0
    
    normalizedKeywords.forEach(keyword => {
      // Match sur les keywords de la catégorie (poids: 3)
      if (category.keywords.some(kw => kw.includes(keyword) || keyword.includes(kw))) {
        score += 3
      }
      
      // Match sur le label (poids: 2)
      if (category.label.toLowerCase().includes(keyword)) {
        score += 2
      }
      
      // Match sur l'ID (poids: 1)
      if (category.id.includes(keyword)) {
        score += 1
      }
    })

    return { category, score }
  })

  // Retourner les fichiers pertinents (score > 0)
  const relevant = scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ category }) => category.path)

  // Si aucun fichier id entifié, retourner tous (fallback)
  if (relevant.length === 0) {
    return BIP_FILE_CATEGORIES.map(cat => cat.path)
  }

  return relevant
}

/**
 * Recherche sélective des fiches BIP en 2 étapes :
 * 1) Identifier les fichiers pertinents
 * 2) Charger et chercher seulement dans ces fichiers
 */
async function searchSelectiveBipByKeywords(keywords: string[]): Promise<BipFiche[]> {
  // ÉTAPE 1 : Identifier les fichiers pertinents
  const fichiersPertinents = identifierFichiersBipPertinents(keywords)
  
  if (fichiersPertinents.length === 0) {
    return []
  }

  // ÉTAPE 2 : Charger et chercher seulement dans ces fichiers
  const results = await searchSelectiveBipByFileAndKeywords(fichiersPertinents, keywords)
  
  return results
}

/**
 * Searches BIP fiches by keywords with ranking (synchronous version)
 * Uses local JSONL data if available (from cache), falls back to index.
 * Data loading happens in background to improve future searches.
 * 
 * NOW WITH 2-STEP OPTIMIZATION:
 * 1) Identifies relevant files based on keywords
 * 2) Loads only those files for search
 */
export function searchFichesByKeywords(keywords: string[]): SearchResult {
  if (!keywords || keywords.length === 0) {
    return { results: [], totalMatches: 0, query: '' }
  }

  const query = keywords.join(' ')
  const normalizedKeywords = keywords
    .map(k => normalizeText(k))
    .filter(k => k.length > 0)

  if (normalizedKeywords.length === 0) {
    return { results: [], totalMatches: 0, query }
  }

  // Étape 1 : Identifier les fichiers pertinents en arrière-plan
  // (amélioration future : faire ceci de manière asynchrone et mettre en cache)
  const fichiersPertinents = identifierFichiersBipPertinents(keywords)
  
  // Déclencher le chargement sélectif en arrière-plan pour prochaine recherche
  if (fichiersPertinents.length > 0) {
    searchSelectiveBipByKeywords(keywords).catch(err => 
      console.warn('Erreur lors du chargement sélectif des fiches BIP:', err)
    )
  }

  // Tentar usar dados locais primeiro (com conteúdo completo)
  if (bipDataInitialized && bipDataCache.length > 0) {
    try {
      const indexByCode = new Map(ficheIndex.map(entry => [entry.code, entry]))

      const scored = bipDataCache.map(fiche => {
        let score = 0

        const titleMatches = countUniqueMatches(fiche.titre, normalizedKeywords)
        const sectionMatches = countUniqueMatches(fiche.section, normalizedKeywords)
        const contentMatches = countUniqueMatches(fiche.content, normalizedKeywords)
        const intentBoost = computeIntentBoost(normalizedKeywords, fiche.section, fiche.titre)

        score += titleMatches * 8
        score += sectionMatches * 4
        score += contentMatches * 2
        score += intentBoost

        // Boost if both title and content are aligned
        if (titleMatches > 0 && contentMatches > 0) score += 6

        // Fuse with index metadata for better precision
        const indexEntry = indexByCode.get(fiche.code)
        if (indexEntry) {
          const indexKeywordMatches = (indexEntry.motsCles || [])
            .map(k => normalizeText(k))
            .filter(k => normalizedKeywords.some(q => k.includes(q) || q.includes(k))).length

          const indexTitleMatches = countUniqueMatches(indexEntry.titre || '', normalizedKeywords)

          score += indexKeywordMatches * 2
          score += indexTitleMatches * 3
        }

        // Penalize weak/noisy entries
        if (normalizeText(fiche.content).includes('no content available')) {
          score -= 5
        }

        const minSignal = titleMatches > 0 || sectionMatches > 0 || contentMatches >= 2

        return { fiche, score, minSignal }
      })

      const results = scored
        .filter(({ score, minSignal }) => minSignal && score >= 4)
        .sort((a, b) => b.score - a.score)
        .map(({ fiche }) => fiche)

      const dedupedResults = deduplicateBipResults(results)

      if (dedupedResults.length > 0) {
        return {
          results: dedupedResults,
          totalMatches: dedupedResults.length,
          query,
        }
      }
    } catch (error) {
      console.warn('Erro ao buscar em dados locais BIP, usando índice:', error)
    }
  }

  // Fallback para índice
  const scored = ficheIndex.map(fiche => {
    let score = 0

    const titleMatches = countUniqueMatches(getFicheTitle(fiche), normalizedKeywords)
    const categoryMatches = countUniqueMatches(getFicheCategory(fiche), normalizedKeywords)
    const intentBoost = computeIntentBoost(normalizedKeywords, getFicheCategory(fiche), getFicheTitle(fiche))
    const keywordMatches = getFicheKeywords(fiche)
      .map(mc => normalizeText(mc))
      .filter(mc => normalizedKeywords.some(k => mc.includes(k) || k.includes(mc))).length

    score += titleMatches * 6
    score += categoryMatches * 3
    score += keywordMatches * 2
    score += intentBoost

    const minSignal = titleMatches > 0 || categoryMatches > 0 || keywordMatches > 0

    return { fiche, score, minSignal }
  })

  // Filter and sort by score
  const results = scored
    .filter(({ score, minSignal }) => minSignal && score >= 2)
    .sort((a, b) => b.score - a.score)
    .map(({ fiche }) => fiche)

  const dedupedResults = deduplicateIndexResults(results)

  return {
    results: dedupedResults,
    totalMatches: dedupedResults.length,
    query,
  }
}

/**
 * Async version of searchFichesByKeywords
 * Useful when you need to ensure BIP data is fully loaded
 */
export async function searchFichesByKeywordsAsync(keywords: string[]): Promise<SearchResult> {
  await initializeBipDataAsync();
  return searchFichesByKeywords(keywords);
}

/**
 * Gets all unique categories from fiches
 */
export function getAllCategories(): string[] {
  if (bipDataInitialized && bipDataCache.length > 0) {
    const categories = new Set(bipDataCache.map(f => f.section))
    return Array.from(categories).sort()
  }
  
  const categories = new Set(ficheIndex.map(f => getFicheCategory(f)).filter(Boolean))
  return Array.from(categories).sort()
}

/**
 * Gets fiches by category
 */
export function getFichesByCategory(category: string): FicheIndexEntry[] {
  const normalized = category.toLowerCase()
  return ficheIndex.filter(f => getFicheCategory(f) === normalized)
}

/**
 * Gets all fiches
 */
export function getAllFiches(): FicheIndexEntry[] {
  return ficheIndex
}
