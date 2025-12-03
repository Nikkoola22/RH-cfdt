export interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: 'temps-travail' | 'formation' | 'conges' | 'absences' | 'general';
}

export const faqData: FAQItem[] = [
  {
    id: 26,
    question: "J'ai droit à combien de jours de télétravail mobile ?",
    answer: "À la mairie de Gennevilliers, le forfait télétravail annuel est de 15 jours par an, à utiliser dans la limite de 3 jours maximum par mois. Ce forfait s'ajoute à votre jour fixe de télétravail hebdomadaire, sans dépasser un total de 2 jours de télétravail par semaine. Pour les agents à temps partiel en dessous de 80%, ce forfait est proratisé en fonction du temps de travail. En cas de non-utilisation, le report des jours de forfait n'est pas possible. Pour toute demande d'utilisation des jours de forfait, elle doit être validée par la hiérarchie au moins 5 jours à l'avance.",
    category: 'general'
  },
  {
    id: 27,
    question: "Je peux mettre combien de jours dans mon CET ?",
    answer: "Tu peux mettre au maximum **5 jours de congés annuels** et **2 jours de fractionnement** ainsi que 50 % des jours de **A.R.T.T** dans ton CET chaque année, à condition d’avoir pris au moins 20 jours de congés annuels dans l’année en cours. La demande d’ouverture ou d’alimentation du CET se fait avec les formulaires disponibles sur l’intranet.\n\nSeuls les agents employés de manière continue depuis au moins 1 an peuvent alimenter un CET, et les fonctionnaires stagiaires ne sont pas concernés pendant la période de stage.",
    category: 'conges'
  },
  {
    id: 1,
    question: "Quelle est la durée légale du temps de travail ?",
    answer: "La durée légale du temps de travail est de 1607 heures par an, répartie sur la base de 35 heures par semaine. Cette durée peut être organisée selon différents cycles hebdomadaires en fonction des services.",
    category: 'temps-travail'
  },
  {
    id: 2,
    question: "Comment fonctionnent les plages fixes et les plages de souplesse ?",
    answer: "Les plages fixes sont des périodes où la présence est obligatoire pour tous les agents. Les plages de souplesse permettent une certaine flexibilité dans les horaires d'arrivée et de départ, dans le respect de l'amplitude journalière et de la pause méridienne.",
    category: 'temps-travail'
  },
  {
    id: 3,
    question: "Quelles sont les conditions pour bénéficier du temps partiel ?",
    answer: "Le temps partiel peut être accordé de droit ou sur autorisation selon les situations. Il faut respecter une quotité minimale et les modalités varient selon que vous soyez fonctionnaire ou contractuel. La rémunération et les congés sont calculés au prorata du temps travaillé.",
    category: 'temps-travail'
  },
  {
    id: 4,
    question: "Comment sont rémunérées les heures supplémentaires ?",
    answer: `Les heures supplémentaires sont rémunérées uniquement si elles sont effectuées à la demande de la hiérarchie, concernent les agents titulaires et non titulaires de catégorie B et C, et dépassent le temps de travail normal de l’agent.

- **Elles donnent prioritairement droit à une récupération majorée**, à effectuer dans un délai de deux mois.
- **Majoration de récupération** :
  - Pour les 14 premières heures : +25%
  - De la 15ème à la 25ème heure : +27%
  - Heures de nuit (22h à 7h) : +100%
  - Heures effectuées le dimanche et jours fériés : +66%
  - Ces majorations peuvent se cumuler entre elles.

- **Exemple de récupération** :
  - 1 heure supplémentaire "classique" donne droit à 1h15 à récupérer pour les 14 premières heures, 1h17 de la 15ème à la 25ème.
  - 1 heure de nuit donne droit à 2h30 (pour les 14 premières) ou 2h34 (de la 15ème à la 25ème).
  - 1 heure le dimanche donne droit à 2h05 (pour les 14 premières) ou 2h07 (de la 15ème à la 25ème).

- **Indemnisation à titre exceptionnel** : si la récupération n’a pas été possible, elles peuvent être indemnisées sur demande du chef de service et selon les mêmes taux de majoration.

- **Limite** : pas plus de 25 heures supplémentaires par mois. Elles doivent être formalisées et validées par le chef de service.`,
    category: 'temps-travail'
  },
  {
    id: 5,
    question: "Combien dure la journée de solidarité ?",
    answer: "La journée de solidarité représente 7 heures de travail supplémentaires par an. Elle peut être fractionnée et prise sur des jours RTT, des jours fériés ou des congés selon les modalités définies par la collectivité.",
    category: 'temps-travail'
  },
  {
    id: 6,
    question: "Combien de jours de congés annuels ai-je droit ?",
    answer: "Vous avez droit à 25 jours ouvrés de congés annuels par an (soit 5 semaines). Ces congés peuvent être fractionnés et doivent être pris avant le 31 décembre. Pour les agents à temps partiel, les congés sont calculés au prorata.",
    category: 'conges'
  },
  {
    id: 7,
    question: "Comment fonctionnent les jours d'ARTT ?",
    answer: `Les **jours d'ARTT** (Aménagement et Réduction du Temps de Travail) sont des journées de repos attribuées pour compenser le fait de travailler plus de 35 heures par semaine. Ils permettent de ne pas dépasser le plafond annuel de 1607 heures de travail.

- **Qui y a droit ?**  
Tu peux bénéficier des ARTT si tu travailles à temps complet avec une durée hebdomadaire supérieure à 35h (par exemple : 37h, 37,5h, 38h ou 39h selon les cycles en vigueur à Gennevilliers), ou à temps partiel (le nombre de jours d’ARTT est alors au prorata de ton temps de travail).

- **Combien de jours d’ARTT ?**  
Le nombre de jours dépend de ton temps de travail hebdomadaire. Par exemple :  
  - 37h : 12 jours d’ARTT par an  
  - 37,5h : 15 jours  
  - 38h : 18 jours  
  - 39h : 23 jours  
Ce nombre est réduit proportionnellement si tu as des absences pour maladie dans l'année.

- **Comment poser ses ARTT ?**  
Ils se posent en journée ou demi-journée, comme les congés annuels. Les règles et délais de demande sont les mêmes que pour les congés annuels :  
  - Hors période estivale, 1 mois à l’avance pour 5 à 10 jours, 15 jours avant pour moins de 5 jours, et 5 jours ouvrés avant pour une journée.  
  - 50 % des jours d’ARTT doivent être pris avant le 15 septembre.

- **ARTT non pris :**  
À la fin de l’année, les jours d’ARTT non pris peuvent être versés sur ton compte épargne-temps (CET) selon les règles définies, sinon ils sont perdus.

- **Attention :**
  - Les absences pour raisons de santé diminuent le nombre de jours d’ARTT acquis : un système de « quotient de réduction » fait qu’après un certain nombre d’absences, une journée d’ARTT est retirée.
  - Les agents sur emplois saisonniers ou aux contrats courts doivent impérativement poser leurs ARTT avant la fin de contrat.

N’oublie pas que les jours non travaillés automatiquement (JNT) ne sont pas des ARTT et qu’ils sont planifiés directement par le service, contrairement aux ARTT qui sont à ta main sous réserve des nécessités de service.`,
    category: 'conges'
  },
  {
    id: 8,
    question: "Qu'est-ce que le don de jours de repos ?",
    answer: "Le don de jours permet de céder des jours RTT ou congés annuels à un collègue pour l'aide à un proche ou un enfant malade. Le don est limité à 31 jours et nécessite des justificatifs médicaux.",
    category: 'conges'
  },
 
  {
    id: 10,
    question: "Quels sont mes droits en cas de congé maternité ?",
    answer: "Le congé maternité varie selon le nombre d'enfants et les circonstances (grossesse multiple, hospitalisation). La durée et les conditions d'indemnisation sont définies par la réglementation. Des autorisations spéciales peuvent être accordées pour les consultations médicales.",
    category: 'conges'
  },
  {
    id: 11,
    question: "Puis-je m'absenter pour garde d'enfant malade ?",
    answer: `Oui, tu peux t’absenter pour garde d’enfant malade, sous certaines conditions.

Voici les règles principales concernant l’absence pour garde d’enfant :
- **L’autorisation d’absence est prévue si tu dois soigner un enfant malade ou assurer momentanément sa garde à cause d’une situation imprévue**, par exemple si l’enfant ou sa nourrice est malade, ou si la crèche ou l’école est fermée.
- **La garde d’enfant est acceptée aussi en cas de mouvement de grève** entraînant des problèmes de garde.
- **L’autorisation n’est pas accordée pour accompagner un enfant à une consultation médicale prévue** (sauf maladie grave ou handicap).
- **L’autorisation est accordée jusqu’aux 16 ans de l’enfant** (sans limite d’âge si l’enfant est handicapé), peu importe le nombre d’enfants.
- Pour les agents à temps complet : **6 jours par an** maximum.
- Pour les agents à temps partiel : le nombre de jours est calculé au prorata (exemple, pour un agent à 60 % : 4 jours).
- Ces jours peuvent être pris **en fractionné ou en continu**, selon le besoin.
- **La durée peut être doublée** si tu assumes seul la charge de l’enfant ou si ton conjoint recherche un emploi ou n’a pas d’autorisation d’absence rémunérée, sur justificatif.
- Si ton conjoint bénéficie d’un nombre d’autorisations moins élevé que le tien, tu peux obtenir la différence en supplément.
- Pour la première demande, il faut fournir une attestation de l’employeur du conjoint précisant ses droits à autorisation.
- La demande se fait auprès du responsable de service, puis transmise à la RH (Service GCR), avec le formulaire disponible sur l’intranet.

N’oublie pas de prévenir ton responsable hiérarchique dès que possible et de présenter les justificatifs nécessaires. 

Tu ne peux pas venir travailler avec ton enfant en cas de difficulté de garde. Les jours non utilisés ne sont pas reportés sur l’année suivante.`,
    category: 'absences'
  },
  {
    id: 12,
    question: "Quelles autorisations pour les fêtes religieuses ?",
    answer: "Des autorisations d'absence peuvent être accordées pour les principales fêtes religieuses (musulmanes, juives, chrétiennes orthodoxes) selon le calendrier établi par la préfecture. Ces absences peuvent être récupérées ou prises sur RTT/congés.",
    category: 'absences'
  },
  {
    id: 13,
    question: "Combien de jours en cas de décès familial ?",
    answer: "Le nombre de jours d'autorisation varie selon le lien de parenté : conjoint, enfant, parents donnent droit à plus de jours que frères, sœurs, oncles, tantes. Ces autorisations sont accordées sur présentation de justificatifs.",
    category: 'absences'
  },
  {
    id: 14,
    question: "Puis-je m'absenter pour déménagement ?",
    answer: "Une autorisation d'absence d'une journée est généralement accordée pour déménagement sur présentation de justificatifs (bail, acte de vente). Cette autorisation doit être demandée avec un préavis suffisant.",
    category: 'absences'
  },
  {
    id: 15,
    question: "Comment sont prises en charge les formations obligatoires ?",
    answer: "Les formations obligatoires (intégration, professionnalisation, hygiène-sécurité) sont prises en charge par l'employeur ou le CNFPT. Les frais de transport et d'hébergement sont remboursés selon les barèmes en vigueur.",
    category: 'formation'
  },
  {
    id: 16,
    question: "Qu'est-ce que la formation d'intégration ?",
    answer: "La formation d'intégration est obligatoire pour tous les nouveaux agents. Elle dure 10 jours pour les catégories A et B, 5 jours pour la catégorie C. Elle doit être réalisée dans l'année suivant la nomination et conditionne la titularisation.",
    category: 'formation'
  },
  {
    id: 17,
    question: "Comment utiliser mon Compte Personnel de Formation (CPF) ?",
    answer: "Le CPF est alimenté de 25h par an (plafond 150h). Il permet de financer des formations diplômantes, certifiantes ou de préparation aux concours. L'accord de l'employeur est nécessaire sur la nature, le calendrier et le financement.",
    category: 'formation'
  },
  {
    id: 18,
    question: "Puis-je préparer un concours sur mon temps de travail ?",
    answer: "Oui, des formations de préparation aux concours sont proposées. Les jours d'épreuves sont accordés sur temps de travail pour les concours de la fonction publique territoriale. Des congés de préparation peuvent être accordés avant les épreuves.",
    category: 'formation'
  },
  {
    id: 19,
    question: "Qu'est-ce que la VAE (Validation des Acquis de l'Expérience) ?",
    answer: "La VAE permet d'obtenir un diplôme grâce à l'expérience professionnelle. Un congé de 24h (72h pour certains agents) peut être accordé. La prise en charge dépend des priorités de la collectivité et du budget formation.",
    category: 'formation'
  },
  {
    id: 20,
    question: "Comment s'inscrire à une formation CNFPT ?",
    answer: "L'inscription se fait uniquement en ligne sur le compte IEL (www.cnfpt.fr). Après sélection de la formation, la demande est validée par la hiérarchie puis par le service DCRH. Les agents peuvent être aidés pour créer leur compte.",
    category: 'formation'
  },
  {
    id: 21,
    question: "Que faire en cas d'arrêt maladie ?",
    answer: "L'arrêt maladie doit être transmis rapidement au service RH. La rémunération est maintenue selon des modalités précises. Un certificat médical est obligatoire. Les agents en arrêt ne peuvent pas participer aux formations sauf cas particuliers de reconversion.",
    category: 'absences'
  },
  {
    id: 22,
    question: "Comment déclarer un accident de service ?",
    answer: "L'accident de service doit être déclaré immédiatement à la hiérarchie. Une prise en charge spécifique est prévue avec maintien de la rémunération. Les soins sont pris en charge et un arrêt de travail peut être prescrit.",
    category: 'absences'
  },
  {
    id: 23,
    question: "Puis-je cumuler plusieurs emplois ?",
    answer: "Le cumul d'emplois est soumis à autorisation préalable. Certaines activités sont autorisées de droit (enseignement, formation), d'autres nécessitent une demande motivée. Les règles varient selon que vous soyez à temps complet ou partiel.",
    category: 'general'
  },
  {
    id: 24,
    question: "Comment faire une demande de télétravail ?",
    answer: "Le télétravail est soumis à autorisation selon les modalités définies par la collectivité. Il faut respecter les conditions d'éligibilité du poste, disposer d'un équipement adapté et signer une convention. Des formations peuvent être proposées.",
    category: 'general'
  },
  {
    id: 25,
    question: "Où trouver les textes réglementaires ?",
    answer: "Les textes réglementaires sont disponibles sur Légifrance, le site du ministère de la Fonction Publique, et sur le portail de la fonction publique territoriale. Pour la jurisprudence administrative, consultez le site opendata.justice-administrative.fr.",
    category: 'general'
  },
  {
    id: 28,
    question: "Combien de fois peut-on me refuser ma formation ?",
    answer: `On ne peut pas te refuser plus de deux fois la même formation sans avis de la commission paritaire compétente. Après deux refus successifs, l'avis de cette commission devient obligatoire et, dans certains cas (comme pour la lutte contre l'illettrisme, le perfectionnement ou certaines formations du CNFPT), tu bénéficies même d'une priorité d'accès à la formation demandée si l'employeur n'a pas accordé l'autorisation deux années de suite. 

Pour le CPF, le troisième rejet d'une formation de même nature ne peut être prononcé qu'après avis de l'instance paritaire compétente. Pour les formations relevant du socle de connaissances de base (ex : communication en français, calcul…), l'employeur ne peut pas s'y opposer durablement, seulement demander un report d'un an maximum en raison des nécessités de service. `,
    category: 'formation'
  }
];

// (les questions ajoutées ont été intégrées directement dans `faqData` pour apparaître en premier)

export const getFAQByCategory = (category: string): FAQItem[] => {
  return faqData.filter(item => item.category === category);
};

export const searchFAQ = (query: string): FAQItem[] => {
  const searchTerm = query.toLowerCase();
  return faqData.filter(item => 
    item.question.toLowerCase().includes(searchTerm) || 
    item.answer.toLowerCase().includes(searchTerm)
  );
};