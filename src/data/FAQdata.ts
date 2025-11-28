export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: 'temps-travail' | 'formation' | 'conges' | 'absences' | 'general';
  tags?: string[];
}

export const faqData: FAQItem[] = [
  // --- TEMPS DE TRAVAIL / TÉLÉTRAVAIL ---
  {
    id: 1,
    question: "Qu'est-ce que le télétravail selon la définition de la ville de Gennevilliers ?",
    answer: "Le télétravail désigne toute forme d'organisation du travail dans laquelle les fonctions qui auraient pu être exercées par un agent dans les locaux de son employeur sont réalisées hors de ces locaux de façon régulière et volontaire en utilisant les technologies de l'information et de la communication.",
    category: "temps-travail",
    tags: ["télétravail", "définition"]
  },
  {
    id: 2,
    question: "Quels sont les objectifs du télétravail à Gennevilliers ?",
    answer: "Concilier vie privée et professionnelle, promouvoir le management par la confiance, réduire l'empreinte écologique et améliorer les conditions de travail des agents.",
    category: "temps-travail",
    tags: ["télétravail", "objectifs"]
  },
  {
    id: 3,
    question: "Le télétravail est-il obligatoire ?",
    answer: "Non, le télétravail repose sur le strict volontariat de l'agent et est soumis à l'accord de son responsable hiérarchique.",
    category: "temps-travail",
    tags: ["télétravail", "volontariat"]
  },
  {
    id: 4,
    question: "Quelle est la quotité de télétravail autorisée ?",
    answer: "Le télétravail est limité à 1 jour fixe par semaine accompagné d'un forfait annuel de 15 jours dans la limite de 3 jours maximum par mois. La présence sur site est obligatoire 3 jours par semaine.",
    category: "temps-travail",
    tags: ["télétravail", "quotité", "jours"]
  },
  {
    id: 5,
    question: "Peut-on faire du télétravail en demi-journée ?",
    answer: "Non, le télétravail n'est pas autorisé pour une demi-journée.",
    category: "temps-travail",
    tags: ["télétravail", "demi-journée"]
  },
  {
    id: 6,
    question: "Où peut s'exercer le télétravail ?",
    answer: "Le télétravail peut s'exercer au domicile principal de l'agent, dans un autre domicile sous réserve d'accord hiérarchique, ou dans un espace de travail public gratuit garantissant la confidentialité.",
    category: "temps-travail",
    tags: ["télétravail", "lieu", "domicile"]
  },
  {
    id: 7,
    question: "Quels métiers sont exclus du télétravail ?",
    answer: "Les métiers en contact présentiel quotidien avec les usagers (animateurs, personnel des crèches, agents d'écoles), les métiers exercés sur la voie publique, et ceux avec des contraintes techniques ou de sécurité particulières.",
    category: "temps-travail",
    tags: ["télétravail", "exclusion", "métiers"]
  },
  {
    id: 8,
    question: "Comment faire une demande de télétravail ?",
    answer: "L'exercice des fonctions en télétravail est accordé sur demande écrite de l'agent qui précise les modalités d'organisation souhaitées et doit être transmise au responsable hiérarchique pour validation.",
    category: "temps-travail",
    tags: ["télétravail", "demande", "procédure"]
  },
  {
    id: 9,
    question: "Quelle est la durée d'autorisation du télétravail ?",
    answer: "La durée de l'autorisation ne peut excéder un an. Les agents qui souhaitent continuer doivent renouveler leur demande auprès de leur responsable hiérarchique.",
    category: "temps-travail",
    tags: ["télétravail", "durée", "renouvellement"]
  },
  {
    id: 10,
    question: "Peut-on interrompre le télétravail ?",
    answer: "Oui, il peut être mis fin au télétravail par écrit, à tout moment, à l'initiative de l'administration ou de l'agent, moyennant un délai de prévenance de quinze jours.",
    category: "temps-travail",
    tags: ["télétravail", "interruption", "fin"]
  },
  {
    id: 11,
    question: "Qui fournit le matériel informatique pour le télétravail ?",
    answer: "La collectivité met à disposition les moyens informatiques nécessaires. L'agent peut aussi utiliser son propre matériel sous réserve de compatibilité technique.",
    category: "temps-travail",
    tags: ["télétravail", "matériel", "équipement"]
  },
  {
    id: 12,
    question: "Y a-t-il une indemnisation pour les frais de télétravail ?",
    answer: "Non, les agents qui exercent leurs fonctions en télétravail ne bénéficient d'aucune prise en charge ou indemnisation liée aux coûts engagés.",
    category: "temps-travail",
    tags: ["télétravail", "indemnisation", "frais"]
  },
  {
    id: 13,
    question: "Le droit à la déconnexion est-il respecté ?",
    answer: "Oui, en dehors des plages horaires de travail habituelles, le télétravailleur n'est pas censé être connecté et aucune réponse immédiate ne peut être attendue.",
    category: "temps-travail",
    tags: ["télétravail", "déconnexion", "horaires"]
  },
  {
    id: 26,
    question: "Le télétravail peut-il être utilisé pour garder ses enfants ?",
    answer: "Non, le télétravail ne peut être appliqué pour garder ses enfants ou pour couvrir une maladie ordinaire.",
    category: "temps-travail",
    tags: ["télétravail", "enfants", "interdiction"]
  },
  {
    id: 27,
    question: "Qu'arrive-t-il en cas de panne technique pendant le télétravail ?",
    answer: "En cas de dysfonctionnement des équipements, l'agent doit informer sa hiérarchie et le service informatique. Si le télétravail n'est plus possible, le travail doit être effectué en présentiel avec la durée de déplacement comptée comme temps de travail.",
    category: "temps-travail",
    tags: ["télétravail", "panne", "technique"]
  },
  {
    id: 28,
    question: "Comment s'articulent les jours de forfait annuel ?",
    answer: "L'articulation des jours forfait se fait sur validation hiérarchique 5 jours à l'avance, dans la limite de 3 jours par mois. En cas de non-utilisation, le report n'est pas possible.",
    category: "temps-travail",
    tags: ["télétravail", "forfait", "jours"]
  },

  // --- FORMATION ---
  {
    id: 14,
    question: "Qu'est-ce que la formation d'intégration ?",
    answer: "Formation obligatoire de **10 jours** pour les catégories A et B, **5 jours** pour la catégorie C, à réaliser dans l'année suivant la nomination. Elle porte sur l'environnement territorial et conditionne la titularisation.",
    category: "formation",
    tags: ["formation", "intégration", "obligatoire"]
  },
  {
    id: 15,
    question: "Qui a droit à la formation ?",
    answer: "Les agents stagiaires, titulaires, contractuels de droit public occupant un emploi permanent, ainsi que les agents en congé parental bénéficient du droit à la formation.",
    category: "formation",
    tags: ["formation", "droit", "agents"]
  },
  {
    id: 16,
    question: "Qu'est-ce que la formation de professionnalisation ?",
    answer: "Formation permettant aux fonctionnaires de s'adapter à leur emploi et de maintenir leurs compétences. Elle comprend la formation au premier emploi (2 ans), tout au long de la carrière (tous les 5 ans) et suite à l'affectation sur un poste à responsabilité (6 mois).",
    category: "formation",
    tags: ["formation", "professionnalisation", "compétences"]
  },
  {
    id: 17,
    question: "Les formations sont-elles considérées comme du temps de travail ?",
    answer: "Oui, toute période de formation professionnelle est considérée comme du temps de travail, sauf dans les cas particuliers de disponibilité pour études.",
    category: "formation",
    tags: ["formation", "temps de travail"]
  },
  {
    id: 18,
    question: "Peut-on suivre une formation pendant un congé maladie ?",
    answer: "En règle générale non, mais par exception, un agent peut bénéficier d'une formation pendant un congé d'indisponibilité physique, uniquement en vue de sa réadaptation ou reconversion professionnelle.",
    category: "formation",
    tags: ["formation", "maladie", "reconversion"]
  },
  {
    id: 19,
    question: "Qu'est-ce que le CNFPT ?",
    answer: "Le **Centre National de la Fonction Publique Territoriale** est l'établissement public chargé de dispenser les formations. La collectivité lui verse une cotisation de 0,9% de la masse salariale.",
    category: "formation",
    tags: ["CNFPT", "formation", "cotisation"]
  },
  {
    id: 20,
    question: "Comment s'inscrire à une formation non dispensée par le CNFPT ?",
    answer: "L'agent doit faire une demande via le formulaire dédié sur l'Intranet, avec avis hiérarchique et devis, avant transmission au service DCRH pour arbitrage.",
    category: "formation",
    tags: ["formation", "inscription", "hors CNFPT"]
  },
  {
    id: 21,
    question: "Qu'est-ce que la préparation aux concours ?",
    answer: "Formation non obligatoire pour préparer les agents aux avancements de grade ou changements de cadre d'emplois. Délai de 12 mois entre deux formations similaires.",
    category: "formation",
    tags: ["formation", "concours", "préparation"]
  },
  {
    id: 22,
    question: "Combien de jours de congé pour préparer un concours ?",
    answer: "**1 jour** avant les épreuves d'admissibilité et **2 jours** avant l'épreuve d'admission, accordé une seule fois par an pour un concours ou examen.",
    category: "conges",
    tags: ["congé", "concours", "préparation"]
  },
  {
    id: 23,
    question: "Qu'est-ce que la REP ?",
    answer: "La **Reconnaissance de l'Expérience Professionnelle** permet aux agents de faire reconnaître leur expérience comme équivalente à un diplôme pour accéder à certains concours.",
    category: "formation",
    tags: ["REP", "expérience", "concours"]
  },
  {
    id: 24,
    question: "La collectivité peut-elle refuser deux fois de suite une formation ?",
    answer: "L'autorité territoriale ne peut opposer deux refus successifs à un agent qu'après avis de la commission administrative paritaire. L'agent peut alors s'adresser au CNFPT avec priorité d'accès.",
    category: "formation",
    tags: ["formation", "refus", "CAP"]
  },
  {
    id: 25,
    question: "Quelle est la prise en charge pour les formations diplômantes ?",
    answer: "Si la formation est à la demande de l'agent uniquement, la collectivité participe à hauteur de **70%** des frais pédagogiques, sans prise en charge des frais annexes.",
    category: "formation",
    tags: ["formation", "diplômante", "prise en charge"]
  },
  {
    id: 29,
    question: "Quelles sont les formations en hygiène et sécurité ?",
    answer: "Formations obligatoires pour développer les compétences en sécurité et protéger la santé au travail : formation générale à la sécurité, premiers secours, formations techniques spécifiques (habilitation électrique, conduite d'engins, HACCP).",
    category: "formation",
    tags: ["formation", "hygiène", "sécurité"]
  },
  {
    id: 30,
    question: "Qui sont les acteurs internes de la formation dans la collectivité ?",
    answer: "Les élus (votent les crédits), l'autorité territoriale (autorise les départs), la DRH/service DCRH (organise et suit), les responsables hiérarchiques (évaluent les besoins) et les agents (expriment leurs besoins).",
    category: "formation",
    tags: ["formation", "acteurs", "organisation"]
  },

  // --- CONGÉS ---
  {
    id: 31,
    question: "Combien de jours de congés annuels ai-je droit ?",
    answer: "Les agents à temps complet ont droit à **25 jours de congés annuels** par an, auxquels s'ajoutent les jours de RTT selon le cycle de travail.",
    category: "conges",
    tags: ["congés", "annuels", "RTT"]
  },
  {
    id: 32,
    question: "Puis-je reporter mes congés non pris ?",
    answer: "Les congés annuels doivent être pris dans l'année civile. Le report est possible exceptionnellement jusqu'au 31 janvier de l'année suivante, sur autorisation hiérarchique.",
    category: "conges",
    tags: ["congés", "report"]
  },

  // --- ABSENCES ---
  {
    id: 33,
    question: "Quel est le délai pour transmettre un arrêt maladie ?",
    answer: "L'arrêt de travail doit être transmis dans les **48 heures** suivant son établissement par le médecin.",
    category: "absences",
    tags: ["maladie", "arrêt", "délai"]
  },
  {
    id: 34,
    question: "Qu'est-ce que le jour de carence ?",
    answer: "Le **jour de carence** est le premier jour d'arrêt maladie non rémunéré. Il s'applique à chaque nouvel arrêt, sauf exceptions (ALD, accident de service, maternité).",
    category: "absences",
    tags: ["carence", "maladie", "rémunération"]
  },

  // --- GÉNÉRAL ---
  {
    id: 35,
    question: "Comment contacter la CFDT ?",
    answer: "Vous pouvez contacter la CFDT au **01 40 85 64 64** ou par email. Les permanences sont assurées du lundi au vendredi.",
    category: "general",
    tags: ["CFDT", "contact", "syndicat"]
  },
  {
    id: 36,
    question: "Où trouver les documents RH sur l'intranet ?",
    answer: "Les documents RH sont disponibles sur l'intranet de la ville dans la rubrique **Ressources Humaines > Formulaires et documents**.",
    category: "general",
    tags: ["intranet", "documents", "RH"]
  }
];
