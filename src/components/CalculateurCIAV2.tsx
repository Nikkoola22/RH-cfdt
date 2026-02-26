import { useState, useMemo } from 'react'
import { 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2, 
  Euro, 
  ArrowLeft, 
  Info,
  Sparkles,
  Calculator,
  BarChart3,
  CalendarDays,
  FileText
} from 'lucide-react'

interface CalculateurCIAProps {
  onClose: () => void
}

// Définition des étapes du wizard
const STEPS = [
  { 
    id: 1, 
    title: 'IFSE Mensuel', 
    subtitle: 'Votre prime de base',
    icon: Euro,
    color: 'orange',
    description: 'L\'IFSE est la base de calcul de votre CIA. Indiquez le montant que vous percevez chaque mois.',
    tip: '💡 Consultez votre fiche de paie pour trouver le montant exact de votre IFSE mensuel'
  },
  { 
    id: 2, 
    title: 'Week-ends travaillés', 
    subtitle: 'Samedis et dimanches',
    icon: CalendarDays,
    color: 'amber',
    description: 'Les jours de week-end travaillés sont comptabilisés séparément pour le calcul du CIA.',
    tip: '💡 Le taux standard est de 40€ par samedi et 40€ par dimanche travaillé'
  },
  { 
    id: 3, 
    title: 'Évaluation annuelle', 
    subtitle: 'Votre note de performance',
    icon: BarChart3,
    color: 'cyan',
    description: 'Votre taux d\'évaluation détermine la première moitié de votre CIA (50%).',
    tip: '💡 Très satisfaisant = 100% | Satisfaisant = 75% | À consolider = 25% | Non évalué = 0%'
  },
  { 
    id: 4, 
    title: 'Absences N-1', 
    subtitle: 'Jours d\'absence l\'année passée',
    icon: CalendarDays,
    color: 'purple',
    description: 'Vos jours d\'absence de l\'année précédente impactent la seconde moitié du CIA (50%).',
    tip: "⚠️ Attention : si vous êtes arrêté du vendredi matin au mardi soir, il faut compter le week-end, donc 5 jours !"
  },
  { 
    id: 5, 
    title: 'Résultat', 
    subtitle: 'Votre CIA estimé',
    icon: Calculator,
    color: 'green',
    description: 'Récapitulatif complet de votre Complément Indemnitaire Annuel.',
    tip: '🎉 Le CIA est versé une fois par an, généralement en décembre'
  }
]

export default function CalculateurCIAV2({ onClose }: CalculateurCIAProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [showTip, setShowTip] = useState(true)
  
  // États des sélections
  const [ifseMensuel, setIfseMensuel] = useState<number>(0)
  const [weekendSaturdays, setWeekendSaturdays] = useState<number>(0)
  const [weekendSundays, setWeekendSundays] = useState<number>(0)
  const [weekendRateSat, setWeekendRateSat] = useState<number>(40)
  const [weekendRateSun, setWeekendRateSun] = useState<number>(40)
  const [tauxEvaluation, setTauxEvaluation] = useState<number | null>(null)
  const [joursAbsenceN1, setJoursAbsenceN1] = useState<number>(0)
  const [showDetail, setShowDetail] = useState(false)

  // Calculs
  const weekendTotalMensuel = (weekendSaturdays * weekendRateSat) + (weekendSundays * weekendRateSun)
  const ifseMensuelTotal = ifseMensuel + weekendTotalMensuel

  const resultat = useMemo(() => {
    if (ifseMensuelTotal <= 0) {
      return {
        ifseAnnuel: 0,
        base10Pourcent: 0,
        tauxAbsence: 0,
        ciaEvaluation: 0,
        ciaAbsence: 0,
        ciaFinal: 0
      }
    }
    
    // IFSE annuel
    const ifseAnnuel = ifseMensuelTotal * 12
    
    // Base CIA = 10% de l'IFSE annuel
    const base10Pourcent = ifseAnnuel * 0.10
    
    // Première moitié (Évaluation)
    const evalTaux = tauxEvaluation || 0
    const ciaEvaluation = (base10Pourcent / 2) * (evalTaux / 100)
    
    // Deuxième moitié (Absences)
    let tauxAbsence = 0
    if (joursAbsenceN1 < 5) {
      tauxAbsence = 100
    } else if (joursAbsenceN1 <= 10) {
      tauxAbsence = 50
    } else {
      tauxAbsence = 0
    }
    const ciaAbsence = (base10Pourcent / 2) * (tauxAbsence / 100)
    
    // Total
    const ciaFinal = ciaEvaluation + ciaAbsence
    
    return {
      ifseAnnuel,
      base10Pourcent,
      tauxAbsence,
      ciaEvaluation,
      ciaAbsence,
      ciaFinal
    }
  }, [ifseMensuelTotal, tauxEvaluation, joursAbsenceN1])

  // Progression
  const getStepStatus = (stepId: number) => {
    if (stepId === 1) return ifseMensuel > 0 ? 'completed' : currentStep === 1 ? 'active' : 'pending'
    if (stepId === 2) return (weekendSaturdays > 0 || weekendSundays > 0) ? 'completed' : currentStep === 2 ? 'active' : 'pending'
    if (stepId === 3) return tauxEvaluation !== null ? 'completed' : currentStep === 3 ? 'active' : 'pending'
    if (stepId === 4) return currentStep > 4 ? 'completed' : currentStep === 4 ? 'active' : 'pending'
    if (stepId === 5) return currentStep === 5 ? 'active' : 'pending'
    return 'pending'
  }

  const canGoNext = () => {
    if (currentStep === 1) return ifseMensuel > 0
    if (currentStep === 2) return true // Optionnel
    if (currentStep === 3) return tauxEvaluation !== null
    if (currentStep === 4) return true // Optionnel
    return false
  }

  const canGoPrev = () => currentStep > 1

  const goNext = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const goPrev = () => {
    if (canGoPrev()) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const resetCalculator = () => {
    setCurrentStep(1)
    setIfseMensuel(0)
    setWeekendSaturdays(0)
    setWeekendSundays(0)
    setWeekendRateSat(40)
    setWeekendRateSun(40)
    setTauxEvaluation(null)
    setJoursAbsenceN1(0)
    setShowDetail(false)
  }

  const currentStepData = STEPS[currentStep - 1]
  const StepIcon = currentStepData.icon

  // Couleurs par étape
  const getStepColor = (color: string) => {
    const colors: Record<string, { bg: string, border: string, text: string, ring: string }> = {
      orange: { bg: 'from-orange-500 to-amber-500', border: 'border-orange-400/50', text: 'text-orange-300', ring: 'ring-orange-400/50' },
      amber: { bg: 'from-amber-500 to-yellow-500', border: 'border-amber-400/50', text: 'text-amber-300', ring: 'ring-amber-400/50' },
      cyan: { bg: 'from-cyan-500 to-teal-500', border: 'border-cyan-400/50', text: 'text-cyan-300', ring: 'ring-cyan-400/50' },
      purple: { bg: 'from-purple-500 to-pink-500', border: 'border-purple-400/50', text: 'text-purple-300', ring: 'ring-purple-400/50' },
      green: { bg: 'from-green-500 to-emerald-500', border: 'border-green-400/50', text: 'text-green-300', ring: 'ring-green-400/50' },
    }
    return colors[color] || colors.orange
  }

  const stepColor = getStepColor(currentStepData.color)

  // Options d'évaluation
  const evaluationOptions = [
    { value: 100, label: 'Très satisfaisant', color: 'green', desc: '100% de la première moitié' },
    { value: 75, label: 'Satisfaisant', color: 'cyan', desc: '75% de la première moitié' },
    { value: 25, label: 'À consolider', color: 'amber', desc: '25% de la première moitié' },
    { value: 0, label: 'Non évalué', color: 'slate', desc: '0% de la première moitié' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-950/30 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/95 to-orange-900/95 backdrop-blur-md py-4 border-b border-orange-500/30 shadow-xl glass-banner">
        <div className="px-4 sm:px-6 flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className={`p-3 bg-gradient-to-br ${stepColor.bg} rounded-xl shadow-lg`}>
              <Euro className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white">Calculateur CIA</h1>
              <p className="text-orange-300/80 text-xs sm:text-sm">Complément Indemnitaire Annuel</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all border border-red-500/50 glass-pill"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Retour</span>
            </button>
          )}
        </div>
      </div>

      {/* Barre de progression */}
      <div className="bg-slate-800/50 border-b border-slate-700/30 py-3 px-4 glass-banner">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, idx) => {
              const status = getStepStatus(step.id)
              const Icon = step.icon
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => {
                      if (status === 'completed' || step.id <= currentStep) {
                        setCurrentStep(step.id)
                      }
                    }}
                    disabled={status === 'pending' && step.id > currentStep}
                    className={`relative flex flex-col items-center transition-all duration-300 ${
                      status === 'pending' && step.id > currentStep ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-105'
                    }`}
                  >
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      status === 'completed' 
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
                        : status === 'active'
                          ? `bg-gradient-to-br ${getStepColor(step.color).bg} text-white shadow-lg animate-pulse`
                          : 'bg-slate-700 text-slate-400'
                    }`}>
                      {status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </div>
                    <span className={`text-[10px] sm:text-xs mt-1 font-medium hidden sm:block ${
                      status === 'active' ? getStepColor(step.color).text : 'text-slate-500'
                    }`}>
                      {step.title}
                    </span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={`w-4 sm:w-8 h-0.5 mx-1 sm:mx-2 transition-all duration-500 ${
                      getStepStatus(STEPS[idx + 1].id) !== 'pending' ? 'bg-green-500' : 'bg-slate-700'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Récapitulatif flottant */}
      {resultat.ciaFinal > 0 && currentStep < 5 && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right duration-500">
          <div className="bg-gradient-to-br from-orange-900/95 to-amber-900/95 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-orange-500/30 glass-card">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-xs text-orange-300/70">CIA estimé</p>
                <p className="text-xl font-bold text-orange-300">{resultat.ciaFinal.toFixed(0)}€<span className="text-sm font-normal">/an</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          
          {/* En-tête de l'étape */}
          <div className={`mb-6 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border ${stepColor.border} shadow-xl glass-card`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stepColor.bg} shadow-lg`}>
                <StepIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-slate-500 text-sm">Étape {currentStep}/5</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stepColor.text} bg-slate-700/50`}>
                    {currentStepData.subtitle}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{currentStepData.title}</h2>
                <p className="text-slate-400 text-sm">{currentStepData.description}</p>
              </div>
            </div>
            
            {/* Tip */}
            {showTip && (
              <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30 flex items-start gap-3 glass-card">
                <Info className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-slate-300">{currentStepData.tip}</p>
                <button onClick={() => setShowTip(false)} className="text-slate-500 hover:text-slate-300 text-xs">✕</button>
              </div>
            )}
          </div>

          {/* Contenu de l'étape */}
          <div className={`p-4 sm:p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 shadow-lg ring-2 ${stepColor.ring} transition-all duration-500 glass-card`}>
            
            {/* ÉTAPE 1: IFSE Mensuel */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div>
                  <label className="text-sm text-slate-400 block font-medium mb-3">
                    Montant de votre IFSE mensuel (en €)
                  </label>
                  <div className="flex items-center gap-3">
                    <Euro className="w-6 h-6 text-orange-400" />
                    <input
                      type="number"
                      value={ifseMensuel || ''}
                      onChange={(e) => setIfseMensuel(Number(e.target.value) || 0)}
                      placeholder="Ex: 250"
                      className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-xl text-white text-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 outline-none transition-all glass-pill"
                    />
                    <span className="text-slate-400">€/mois</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Consultez votre fiche de paie pour ce montant</p>
                </div>

                {ifseMensuel > 0 && (
                  <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl glass-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">IFSE mensuel saisi</p>
                        <p className="text-lg font-semibold text-white">{ifseMensuel}€/mois</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Soit par an</p>
                        <p className="text-xl font-bold text-orange-300">{(ifseMensuel * 12).toLocaleString('fr-FR')}€</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ÉTAPE 2: Week-ends */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <p className="text-sm text-slate-400 mb-4">
                  Indiquez le nombre moyen de samedis et dimanches que vous travaillez par mois :
                </p>

                {/* Samedis */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl glass-card">
                  <label className="text-sm text-amber-300 block font-medium mb-3">
                    📅 Samedis travaillés par mois
                  </label>
                  <div className="flex items-center gap-2 mb-3">
                    {[0, 1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onClick={() => setWeekendSaturdays(n)}
                        className={`w-10 h-10 rounded-lg font-bold transition-all glass-pill ${
                          weekendSaturdays === n
                            ? 'bg-amber-500 text-white shadow-lg'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Taux par samedi :</span>
                    <select
                      value={weekendRateSat}
                      onChange={(e) => setWeekendRateSat(Number(e.target.value))}
                      className="px-3 py-1 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white text-sm glass-pill"
                    >
                      {[40, 60, 80].map(rate => (
                        <option key={rate} value={rate}>{rate}€</option>
                      ))}
                    </select>
                    {weekendSaturdays > 0 && (
                      <span className="text-amber-300 text-sm ml-auto">
                        = {weekendSaturdays * weekendRateSat}€/mois
                      </span>
                    )}
                  </div>
                </div>

                {/* Dimanches */}
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl glass-card">
                  <label className="text-sm text-purple-300 block font-medium mb-3">
                    📅 Dimanches travaillés par mois
                  </label>
                  <div className="flex items-center gap-2 mb-3">
                    {[0, 1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onClick={() => setWeekendSundays(n)}
                        className={`w-10 h-10 rounded-lg font-bold transition-all glass-pill ${
                          weekendSundays === n
                            ? 'bg-purple-500 text-white shadow-lg'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Taux par dimanche :</span>
                    <select
                      value={weekendRateSun}
                      onChange={(e) => setWeekendRateSun(Number(e.target.value))}
                      className="px-3 py-1 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white text-sm glass-pill"
                    >
                      {[40, 60, 80].map(rate => (
                        <option key={rate} value={rate}>{rate}€</option>
                      ))}
                    </select>
                    {weekendSundays > 0 && (
                      <span className="text-purple-300 text-sm ml-auto">
                        = {weekendSundays * weekendRateSun}€/mois
                      </span>
                    )}
                  </div>
                </div>

                {/* Récapitulatif week-ends */}
                {weekendTotalMensuel > 0 && (
                  <div className="p-4 bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-slate-600/30 rounded-xl glass-card">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Total week-ends :</span>
                      <span className="text-xl font-bold text-white">{weekendTotalMensuel}€/mois</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-slate-400">IFSE total (base + week-ends) :</span>
                      <span className="text-orange-300 font-semibold">{ifseMensuelTotal}€/mois</span>
                    </div>
                  </div>
                )}

                {weekendTotalMensuel === 0 && (
                  <div className="p-4 bg-slate-700/30 rounded-lg text-center glass-card">
                    <p className="text-slate-400 text-sm">Vous ne travaillez pas les week-ends ? Passez à l'étape suivante.</p>
                  </div>
                )}
              </div>
            )}

            {/* ÉTAPE 3: Évaluation */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <p className="text-sm text-slate-400 mb-4">
                  Sélectionnez votre niveau d'évaluation annuelle :
                </p>
                
                <div className="space-y-3">
                  {evaluationOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTauxEvaluation(option.value)}
                      className={`w-full p-4 rounded-xl text-left transition-all border glass-card ${
                        tauxEvaluation === option.value
                          ? `bg-${option.color}-500/20 border-${option.color}-400/60 shadow-lg ring-2 ring-${option.color}-400/50`
                          : 'bg-slate-700/30 border-slate-600/20 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            tauxEvaluation === option.value 
                              ? `bg-${option.color}-500 border-${option.color}-400` 
                              : 'border-slate-500'
                          }`}>
                            {tauxEvaluation === option.value && <span className="text-white text-sm">✓</span>}
                          </div>
                          <div>
                            <p className="text-white font-medium">{option.label}</p>
                            <p className="text-xs text-slate-400">{option.desc}</p>
                          </div>
                        </div>
                        <span className={`text-lg font-bold ${
                          option.value === 100 ? 'text-green-400' :
                          option.value === 75 ? 'text-cyan-400' :
                          option.value === 25 ? 'text-amber-400' : 'text-slate-400'
                        }`}>
                          {option.value}%
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {tauxEvaluation !== null && (
                  <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl mt-4 glass-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Part évaluation du CIA</p>
                        <p className="text-xs text-slate-500">(50% de la base × {tauxEvaluation}%)</p>
                      </div>
                      <span className="text-xl font-bold text-cyan-300">
                        {resultat.ciaEvaluation.toFixed(2)}€
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ÉTAPE 4: Absences */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div>
                  <label className="text-sm text-slate-400 block font-medium mb-3">
                    Nombre de jours d'absence en N-1 (année précédente)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={joursAbsenceN1 || ''}
                    onChange={(e) => setJoursAbsenceN1(Number(e.target.value) || 0)}
                    placeholder="Ex: 3"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-xl text-white text-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 outline-none transition-all glass-pill"
                  />
                </div>

                {/* Barème visuel */}
                <div className="space-y-2">
                  <p className="text-sm text-slate-400 font-medium">Barème appliqué :</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`p-3 rounded-lg text-center transition-all glass-card ${
                      joursAbsenceN1 < 5 ? 'bg-green-500/20 border-2 border-green-400 ring-2 ring-green-400/50' : 'bg-slate-700/30 border border-slate-600/30'
                    }`}>
                      <p className={`font-bold ${joursAbsenceN1 < 5 ? 'text-green-400' : 'text-slate-400'}`}>100%</p>
                      <p className="text-xs text-slate-400">&lt; 5 jours</p>
                    </div>
                    <div className={`p-3 rounded-lg text-center transition-all glass-card ${
                      joursAbsenceN1 >= 5 && joursAbsenceN1 <= 10 ? 'bg-amber-500/20 border-2 border-amber-400 ring-2 ring-amber-400/50' : 'bg-slate-700/30 border border-slate-600/30'
                    }`}>
                      <p className={`font-bold ${joursAbsenceN1 >= 5 && joursAbsenceN1 <= 10 ? 'text-amber-400' : 'text-slate-400'}`}>50%</p>
                      <p className="text-xs text-slate-400">5-10 jours</p>
                    </div>
                    <div className={`p-3 rounded-lg text-center transition-all glass-card ${
                      joursAbsenceN1 > 10 ? 'bg-red-500/20 border-2 border-red-400 ring-2 ring-red-400/50' : 'bg-slate-700/30 border border-slate-600/30'
                    }`}>
                      <p className={`font-bold ${joursAbsenceN1 > 10 ? 'text-red-400' : 'text-slate-400'}`}>0%</p>
                      <p className="text-xs text-slate-400">&gt; 10 jours</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl glass-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Part absences du CIA</p>
                      <p className="text-xs text-slate-500">(50% de la base × {resultat.tauxAbsence}%)</p>
                    </div>
                    <span className="text-xl font-bold text-purple-300">
                      {resultat.ciaAbsence.toFixed(2)}€
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 5: Résultat */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="text-center mb-6">
                  <Sparkles className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                  <h3 className="text-2xl font-bold text-white">Votre CIA estimé</h3>
                  <p className="text-slate-400">Complément Indemnitaire Annuel</p>
                </div>

                {/* Détail du calcul */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 bg-orange-500/10 rounded-xl border border-orange-500/30 glass-card">
                    <div>
                      <p className="text-orange-300 font-medium">IFSE mensuel total</p>
                      <p className="text-xs text-slate-400">Base {ifseMensuel}€ + Week-ends {weekendTotalMensuel}€</p>
                    </div>
                    <span className="text-xl font-bold text-orange-300">{ifseMensuelTotal}€</span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 glass-card">
                    <div>
                      <p className="text-slate-300 font-medium">Base CIA (10% IFSE annuel)</p>
                      <p className="text-xs text-slate-400">{resultat.ifseAnnuel.toFixed(0)}€ × 10%</p>
                    </div>
                    <span className="text-lg font-bold text-slate-300">{resultat.base10Pourcent.toFixed(2)}€</span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/30 glass-card">
                    <div>
                      <p className="text-cyan-300 font-medium">Part Évaluation (50%)</p>
                      <p className="text-xs text-slate-400">Taux {tauxEvaluation}%</p>
                    </div>
                    <span className="text-xl font-bold text-cyan-300">{resultat.ciaEvaluation.toFixed(2)}€</span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-purple-500/10 rounded-xl border border-purple-500/30 glass-card">
                    <div>
                      <p className="text-purple-300 font-medium">Part Absences (50%)</p>
                      <p className="text-xs text-slate-400">{joursAbsenceN1} jours → {resultat.tauxAbsence}%</p>
                    </div>
                    <span className="text-xl font-bold text-purple-300">{resultat.ciaAbsence.toFixed(2)}€</span>
                  </div>
                </div>

                {/* Total */}
                <div className="p-6 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-2xl border-2 border-orange-400/50 shadow-xl glass-card">
                  <div className="text-center">
                    <p className="text-orange-300/70 text-sm mb-1">CIA ANNUEL ESTIMÉ</p>
                    <p className="text-5xl font-bold text-orange-300">{resultat.ciaFinal.toFixed(0)}€</p>
                    <p className="text-slate-400 text-sm mt-2">
                      Soit environ <strong className="text-orange-300">{(resultat.ciaFinal / 12).toFixed(2)}€</strong> par mois
                    </p>
                  </div>
                </div>

                {/* Détail complet (toggle) */}
                <button
                  onClick={() => setShowDetail(!showDetail)}
                  className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-300 py-2"
                >
                  <FileText className="w-4 h-4" />
                  {showDetail ? 'Masquer' : 'Voir'} le détail du calcul
                </button>

                {showDetail && (
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 text-xs text-slate-400 font-mono space-y-2 glass-card">
                    <p>📊 IFSE mensuel = {ifseMensuel}€ + ({weekendSaturdays}×{weekendRateSat}€ + {weekendSundays}×{weekendRateSun}€) = {ifseMensuelTotal}€</p>
                    <p>📊 IFSE annuel = {ifseMensuelTotal}€ × 12 = {resultat.ifseAnnuel.toFixed(2)}€</p>
                    <p>📊 Base CIA = {resultat.ifseAnnuel.toFixed(2)}€ × 10% = {resultat.base10Pourcent.toFixed(2)}€</p>
                    <p className="border-t border-slate-700 pt-2">
                      ➜ Part évaluation = {(resultat.base10Pourcent/2).toFixed(2)}€ × {tauxEvaluation}% = {resultat.ciaEvaluation.toFixed(2)}€
                    </p>
                    <p>
                      ➜ Part absences = {(resultat.base10Pourcent/2).toFixed(2)}€ × {resultat.tauxAbsence}% = {resultat.ciaAbsence.toFixed(2)}€
                    </p>
                    <p className="border-t border-slate-700 pt-2 text-orange-300">
                      ✅ CIA TOTAL = {resultat.ciaEvaluation.toFixed(2)}€ + {resultat.ciaAbsence.toFixed(2)}€ = {resultat.ciaFinal.toFixed(2)}€
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={resetCalculator}
                    className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all glass-pill"
                  >
                    Recommencer
                  </button>
                  {onClose && (
                    <button
                      onClick={onClose}
                      className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-medium transition-all glass-pill"
                    >
                      Terminer
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-500 text-center mt-4">
                  ⚠️ Ce calcul est indicatif. Le montant final dépend des décisions de votre administration.
                </p>
              </div>
            )}
          </div>

          {/* Boutons de navigation */}
          {currentStep < 5 && (
            <div className="flex justify-between mt-6 gap-4">
              <button
                onClick={goPrev}
                disabled={!canGoPrev()}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all glass-pill ${
                  canGoPrev()
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
                Précédent
              </button>
              
              <button
                onClick={goNext}
                disabled={!canGoNext() && currentStep !== 2 && currentStep !== 4}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all glass-pill ${
                  canGoNext() || currentStep === 2 || currentStep === 4
                    ? `bg-gradient-to-r ${stepColor.bg} hover:opacity-90 text-white shadow-lg`
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                {currentStep === 4 ? 'Voir le résultat' : 'Suivant'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Skip pour les étapes optionnelles */}
          {(currentStep === 2 || currentStep === 4) && (
            <div className="text-center mt-4">
              <button
                onClick={goNext}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                Passer cette étape →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
