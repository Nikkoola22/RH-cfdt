import { useState, useMemo } from 'react'
import { ArrowLeft, DollarSign, Calculator } from 'lucide-react'

interface Calculateur13emeProps {
  onClose?: () => void
}

type AgentType = 'indiciaire' | 'horaire'
type IndiciaireProfile = 'permanent' | 'medecin' | 'assistante'
type HoraireBase = 'indice' | 'taux'
type HorairePeriode = 'juin' | 'novembre'

interface Result {
  eligible: boolean
  reasons?: string[]
  total?: number
  compRem?: number
  primeSem?: number
  breakdown?: { month: string; ratio: number; amount: number; note?: string }[]
  context?: {
    prorataAnnee?: number
    tempsRatio?: number
    smicVerse?: number
    ratioHeures?: number
    baseReference?: number
  }
}

const INDICIAIRE_SCHEDULE: Record<IndiciaireProfile, { month: string; part: number; note?: string }[]> = {
  permanent: [
    { month: 'Juin', part: 6, note: 'Versement principal (6/12)' },
    { month: 'Novembre', part: 5, note: 'Complément (5/12)' },
    { month: 'Décembre', part: 1, note: 'Solde (1/12)' },
  ],
  medecin: [
    { month: 'Juin', part: 6, note: 'Versement principal (6/12)' },
    { month: 'Novembre', part: 6, note: 'Versement complémentaire (6/12)' },
  ],
  assistante: [
    { month: 'Juin', part: 6, note: 'Calendrier spécifique assistantes' },
    { month: 'Novembre', part: 6 },
  ],
}

const HOURS_CAP = 910
const HOURS_MIN = 455
const SMIC_MENSUEL = 1801.8
const DEFAULT_SMIC_REFERENCE = SMIC_MENSUEL
const INDICE_POINT_VALUE = 4.92278
const IR_RATE = 0.03
const HOURS_REFERENCE_TEXT = '910 h = équivalent 6 mois temps complet'

const formatEUR = (value: number) =>
  value.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  })

const sanitizeNumber = (value: string | number) => {
  if (typeof value === 'number') return value
  if (!value) return 0
  return Number(value.replace(',', '.')) || 0
}

const indiceToEuro = (indice: string) => sanitizeNumber(indice) * INDICE_POINT_VALUE

export default function Calculateur13eme({ onClose }: Calculateur13emeProps) {
  const [agentType, setAgentType] = useState<AgentType>('')
  const [indiciaireProfile, setIndiciaireProfile] = useState<IndiciaireProfile>('')
  const [im, setIm] = useState('')
  const [nbi, setNbi] = useState('')
  const [tempsEmploi, setTempsEmploi] = useState(100)
  const [monthsWorked, setMonthsWorked] = useState(12)
  const [anciennete, setAnciennete] = useState(12)
  const [smicReference, setSmicReference] = useState(DEFAULT_SMIC_REFERENCE)
  const [rubrique7587, setRubrique7587] = useState('')

  const [horaireBaseType, setHoraireBaseType] = useState<HoraireBase>('')
  const [horaireIM, setHoraireIM] = useState('')
  const [horaireTaux, setHoraireTaux] = useState('')
  const [horaireConges, setHoraireConges] = useState(10)
  const [horaireHours, setHoraireHours] = useState(HOURS_MIN)
  const [horairePeriode, setHorairePeriode] = useState<HorairePeriode>('juin')
  const [horaireAnciennete, setHoraireAnciennete] = useState(6)

  const [result, setResult] = useState<Result | null>(null)
  const [wizardStep, setWizardStep] = useState(1)

  const indiciaireTI = indiceToEuro(im)
  const indiciaireNBIValue = indiceToEuro(nbi)
  const indiciaireIRValue = (indiciaireTI + indiciaireNBIValue) * IR_RATE
  const horaireTI = indiceToEuro(horaireIM)
  const horaireIRValue = (horaireTI + 0) * IR_RATE

  const indiciaireEligibility = useMemo(() => {
    const reasons = [] as string[]
    if (monthsWorked < 3) reasons.push('Ancienneté insuffisante (< 3 mois)')
    if (tempsEmploi < 50) reasons.push('Temps de travail < 50%')
    if (indiciaireProfile === 'assistante' && !rubrique7587) reasons.push('La rubrique 7587 est requise')
    const base = indiciaireProfile === 'assistante'
      ? sanitizeNumber(rubrique7587)
      : indiciaireTI + indiciaireNBIValue
    if (base <= 0) reasons.push('Saisir un indice majoré et/ou une NBI pour lancer le calcul')
    return {
      eligible: reasons.length === 0,
      reasons,
    }
  }, [monthsWorked, tempsEmploi, indiciaireProfile, indiciaireTI, indiciaireNBIValue, rubrique7587])

  const horaireEligibility = useMemo(() => {
    const reasons = [] as string[]
    if (horaireAnciennete < 3) reasons.push('Ancienneté insuffisante (< 3 mois)')
    if (horaireHours < HOURS_MIN) reasons.push(`Nombre d'heures insuffisant (< ${HOURS_MIN}h) sur la période de référence`)
    if (horaireBaseType === 'indice' && horaireTI <= 0) {
      reasons.push('Saisir un indice majoré pour un calcul indiciaire')
    }
    if (horaireBaseType === 'taux' && sanitizeNumber(horaireTaux) === 0) {
      reasons.push('Saisir le taux horaire pour le calcul au taux')
    }
    return {
      eligible: reasons.length === 0,
      reasons,
    }
  }, [horaireAnciennete, horaireHours, horaireBaseType, horaireTI, horaireTaux])

  const handleReset = () => {
    setIndiciaireProfile('permanent')
    setIm('')
    setNbi('')
    setTempsEmploi(100)
    setMonthsWorked(12)
    setAnciennete(12)
    setSmicReference(DEFAULT_SMIC_REFERENCE)
    setRubrique7587('')
    setAgentType('')
    setIndiciaireProfile('')
    setHoraireBaseType('')
    setHoraireIM('')
    setHoraireTaux('')
    setHoraireConges(10)
    setHoraireHours(HOURS_MIN)
    setHorairePeriode('juin')
    setHoraireAnciennete(6)
    setResult(null)
    setWizardStep(1)
  }

  const handleSelectAgentType = (type: AgentType) => {
    setAgentType(type)
    setResult(null)
    setWizardStep(prev => {
      if (agentType !== type) return 2
      return Math.max(prev, 2)
    })
  }

  const handleSelectIndiciaireProfile = (profile: IndiciaireProfile) => {
    setIndiciaireProfile(profile)
    setResult(null)
    setWizardStep(prev => Math.max(prev, 3))
  }

  const handleSelectHoraireBaseType = (base: HoraireBase) => {
    setHoraireBaseType(base)
    setResult(null)
    setWizardStep(prev => Math.max(prev, 3))
  }

  const computeIndiciaire = () => {
    const { eligible, reasons } = indiciaireEligibility
    if (!eligible) {
      setResult({ eligible: false, reasons })
      return
    }

    const tiValue = indiciaireTI
    const nbiValue = indiciaireNBIValue
    const irValue = indiciaireIRValue
    const baseRub = sanitizeNumber(rubrique7587)

    const remunerationBase = indiciaireProfile === 'assistante'
      ? (baseRub / 2)
      : (tiValue + nbiValue + irValue)

    const tempsRatio = Math.max(0, Math.min(1, tempsEmploi / 100))
    const prorataAnnee = Math.max(0, Math.min(1, monthsWorked / 12))
    const ancienneteRatio = Math.max(0, Math.min(1, anciennete / 12))
    const prorataGlobal = tempsRatio * prorataAnnee * ancienneteRatio

    const fixedPart = prorataGlobal * (smicReference / 2)
    const smicVerse = prorataGlobal * smicReference
    const remunerationProratisee = prorataGlobal * remunerationBase
    const variableBase = remunerationProratisee - smicVerse
    const variablePart = variableBase > 0 ? variableBase : 0
    const total = fixedPart + variablePart

    const schedule = INDICIAIRE_SCHEDULE[indiciaireProfile]
    const parts = schedule.reduce((sum, item) => sum + item.part, 0)
    const breakdown = schedule.map(item => ({
      month: item.month,
      ratio: item.part / parts,
      note: item.note,
      amount: (total * (item.part / parts)),
    }))

    setResult({
      eligible: true,
      family: 'indiciaire',
      total,
      compRem: fixedPart,
      primeSem: variablePart,
      breakdown,
      context: {
        baseMensuelle: remunerationBase,
        tempsRatio,
        prorataAnnee,
        ancienneteRatio,
        prorataGlobal,
        tiValue,
        nbiValue,
        irValue,
        fixedPart,
        variablePart,
        smicVerse,
        remunerationProratisee,
        variableBase,
      },
    })
  }

  const computeHoraire = () => {
    const { eligible, reasons } = horaireEligibility
    if (!eligible) {
      setResult({ eligible: false, reasons })
      return
    }

    const heuresRetenues = Math.min(horaireHours, HOURS_CAP)
    const ratioHeures = heuresRetenues / HOURS_CAP
    const tiHoraire = horaireTI
    const autoIRHoraire = horaireIRValue
    const tauxHoraire = sanitizeNumber(horaireTaux)

    let baseReference = 0
    let total = 0
    let compRem = 0
    let primeSem = 0
    let baseSixMois = 0
    let basePS = 0
    const crBase = smicReference / 2
    const crHoraireUnit = crBase / HOURS_CAP

    if (horaireBaseType === 'indice') {
      baseReference = tiHoraire + autoIRHoraire
      baseSixMois = baseReference / 2
      basePS = Math.max(baseSixMois - crBase, 0)
      compRem = ratioHeures * crBase
      primeSem = ratioHeures * basePS
      total = compRem + primeSem
    } else {
      const tauxMajore = tauxHoraire * (1 + horaireConges / 100)
      baseReference = tauxMajore
      const mensualise = tauxMajore * 151.67
      baseSixMois = mensualise / 2
      basePS = Math.max(baseSixMois - crBase, 0)
      compRem = ratioHeures * crBase
      primeSem = ratioHeures * basePS
      total = compRem + primeSem
    }

    setResult({
      eligible: true,
      family: 'horaire',
      total,
      compRem,
      primeSem,
      breakdown: [
        {
          month: horairePeriode === 'juin' ? 'Versement de Juin (Réf. Nov → Avril)' : 'Versement de Novembre (Réf. Mai → Octobre)',
          ratio: ratioHeures,
          amount: total,
          note: `${horaireHours} h déclarées sur la période / ${HOURS_CAP} h max`,
        },
      ],
      context: {
        ratioHeures,
        baseReference,
        heuresRetenues,
        tiHoraire,
        autoIRHoraire,
        baseType: horaireBaseType,
        baseSixMois,
        basePS,
        crBase,
        crHoraireUnit: horaireBaseType === 'indice' ? crHoraireUnit : undefined,
        tauxHoraireMajore: horaireBaseType === 'taux' ? tauxHoraire * (1 + horaireConges / 100) : undefined,
      },
    })
  }

  const handleCompute = () => {
    if (agentType === 'indiciaire') {
      computeIndiciaire()
    } else {
      computeHoraire()
    }
  }

  const eligibility = agentType === 'indiciaire' ? indiciaireEligibility : horaireEligibility

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 flex flex-col">
      {/* Header avec bouton retour - Style unifié dark */}
      <div className="bg-gradient-to-r from-slate-800/95 to-green-900/95 backdrop-blur-md py-6 border-b border-green-500/30 shadow-xl">
        <div className="px-6 flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-green-500/80 to-emerald-500/80 rounded-2xl shadow-2xl">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-light text-white">Calculateur 13ème Mois</h1>
              <p className="text-green-300/80 text-sm font-light mt-1">Simulation pas à pas - Résultat informatif</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-light transition-all duration-150 border border-red-500/50"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* ÉTAPE 1 - Mode de rémunération */}
          <div>
            <div className="bg-gradient-to-br from-slate-800/80 to-green-900/40 backdrop-blur-md rounded-2xl overflow-hidden border border-green-500/30">
              <div className="bg-gradient-to-r from-green-600/80 to-emerald-600/80 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full text-white font-light">1</div>
                  <h2 className="text-lg font-light text-white">Mode de rémunération</h2>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-400 font-light">Quel est votre mode de rémunération ?</p>
                <select
                  value={agentType}
                  onChange={(e) => handleSelectAgentType(e.target.value as AgentType)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-600/50 text-white font-light focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none transition-all"
                >
                  <option value="">Choisir...</option>
                  <option value="indiciaire">Indiciaire (sur un emploi permanent)</option>
                  <option value="horaire">Horaire (animateurs, écoles, crèches, vacataires, ...)</option>
                </select>
              </div>
            </div>
          </div>

          {agentType && (
            /* ÉTAPE 2 - Profil ou Mode horaire */
            <div className="animate-slide-up">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-l-4 border-cyan-500">
                <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full text-white font-bold">2</div>
                    <h2 className="text-xl font-bold text-white">{agentType === 'indiciaire' ? 'Profil' : 'Mode de calcul'}</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm text-gray-600">{agentType === 'indiciaire' ? 'Quel est votre profil ?' : 'Choisissez votre mode de calcul'}</p>
                  <select
                    value={agentType === 'indiciaire' ? indiciaireProfile : horaireBaseType}
                    onChange={(e) => agentType === 'indiciaire' 
                      ? handleSelectIndiciaireProfile(e.target.value as IndiciaireProfile)
                      : handleSelectHoraireBaseType(e.target.value as HoraireBase)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-cyan-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none font-semibold text-gray-800 transition-all duration-200"
                  >
                    <option value="">Choisir...</option>
                    {agentType === 'indiciaire' ? (
                      <>
                        <option value="permanent">Agent permanent</option>
                        <option value="medecin">Médecin</option>
                        <option value="assistante">Assistante maternelle</option>
                      </>
                    ) : (
                      <>
                        <option value="indice">En référence à un indice (ex: 366)</option>
                        <option value="taux">Sur la base d'un taux horaire (ex: 11,5 €/h)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>
          )}

          {wizardStep >= 3 && (
            agentType === 'indiciaire' ? (
              <div className="animate-slide-up">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-l-4 border-emerald-500">
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full text-white font-bold">3</div>
                        <h2 className="text-xl font-bold text-white">Données indiciaires</h2>
                      </div>
                      <span className="text-xs font-semibold text-emerald-100 bg-emerald-700/50 px-3 py-1 rounded-full">Profil: {indiciaireProfile}</span>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    {indiciaireProfile !== 'assistante' ? (
                      <>
                        {/* Alerte */}
                        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-l-4 border-yellow-500 p-4 rounded-lg">
                          <p className="text-sm font-semibold text-yellow-900">⚠️ Remplissez les deux champs ci-dessous pour calculer votre 13ème mois</p>
                        </div>

                        {/* Indice Majoré */}
                        <div className="space-y-3">
                          <label className="block text-sm font-bold text-emerald-700 flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-600 text-white rounded-full text-xs font-bold">1</span>
                            Indice Majoré (IM)
                          </label>
                          <input
                            value={im}
                            onChange={(e) => setIm(e.target.value)}
                            inputMode="decimal"
                            className="w-full px-4 py-3 text-lg rounded-lg border-2 border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none font-bold text-gray-800 placeholder-gray-400 transition-all duration-200"
                            placeholder="ex : 366"
                          />
                          <p className="text-xs text-gray-600">Trouvez cette valeur sur votre dernière fiche de paie</p>
                        </div>

                        {/* Nouvelle Bonification Indiciaire */}
                        <div className="space-y-3">
                          <label className="block text-sm font-bold text-emerald-700 flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-600 text-white rounded-full text-xs font-bold">2</span>
                            Nouvelle Bonification Indiciaire (NBI)
                          </label>
                          <input
                            value={nbi}
                            onChange={(e) => setNbi(e.target.value)}
                            inputMode="decimal"
                            className="w-full px-4 py-3 text-lg rounded-lg border-2 border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none font-bold text-gray-800 placeholder-gray-400 transition-all duration-200"
                            placeholder="ex : 10"
                          />
                          <p className="text-xs text-gray-600">Conversion appliquée : indice × 4,92278</p>
                        </div>

                        {/* Montants convertis */}
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4 space-y-2">
                          <p className="text-sm font-semibold text-emerald-900">💰 Montants convertis</p>
                          <div className="flex justify-between items-center py-2 px-3 bg-white rounded">
                            <span className="text-sm text-gray-700">Traitement indiciaire (TI)</span>
                            <span className="font-bold text-emerald-700">{formatEUR(indiciaireTI)}</span>
                          </div>
                          <div className="flex justify-between items-center py-2 px-3 bg-white rounded">
                            <span className="text-sm text-gray-700">Indemnité résidence (3% TI)</span>
                            <span className="font-bold text-emerald-700">{formatEUR(indiciaireIRValue)}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <label className="block text-sm font-bold text-emerald-700">Montant rubrique 7587 en paie</label>
                        <input
                          value={rubrique7587}
                          onChange={(e) => setRubrique7587(e.target.value)}
                          inputMode="decimal"
                          className="w-full px-4 py-3 rounded-lg border-2 border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 outline-none font-semibold text-gray-800 transition-all duration-200"
                          placeholder="Montant brut rubrique 7587"
                        />
                        <p className="text-xs text-gray-600">Le 13ème mois = rubrique 7587 / 2 (proratisé)</p>
                      </div>
                    )}

                    {/* Paramètres de calcul */}
                    <div className="border-t pt-4 space-y-4">
                      <p className="text-sm font-semibold text-gray-800">⏱️ Paramètres de calcul</p>
                      
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">Temps de travail</label>
                        <input
                          type="range"
                          min={50}
                          max={100}
                          value={tempsEmploi}
                          onChange={(e) => setTempsEmploi(Number(e.target.value))}
                          className="w-full accent-emerald-600"
                        />
                        <div className="flex justify-between items-center mt-2 px-2">
                          <span className="text-xs text-gray-500">50%</span>
                          <span className="px-4 py-1 bg-emerald-100 text-emerald-700 font-bold rounded-full text-sm">{tempsEmploi}%</span>
                          <span className="text-xs text-gray-500">100%</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Mois travaillés sur l'année</label>
                        <input
                          type="number"
                          min={0}
                          max={12}
                          value={monthsWorked}
                          onChange={(e) => setMonthsWorked(Math.max(0, Math.min(12, Number(e.target.value) || 0)))}
                          className="w-full px-4 py-2 rounded-lg border-2 border-emerald-300 focus:border-emerald-600 outline-none font-semibold"
                        />
                        <p className="text-xs text-gray-600"><strong>{monthsWorked}/12</strong> mois travaillés</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-slide-up">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-l-4 border-purple-500">
                  <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full text-white font-bold">3</div>
                      <h2 className="text-xl font-bold text-white">Paramètres horaires</h2>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">Période de versement</label>
                      <select
                        value={horairePeriode}
                        onChange={(e) => setHorairePeriode(e.target.value as HorairePeriode)}
                        className="w-full px-4 py-2 rounded-lg border-2 border-purple-300 focus:border-purple-600 outline-none font-semibold"
                      >
                        <option value="juin">Juin (heures Nov → Avril)</option>
                        <option value="novembre">Novembre (heures Mai → Octobre)</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-700">Heures rémunérées (min {HOURS_MIN}h)</label>
                      <input
                        type="number"
                        min={0}
                        value={horaireHours}
                        onChange={(e) => setHoraireHours(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full px-4 py-2 rounded-lg border-2 border-purple-300 focus:border-purple-600 outline-none font-semibold"
                      />
                      <p className="text-xs text-gray-600">{HOURS_REFERENCE_TEXT}</p>
                    </div>

                    {horaireBaseType === 'indice' ? (
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">Indice majoré (IM)</label>
                        <input
                          value={horaireIM}
                          onChange={(e) => setHoraireIM(e.target.value)}
                          inputMode="decimal"
                          className="w-full px-4 py-2 rounded-lg border-2 border-purple-300 focus:border-purple-600 outline-none font-semibold"
                          placeholder="ex : 366"
                        />
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-1">
                          <p className="text-xs text-purple-900"><strong>TI converti :</strong> <span className="text-purple-700 font-bold">{formatEUR(horaireTI)}</span></p>
                          <p className="text-xs text-purple-900"><strong>IR 3% :</strong> <span className="text-purple-700 font-bold">{formatEUR(horaireIRValue)}</span></p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">Taux horaire brut (€/h)</label>
                        <input
                          value={horaireTaux}
                          onChange={(e) => setHoraireTaux(e.target.value)}
                          inputMode="decimal"
                          className="w-full px-4 py-2 rounded-lg border-2 border-purple-300 focus:border-purple-600 outline-none font-semibold"
                          placeholder="ex : 11,50"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          )}

          {wizardStep >= 3 && (
            <>
              {/* Bouton Calculer */}
              <div className="animate-slide-up bg-white rounded-2xl shadow-lg overflow-hidden border-l-4 border-green-500">
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Calculator className="w-6 h-6 text-white" />
                    <h2 className="text-xl font-bold text-white">Calcul du 13ème mois</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {eligibility.reasons.length > 0 && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded space-y-2">
                      <p className="text-sm font-semibold text-yellow-900">Conditions à respecter :</p>
                      <ul className="text-xs text-yellow-800 space-y-1">
                        {eligibility.reasons.map(reason => (
                          <li key={reason}>✗ {reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={handleCompute}
                    className={`w-full px-6 py-3 rounded-lg font-bold transition-all duration-200 transform ${eligibility.eligible ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:scale-105' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    disabled={!eligibility.eligible}
                  >
                    {eligibility.eligible ? '🧮 Lancer le calcul' : 'Complétez les conditions'}
                  </button>

                  {result && (
                    <div className="space-y-4 border-t pt-4">
                      {!result.eligible && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                          <p className="text-sm font-semibold text-red-900 mb-2">Situations bloquantes :</p>
                          <ul className="text-xs text-red-800 space-y-1">
                            {result.reasons?.map((reason: string) => (
                              <li key={reason}>✗ {reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {result.eligible && (
                        <div className="space-y-4">
                          {/* Résultat Principal */}
                          <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-lg p-6 space-y-2">
                            <p className="text-xs uppercase tracking-wide text-green-700 font-bold">Total estimé du 13ème mois</p>
                            <p className="text-5xl font-extrabold text-green-700">{formatEUR(result.total)}</p>
                            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-green-300">
                              <div className="bg-white rounded p-3">
                                <p className="text-xs text-gray-600">Complément de rémunération</p>
                                <p className="font-bold text-green-700">{formatEUR(result.compRem)}</p>
                              </div>
                              <div className="bg-white rounded p-3">
                                <p className="text-xs text-gray-600">Prime semestrielle</p>
                                <p className="font-bold text-green-700">{formatEUR(result.primeSem)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Ventilation */}
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                            <p className="text-xs uppercase tracking-wide text-gray-700 font-bold">Ventilation par échéance</p>
                            <div className="space-y-2">
                              {result.breakdown?.map((item: { month: string; ratio: number; amount: number; note?: string }) => (
                                <div key={item.month} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">{item.month}</p>
                                    <p className="text-xs text-gray-500">{(item.ratio * 100).toFixed(1)}%</p>
                                  </div>
                                  <p className="text-lg font-bold text-green-700">{formatEUR(item.amount)}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Détails techniques */}
                          {result.context && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-900 space-y-2">
                              <p className="font-semibold">Détails du calcul :</p>
                              {agentType === 'indiciaire' ? (
                                <p>Prorata année : {(result.context.prorataAnnee * 100).toFixed(0)}% • Temps de travail : {(result.context.tempsRatio * 100).toFixed(0)}% • SMIC versé : {formatEUR(result.context.smicVerse || 0)}</p>
                              ) : (
                                <p>Heures retenues : {(result.context.ratioHeures * 100).toFixed(0)}% • Base calcul : {formatEUR(result.context.baseReference || 0)}</p>
                              )}
                            </div>
                          )}

                          {/* Avertissement */}
                          <div className="bg-orange-50 border-l-4 border-orange-500 p-3 text-xs text-orange-900">
                            <p className="font-semibold">⚠️ Simulateur informatif uniquement</p>
                            <p className="mt-1">Seuls les collègues de la GCR font le calcul officiel.</p>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleReset}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                      >
                        ↻ Nouvelle simulation
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { 
            opacity: 0; 
            transform: translateY(20px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}
