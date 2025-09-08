export interface InfoItem {
  id: number;
  title: string;
  content: string;
}

export const infoItems: InfoItem[] = [
  {
    id: 1,
    title: "Accident de trajet : où commence le trajet domicile-travail lorsqu'un agent réside dans un immeuble collectif ?",
    content: "Le trajet domicile-travail commence dès la sortie de l'immeuble collectif où réside l'agent. Cela inclut les parties communes de l'immeuble (hall, escaliers, ascenseur) jusqu'à la voie publique. En cas d'accident dans ces espaces communs, celui-ci peut être reconnu comme accident de trajet si l'agent se rendait effectivement au travail ou en revenait."
  },
    {
    id: 2,
    title: "Un fonctionnaire territorial peut-il demander une mutation tout en étant en disponibilité  ?",
    content: "Dans la fonction publique territoriale, un fonctionnaire placé en disponibilité ne peut pas être muté directement puisqu’il n’est pas en position d’activité. Toutefois, il lui reste possible de préparer sa mobilité et de poser sa candidature à une mutation, à condition de respecter la procédure adaptée. Ce cadre juridique doit être bien compris par les services RH afin d’accompagner correctement les agents."
  },
  {
    id: 3,
    title: "Repenser le recrutement pour une fonction publique plus inclusive.",
    content: "La fonction publique territoriale s'engage vers plus d'inclusivité en diversifiant ses méthodes de recrutement. Cela passe par l'adaptation des épreuves pour les personnes en situation de handicap, la valorisation de l'expérience professionnelle via la reconnaissance des acquis, et le développement de parcours d'insertion pour favoriser l'égalité des chances dans l'accès aux emplois publics."
  },
    {
    id: 4,
    title: "Entretien avec son chef: accident de service?.",
    content: "La circonstance qu’un chef de service, recevant en entretien individuel l’un de ses agents, ait pu adresser à ce dernier plusieurs reproches sur sa manière de servir et s’énerver en lui reprochant notamment « tricher sur ses horaires de travail », n’est pas constitutive d’un accident de service, dès lors que la restitution de cet entretien par l’intéressé ne fait apparaitre aucun propos ou comportement excédant l'exercice normal du pouvoir hiérarchique de ce supérieur.TA Besançon 2400131 du 19.06.2025."
  },
  {
    id: 5,
    title: "Sanction: Utilisation WhatApp.",
    content: "La circonstance qu’un agent ait envoyé depuis son téléphone personnel et sa messagerie WhatsApp, à l'attention de plusieurs personnes, dont des élus, des photos montages assortis de sous-titre déshonorants à l'encontre de la maire de la ville et de son troisième adjoint, présente un caractère fautif et non humoristique, compte-tenu de la nature des photographies diffusées et des personnes visées par ces montages. Par suite, le comportement de l’intéressé constitue un manquement à son obligation de dignité, de réserve de probité, d'intégrité et de loyauté, justifiant son exclusion de fonctions durant deux ans. La circonstance que les messages incriminés soient provenus de la messagerie privée de l'intéressé et en dehors du service est sans incidence dès lors que le comportement d'un agent public peut avoir pour effet de perturber le service ou de jeter le discrédit sur l'administration, comme en l'espèce.TA Cergy-Pontoise 2201748 du 09.07.2025."
  
  }
];

// Pour compatibilité avec l'ancien système
export const infoData = infoItems.map(item => item.title).join(" • ");