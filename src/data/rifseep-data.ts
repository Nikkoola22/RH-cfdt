// Données extraites du Guide RH RIFSEEP de Gennevilliers
// IFSE 2 est maintenant dans ifse2_primes.json (source unique et complète)

import ifse2PrimesJson from './ifse2_primes.json'

// Interface pour les données du JSON IFSE2
interface IFSE2PrimeJson {
  Motif: string
  Montant: string
  Metiers_concernes: string
  Direction: string
  Service: string
}

// Interface pour les données transformées IFSE2
export interface IFSE2Data {
  motif: string
  amount: number
  jobs: string[]
  direction: string
  service: string
}

// Transformer les données JSON au format attendu
const transformIfse2Data = (jsonData: IFSE2PrimeJson[]): IFSE2Data[] => {
  const grouped = new Map<string, IFSE2Data>()
  
  jsonData.forEach(item => {
    const key = `${item.Motif}|${item.Direction}|${item.Service}`
    const amountStr = item.Montant.replace(' €', '').trim().replace(',', '.')
    const amount = parseFloat(amountStr) || 0
    
    if (grouped.has(key)) {
      const existing = grouped.get(key)!
      if (!existing.jobs.includes(item.Metiers_concernes)) {
        existing.jobs.push(item.Metiers_concernes)
      }
    } else {
      grouped.set(key, {
        motif: item.Motif,
        amount: amount,
        jobs: [item.Metiers_concernes],
        direction: item.Direction,
        service: item.Service
      })
    }
  })
  
  return Array.from(grouped.values())
}

// Données IFSE2 transformées (source unique depuis le JSON)
export const ifse2Data = transformIfse2Data(ifse2PrimesJson as IFSE2PrimeJson[])

// Contenu complet du guide RIFSEEP pour le chatbot
export const rifseepData = `
# Guide RH RIFSEEP - Mairie de Gennevilliers

## RIFSEEP - Régime Indemnitaire tenant compte des Fonctions, des Sujétions, de l'Expertise et de l'Engagement Professionnel

### IFSE 1 - Indemnité de Fonction, de Sujétion et d'Expertise

L'IFSE 1 est une indemnité forfaitaire mensuelle versée aux agents qui exercent des fonctions comportant des responsabilités particulières, des sujétions spécifiques ou nécessitant une expertise particulière.

#### Catégorie A - Fonctions d'encadrement supérieur
- Directeur Général des Services : 24000€/an (2000€/mois)
- Directeur Général Adjoint : 18000€/an (1500€/mois)
- Directeur : 12000€/an (1000€/mois)
- Chef de service principal : 6000€/an (500€/mois)

#### Catégorie B - Fonctions d'encadrement intermédiaire
- Chef de service : 4800€/an (400€/mois)
- Adjoint au chef de service : 3600€/an (300€/mois)
- Responsable d'équipe : 2400€/an (200€/mois)

#### Catégorie C - Fonctions d'application
- Agent de maîtrise : 1800€/an (150€/mois)
- Agent qualifié : 1200€/an (100€/mois)
- Agent d'exécution : 600€/an (50€/mois)

### IFSE 2 - Indemnités et primes complémentaires

L'IFSE 2 comprend diverses indemnités et primes selon les fonctions exercées et les sujétions particulières.
Les données complètes IFSE 2 sont disponibles dans ifse2_primes.json (292 entrées).

#### Primes communes à toutes les directions
- Prime maître apprentissage : 98,46€/mois
- Prime référent financier principal : 75€/mois
- Prime référent financier suppléant : 40€/mois
- Prime formateur interne : 75€/mois
- Prime intérim : 150€/mois

#### Primes spécifiques par direction
- Indemnités horaires décalés : 20€/mois
- Prime accueil : 50€/mois
- Prime informatique : 308,70€/mois
- Prime rendement : 210,44€/mois
- Prime expertise comptable : 180€/mois
- Prime gestionnaire déconcentré : 90€/mois

### Modalités d'attribution
- L'IFSE 1 est attribuée automatiquement selon la fonction exercée
- L'IFSE 2 est attribuée selon les critères spécifiques de chaque prime
- Les montants sont versés mensuellement avec le traitement
- Révision annuelle des barèmes selon les accords collectifs
`;

export interface IFSE1Data {
  category: 'A' | 'B' | 'C';
  function: string;
  functionCode: string;
  annualAmount: number;
  monthlyAmount: number;
  implementationYear: 2024 | 2025 | 2026;
}

// Barème IFSE 1 - Données extraites du guide
export const ifse1Data: IFSE1Data[] = [
  // Catégorie A
  { category: 'A', function: 'DGS', functionCode: 'A-0', annualAmount: 32400, monthlyAmount: 2700, implementationYear: 2024 },
  { category: 'A', function: 'Direction générale', functionCode: 'A-1', annualAmount: 28500, monthlyAmount: 2375, implementationYear: 2024 },
  { category: 'A', function: 'Directeur', functionCode: 'A-2', annualAmount: 19200, monthlyAmount: 1600, implementationYear: 2024 },
  { category: 'A', function: 'Chef de projet', functionCode: 'A-3', annualAmount: 13200, monthlyAmount: 1100, implementationYear: 2024 },
  { category: 'A', function: 'Responsable de service', functionCode: 'A-4', annualAmount: 13200, monthlyAmount: 1100, implementationYear: 2024 },
  { category: 'A', function: 'Adjoint responsable de service', functionCode: 'A-5', annualAmount: 10000, monthlyAmount: 833.33, implementationYear: 2024 },
  { category: 'A', function: 'Responsable de structure', functionCode: 'A-6', annualAmount: 9000, monthlyAmount: 750, implementationYear: 2024 },
  { category: 'A', function: 'Ingénieur (sous directeur)', functionCode: 'A-7', annualAmount: 13000, monthlyAmount: 1083.33, implementationYear: 2025 },
  { category: 'A', function: 'Ingénieur (sous responsable)', functionCode: 'A-7', annualAmount: 12000, monthlyAmount: 1000, implementationYear: 2025 },
  { category: 'A', function: 'Gestionnaire spécialisé', functionCode: 'A-8', annualAmount: 8000, monthlyAmount: 666.67, implementationYear: 2025 },
  { category: 'A', function: 'Chargé de missions (sous un DGA)', functionCode: 'A-9', annualAmount: 8000, monthlyAmount: 666.67, implementationYear: 2025 },
  { category: 'A', function: 'Chargé de missions (sous directeur)', functionCode: 'A-9', annualAmount: 7500, monthlyAmount: 625, implementationYear: 2025 },
  { category: 'A', function: 'Chargé de missions (sous responsable)', functionCode: 'A-9', annualAmount: 5500, monthlyAmount: 458.33, implementationYear: 2026 },
  { category: 'A', function: 'Adjoint responsable de structure', functionCode: 'A-10', annualAmount: 6000, monthlyAmount: 500, implementationYear: 2025 },
  { category: 'A', function: 'Infirmier', functionCode: 'A-11', annualAmount: 7500, monthlyAmount: 625, implementationYear: 2025 },
  { category: 'A', function: 'Travailleur social / Médico-social', functionCode: 'A-14', annualAmount: 6000, monthlyAmount: 500, implementationYear: 2026 },

  // Catégorie B
  { category: 'B', function: 'Responsable de service', functionCode: 'B-4', annualAmount: 8000, monthlyAmount: 666.67, implementationYear: 2024 },
  { category: 'B', function: 'Adjoint responsable de service', functionCode: 'B-5', annualAmount: 6000, monthlyAmount: 500, implementationYear: 2025 },
  { category: 'B', function: 'Responsable de structure', functionCode: 'B-6', annualAmount: 5000, monthlyAmount: 416.67, implementationYear: 2024 },
  { category: 'B', function: 'Technicien (sous directeur)', functionCode: 'B-7', annualAmount: 9000, monthlyAmount: 750, implementationYear: 2025 },
  { category: 'B', function: 'Technicien (sous responsable)', functionCode: 'B-7', annualAmount: 8250, monthlyAmount: 687.50, implementationYear: 2025 },
  { category: 'B', function: 'Gestionnaire spécialisé', functionCode: 'B-8', annualAmount: 6500, monthlyAmount: 541.67, implementationYear: 2026 },
  { category: 'B', function: 'Chargé de missions (sous directeur)', functionCode: 'B-9', annualAmount: 6480, monthlyAmount: 540, implementationYear: 2025 },
  { category: 'B', function: 'Chargé de missions (sous responsable)', functionCode: 'B-9', annualAmount: 5750, monthlyAmount: 479.17, implementationYear: 2026 },
  { category: 'B', function: 'Adjoint responsable de structure', functionCode: 'B-10', annualAmount: 4500, monthlyAmount: 375, implementationYear: 2025 },
  { category: 'B', function: 'Infirmier', functionCode: 'B-11', annualAmount: 5750, monthlyAmount: 479.17, implementationYear: 2025 },
  { category: 'B', function: 'Éducateur', functionCode: 'B-13', annualAmount: 3500, monthlyAmount: 291.67, implementationYear: 2024 },
  { category: 'B', function: 'Travailleur social / Médico-social', functionCode: 'B-14', annualAmount: 4500, monthlyAmount: 375, implementationYear: 2025 },
  { category: 'B', function: 'Chef d\'équipe', functionCode: 'B-16', annualAmount: 5500, monthlyAmount: 458.33, implementationYear: 2026 },
  { category: 'B', function: 'Adjoint chef d\'équipe', functionCode: 'B-17', annualAmount: 5000, monthlyAmount: 416.67, implementationYear: 2025 },
  { category: 'B', function: 'Assistant(e) (sous DGA)', functionCode: 'B-19', annualAmount: 5000, monthlyAmount: 416.67, implementationYear: 2025 },
  { category: 'B', function: 'Assistant(e) (sous directeur)', functionCode: 'B-19', annualAmount: 3750, monthlyAmount: 312.50, implementationYear: 2024 },
  { category: 'B', function: 'Assistant(e) (sous responsable)', functionCode: 'B-19', annualAmount: 3000, monthlyAmount: 250, implementationYear: 2024 },
  { category: 'B', function: 'Gestionnaire', functionCode: 'B-18', annualAmount: 4000, monthlyAmount: 333.33, implementationYear: 2024 },
  { category: 'B', function: 'Animateur', functionCode: 'B-20', annualAmount: 4500, monthlyAmount: 375, implementationYear: 2025 },
  { category: 'B', function: 'Agent technique spécialisé', functionCode: 'B-22', annualAmount: 4500, monthlyAmount: 375, implementationYear: 2026 },
  { category: 'B', function: 'Agent d\'accueil', functionCode: 'B-23', annualAmount: 3500, monthlyAmount: 291.67, implementationYear: 2025 },

  // Catégorie C
  { category: 'C', function: 'Responsable de service', functionCode: 'C-4', annualAmount: 7500, monthlyAmount: 625, implementationYear: 2024 },
  { category: 'C', function: 'Adjoint responsable de service', functionCode: 'C-5', annualAmount: 4500, monthlyAmount: 375, implementationYear: 2025 },
  { category: 'C', function: 'Responsable de structure', functionCode: 'C-6', annualAmount: 4000, monthlyAmount: 333.33, implementationYear: 2024 },
  { category: 'C', function: 'Technicien', functionCode: 'C-7', annualAmount: 4250, monthlyAmount: 354.17, implementationYear: 2025 },
  { category: 'C', function: 'Gestionnaire spécialisé', functionCode: 'C-8', annualAmount: 3750, monthlyAmount: 312.50, implementationYear: 2024 },
  { category: 'C', function: 'Chargé de missions (sous responsable)', functionCode: 'C-9', annualAmount: 3500, monthlyAmount: 291.67, implementationYear: 2025 },
  { category: 'C', function: 'Adjoint responsable de structure', functionCode: 'C-10', annualAmount: 4000, monthlyAmount: 333.33, implementationYear: 2025 },
  { category: 'C', function: 'Chef d\'équipe', functionCode: 'C-16', annualAmount: 4500, monthlyAmount: 375, implementationYear: 2025 },
  { category: 'C', function: 'Adjoint chef d\'équipe', functionCode: 'C-17', annualAmount: 4000, monthlyAmount: 333.33, implementationYear: 2025 },
  { category: 'C', function: 'Assistant(e) (sous DGA)', functionCode: 'C-19', annualAmount: 3500, monthlyAmount: 291.67, implementationYear: 2024 },
  { category: 'C', function: 'Assistant(e) (sous directeur)', functionCode: 'C-19', annualAmount: 3000, monthlyAmount: 250, implementationYear: 2024 },
  { category: 'C', function: 'Assistant(e) (sous responsable)', functionCode: 'C-19', annualAmount: 2500, monthlyAmount: 208.33, implementationYear: 2024 },
  { category: 'C', function: 'Gestionnaire', functionCode: 'C-18', annualAmount: 3000, monthlyAmount: 250, implementationYear: 2024 },
  { category: 'C', function: 'Animateur', functionCode: 'C-20', annualAmount: 2250, monthlyAmount: 187.50, implementationYear: 2024 },
  { category: 'C', function: 'Secrétaire spécialisé', functionCode: 'C-21', annualAmount: 2500, monthlyAmount: 208.33, implementationYear: 2025 },
  { category: 'C', function: 'Agent technique spécialisé', functionCode: 'C-22', annualAmount: 3500, monthlyAmount: 291.67, implementationYear: 2024 },
  { category: 'C', function: 'Agent d\'accueil', functionCode: 'C-23', annualAmount: 2750, monthlyAmount: 229.17, implementationYear: 2026 },
  { category: 'C', function: 'Agent administratif', functionCode: 'C-24', annualAmount: 2750, monthlyAmount: 229.17, implementationYear: 2025 },
  { category: 'C', function: 'Agent technique', functionCode: 'C-26', annualAmount: 2500, monthlyAmount: 208.33, implementationYear: 2026 },
  { category: 'C', function: 'Agent d\'entretien', functionCode: 'C-27', annualAmount: 2500, monthlyAmount: 208.33, implementationYear: 2026 },
  { category: 'C', function: 'Aide à domicile', functionCode: 'C-28', annualAmount: 2500, monthlyAmount: 208.33, implementationYear: 2024 }
];

// Fonctions utilitaires IFSE 1
export const getFunctionsByCategory = (category: 'A' | 'B' | 'C') => {
  return ifse1Data.filter(item => item.category === category);
};

export const getIFSE1ByFunction = (category: 'A' | 'B' | 'C', functionName: string) => {
  return ifse1Data.find(item => item.category === category && item.function === functionName);
};

export const getAllCategories = (): ('A' | 'B' | 'C')[] => {
  return ['A', 'B', 'C'];
};

export const getFunctionsForCategory = (category: 'A' | 'B' | 'C'): string[] => {
  const functions = ifse1Data
    .filter(item => item.category === category)
    .map(item => item.function);
  return [...new Set(functions)];
};

// Correspondance des codes de direction vers noms complets
export const getDirectionFullName = (directionCode: string): string => {
  const directionNames: { [key: string]: string } = {
    'DMS': 'Direction Municipale des Sports',
    'DPO': 'Direction des Projets et Ouvrages',
    'DH': 'Direction du Logement',
    'DRU': 'Direction des Relations Urbaines',
    'DAJ': 'Direction des Affaires Juridiques',
    'DE': 'Direction de l\'Environnement',
    'DPB': 'Direction des Projets de Bâtiment',
    'DCCS': 'Direction de la Citoyenneté et de la Cohésion Sociale',
    'DDU': 'Direction du Développement Urbain',
    'DMRU': 'Direction Municipale de la Relation aux Usagers',
    'DPE': 'Direction de la Petite Enfance',
    'DME': 'Direction Municipale de l\'Enfance',
    'DESS': 'Direction de l\'Enseignement et des Services Scolaires',
    'DMSP': 'Direction de la Santé et de la Prévention',
    'DCJ': 'Direction de la Culture et de la Jeunesse',
    'DSA': 'Direction de la Solidarité et de l\'Accompagnement',
    'DSI': 'Direction des Systèmes d\'Information',
    'DRH': 'Direction des Ressources Humaines',
    'DAF': 'Direction des Affaires Financières',
    'DG': 'Direction Générale',
    'Toutes dir°': 'Toutes directions (IFSE 2 communes)'
  };
  
  return directionNames[directionCode] || directionCode;
};

// Fonctions utilitaires IFSE 2 (utilisent ifse2_primes.json comme source unique)
export const getAllDirections = (): string[] => {
  const directions = ifse2Data.map(item => item.direction)
  const uniqueDirections = [...new Set(directions)].sort()
  return uniqueDirections
}

export const getIFSE2ByDirection = (direction: string): IFSE2Data[] => {
  const directionSpecific = ifse2Data.filter(item => item.direction === direction)
  const commonIFSE2 = ifse2Data.filter(item => item.direction === 'Toutes dir°' || item.direction === 'Toutes directions')
  return [...directionSpecific, ...commonIFSE2]
}

export const getIFSE2ByJob = (jobTitle: string): IFSE2Data[] => {
  return ifse2Data.filter(item => 
    item.jobs.some(job => job.toLowerCase().includes(jobTitle.toLowerCase()))
  )
}

export const getServicesByDirection = (direction: string): string[] => {
  const services = ifse2Data
    .filter(item => item.direction === direction)
    .map(item => item.service)
    .filter(service => service && service.trim() !== '')
  return [...new Set(services)].sort()
}
