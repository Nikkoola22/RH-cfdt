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

function getFicheTitle(fiche: FicheIndexEntry): string {
  return ((fiche as { titre?: string }).titre || (fiche as { title?: string }).title || '').toLowerCase()
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
    .map(k => k.toLowerCase().trim())
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
      const scored = bipDataCache.map(fiche => {
        let score = 0

        // Title matches (weight: 3)
        const titleLower = fiche.title.toLowerCase()
        normalizedKeywords.forEach(keyword => {
          if (titleLower.includes(keyword)) score += 3
        })

        // Section matches (weight: 2)
        const sectionLower = fiche.section.toLowerCase()
        normalizedKeywords.forEach(keyword => {
          if (sectionLower.includes(keyword)) score += 2
        })

        // Content matches (weight: 1)
        const contentLower = fiche.content.toLowerCase()
        normalizedKeywords.forEach(keyword => {
          if (contentLower.includes(keyword)) score += 1
        })

        return { fiche, score }
      })

      const results = scored
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ fiche }) => fiche)

      if (results.length > 0) {
        return {
          results,
          totalMatches: results.length,
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

    // Title matches (weight: 3)
    const titleLower = getFicheTitle(fiche)
    normalizedKeywords.forEach(keyword => {
      if (titleLower.includes(keyword)) score += 3
    })

    // Category matches (weight: 2)
    const categoryLower = getFicheCategory(fiche)
    normalizedKeywords.forEach(keyword => {
      if (categoryLower.includes(keyword)) score += 2
    })

    // Keyword matches (weight: 1)
    const keywordsArray = getFicheKeywords(fiche)
    keywordsArray.forEach((motCle) => {
      const mcLower = motCle.toLowerCase()
      normalizedKeywords.forEach(keyword => {
        if (mcLower.includes(keyword)) score += 1
      })
    })

    return { fiche, score }
  })

  // Filter and sort by score
  const results = scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ fiche }) => fiche)

  return {
    results,
    totalMatches: results.length,
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
