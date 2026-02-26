import { useState, useMemo } from 'react'
import { 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2, 
  TrendingUp, 
  ArrowLeft, 

  Briefcase,
  Building2,
  Users,
  Calendar,
  Award,
  Calculator,
  Info,
  Sparkles
} from 'lucide-react'
import { 
  ifse1Data, 
  getDirectionFullName, 
  getAllDirections, 
  getIFSE2ByDirection, 
  getServicesByDirection
} from '../data/rifseep-data'

interface CalculateurPrimesProps {
  onClose?: () => void
}

// Définition des étapes du wizard
const STEPS = [
  { 
    id: 1, 
    title: 'Catégorie', 
    subtitle: 'Votre grille indiciaire',
    icon: Briefcase,
    color: 'blue',
    description: 'La catégorie détermine votre grille de rémunération. Elle correspond à votre niveau de qualification.',
    tip: '💡 Catégorie A = Bac+3 minimum | B = Bac à Bac+2 | C = Sans condition de diplôme'
  },
  { 
    id: 2, 
    title: 'Fonction', 
    subtitle: 'IFSE 1 - Prime de base',
    icon: Users,
    color: 'cyan',
    description: 'L\'IFSE 1 est votre prime principale. Elle dépend de votre fonction et de vos responsabilités.',
    tip: '💡 Cette prime est versée chaque mois automatiquement selon votre poste'
  },
  { 
    id: 3, 
    title: 'Direction & Métier', 
    subtitle: 'IFSE 2 - Primes complémentaires',
    icon: Building2,
    color: 'teal',
    description: 'Les primes IFSE 2 sont liées à votre direction, service et métier. Elles récompensent les sujétions particulières.',
    tip: '💡 Certaines primes sont cumulables selon votre situation'
  },
  { 
    id: 4, 
    title: 'Week-ends', 
    subtitle: 'IFSE 3 - Travail week-end',
    icon: Calendar,
    color: 'purple',
    description: 'Si vous travaillez les samedis et/ou dimanches, vous percevez une indemnité supplémentaire.',
    tip: '💡 40€ par samedi et 40€ par dimanche travaillé en moyenne'
  },
  { 
    id: 5, 
    title: 'Primes spéciales', 
    subtitle: 'Primes particulières',
    icon: Award,
    color: 'orange',
    description: 'Certaines situations donnent droit à des primes additionnelles (intérim, apprentissage...).',
    tip: '💡 Ces primes sont versées uniquement si vous êtes dans une situation particulière'
  },
  { 
    id: 6, 
    title: 'Résultat', 
    subtitle: 'Votre total mensuel',
    icon: Calculator,
    color: 'green',
    description: 'Récapitulatif de toutes vos primes et indemnités mensuelles.',
    tip: '🎉 N\'oubliez pas que ce calcul est indicatif'
  }
]

export default function CalculateurPrimesV2({ onClose }: CalculateurPrimesProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [showTip, setShowTip] = useState(true)
  
  // États des sélections
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedFunctionIndex, setSelectedFunctionIndex] = useState<number | null>(null)
  const [selectedDirection, setSelectedDirection] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [selectedJob, setSelectedJob] = useState('')
  const [selectedIFSE2, setSelectedIFSE2] = useState<Set<number>>(new Set())
  const [selectedSpecialPrimes, setSelectedSpecialPrimes] = useState<Set<number>>(new Set())
  const [weekendSaturdays, setWeekendSaturdays] = useState(0)
  const [weekendSundays, setWeekendSundays] = useState(0)
  const [weekendRateSat, setWeekendRateSat] = useState(40)
  const [weekendRateSun, setWeekendRateSun] = useState(40)

  // Calculs
  const ifse1Amount = useMemo(() => {
    if (selectedFunctionIndex === null) return 0
    const item = ifse1Data[selectedFunctionIndex]
    return item?.monthlyAmount || 0
  }, [selectedFunctionIndex])

  const ifse2Amount = useMemo(() => {
    if (!selectedDirection || selectedIFSE2.size === 0) return 0
    const ifse2List = getIFSE2ByDirection(selectedDirection)
    return Array.from(selectedIFSE2).reduce((sum, idx) => {
      return sum + (ifse2List[idx]?.amount || 0)
    }, 0)
  }, [selectedDirection, selectedIFSE2])

  const ifse3Total = (weekendSaturdays * weekendRateSat) + (weekendSundays * weekendRateSun)

  const specialPrimesData = useMemo(() => [
    { name: 'Prime intérim', amount: 150, desc: 'Remplacement temporaire d\'un poste vacant' },
    { name: 'Prime technicité', amount: 75, desc: 'Expertise technique reconnue' },
    { name: 'Prime Maître apprentissage', amount: 98.46, desc: 'Encadrement d\'un apprenti' },
    { name: 'Prime Référent financier suppléant', amount: 40, desc: 'Suppléance référent financier' },
    { name: 'Prime ODEC Partiel', amount: 40, desc: 'Officier d\'état civil partiel' },
  ], [])

  const specialPrimesAmount = useMemo(() => {
    if (selectedSpecialPrimes.size === 0) return 0
    return Array.from(selectedSpecialPrimes).reduce((sum, idx) => {
      return sum + (specialPrimesData[idx]?.amount || 0)
    }, 0)
  }, [selectedSpecialPrimes, specialPrimesData])

  const totalMonthly = Math.round((ifse1Amount + ifse2Amount + ifse3Total + specialPrimesAmount) * 100) / 100

  // Progression
  const getStepStatus = (stepId: number) => {
    if (stepId === 1) return selectedCategory ? 'completed' : currentStep === 1 ? 'active' : 'pending'
    if (stepId === 2) return selectedFunctionIndex !== null ? 'completed' : currentStep === 2 ? 'active' : 'pending'
    if (stepId === 3) return selectedJob ? 'completed' : currentStep === 3 ? 'active' : 'pending'
    if (stepId === 4) return (weekendSaturdays > 0 || weekendSundays > 0) ? 'completed' : currentStep === 4 ? 'active' : 'pending'
    if (stepId === 5) return selectedSpecialPrimes.size > 0 ? 'completed' : currentStep === 5 ? 'active' : 'pending'
    if (stepId === 6) return currentStep === 6 ? 'active' : 'pending'
    return 'pending'
  }

  const canGoNext = () => {
    if (currentStep === 1) return selectedCategory !== ''
    if (currentStep === 2) return selectedFunctionIndex !== null
    if (currentStep === 3) return true // Optionnel
    if (currentStep === 4) return true // Optionnel
    if (currentStep === 5) return true // Optionnel
    return false
  }

  const canGoPrev = () => currentStep > 1

  const goNext = () => {
    if (canGoNext() && currentStep < 6) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const goPrev = () => {
    if (canGoPrev()) {
      setCurrentStep(prev => prev - 1)
    }
  }

  // Handlers
  const handleDirectionSelect = (dir: string) => {
    setSelectedDirection(dir)
    setSelectedIFSE2(new Set())
    setSelectedJob('')
    setSelectedService('')
  }

  const handleServiceSelect = (service: string) => {
    setSelectedService(service)
    setSelectedIFSE2(new Set())
    setSelectedJob('')
  }

  const handleJobSelect = (job: string) => {
    setSelectedJob(job)
    if (!job) return
    
    const directionPrimes = getIFSE2ByDirection(selectedDirection)
    const jobPrimes = directionPrimes.filter(p => 
      p.jobs?.includes(job) && 
      (!selectedService || p.service === selectedService || p.service === 'Tous services')
    )
    
    const newSelectedIFSE2 = new Set(selectedIFSE2)
    jobPrimes.forEach(jobPrime => {
      const primeIdx = directionPrimes.findIndex(p => p === jobPrime)
      if (primeIdx >= 0) {
        newSelectedIFSE2.add(primeIdx)
      }
    })
    setSelectedIFSE2(newSelectedIFSE2)
  }

  const handleToggleIFSE2 = (idx: number) => {
    const newSet = new Set(selectedIFSE2)
    if (newSet.has(idx)) {
      newSet.delete(idx)
    } else {
      newSet.add(idx)
    }
    setSelectedIFSE2(newSet)
  }

  const handleToggleSpecialPrime = (idx: number) => {
    const newSet = new Set(selectedSpecialPrimes)
    if (newSet.has(idx)) {
      newSet.delete(idx)
    } else {
      newSet.add(idx)
    }
    setSelectedSpecialPrimes(newSet)
  }

  const resetCalculator = () => {
    setCurrentStep(1)
    setSelectedCategory('')
    setSelectedFunctionIndex(null)
    setSelectedDirection('')
    setSelectedService('')
    setSelectedJob('')
    setSelectedIFSE2(new Set())
    setSelectedSpecialPrimes(new Set())
    setWeekendSaturdays(0)
    setWeekendSundays(0)
  }

  const currentStepData = STEPS[currentStep - 1]
  const StepIcon = currentStepData.icon

  // Couleurs par étape
  const getStepColor = (color: string) => {
    const colors: Record<string, { bg: string, border: string, text: string, ring: string }> = {
      blue: { bg: 'from-blue-500 to-cyan-500', border: 'border-blue-400/50', text: 'text-blue-300', ring: 'ring-blue-400/50' },
      cyan: { bg: 'from-cyan-500 to-teal-500', border: 'border-cyan-400/50', text: 'text-cyan-300', ring: 'ring-cyan-400/50' },
      teal: { bg: 'from-teal-500 to-green-500', border: 'border-teal-400/50', text: 'text-teal-300', ring: 'ring-teal-400/50' },
      purple: { bg: 'from-purple-500 to-pink-500', border: 'border-purple-400/50', text: 'text-purple-300', ring: 'ring-purple-400/50' },
      orange: { bg: 'from-orange-500 to-amber-500', border: 'border-orange-400/50', text: 'text-orange-300', ring: 'ring-orange-400/50' },
      green: { bg: 'from-green-500 to-emerald-500', border: 'border-green-400/50', text: 'text-green-300', ring: 'ring-green-400/50' },
    }
    return colors[color] || colors.blue
  }

  const stepColor = getStepColor(currentStepData.color)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-md py-4 border-b border-slate-700/50 shadow-xl glass-banner">
        <div className="px-4 sm:px-6 flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className={`p-3 bg-gradient-to-br ${stepColor.bg} rounded-xl shadow-lg`}>
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white">Calculateur de Primes</h1>
              <p className="text-slate-400 text-xs sm:text-sm">Estimez vos primes RIFSEEP en quelques clics</p>
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
                    <span className={`text-[10px] sm:text-xs mt-1 font-medium ${
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
      {totalMonthly > 0 && currentStep < 6 && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right duration-500">
          <div className="bg-gradient-to-br from-green-900/95 to-emerald-900/95 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-green-500/30 glass-card">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-xs text-green-300/70">Total estimé</p>
                <p className="text-xl font-bold text-green-300">{totalMonthly.toLocaleString('fr-FR')}€<span className="text-sm font-normal">/mois</span></p>
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
                  <span className="text-slate-500 text-sm">Étape {currentStep}/6</span>
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
            
            {/* ÉTAPE 1: Catégorie */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <label className="text-sm text-slate-400 block font-medium">Sélectionnez votre catégorie d'emploi :</label>
                <div className="grid grid-cols-3 gap-3">
                  {['A', 'B', 'C'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 ${
                        selectedCategory === cat
                          ? 'bg-blue-500/20 border-blue-400 shadow-lg shadow-blue-500/20 scale-105'
                          : 'bg-slate-700/30 border-slate-600/30 hover:border-blue-400/50 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="text-2xl sm:text-3xl font-bold text-white mb-1">Cat. {cat}</div>
                      <div className="text-xs text-slate-400">
                        {cat === 'A' && 'Cadres / Bac+3'}
                        {cat === 'B' && 'Intermédiaires / Bac'}
                        {cat === 'C' && 'Exécution'}
                      </div>
                    </button>
                  ))}
                </div>
                {selectedCategory && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 glass-card">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-300">Catégorie {selectedCategory} sélectionnée</span>
                  </div>
                )}
              </div>
            )}

            {/* ÉTAPE 2: Fonction */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <label className="text-sm text-slate-400 block font-medium">Choisissez votre fonction :</label>
                <select
                  value={selectedFunctionIndex ?? ''}
                  onChange={(e) => setSelectedFunctionIndex(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-xl text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 outline-none transition-all glass-pill"
                >
                  <option value="">-- Sélectionnez une fonction --</option>
                  {ifse1Data
                    .map((item, globalIdx) => ({ item, globalIdx }))
                    .filter(({ item }) => item.category === selectedCategory)
                    .map(({ item, globalIdx }) => (
                      <option key={globalIdx} value={globalIdx}>
                        {item.function} — {item.monthlyAmount}€/mois
                      </option>
                    ))}
                </select>
                
                {selectedFunctionIndex !== null && (
                  <div className="mt-4 p-4 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/30 rounded-xl glass-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Votre IFSE 1</p>
                        <p className="text-lg font-semibold text-white">{ifse1Data[selectedFunctionIndex].function}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-cyan-300">{ifse1Amount}€</p>
                        <p className="text-xs text-slate-400">par mois</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ÉTAPE 3: Direction & Métier */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* Direction */}
                <div>
                  <label className="text-sm text-slate-400 block font-medium mb-2">1. Votre direction :</label>
                  <select
                    value={selectedDirection}
                    onChange={(e) => handleDirectionSelect(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-xl text-white focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30 outline-none transition-all glass-pill"
                  >
                    <option value="">-- Choisir une direction --</option>
                    {getAllDirections().map(dir => (
                      <option key={dir} value={dir}>
                        {getDirectionFullName(dir)} ({dir})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Service */}
                {selectedDirection && (
                  <div className="animate-in slide-in-from-bottom duration-300">
                    <label className="text-sm text-slate-400 block font-medium mb-2">2. Votre service (optionnel) :</label>
                    <select
                      value={selectedService}
                      onChange={(e) => handleServiceSelect(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-xl text-white focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30 outline-none transition-all glass-pill"
                    >
                      <option value="">-- Tous les services --</option>
                      {getServicesByDirection(selectedDirection).map(service => (
                        <option key={service} value={service}>{service}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Métier */}
                {selectedDirection && (
                  <div className="animate-in slide-in-from-bottom duration-300">
                    <label className="text-sm text-slate-400 block font-medium mb-2">3. Votre métier :</label>
                    <select
                      value={selectedJob}
                      onChange={(e) => handleJobSelect(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-xl text-white focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30 outline-none transition-all glass-pill"
                    >
                      <option value="">-- Sélectionnez un métier --</option>
                      {getIFSE2ByDirection(selectedDirection)
                        .filter(p => (!selectedService || p.service === selectedService || p.service === 'Tous services' || p.direction === 'Toutes dir°') && p.jobs?.length)
                        .flatMap(p => p.jobs || [])
                        .filter((job, idx, arr) => arr.indexOf(job) === idx && job !== '')
                        .sort()
                        .map((job, idx) => (
                          <option key={idx} value={job}>{job}</option>
                        ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1 italic">Si vous ne trouvez pas votre métier, contactez-nous</p>
                  </div>
                )}

                {/* Primes associées */}
                {selectedJob && (
                  <div className="animate-in slide-in-from-bottom duration-300">
                    <label className="text-sm text-slate-400 block font-medium mb-2">Primes disponibles pour votre profil :</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {getIFSE2ByDirection(selectedDirection)
                        .filter(prime => prime.jobs?.includes(selectedJob) && (!selectedService || prime.service === selectedService || prime.service === 'Tous services'))
                        .map((prime, idx) => {
                          const allPrimes = getIFSE2ByDirection(selectedDirection)
                          const realIdx = allPrimes.findIndex(p => p === prime)
                          return (
                            <button
                              key={idx}
                              onClick={() => handleToggleIFSE2(realIdx)}
                              className={`w-full p-3 rounded-lg text-left transition-all border glass-card ${
                                selectedIFSE2.has(realIdx)
                                  ? 'bg-teal-500/20 border-teal-400/60 shadow-md'
                                  : 'bg-slate-700/30 border-slate-600/20 hover:bg-slate-700/50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                    selectedIFSE2.has(realIdx) ? 'bg-teal-500 border-teal-400' : 'border-slate-500'
                                  }`}>
                                    {selectedIFSE2.has(realIdx) && <span className="text-white text-xs">✓</span>}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-white">{prime.motif}</p>
                                    <p className="text-xs text-slate-400">{prime.service || 'Tous services'}</p>
                                  </div>
                                </div>
                                <span className="text-teal-300 font-bold">{prime.amount}€</span>
                              </div>
                            </button>
                          )
                        })}
                    </div>
                    {ifse2Amount > 0 && (
                      <div className="mt-3 p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg text-center glass-card">
                        <span className="text-teal-300">Total IFSE 2 : <strong>{ifse2Amount}€/mois</strong></span>
                      </div>
                    )}
                  </div>
                )}

                {!selectedDirection && (
                  <div className="p-4 bg-slate-700/30 rounded-lg text-center glass-card">
                    <p className="text-slate-400 text-sm">Sélectionnez votre direction pour voir les primes disponibles</p>
                    <p className="text-xs text-slate-500 mt-1">Cette étape est optionnelle, vous pouvez passer directement à la suivante</p>
                  </div>
                )}
              </div>
            )}

            {/* ÉTAPE 4: Week-ends */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 block font-medium mb-2">Samedis travaillés / mois</label>
                    <div className="flex items-center gap-2 mb-2">
                      {[0, 1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          onClick={() => setWeekendSaturdays(n)}
                          className={`w-10 h-10 rounded-lg font-bold transition-all glass-pill ${
                            weekendSaturdays === n
                              ? 'bg-purple-500 text-white shadow-lg'
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <label className="text-xs text-slate-400 block mb-1">Forfait par samedi :</label>
                    <select
                      value={weekendRateSat}
                      onChange={e => setWeekendRateSat(Number(e.target.value))}
                      className="w-full px-2 py-2 rounded border border-purple-400 bg-slate-900 text-purple-200 text-sm glass-pill"
                    >
                      {[40, 60, 80].map(rate => (
                        <option key={rate} value={rate}>{rate} €</option>
                      ))}
                    </select>
                    {weekendSaturdays > 0 && (
                      <p className="text-purple-300 text-sm mt-2">{weekendSaturdays} × {weekendRateSat}€ = {weekendSaturdays * weekendRateSat}€</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block font-medium mb-2">Dimanches travaillés / mois</label>
                    <div className="flex items-center gap-2 mb-2">
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
                    <label className="text-xs text-slate-400 block mb-1">Forfait par dimanche :</label>
                    <select
                      value={weekendRateSun}
                      onChange={e => setWeekendRateSun(Number(e.target.value))}
                      className="w-full px-2 py-2 rounded border border-purple-400 bg-slate-900 text-purple-200 text-sm glass-pill"
                    >
                      {[40, 60, 80].map(rate => (
                        <option key={rate} value={rate}>{rate} €</option>
                      ))}
                    </select>
                    {weekendSundays > 0 && (
                      <p className="text-purple-300 text-sm mt-2">{weekendSundays} × {weekendRateSun}€ = {weekendSundays * weekendRateSun}€</p>
                    )}
                  </div>
                </div>
                {ifse3Total > 0 && (
                  <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-center glass-card">
                    <p className="text-purple-300">Total IFSE 3 : <strong className="text-xl">{ifse3Total}€/mois</strong></p>
                  </div>
                )}
                {ifse3Total === 0 && (
                  <div className="p-4 bg-slate-700/30 rounded-lg text-center glass-card">
                    <p className="text-slate-400 text-sm">Vous ne travaillez pas les week-ends ? Pas de souci, passez à l'étape suivante.</p>
                  </div>
                )}
              </div>
            )}

            {/* ÉTAPE 5: Primes spéciales */}
            {currentStep === 5 && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <p className="text-sm text-slate-400 mb-4">Cochez les primes particulières qui s'appliquent à votre situation :</p>
                <div className="space-y-3">
                  {specialPrimesData.map((prime, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleToggleSpecialPrime(idx)}
                      className={`w-full p-4 rounded-xl text-left transition-all border glass-card ${
                        selectedSpecialPrimes.has(idx)
                          ? 'bg-orange-500/20 border-orange-400/60 shadow-lg'
                          : 'bg-slate-700/30 border-slate-600/20 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                            selectedSpecialPrimes.has(idx) ? 'bg-orange-500 border-orange-400' : 'border-slate-500'
                          }`}>
                            {selectedSpecialPrimes.has(idx) && <span className="text-white text-sm">✓</span>}
                          </div>
                          <div>
                            <p className="text-white font-medium">{prime.name}</p>
                            <p className="text-xs text-slate-400">{prime.desc}</p>
                          </div>
                        </div>
                        <span className="text-orange-300 font-bold text-lg">{prime.amount}€</span>
                      </div>
                    </button>
                  ))}
                </div>
                
                {specialPrimesAmount > 0 && (
                  <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl text-center glass-card">
                    <p className="text-orange-300">Total primes spéciales : <strong className="text-xl">{specialPrimesAmount}€/mois</strong></p>
                  </div>
                )}
              </div>
            )}

            {/* ÉTAPE 6: Résultat */}
            {currentStep === 6 && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="text-center mb-6">
                  <Sparkles className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <h3 className="text-2xl font-bold text-white">Votre estimation</h3>
                  <p className="text-slate-400">Récapitulatif de vos primes mensuelles</p>
                </div>

                <div className="space-y-3">
                  {ifse1Amount > 0 && (
                    <div className="flex justify-between items-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
                      <div>
                        <p className="text-blue-300 font-medium">IFSE 1 - Prime de fonction</p>
                        <p className="text-xs text-slate-400">{selectedFunctionIndex !== null ? ifse1Data[selectedFunctionIndex].function : ''}</p>
                      </div>
                      <span className="text-2xl font-bold text-blue-300">{ifse1Amount}€</span>
                    </div>
                  )}
                  
                  {ifse2Amount > 0 && (
                    <div className="flex justify-between items-center p-4 bg-teal-500/10 rounded-xl border border-teal-500/30">
                      <div>
                        <p className="text-teal-300 font-medium">IFSE 2 - Primes de sujétion</p>
                        <p className="text-xs text-slate-400">{selectedIFSE2.size} prime(s) sélectionnée(s)</p>
                      </div>
                      <span className="text-2xl font-bold text-teal-300">{ifse2Amount}€</span>
                    </div>
                  )}
                  
                  {ifse3Total > 0 && (
                    <div className="flex justify-between items-center p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
                      <div>
                        <p className="text-purple-300 font-medium">IFSE 3 - Week-ends</p>
                        <p className="text-xs text-slate-400">{weekendSaturdays} sam. + {weekendSundays} dim.</p>
                      </div>
                      <span className="text-2xl font-bold text-purple-300">{ifse3Total}€</span>
                    </div>
                  )}
                  
                  {specialPrimesAmount > 0 && (
                    <div className="flex justify-between items-center p-4 bg-orange-500/10 rounded-xl border border-orange-500/30">
                      <div>
                        <p className="text-orange-300 font-medium">Primes particulières</p>
                        <p className="text-xs text-slate-400">{selectedSpecialPrimes.size} prime(s)</p>
                      </div>
                      <span className="text-2xl font-bold text-orange-300">{specialPrimesAmount}€</span>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl border-2 border-green-400/50 shadow-xl">
                  <div className="text-center">
                    <p className="text-green-300/70 text-sm mb-1">TOTAL MENSUEL ESTIMÉ</p>
                    <p className="text-5xl font-bold text-green-300">{totalMonthly.toLocaleString('fr-FR')}€</p>
                    <p className="text-slate-400 text-sm mt-2">Soit environ <strong className="text-green-300">{(totalMonthly * 12).toLocaleString('fr-FR')}€</strong> par an</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={resetCalculator}
                    className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all"
                  >
                    Recommencer
                  </button>
                  {onClose && (
                    <button
                      onClick={onClose}
                      className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-all"
                    >
                      Terminer
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-500 text-center mt-4">
                  ⚠️ Ce calcul est indicatif. Pour une estimation précise, contactez le service RH.
                </p>
              </div>
            )}
          </div>

          {/* Boutons de navigation */}
          {currentStep < 6 && (
            <div className="flex justify-between mt-6 gap-4">
              <button
                onClick={goPrev}
                disabled={!canGoPrev()}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
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
                disabled={!canGoNext()}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  canGoNext()
                    ? `bg-gradient-to-r ${stepColor.bg} hover:opacity-90 text-white shadow-lg`
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                {currentStep === 5 ? 'Voir le résultat' : 'Suivant'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Skip pour les étapes optionnelles */}
          {(currentStep === 3 || currentStep === 4 || currentStep === 5) && (
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
