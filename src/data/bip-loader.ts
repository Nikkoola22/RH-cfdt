/**
 * BIP Local Data Loader
 * Carrega dados dos arquivos JSONL locais em vez de URLs externas
 */

import { BIP_JSONL_FILES } from './bip-files'

export interface BipFiche {
  url: string;
  title: string;
  content: string;
  timestamp: string;
  source: string;
  type: string;
  section: string;
}

// Cache de dados carregados
let bipCache: BipFiche[] | null = null;
let bipCachePromise: Promise<BipFiche[]> | null = null;

/**
 * Parse JSONL data
 */
function parseJsonlData(data: string): BipFiche[] {
  const fiches: BipFiche[] = [];
  const lines = data.split('\n').filter(line => line.trim());

  for (const line of lines) {
    try {
      const fiche = JSON.parse(line);
      if (fiche.title && fiche.content) {
        fiches.push(fiche);
      }
    } catch {
      // Silently skip invalid lines
    }
  }

  return fiches;
}

/**
 * Carrega dados BIP apenas dos arquivos selecionados (otimizado para buscas específicas)
 */
async function loadSelectiveBipDataAsync(filePaths: string[]): Promise<BipFiche[]> {
  try {
    const allFiches: BipFiche[] = [];

    for (const filePath of filePaths) {
      try {
        const response = await fetch(filePath);
        if (!response.ok) {
          console.warn(`Erro ao carregar ${filePath}: ${response.status}`);
          continue;
        }

        const text = await response.text();
        const fiches = parseJsonlData(text);
        allFiches.push(...fiches);
      } catch (error) {
        console.warn(`Erro ao carregar arquivo ${filePath}:`, error);
      }
    }

    console.log(`✅ Carregados ${allFiches.length} fiches BIP de ${filePaths.length} arquivo(s) selecionado(s)`);
    return allFiches;
  } catch (error) {
    console.error('Erro ao carregar dados BIP seletivamente:', error);
    return [];
  }
}

/**
 * Carrega todos os dados BIP dos arquivos JSONL locais (assincronamente)
 */
async function loadBipDataAsync(): Promise<BipFiche[]> {
  if (bipCache) {
    return bipCache;
  }

  if (bipCachePromise) {
    return bipCachePromise;
  }

  bipCachePromise = (async () => {
    try {
      const allFiches: BipFiche[] = [];

      for (const filePath of BIP_JSONL_FILES) {
        try {
          const response = await fetch(filePath);
          if (!response.ok) {
            console.warn(`Erro ao carregar ${filePath}: ${response.status}`);
            continue;
          }

          const text = await response.text();
          const fiches = parseJsonlData(text);
          allFiches.push(...fiches);
        } catch (error) {
          console.warn(`Erro ao carregar arquivo ${filePath}:`, error);
        }
      }

      bipCache = allFiches;
      console.log(`✅ Carregados ${allFiches.length} fiches BIP de dados locais`);
      return allFiches;
    } catch (error) {
      console.error('Erro ao carregar dados BIP:', error);
      return [];
    }
  })();

  return bipCachePromise;
}

/**
 * Carrega todos os dados BIP dos arquivos JSONL locais (sincronamente, retorna cache ou vazio)
 */
export function loadBipData(): BipFiche[] {
  if (bipCache) {
    return bipCache;
  }

  // Inicia carregamento em background se ainda não foi feito
  if (!bipCachePromise) {
    loadBipDataAsync().catch(err => console.error('Erro ao carregar BIP em background:', err));
  }

  return [];
}

/**
 * Busca fiches por palavras-chave no conteúdo local (assincronamente)
 */
export async function searchBipByKeywords(keywords: string[]): Promise<BipFiche[]> {
  const fiches = await loadBipDataAsync();
  
  if (!keywords || keywords.length === 0) {
    return [];
  }

  const normalizedKeywords = keywords
    .map(k => k.toLowerCase().trim())
    .filter(k => k.length > 0);

  const scored = fiches.map(fiche => {
    let score = 0;

    // Matchs no título (peso: 3)
    const titleLower = fiche.title.toLowerCase();
    normalizedKeywords.forEach(keyword => {
      if (titleLower.includes(keyword)) score += 3;
    });

    // Matchs na seção (peso: 2)
    const sectionLower = fiche.section.toLowerCase();
    normalizedKeywords.forEach(keyword => {
      if (sectionLower.includes(keyword)) score += 2;
    });

    // Matchs no conteúdo (peso: 1)
    const contentLower = fiche.content.toLowerCase();
    normalizedKeywords.forEach(keyword => {
      if (contentLower.includes(keyword)) score += 1;
    });

    return { fiche, score };
  });

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ fiche }) => fiche);
}

/**
 * Obtem todas as fiches (assincronamente)
 */
export async function getAllBipFiches(): Promise<BipFiche[]> {
  return loadBipDataAsync();
}

/**
 * Obtem categorias únicas (assincronamente)
 */
export async function getAllBipCategories(): Promise<string[]> {
  const fiches = await loadBipDataAsync();
  const categories = new Set(fiches.map(f => f.section));
  return Array.from(categories).sort();
}

/**
 * Busca fiches por categoria (assincronamente)
 */
export async function getBipFichesByCategory(category: string): Promise<BipFiche[]> {
  const fiches = await loadBipDataAsync();
  return fiches.filter(f => f.section === category);
}

/**
 * Obtem uma fiche específica pelo URL (assincronamente)
 */
export async function getBipFicheByUrl(url: string): Promise<BipFiche | undefined> {
  const fiches = await loadBipDataAsync();
  return fiches.find(f => f.url === url);
}

/**
 * Carrega e busca fiches apenas em arquivos selecionados
 * Útil para otimizar buscas quando você sabe quais catégories procurar
 */
export async function searchSelectiveBipByFileAndKeywords(
  filePaths: string[],
  keywords: string[]
): Promise<BipFiche[]> {
  const fiches = await loadSelectiveBipDataAsync(filePaths);
  
  if (!keywords || keywords.length === 0) {
    return [];
  }

  const normalizedKeywords = keywords
    .map(k => k.toLowerCase().trim())
    .filter(k => k.length > 0);

  const scored = fiches.map(fiche => {
    let score = 0;

    // Matchs no título (peso: 3)
    const titleLower = fiche.title.toLowerCase();
    normalizedKeywords.forEach(keyword => {
      if (titleLower.includes(keyword)) score += 3;
    });

    // Matchs na seção (peso: 2)
    const sectionLower = fiche.section.toLowerCase();
    normalizedKeywords.forEach(keyword => {
      if (sectionLower.includes(keyword)) score += 2;
    });

    // Matchs no conteúdo (peso: 1)
    const contentLower = fiche.content.toLowerCase();
    normalizedKeywords.forEach(keyword => {
      if (contentLower.includes(keyword)) score += 1;
    });

    return { fiche, score };
  });

  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ fiche }) => fiche);
}
