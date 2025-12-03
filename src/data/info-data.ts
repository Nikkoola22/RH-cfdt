export interface InfoItem {
  id: number;
  title: string;
  content: string;
}

export const infoItems: InfoItem[] = [
  {
    id: 1,
    title: "Accident de trajet : où commence le trajet domicile-travail ?",
    content: "Le trajet domicile-travail commence dès la sortie de l'immeuble collectif où réside l'agent. Cela inclut les parties communes de l'immeuble (hall, escaliers, ascenseur) jusqu'à la voie publique. En cas d'accident dans ces espaces communs, celui-ci peut être reconnu comme accident de trajet si l'agent se rendait effectivement au travail ou en revenait."
  },
  {
    id: 2,
    title: "Crise cardiaque au self, accident de service ?",
    content: "L'accident cardio-neurovasculaire déclaré par un agent alors qu'il se rendait au restaurant municipal pendant sa pause méridienne, est imputable au service, dès lors qu'aucune circonstance particulière ne l'en détache. \nD'une part, l'accident s'est produit sur le parcours habituel entre le lieu où s'accomplit le travail de l'agent et le lieu de sa pause déjeuner, et pendant la durée normale pour l'effectuer. \nD'autre part, l'intéressé présentait, depuis son affectation, un état de stress important engendrant de l'hypertension artérielle à l'origine de l'accident, et ne présentait pas de facteurs de risque prédisposant à la dissection de l'aorte dont il a été victime. \nPar suite, alors même que le jour de l'accident, l'agent n'a fourni aucun effort physique violent et inhabituel, le maire a entaché sa décision de refus de reconnaissance de l'imputabilité au service de l'accident, d'une erreur d'appréciation.CAA Bordeaux 23BX02371 du 28.10.2025"
  },
  {
    id: 3,
    title: "Fin de congé parental: obligation de réintégrer ?",
    content: "Il ne résulte pas des dispositions de l'article L. 515-6 du code général de la fonction publique, qu'un fonctionnaire territorial ayant demandé à ce qu'il soit mis fin à son congé parental avant le terme prévu, doive être réintégré de plein droit. \nPar suite, une collectivité a pu refuser la réintégration d'un agent en faisant valoir qu'elle n'était pas en mesure d'anticiper son retour dans de bonnes conditions.TA Rouen 2401665 du 03.10.2025"
  },
  {
    id: 4,
    title: "Entretien avec son chef: accident de service?.",
    content: "La circonstance qu'un chef de service, recevant en entretien individuel l'un de ses agents, ait pu adresser à ce dernier plusieurs reproches sur sa manière de servir et s'énerver en lui reprochant notamment « tricher sur ses horaires de travail », n'est pas constitutive d'un accident de service, dès lors que la restitution de cet entretien par l'intéressé ne fait apparaitre aucun propos ou comportement excédant l'exercice normal du pouvoir hiérarchique de ce supérieur.TA Besançon 2400131 du 19.06.2025."
  },
  {
    id: 5,
    title: "Sanction: Utilisation WhatApp.",
    content: "La circonstance qu'un agent ait envoyé depuis son téléphone personnel et sa messagerie WhatsApp, à l'attention de plusieurs personnes, dont des élus, des photos montages assortis de sous-titre déshonorants à l'encontre de la maire de la ville et de son troisième adjoint, présente un caractère fautif et non humoristique, compte-tenu de la nature des photographies diffusées et des personnes visées par ces montages. Par suite, le comportement de l'intéressé constitue un manquement à son obligation de dignité, de réserve de probité, d'intégrité et de loyauté, justifiant son exclusion de fonctions durant deux ans. La circonstance que les messages incriminés soient provenus de la messagerie privée de l'intéressé et en dehors du service est sans incidence dès lors que le comportement d'un agent public peut avoir pour effet de perturber le service ou de jeter le discrédit sur l'administration, comme en l'espèce.TA Cergy-Pontoise 2201748 du 09.07.2025."
  },
  {
    id: 6,
    title: "dois je donner mom mot de passe pendant mon arrêt maladie?",
    content: "La circonstance qu'un agent placé en congé de maladie ait expressément refusé, à deux reprises, de communiquer à ses supérieurs hiérarchiques le mot de passe permettant d'accéder à son ordinateur professionnel, alors que ce dernier était le seul à contenir les informations nécessaires à la poursuite de l'activité du service, est constitutive d'un fait de désobéissance hiérarchique, de nature à justifier la sanction disciplinaire de l'avertissement.TA Marseille 2210505 du 30.06.2025"
  },
  {
    id: 7,
    title: "INCESTE : sphère privée ?",
    content: "La circonstance qu'un adjoint technique territorial des établissements d'enseignement ait été pénalement condamné à trois ans d'emprisonnement pour des faits d'agression sexuelle incestueuse sur mineure de 15 ans par ascendant, est incompatible de manière générale avec sa qualité de fonctionnaire exerçant ses fonctions impliquant des contacts quotidiens avec des élèves mineurs, et justifie sa révocation. A cet égard, si l'intéressé soutient que son comportement relève de la sphère privée et ne porteraient atteinte ni au fonctionnement du service public, ni à l'image de l'administration, les faits qui lui sont reprochés sont, par leur nature même, incompatibles, avec la poursuite de ses fonctions de magasinier au sein d'un établissement scolaire accueillant des élèves mineurs.TA Orléans 2504719 du 06.10.2025"
  }
];

// Pour compatibilité avec l'ancien système
export const infoData = infoItems.map(item => item.title).join(" • ");
