/**
 * SOMMAIRE UNIFIÉ - Index léger pour la recherche en 2 étapes
 * 
 * Ce fichier contient uniquement les titres et mots-clés de chaque section
 * des documents internes (temps.ts, formation.ts, teletravail.ts).
 * 
 * Stratégie :
 * 1. L'API interroge ce sommaire léger (~500 tokens) pour identifier OÙ se trouve la réponse
 * 2. Une fois la section identifiée, on charge uniquement le texte pertinent du bon fichier
 * 
 * Économie : ~90% de tokens en moins par requête
 */

export interface SectionIndex {
  id: string;
  titre: string;
  motsCles: string[];
  source: 'temps' | 'formation' | 'teletravail';
  chapitre?: number; // Pour temps.ts qui a des chapitres numérotés
  resume?: string; // Résumé court pour aider l'API à choisir
}

export const sommaireUnifie: SectionIndex[] = [
  // ============================================
  // TEMPS DE TRAVAIL (temps.ts - chapitres 1-4)
  // ============================================
  
  // Chapitre 1 : Le temps de travail
  {
    id: 'temps_ch1_definition',
    titre: 'Définition du temps de travail',
    motsCles: ['temps de travail', 'travail effectif', '1607h', 'durée légale', 'jours travaillés', 'solidarité'],
    source: 'temps',
    chapitre: 1,
    resume: 'Définition légale du temps de travail, calcul des 1607h annuelles, journée de solidarité'
  },
  {
    id: 'temps_ch1_durees',
    titre: 'Durées et cycles de travail',
    motsCles: ['37h', '38h', '39h', 'cycle hebdomadaire', 'annualisation', 'JNT', 'crèches'],
    source: 'temps',
    chapitre: 1,
    resume: 'Cycles de travail (37h, 37.5h, 38h, 39h), annualisation, jours non travaillés'
  },
  {
    id: 'temps_ch1_plages',
    titre: 'Plages fixes et plages de souplesse',
    motsCles: ['plages fixes', 'plages souplesse', 'horaires variables', 'flexibilité', 'pause méridienne', '9h30', '16h30'],
    source: 'temps',
    chapitre: 1,
    resume: 'Horaires de présence obligatoire (9h30-12h, 14h-16h30) et plages de souplesse'
  },
  {
    id: 'temps_ch1_garanties',
    titre: 'Garanties minimales',
    motsCles: ['repos quotidien', 'repos hebdomadaire', '11h', '35h', 'amplitude', '48h', 'nuit'],
    source: 'temps',
    chapitre: 1,
    resume: 'Repos minimum (11h/jour, 35h/semaine), amplitude max 12h, durée max 48h/semaine'
  },
  {
    id: 'temps_ch1_heures_sup',
    titre: 'Heures supplémentaires et complémentaires',
    motsCles: ['heures supplémentaires', 'heures complémentaires', 'majoration', '25%', '27%', 'récupération', 'nuit', 'dimanche'],
    source: 'temps',
    chapitre: 1,
    resume: 'Heures sup majorées 25%/27%, max 25h/mois, récupération ou indemnisation'
  },
  {
    id: 'temps_ch1_temps_partiel',
    titre: 'Temps partiel',
    motsCles: ['temps partiel', '50%', '60%', '70%', '80%', '90%', 'droit', 'autorisation', 'rémunération', 'retraite', 'surcotisation'],
    source: 'temps',
    chapitre: 1,
    resume: 'Temps partiel de droit (enfant, handicap) ou sur autorisation, quotités 50-90%'
  },
  {
    id: 'temps_ch1_solidarite',
    titre: 'Journée de solidarité',
    motsCles: ['solidarité', '7 heures', 'jour férié', 'RTT', 'proratisation'],
    source: 'temps',
    chapitre: 1,
    resume: '7h supplémentaires fractionnées sur l\'année (2 min/jour)'
  },
  {
    id: 'temps_ch1_astreintes',
    titre: 'Astreintes et permanences',
    motsCles: ['astreinte', 'permanence', 'intervention', 'filière technique', 'indemnité', 'repos compensateur', 'week-end'],
    source: 'temps',
    chapitre: 1,
    resume: 'Astreintes (exploitation, décision, sécurité), permanences week-end/fériés'
  },
  {
    id: 'temps_ch1_sujetions',
    titre: 'Sujétions particulières (nuit, dimanche)',
    motsCles: ['sujétions', 'travail de nuit', 'dimanche', 'jours fériés', 'compensation', 'pénibilité'],
    source: 'temps',
    chapitre: 1,
    resume: 'Compensations pour travail de nuit et dimanches/fériés (1 à 4 jours selon volume)'
  },
  
  // Chapitre 2 : Les congés
  {
    id: 'temps_ch2_conges_annuels',
    titre: 'Congés annuels (CA)',
    motsCles: ['congés annuels', 'congé annuel', 'congés', 'vacances', '25 jours', 'CA', 'C.A', 'planning', 'estivaux', 'report', 'priorité', 'droit', 'combien', 'jours ouvrés', '22.5', '20', '17.5', '15', '12.5', 'prorata', 'fractionnement', '31 jours', 'consécutifs', 'pose congé', 'demande congé', '1er mars', '15 mars', 'délai', 'refus', 'contractuel'],
    source: 'temps',
    chapitre: 2,
    resume: '25 jours ouvrés/an (5j x 5 sem). Prorata selon temps travail. Estivaux: demande avant 1er mars. Max 31j consécutifs'
  },
  {
    id: 'temps_ch2_fractionnement',
    titre: 'Jours de fractionnement',
    motsCles: ['fractionnement', 'jours supplémentaires', 'bonification', '1 jour', '2 jours', '5 jours', '7 jours', '8 jours', 'janvier', 'avril', 'novembre', 'décembre', 'hiver'],
    source: 'temps',
    chapitre: 2,
    resume: '+1 jour si 5-7 CA pris jan-avr ou nov-déc, +2 jours si 8+ CA pris sur ces périodes'
  },
  {
    id: 'temps_ch2_conge_bonifie',
    titre: 'Congé bonifié (outre-mer)',
    motsCles: ['congé bonifié', 'outre-mer', 'DOM', 'Guadeloupe', 'Martinique', 'Réunion', 'Guyane', 'Mayotte', 'Saint Pierre', 'Miquelon', 'Saint Barthélémy', 'Saint Martin', '31 jours', '2 ans', 'métropole'],
    source: 'temps',
    chapitre: 2,
    resume: 'Pour fonctionnaires originaires DOM, tous les 2 ans, max 31 jours calendaires'
  },
  {
    id: 'temps_ch2_rtt',
    titre: 'Jours RTT / ARTT',
    motsCles: ['RTT', 'ARTT', 'A.R.T.T', 'réduction temps travail', '12 jours', '15 jours', '18 jours', '23 jours', 'décompte', 'maladie', 'absence', 'quotient', 'temps partiel', 'proratisé', '37h', '37.5h', '38h', '39h', '15 septembre', '50%', 'CET', 'jours de repos'],
    source: 'temps',
    chapitre: 2,
    resume: 'RTT: 12j (37h), 15j (37.5h), 18j (38h), 23j (39h). 50% pris avant 15/09. Réduit si maladie'
  },
  {
    id: 'temps_ch2_don_jours',
    titre: 'Don de jours de repos',
    motsCles: ['don jours', 'don de jours', 'enfant malade', 'enfant gravement malade', 'proche aidant', 'aidant familial', 'solidarité', 'anonyme', '5 jours', 'moins de 20 ans', 'handicap', 'accident', 'perte autonomie'],
    source: 'temps',
    chapitre: 2,
    resume: 'Don anonyme de RTT/CA (max 5j/an) pour collègue avec enfant malade <20 ans ou proche aidant'
  },
  {
    id: 'temps_ch2_cet',
    titre: 'Compte Épargne Temps (CET)',
    motsCles: ['CET', 'compte épargne temps', 'épargne', 'capitalisation', 'jours non pris', '5 jours', '1 an', 'service', 'ouverture', 'alimentation', 'stagiaire', 'titularisation', 'indemnisation'],
    source: 'temps',
    chapitre: 2,
    resume: 'Épargne max 5j CA + RTT/an, ouvert après 1 an de service. Pas pour stagiaires'
  },
  {
    id: 'temps_ch2_maternite',
    titre: 'Congé maternité',
    motsCles: ['maternité', 'congé maternité', 'grossesse', 'accouchement', 'prénatal', 'postnatal', '16 semaines', '26 semaines', '34 semaines', '46 semaines', 'jumeaux', 'triplés', 'couches pathologiques', '2 semaines', '4 semaines', 'déclaration', '4ème mois', 'plein traitement'],
    source: 'temps',
    chapitre: 2,
    resume: 'Durée: 16 sem (1er/2e enfant), 26 sem (3e+), 34 sem (jumeaux), 46 sem (triplés). Plein traitement'
  },
  {
    id: 'temps_ch2_paternite',
    titre: 'Congé paternité',
    motsCles: ['paternité', 'congé paternité', 'naissance', 'père', 'accueil enfant', '25 jours', '32 jours', '4 jours', '21 jours', '28 jours', '6 mois', 'calendaires', 'hospitalisation', 'naissance multiple'],
    source: 'temps',
    chapitre: 2,
    resume: '25 jours (32 si multiple): 4j obligatoires après naissance + 21j/28j dans les 6 mois'
  },
  
  // Chapitre 3 : Autorisations spéciales d'absence
  {
    id: 'temps_ch3_fetes_religieuses',
    titre: 'Fêtes religieuses',
    motsCles: ['fêtes religieuses', 'musulmane', 'juive', 'orthodoxe', 'bouddhiste', 'Aïd', 'Kippour'],
    source: 'temps',
    chapitre: 3,
    resume: 'Autorisation prioritaire de poser un congé pour fêtes religieuses'
  },
  {
    id: 'temps_ch3_garde_enfant',
    titre: 'Garde d\'enfant malade',
    motsCles: ['garde enfant', 'enfant malade', 'nourrice', 'école fermée', '6 jours', '16 ans', 'grève'],
    source: 'temps',
    chapitre: 3,
    resume: '6 jours/an (doublés si parent seul), jusqu\'aux 16 ans de l\'enfant'
  },
  {
    id: 'temps_ch3_soins_malade',
    titre: 'Soins ou assistance à un malade',
    motsCles: ['soins', 'malade', 'conjoint', 'ascendant', 'certificat médical', '5 jours', '3 jours'],
    source: 'temps',
    chapitre: 3,
    resume: '5 jours pour conjoint/parents/enfant, 3 jours pour autres proches'
  },
  {
    id: 'temps_ch3_proche_aidant',
    titre: 'Congé proche aidant (fin de vie)',
    motsCles: ['proche aidant', 'fin de vie', 'AJPA', 'dépendance', 'handicap', 'non rémunéré'],
    source: 'temps',
    chapitre: 3,
    resume: 'Congé non rémunéré max 3 mois renouvelable, AJPA possible via CAF'
  },
  {
    id: 'temps_ch3_deces',
    titre: 'Décès d\'un membre de la famille',
    motsCles: ['décès', 'obsèques', 'deuil', 'conjoint', 'parent', 'enfant', '5 jours', '14 jours'],
    source: 'temps',
    chapitre: 3,
    resume: '5j conjoint/parents, 14j enfant <25 ans, 3j grands-parents/frères/soeurs'
  },
  {
    id: 'temps_ch3_mariage',
    titre: 'Mariage ou PACS',
    motsCles: ['mariage', 'PACS', 'union', 'cérémonie', '7 jours', '3 jours', '1 jour'],
    source: 'temps',
    chapitre: 3,
    resume: '7 jours pour l\'agent, 3 jours pour enfant, 1 jour pour autres proches'
  },
  {
    id: 'temps_ch3_maternite_absence',
    titre: 'Absences liées à la maternité',
    motsCles: ['grossesse', 'examens prénataux', 'accouchement sans douleur', '1 heure par jour'],
    source: 'temps',
    chapitre: 3,
    resume: 'Examens prénataux, 1h/jour dès le 3e mois, préparation accouchement'
  },
  {
    id: 'temps_ch3_consultation',
    titre: 'Consultation médicale',
    motsCles: ['consultation', 'rendez-vous médical', 'récupération', 'RQTH', '4 jours'],
    source: 'temps',
    chapitre: 3,
    resume: 'Absence autorisée mais récupérable, sauf RQTH (4j/an)'
  },
  {
    id: 'temps_ch3_rentree',
    titre: 'Rentrée scolaire',
    motsCles: ['rentrée scolaire', 'école', 'maternelle', 'primaire', '6ème', '1 heure'],
    source: 'temps',
    chapitre: 3,
    resume: 'Facilité d\'1h le jour de la rentrée (maternelle, primaire, entrée en 6e)'
  },
  {
    id: 'temps_ch3_demenagement',
    titre: 'Déménagement',
    motsCles: ['déménagement', 'changement adresse', 'domicile', '1 jour'],
    source: 'temps',
    chapitre: 3,
    resume: '1 jour d\'autorisation la semaine précédant ou suivant le déménagement'
  },
  {
    id: 'temps_ch3_formation',
    titre: 'Formation et concours',
    motsCles: ['formation', 'concours', 'examen professionnel', 'jury', 'formateur', '1 jour', '2 jours'],
    source: 'temps',
    chapitre: 3,
    resume: '1j avant admissibilité, 2j avant admission, 5j/an jury ou formateur externe'
  },
  
  // Chapitre 4 : Maladies et accidents
  {
    id: 'temps_ch4_maladie',
    titre: 'Congé maladie',
    motsCles: ['maladie', 'arrêt', 'carence', '48h', 'contrôle', 'contre-visite', 'CMO'],
    source: 'temps',
    chapitre: 4,
    resume: 'Transmission sous 48h, 1 jour de carence, contre-visite possible'
  },
  {
    id: 'temps_ch4_accident',
    titre: 'Accident de service ou de trajet',
    motsCles: ['accident service', 'accident travail', 'accident trajet', 'déclaration', '15 jours', 'certificat'],
    source: 'temps',
    chapitre: 4,
    resume: 'Déclaration sous 48h (régime général) ou 15j (CNRACL), plein traitement'
  },
  {
    id: 'temps_ch4_remuneration',
    titre: 'Prise en charge rémunération maladie',
    motsCles: ['rémunération', 'plein traitement', 'demi-traitement', 'CLM', 'CLD', 'grave maladie', 'CNRACL', 'IRCANTEC'],
    source: 'temps',
    chapitre: 4,
    resume: 'Maladie ordinaire: 3 mois plein + 9 mois demi, CLM/CLD: 1-3 ans plein'
  },

  // ============================================
  // FORMATION (formation.ts)
  // ============================================
  {
    id: 'formation_obligatoire',
    titre: 'Formations obligatoires (intégration, professionnalisation)',
    motsCles: ['formation obligatoire', 'intégration', 'professionnalisation', 'CNFPT', 'titularisation', '5 jours', '10 jours'],
    source: 'formation',
    resume: 'Formation intégration (5-10j), professionnalisation 1er emploi (3-10j), tout au long carrière (2-10j)'
  },
  {
    id: 'formation_concours',
    titre: 'Préparation concours et examens',
    motsCles: ['concours', 'examen professionnel', 'préparation', 'avancement', 'promotion'],
    source: 'formation',
    resume: 'Préparation aux concours/examens FPT, 1j admissibilité + 2j admission'
  },
  {
    id: 'formation_cpf',
    titre: 'Compte Personnel de Formation (CPF)',
    motsCles: ['CPF', 'compte formation', 'heures', '25 heures', '150 heures', 'diplôme', 'certification'],
    source: 'formation',
    resume: '25h/an (plafond 150h), formations diplômantes ou certifiantes'
  },
  {
    id: 'formation_conge_pro',
    titre: 'Congé de formation professionnelle',
    motsCles: ['congé formation', '3 ans', '85%', 'traitement', 'projet professionnel'],
    source: 'formation',
    resume: 'Max 3 ans sur carrière (5 ans cat C), rémunéré 85% la 1ère année'
  },
  {
    id: 'formation_bilan',
    titre: 'Bilan de compétences',
    motsCles: ['bilan compétences', '24 heures', '72 heures', 'projet professionnel', 'reconversion'],
    source: 'formation',
    resume: '24h (72h si handicap/cat C), tous les 5 ans'
  },
  {
    id: 'formation_vae',
    titre: 'Validation des Acquis de l\'Expérience (VAE)',
    motsCles: ['VAE', 'validation acquis', 'expérience', 'diplôme', '24 heures'],
    source: 'formation',
    resume: '24h de congé (72h si handicap/cat C) pour obtenir un diplôme via expérience'
  },
  {
    id: 'formation_transition',
    titre: 'Congé de transition professionnelle',
    motsCles: ['transition professionnelle', 'reconversion', 'nouveau métier', '120 heures', '6000€'],
    source: 'formation',
    resume: 'Max 1 an, formations ≥120h, frais pris en charge jusqu\'à 6000€'
  },
  {
    id: 'formation_immersion',
    titre: 'Période d\'immersion professionnelle',
    motsCles: ['immersion', 'découverte métier', 'mobilité', '2 à 10 jours'],
    source: 'formation',
    resume: '2 à 10 jours pour découvrir un autre métier, max 20j sur 3 ans'
  },
  {
    id: 'formation_syndicale',
    titre: 'Formation syndicale',
    motsCles: ['formation syndicale', 'syndicat', '12 jours', 'représentant'],
    source: 'formation',
    resume: '12 jours ouvrables par an, frais à charge du syndicat'
  },
  {
    id: 'formation_hygiene_securite',
    titre: 'Formations hygiène et sécurité',
    motsCles: ['sécurité', 'hygiène', 'habilitation', 'CACES', 'électrique', 'premiers secours'],
    source: 'formation',
    resume: 'Formations obligatoires liées au poste (CACES, habilitation électrique, SST...)'
  },
  {
    id: 'formation_perfectionnement',
    titre: 'Formation de perfectionnement et préparation aux diplômes',
    motsCles: ['perfectionnement', 'diplôme', 'frais', '70%', 'prise en charge', 'pédagogique', 'qualification'],
    source: 'formation',
    resume: 'Formations diplômantes/qualifiantes, 70% frais pédagogiques si demande de l\'agent'
  },
  {
    id: 'formation_integration',
    titre: 'Formation d\'intégration',
    motsCles: ['intégration', 'titularisation', '5 jours', '10 jours', 'catégorie A', 'catégorie B', 'catégorie C', 'CNFPT'],
    source: 'formation',
    resume: 'Obligatoire à titularisation : 10 jours (cat A/B), 5 jours (cat C)'
  },
  {
    id: 'formation_professionnalisation',
    titre: 'Formation de professionnalisation',
    motsCles: ['professionnalisation', 'premier emploi', 'carrière', '5 jours', '10 jours', 'nouveau poste'],
    source: 'formation',
    resume: '5 à 10 jours (1er emploi), 2 à 10 jours (tout au long de carrière)'
  },
  {
    id: 'formation_rep',
    titre: 'Reconnaissance de l\'Expérience Professionnelle (REP)',
    motsCles: ['REP', 'reconnaissance', 'expérience', 'équivalence', 'diplôme', 'concours'],
    source: 'formation',
    resume: 'Permet de faire reconnaître son expérience comme équivalente à un diplôme pour les concours'
  },
  {
    id: 'formation_disponibilite_etudes',
    titre: 'Disponibilité pour études ou recherches',
    motsCles: ['disponibilité', 'études', 'recherches', '3 ans', 'renouvelable'],
    source: 'formation',
    resume: 'Max 3 ans renouvelable une fois, sans rémunération ni avancement'
  },
  {
    id: 'formation_formateur_interne',
    titre: 'Formateur interne occasionnel',
    motsCles: ['formateur', 'interne', 'expertise', 'RIFSEEP', 'déroulé pédagogique'],
    source: 'formation',
    resume: 'Agents avec expertise métier, formation de formateur requise, rémunéré via RIFSEEP'
  },

  // ============================================
  // TÉLÉTRAVAIL (teletravail.ts)
  // ============================================
  {
    id: 'teletravail_principes',
    titre: 'Principes du télétravail',
    motsCles: ['télétravail', 'principes', 'volontariat', 'réversibilité', 'confiance', 'déconnexion'],
    source: 'teletravail',
    resume: 'Volontaire, réversible, droit à la déconnexion, management par confiance'
  },
  {
    id: 'teletravail_eligibilite',
    titre: 'Éligibilité au télétravail',
    motsCles: ['éligibilité', 'métiers', 'compatible', 'exclus', 'catégorie A', 'catégorie B', 'catégorie C'],
    source: 'teletravail',
    resume: 'Ouvert à tous si fonctions compatibles, exclus: contact public, voie publique, confidentialité'
  },
  {
    id: 'teletravail_quotite',
    titre: 'Quotité et forfait télétravail',
    motsCles: ['forfait', 'jours télétravail', '15 jours', '1 jour par semaine', '3 jours par mois', 'quotité'],
    source: 'teletravail',
    resume: '1 jour fixe/semaine + forfait 15 jours/an (max 3j/mois), présence obligatoire 3j/semaine'
  },
  {
    id: 'teletravail_demande',
    titre: 'Procédure de demande télétravail',
    motsCles: ['demande', 'formulaire', 'autorisation', 'refus', 'entretien', 'CAP'],
    source: 'teletravail',
    resume: 'Demande écrite, entretien préalable, refus motivé contestable en CAP'
  },
  {
    id: 'teletravail_materiel',
    titre: 'Matériel et équipement télétravail',
    motsCles: ['matériel', 'ordinateur', 'internet', 'kit ergonomique', 'équipement'],
    source: 'teletravail',
    resume: 'Matériel fourni par la collectivité, kit ergonomique, connexion internet requise'
  },
  {
    id: 'teletravail_lieu',
    titre: 'Lieu d\'exercice du télétravail',
    motsCles: ['domicile', 'lieu', 'adresse', 'espace coworking', 'tiers lieu'],
    source: 'teletravail',
    resume: 'Domicile principal ou autre lieu déclaré, espaces publics possibles'
  },
  {
    id: 'teletravail_horaires',
    titre: 'Horaires et temps de travail en télétravail',
    motsCles: ['horaires', 'plages fixes', 'joignable', 'déconnexion', 'heures sup'],
    source: 'teletravail',
    resume: 'Mêmes horaires que sur site, plages fixes obligatoires, pas d\'heures sup'
  },
  {
    id: 'teletravail_situations_particulieres',
    titre: 'Situations particulières (grossesse, aidants, handicap)',
    motsCles: ['grossesse', 'enceinte', 'proche aidant', 'handicap', 'situation particulière', 'dérogation'],
    source: 'teletravail',
    resume: 'Dérogation possible au-delà de 3j/semaine pour femmes enceintes, aidants, handicap'
  },
  {
    id: 'teletravail_exceptionnel',
    titre: 'Télétravail exceptionnel (pandémie, intempéries)',
    motsCles: ['exceptionnel', 'pandémie', 'intempéries', 'circonstances', 'PCA', 'continuité'],
    source: 'teletravail',
    resume: 'Peut être imposé en cas de crise (pandémie, catastrophe), intégré au PCA'
  },
  {
    id: 'teletravail_reversibilite',
    titre: 'Réversibilité et fin du télétravail',
    motsCles: ['réversibilité', 'fin', 'arrêt', 'préavis', '1 mois', '2 mois', 'adaptation'],
    source: 'teletravail',
    resume: 'Fin possible à tout moment : 1 mois préavis pendant adaptation, 2 mois après'
  }
];

/**
 * Fonction utilitaire pour rechercher dans le sommaire
 * Retourne les sections les plus pertinentes pour une question donnée
 */
export function rechercherDansSommaire(question: string, maxResults = 3): SectionIndex[] {
  const q = question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Calculer un score pour chaque section
  const scored = sommaireUnifie.map(section => {
    let score = 0;
    
    // Vérifier les mots-clés
    for (const motCle of section.motsCles) {
      const mcNorm = motCle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (q.includes(mcNorm)) {
        score += 10;
      }
      // Match partiel
      const mots = mcNorm.split(' ');
      for (const mot of mots) {
        if (mot.length > 3 && q.includes(mot)) {
          score += 3;
        }
      }
    }
    
    // Vérifier le titre
    const titreNorm = section.titre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (q.includes(titreNorm)) {
      score += 15;
    }
    for (const mot of titreNorm.split(' ')) {
      if (mot.length > 3 && q.includes(mot)) {
        score += 2;
      }
    }
    
    // Vérifier le résumé
    if (section.resume) {
      const resumeNorm = section.resume.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      for (const mot of resumeNorm.split(' ')) {
        if (mot.length > 4 && q.includes(mot)) {
          score += 1;
        }
      }
    }
    
    return { section, score };
  });
  
  // Trier par score décroissant et retourner les meilleurs
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(s => s.section);
}

/**
 * Génère un prompt compact du sommaire pour l'API (étape 1)
 * ~500 tokens au lieu de ~15000 pour les docs complètes
 */
export function genererPromptSommaire(): string {
  const lines: string[] = ['SOMMAIRE DES DOCUMENTS INTERNES - MAIRIE DE GENNEVILLIERS\n'];
  
  let currentSource = '';
  for (const section of sommaireUnifie) {
    if (section.source !== currentSource) {
      currentSource = section.source;
      const sourceLabel = {
        temps: '\n📅 TEMPS DE TRAVAIL ET CONGÉS',
        formation: '\n🎓 FORMATION',
        teletravail: '\n🏠 TÉLÉTRAVAIL'
      }[currentSource];
      if (sourceLabel) {
        lines.push(sourceLabel);
      }
    }
    
    lines.push(`• [${section.id}] ${section.titre}`);
    if (section.resume) {
      lines.push(`  → ${section.resume}`);
    }
  }
  
  return lines.join('\n');
}

