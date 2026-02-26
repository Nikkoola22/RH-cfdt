import { useState, useMemo, useEffect } from 'react'
import { ChevronRight, CheckCircle2, AlertCircle, TrendingUp, ArrowLeft } from 'lucide-react'
import { 
  ifse1Data, 
  getDirectionFullName, 
  getAllDirections, 
  getIFSE2ByDirection, 
  getServicesByDirection,
} from '../data/rifseep-data'

interface CalculateurPrimesProps {
  onClose?: () => void
}

export default function CalculateurPrimes({ onClose }: CalculateurPrimesProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedFunctionIndex, setSelectedFunctionIndex] = useState<number | null>(null)
  // const [selectedJob, setSelectedJob] = useState('') // Kept for future advanced filtering
  const [selectedDirection, setSelectedDirection] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [selectedJob, setSelectedJob] = useState('')
  const [selectedIFSE2, setSelectedIFSE2] = useState<Set<number>>(new Set())
  const [selectedSpecialPrimes, setSelectedSpecialPrimes] = useState<Set<number>>(new Set())
  const [weekendSaturdays, setWeekendSaturdays] = useState(0)
  const [weekendSundays, setWeekendSundays] = useState(0)
  const [weekendRateSat, setWeekendRateSat] = useState(40)
  const [weekendRateSun, setWeekendRateSun] = useState(40)

  // Get all unique jobs from IFSE2 data, sorted
  // Note: allJobs kept for future use in advanced filtering

  // Note: matchedJobDirections kept for future use in advanced filtering
  // const matchedJobDirections = useMemo(() => {
  //   if (!selectedJob) return []
  //   const matches: string[] = []
  //   ifse2Data.forEach(item => {
  //     if (item.jobs?.some(j => j.toLowerCase().includes(selectedJob.toLowerCase()))) {
  //       if (!matches.includes(item.direction)) {
  //         matches.push(item.direction)
  //       }
  //     }
  //   })
  //   return matches
  // }, [selectedJob])

  // Get jobs for selected direction only

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

  const ifse3SatTotal = weekendSaturdays * weekendRateSat
  const ifse3SunTotal = weekendSundays * weekendRateSun
  const ifse3Total = ifse3SatTotal + ifse3SunTotal

  const specialPrimesData = useMemo(() => [
    150,    // Prime intérim
    75,     // Prime technicité
    98.46,  // Prime Maître apprentissage
    40,     // Prime Référent financier suppléant
    40,     // Prime ODEC Partiel
  ], [])

  const specialPrimesAmount = useMemo(() => {
    if (selectedSpecialPrimes.size === 0) return 0
    return Array.from(selectedSpecialPrimes).reduce((sum, idx) => {
      return sum + (specialPrimesData[idx] || 0)
    }, 0)
  }, [selectedSpecialPrimes, specialPrimesData])

  const totalMonthly = Math.round((ifse1Amount + ifse2Amount + ifse3Total + specialPrimesAmount) * 100) / 100

  // Note: Commented out for future enhancement of UI
  // const stepDescriptions = [
  //   { num: 1, label: 'Catégorie', desc: 'Votre grille indiciaire' },
  //   { num: 2, label: 'Fonction', desc: 'IFSE 1 - Prime de base' },
  //   { num: 3, label: 'Primes sujétion', desc: 'IFSE 2 - Services' },
  //   { num: 4, label: 'Primes week-end', desc: 'IFSE 3 - Samedis/Dimanches' },
  //   { num: 5, label: 'Résultat', desc: 'Total mensuel' },
  // ]

  // Note: Commented out for future enhancement
  // const isStepComplete = (step: number) => {
  //   if (step === 1) return selectedCategory !== ''
  //   if (step === 2) return selectedFunctionCode !== ''
  //   if (step === 3) return selectedDirection !== ''
  //   if (step === 4) return true
  //   if (step === 5) return true
  //   return false
  // }

    // Note: Commented out for future enhancement
  // const handleJobChange = (value: string) => {
  //   setSelectedJob(value)
  // }

  const handleDirectionSelect = (dir: string) => {
    setSelectedDirection(dir)
    setSelectedIFSE2(new Set())
    setSelectedJob('')
    setSelectedService('')
  }

  const handleServiceSelect = (service: string) => {
    setSelectedService(service)
    // Réinitialiser les primes sélectionnées lors du changement de service
    setSelectedIFSE2(new Set())
    setSelectedJob('')
  }

  const handleJobSelect = (job: string) => {
    setSelectedJob(job)
    if (!job) return
    
    // Récupérer tous les primes associés à ce métier dans cette direction ET ce service
    const directionPrimes = getIFSE2ByDirection(selectedDirection)
    const jobPrimes = directionPrimes.filter(p => p.jobs?.includes(job) && (!selectedService || p.service === selectedService || p.service === 'Tous services'))
    
    // Pré-sélectionner les primes associées
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

  // Auto-advance to next step when current step is complete
  useEffect(() => {
    if (currentStep === 1 && selectedCategory) {
      setTimeout(() => setCurrentStep(2), 300)
    }
  }, [selectedCategory, currentStep])

  useEffect(() => {
    if (currentStep === 2 && selectedFunctionIndex !== null) {
      setTimeout(() => setCurrentStep(3), 300)
    }
  }, [selectedFunctionIndex, currentStep])

  useEffect(() => {
    if (currentStep === 3 && selectedDirection) {
      setTimeout(() => setCurrentStep(4), 300)
    }
  }, [selectedDirection, currentStep])




  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 flex flex-col">
      {/* Header avec bouton retour - Style unifié dark */}
      <div className="bg-gradient-to-r from-slate-800/95 to-cyan-900/95 backdrop-blur-md py-6 border-b border-cyan-500/30 shadow-xl">
        <div className="px-6 flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-cyan-500/80 to-blue-500/80 rounded-2xl shadow-2xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-light text-white">Calculateur PRIMES</h1>
              <p className="text-cyan-300/80 text-sm font-light mt-1">IFSE 1, IFSE 2, IFSE 3 et primes particulières</p>
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
        <div className="max-w-2xl mx-auto space-y-4">

        {/* ÉTAPE 1: CATÉGORIE */}
        <div className={`transition-all duration-500 transform ${!selectedCategory ? 'ring-2 ring-blue-400/50 shadow-lg shadow-blue-500/30 bg-blue-500/10' : ''} ${currentStep === 1 ? 'ring-2 ring-blue-400/50 shadow-lg shadow-blue-500/20 scale-100' : 'opacity-95 hover:opacity-100'} bg-gradient-to-br from-indigo-950/70 via-slate-800/50 to-indigo-900/40 rounded-xl p-6 border border-indigo-700/30 hover:border-blue-400/30 backdrop-blur-sm`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-lg ${!selectedCategory ? 'animate-pulse' : ''} ${currentStep === 1 ? 'animate-pulse' : ''}`}>
              1
            </div>
            <div>
              <h4 className={`text-lg font-bold tracking-tight ${!selectedCategory ? 'text-blue-300 font-bold' : 'text-white'}`}>{!selectedCategory ? '👉 ' : ''}Catégorie d'emploi</h4>
              <p className="text-xs text-slate-400">Sélectionnez votre grille indiciaire (A, B ou C)</p>
            </div>
          </div>
          {selectedCategory && <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />}
        </div>

        <div className="max-w-md mx-auto">
          <label className="text-xs text-slate-400 mb-2 block font-medium uppercase tracking-wide">Choisir une catégorie:</label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value)
              if (e.target.value) {
                setCurrentStep(2)
              }
            }}
            className="w-full px-4 py-3 bg-gradient-to-r from-indigo-900/40 to-slate-800/40 border border-indigo-600/30 rounded-lg text-white text-base focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 outline-none transition-all duration-300 hover:border-indigo-500/50 shadow-md hover:shadow-lg hover:shadow-blue-500/10"
          >
            <option value="">-- Sélectionnez une catégorie --</option>
            {['A', 'B', 'C'].map(cat => (
              <option key={cat} value={cat}>
                Catégorie {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCategory && selectedFunctionIndex === null && (
        <div className="flex justify-center py-4 animate-bounce">
          <div className="text-blue-400 text-6xl">↓</div>
        </div>
      )}

      {/* ÉTAPE 2: FONCTION (IFSE 1) */}
      {selectedCategory && (
        <div className={`transition-all duration-500 transform ${selectedFunctionIndex === null ? 'ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/30 bg-cyan-500/10' : ''} ${currentStep === 2 ? 'ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/20 scale-100' : 'opacity-95 hover:opacity-100'} bg-gradient-to-br from-indigo-950/70 via-slate-800/50 to-indigo-900/40 rounded-xl p-6 border border-indigo-700/30 hover:border-cyan-400/30 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-lg ${selectedFunctionIndex === null ? 'animate-pulse' : ''} ${currentStep === 2 ? 'animate-pulse' : ''}`}>
                2
              </div>
              <div>
                <h4 className={`text-lg font-bold tracking-tight ${selectedFunctionIndex === null ? 'text-cyan-300 font-bold' : 'text-white'}`}>{selectedFunctionIndex === null ? '👉 ' : ''}Fonction & IFSE 1</h4>
                <p className="text-xs text-slate-400">Prime de base selon votre poste</p>
              </div>
            </div>
            {selectedFunctionIndex !== null && <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />}
          </div>

          <div className="max-w-md mx-auto">
            <label className="text-xs text-slate-400 mb-2 block font-medium uppercase tracking-wide">Choisir une fonction:</label>
            <select
              value={selectedFunctionIndex ?? ''}
              onChange={(e) => {
                const val = e.target.value
                setSelectedFunctionIndex(val ? Number(val) : null)
                if (val) {
                  setCurrentStep(3)
                }
              }}
              className="w-full px-4 py-3 bg-gradient-to-r from-indigo-900/40 to-slate-800/40 border border-indigo-600/30 rounded-lg text-white text-base focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 outline-none transition-all duration-300 hover:border-indigo-500/50 shadow-md hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <option value="">-- Sélectionnez une fonction --</option>
              {ifse1Data
                .map((item, globalIdx) => ({ item, globalIdx }))
                .filter(({ item }) => item.category === selectedCategory)
                .map(({ item, globalIdx }) => (
                  <option key={`${selectedCategory}-${globalIdx}`} value={globalIdx}>
                    {item.function} - {item.monthlyAmount}€/mois
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}

      {selectedFunctionIndex !== null && !selectedDirection && (
        <div className="flex justify-center py-4 animate-bounce">
          <div className="text-cyan-400 text-6xl">↓</div>
        </div>
      )}

      {/* ÉTAPE 3: PRIMES COMPLÉMENTAIRES (IFSE 2 & 3) */}
      {selectedFunctionIndex !== null && (
        <div className={`transition-all duration-300 ${currentStep === 3 ? 'ring-2 ring-teal-400/50' : ''} bg-gradient-to-br from-indigo-950/60 to-indigo-900/30 rounded-xl p-6 border border-indigo-700/30 hover:border-indigo-600/50`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center text-white font-bold text-sm">
                3
              </div>
              <div>
                <h4 className="text-lg font-bold text-white tracking-tight">Primes complémentaires</h4>
                <p className="text-xs text-slate-400">IFSE 2 - Services et sujétions</p>
              </div>
            </div>
            {(selectedDirection || ifse3Total > 0) && <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />}
          </div>

          {/* IFSE 2 */}
          <div className="mb-6 space-y-4 p-4 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 rounded-lg border border-teal-500/20">
            <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2 uppercase tracking-wide">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              IFSE 2 — Primes de sujétion
            </h5>

            {/* Étape 1: Direction */}
            <div className={`max-w-sm mx-auto w-full transform transition-all duration-300 hover:scale-102 p-3 rounded-lg ${!selectedDirection ? 'ring-2 ring-teal-400/50 bg-teal-500/10 shadow-lg shadow-teal-500/20' : ''}`}>
              <label className={`text-xs mb-2 block font-medium uppercase tracking-wide transition-all duration-300 ${!selectedDirection ? 'text-teal-300 font-bold' : 'text-slate-300'}`}>
                {!selectedDirection && '👉 '} Étape 1 - Direction:
              </label>
              <select
                value={selectedDirection}
                onChange={(e) => handleDirectionSelect(e.target.value)}
                className={`w-full px-4 py-3 bg-slate-700/50 border rounded-lg text-white text-base outline-none transition-all duration-300 hover:border-slate-500/50 shadow-md hover:shadow-lg ${
                  !selectedDirection 
                    ? 'border-teal-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/40 ring-2 ring-teal-400/50 hover:shadow-lg hover:shadow-teal-500/20' 
                    : 'border-slate-600/30 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30 hover:shadow-teal-500/10'
                }`}
              >
                <option value="">-- Choisir une direction --</option>
                {getAllDirections().map(dir => (
                  <option key={dir} value={dir}>
                    {getDirectionFullName(dir)} ({dir})
                  </option>
                ))}
              </select>
            </div>

            {/* Flèche vers étape 2 */}
            {selectedDirection && !selectedService && (
              <div className="flex justify-center py-4 animate-bounce">
                <div className="text-teal-400 text-6xl">↓</div>
              </div>
            )}

            {/* Étape 2: Service */}
            {selectedDirection && (
              <div className={`max-w-sm mx-auto w-full transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 p-3 rounded-lg ${!selectedService ? 'ring-2 ring-cyan-400/50 bg-cyan-500/10 shadow-lg shadow-cyan-500/20' : ''}`}>
                <label className={`text-xs mb-2 block font-medium uppercase tracking-wide transition-all duration-300 ${!selectedService ? 'text-cyan-300 font-bold' : 'text-slate-300'}`}>
                  {!selectedService && '👉 '} Étape 2 - Service:
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => handleServiceSelect(e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-700/50 border rounded-lg text-white text-base outline-none transition-all duration-300 hover:border-slate-500/50 shadow-md hover:shadow-lg ${
                    !selectedService && selectedDirection
                      ? 'border-cyan-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/40 ring-2 ring-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20' 
                      : 'border-slate-600/30 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30 hover:shadow-teal-500/10'
                  }`}
                >
                  <option value="">-- Tous les services --</option>
                  {getServicesByDirection(selectedDirection).map(service => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Flèche vers étape 3 */}
            {selectedDirection && selectedService && !selectedJob && (
              <div className="flex justify-center py-4 animate-bounce">
                <div className="text-blue-400 text-6xl">↓</div>
              </div>
            )}

            {/* Étape 3: Métier */}
            {selectedDirection && (
              <div className={`max-w-sm mx-auto w-full p-4 rounded-lg transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 shadow-lg ${
                !selectedJob
                  ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-400/60 shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/50'
                  : 'bg-gradient-to-br from-blue-500/15 to-cyan-500/15 border border-blue-500/40 shadow-blue-500/10'
              }`}>
                <h6 className={`text-sm font-semibold mb-3 flex items-center gap-2 uppercase tracking-wide transition-all duration-300 ${
                  !selectedJob ? 'text-blue-200 font-bold' : 'text-blue-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${!selectedJob ? 'animate-pulse bg-blue-300' : 'animate-pulse bg-blue-400'}`} />
                  {!selectedJob && '👉 '} Étape 3 - Métier
                </h6>
                <p className="text-xs text-slate-300 mb-3 italic font-medium">
                  Si vous ne trouvez pas votre metiers merci de nous appeler
                </p>
                
                <label className={`text-xs mb-2 block font-medium uppercase tracking-wide transition-all duration-300 ${
                  !selectedJob ? 'text-blue-300 font-bold' : 'text-slate-300'
                }`}>Choisir un métier:</label>
                <select
                  value={selectedJob}
                  onChange={(e) => handleJobSelect(e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-700/50 border rounded-lg text-white text-base outline-none transition-all duration-300 hover:border-slate-500/50 shadow-md hover:shadow-lg ${
                    !selectedJob
                      ? 'border-blue-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/40 ring-2 ring-blue-400/50 hover:shadow-lg hover:shadow-blue-500/20'
                      : 'border-slate-600/30 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 hover:shadow-blue-500/10'
                  }`}
                >
                  <option value="">-- Sélectionnez un métier --</option>
                  {getIFSE2ByDirection(selectedDirection)
                    .filter(p => (!selectedService || p.service === selectedService || p.service === 'Tous services' || p.direction === 'Toutes dir°' || p.direction === 'Toutes directions') && p.jobs && p.jobs.length > 0 && p.jobs[0] !== '')
                    .flatMap(p => p.jobs || [])
                    .filter((job, idx, arr) => arr.indexOf(job) === idx && job !== '')
                    .sort()
                    .map((job, idx) => (
                      <option key={idx} value={job}>
                        {job}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Primes - Affichées seulement après sélection d'un métier */}
            {selectedJob && selectedDirection && (
              <div className="max-w-sm mx-auto w-full space-y-2 max-h-48 overflow-y-auto">
                {getIFSE2ByDirection(selectedDirection)
                  .filter(prime => (selectedService ? prime.service === selectedService : true) && prime.jobs && prime.jobs.length > 0 && prime.jobs[0] !== '' && prime.jobs.some(job => job === selectedJob))
                  .map((prime, idx) => {
                    // Calculer l'index réel dans la liste complète pour la sélection
                    const allPrimes = getIFSE2ByDirection(selectedDirection)
                    const realIdx = allPrimes.findIndex(p => p === prime)
                    return (
                      <button
                        key={idx}
                        onClick={() => handleToggleIFSE2(realIdx)}
                        className={`w-full p-3 rounded-lg text-left transition-all border ${
                          selectedIFSE2.has(realIdx)
                            ? 'bg-teal-500/30 border-teal-400/60 shadow-md'
                            : 'bg-slate-700/30 border-slate-600/20 hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center transition ${
                            selectedIFSE2.has(realIdx)
                              ? 'bg-green-500 border-green-400'
                              : 'border-slate-500'
                          }`}>
                            {selectedIFSE2.has(realIdx) && <span className="text-white text-xs">✓</span>}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-200">{prime.motif}</p>
                            <p className="text-xs text-slate-400 mt-0.5">Service: {prime.service || 'Tous'}</p>
                            {prime.jobs && prime.jobs.length > 0 && (
                              <p className="text-xs text-slate-400">Métier(s): {prime.jobs.slice(0, 2).join(', ')}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-400">{prime.amount}€</p>
                            <p className="text-xs text-slate-500">/mois</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
              </div>
            )}

            {!selectedJob && selectedDirection && (
              <div className="max-w-sm mx-auto w-full p-3 bg-gradient-to-r from-indigo-900/30 to-slate-800/30 border border-indigo-600/30 rounded-lg text-center">
                <p className="text-xs text-slate-400">Sélectionnez un métier pour afficher les primes</p>
              </div>
            )}

            {ifse2Amount > 0 && (
              <div className="max-w-sm mx-auto w-full p-2 bg-teal-500/10 border border-teal-500/30 rounded text-sm text-teal-200">
                Primes sélectionnées: <span className="font-bold">{ifse2Amount}€/mois</span>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedFunctionIndex !== null && selectedJob && (weekendSaturdays === 0 && weekendSundays === 0) && (
        <div className="flex justify-center py-4 animate-bounce">
          <div className="text-purple-400 text-6xl">↓</div>
        </div>
      )}

      {/* ÉTAPE 4: PRIMES WEEK-END (IFSE 3) */}
      {selectedFunctionIndex !== null && (
        <div className={`transition-all duration-300 ${(weekendSaturdays === 0 && weekendSundays === 0) ? 'ring-2 ring-purple-400/50 shadow-lg shadow-purple-500/30 bg-purple-500/10' : ''} ${currentStep === 4 ? 'ring-2 ring-purple-400/50 shadow-lg shadow-purple-500/20' : ''} bg-gradient-to-br from-indigo-950/60 to-indigo-900/30 rounded-xl p-6 border border-indigo-700/30 hover:border-indigo-600/50`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg ${(weekendSaturdays === 0 && weekendSundays === 0) ? 'animate-pulse' : ''} ${currentStep === 4 ? 'animate-pulse' : ''}`}>
                4
              </div>
              <div>
                <h4 className={`text-lg font-bold tracking-tight ${(weekendSaturdays === 0 && weekendSundays === 0) ? 'text-purple-300 font-bold' : 'text-white'}`}>{(weekendSaturdays === 0 && weekendSundays === 0) ? '👉 ' : ''}Primes week-end</h4>
                <p className="text-xs text-slate-400">IFSE 3 - Samedis et dimanches travaillés</p>
              </div>
            </div>
            {(weekendSaturdays > 0 || weekendSundays > 0) && <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 transform transition-all duration-300">
            <div className="transform transition-all duration-300 hover:scale-102">
              <label className="text-xs text-slate-300 mb-2 block font-medium uppercase tracking-wide">Samedis travaillés par mois</label>
              <select
                value={weekendSaturdays}
                onChange={(e) => setWeekendSaturdays(Number(e.target.value))}
                className="w-full px-4 py-3 bg-gradient-to-r from-indigo-900/40 to-slate-800/40 border border-indigo-600/30 rounded-lg text-white text-base focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 outline-none transition-all duration-300 hover:border-indigo-500/50 shadow-md hover:shadow-lg hover:shadow-purple-500/10"
              >
                {[0, 1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>
                    {n} samedi{n !== 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="transform transition-all duration-300 hover:scale-102">
              <label className="text-xs text-slate-300 mb-2 block font-medium uppercase tracking-wide">Dimanches travaillés par mois</label>
              <select
                value={weekendSundays}
                onChange={(e) => setWeekendSundays(Number(e.target.value))}
                className="w-full px-4 py-3 bg-gradient-to-r from-indigo-900/40 to-slate-800/40 border border-indigo-600/30 rounded-lg text-white text-base focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 outline-none transition-all duration-300 hover:border-indigo-500/50 shadow-md hover:shadow-lg hover:shadow-purple-500/10"
              >
                {[0, 1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>
                    {n} dimanche{n !== 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {weekendSaturdays === 0 && weekendSundays === 0 && (
            <button
              onClick={() => setCurrentStep(5)}
              className="w-full p-4 mb-6 bg-gradient-to-r from-slate-700/50 to-slate-600/50 border-2 border-slate-500/50 hover:border-purple-400/50 hover:bg-purple-500/10 rounded-lg text-slate-300 hover:text-purple-300 font-medium uppercase tracking-wide transition-all duration-300 transform hover:scale-102"
            >
              ✓ Pas de primes week-end sélectionnées
            </button>
          )}

          {(weekendSaturdays > 0 || weekendSundays > 0) && (
            <>
              <div className="mb-6 pb-6 border-b border-slate-600/30 transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
                <h5 className="text-sm font-semibold text-slate-200 mb-4 uppercase tracking-wide">Sélectionnez les taux horaires</h5>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="transform transition-all duration-300 hover:scale-102">
                    <label className="text-xs text-slate-300 mb-2 block font-medium uppercase tracking-wide">Taux pour les samedis</label>
                    <select
                      value={weekendRateSat}
                      onChange={(e) => {
                        setWeekendRateSat(Number(e.target.value))
                        setCurrentStep(5)
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-indigo-900/40 to-slate-800/40 border border-indigo-600/30 rounded-lg text-white text-base focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 outline-none transition-all duration-300 hover:border-indigo-500/50 shadow-md hover:shadow-lg hover:shadow-purple-500/10"
                    >
                      <option value={40}>40€ par samedi - Jusqu'à 3h13 de travail</option>
                      <option value={60}>60€ par samedi - Entre 3h16 et 7h12 de travail</option>
                      <option value={80}>80€ par samedi - Plus de 7h12 de travail</option>
                    </select>
                  </div>

                  <div className="transform transition-all duration-300 hover:scale-102">
                    <label className="text-xs text-slate-300 mb-2 block font-medium uppercase tracking-wide">Taux pour les dimanches</label>
                    <select
                      value={weekendRateSun}
                      onChange={(e) => {
                        setWeekendRateSun(Number(e.target.value))
                        setCurrentStep(5)
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-indigo-900/40 to-slate-800/40 border border-indigo-600/30 rounded-lg text-white text-base focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 outline-none transition-all duration-300 hover:border-indigo-500/50 shadow-md hover:shadow-lg hover:shadow-purple-500/10"
                    >
                      <option value={40}>40€ par dimanche - Jusqu'à 3h13 de travail</option>
                      <option value={60}>60€ par dimanche - Entre 3h16 et 7h12 de travail</option>
                      <option value={80}>80€ par dimanche - Plus de 7h12 de travail</option>
                    </select>
                  </div>
                </div>
              </div>

              {ifse3Total > 0 && (
                <div className="p-4 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30 border border-purple-500/50 rounded-lg">
                  <p className="text-xs text-purple-200 mb-2">💰 Calcul IFSE 3</p>
                  <div className="space-y-1 text-sm">
                    {weekendSaturdays > 0 && (
                      <p className="text-slate-200">{weekendSaturdays} samedi(s) × {weekendRateSat}€ = <span className="font-bold text-purple-300">{ifse3SatTotal}€</span></p>
                    )}
                    {weekendSundays > 0 && (
                      <p className="text-slate-200">{weekendSundays} dimanche(s) × {weekendRateSun}€ = <span className="font-bold text-purple-300">{ifse3SunTotal}€</span></p>
                    )}
                    <div className="border-t border-purple-400/30 mt-2 pt-2">
                      <p className="text-purple-200 font-semibold">Total IFSE 3: <span className="text-lg">{ifse3Total}€/mois</span></p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {selectedFunctionIndex !== null && currentStep >= 5 && (selectedSpecialPrimes.size === 0) && (
        <div className="flex justify-center py-4 animate-bounce">
          <div className="text-orange-400 text-6xl">↓</div>
        </div>
      )}

      {/* ÉTAPE 5: PRIMES PARTICULIÈRES */}
      {selectedFunctionIndex !== null && (
        <div className={`transition-all duration-300 ${selectedSpecialPrimes.size === 0 ? 'ring-2 ring-orange-400/50 shadow-lg shadow-orange-500/30 bg-orange-500/10' : ''} ${currentStep === 5 ? 'ring-2 ring-orange-400/50 shadow-lg shadow-orange-500/20' : ''} bg-gradient-to-br from-indigo-950/60 to-indigo-900/30 rounded-xl p-6 border border-indigo-700/30 hover:border-indigo-600/50`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center text-white font-bold text-sm shadow-lg ${selectedSpecialPrimes.size === 0 ? 'animate-pulse' : ''} ${currentStep === 5 ? 'animate-pulse' : ''}`}>
                5
              </div>
              <div>
                <h4 className={`text-xl font-bold ${selectedSpecialPrimes.size === 0 ? 'text-orange-300 font-bold' : 'text-white'}`}>{selectedSpecialPrimes.size === 0 ? '👉 ' : ''}Primes particulières</h4>
                <p className="text-xs text-slate-400">Primes additionnelles non liées à un métier spécifique</p>
              </div>
            </div>
            {selectedSpecialPrimes.length > 0 && <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />}
          </div>

          <div className="max-w-sm mx-auto w-full space-y-2 max-h-48 overflow-y-auto">
            {[
              { motif: 'Prime intérim', montant: '150', description: 'Travail en intérim' },
              { motif: 'Prime technicité', montant: '75', description: 'Expertise technique' },
              { motif: 'Prime Maître apprentissage', montant: '98,46', description: 'Formation apprentis' },
              { motif: 'Prime Référent financier suppléant', montant: '40', description: 'Fonction référente' },
              { motif: 'Prime ODEC Partiel', montant: '40', description: 'Prime spécifique' },
            ].map((prime, idx) => (
              <button
                key={idx}
                onClick={() => handleToggleSpecialPrime(idx)}
                className={`w-full p-3 rounded-lg text-left transition-all border ${
                  selectedSpecialPrimes.has(idx)
                    ? 'bg-orange-500/30 border-orange-400/60 shadow-md'
                    : 'bg-slate-700/30 border-slate-600/20 hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded border-2 mt-0.5 flex items-center justify-center transition ${
                    selectedSpecialPrimes.has(idx)
                      ? 'bg-green-500 border-green-400'
                      : 'border-slate-500'
                  }`}>
                    {selectedSpecialPrimes.has(idx) && <span className="text-white text-xs">✓</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200">{prime.motif}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{prime.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-orange-400">{prime.montant}€</p>
                    <p className="text-xs text-slate-500">/mois</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {specialPrimesAmount > 0 && (
            <div className="max-w-sm mx-auto w-full mt-4 p-3 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/40 rounded-lg text-sm text-orange-200 font-semibold shadow-lg shadow-orange-500/10 transform transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
              ✓ Primes sélectionnées: <span className="font-bold text-orange-300">{specialPrimesAmount}€/mois</span>
            </div>
          )}
        </div>
      )}

      {selectedFunctionIndex !== null && selectedSpecialPrimes.size > 0 && (
        <div className="flex justify-center py-4 animate-bounce">
          <div className="text-green-400 text-6xl">↓</div>
        </div>
      )}

      {/* ÉTAPE 6: RÉSULTAT FINAL */}
      {selectedFunctionIndex !== null && (
        <div className={`transition-all duration-500 transform ${selectedSpecialPrimes.size === 0 ? 'ring-2 ring-green-400/50 shadow-xl shadow-green-500/30 bg-green-500/10' : ''} ${currentStep === 6 ? 'ring-2 ring-green-400/50 shadow-xl shadow-green-500/20 scale-100' : 'opacity-95'} bg-gradient-to-br from-emerald-950/50 via-teal-900/40 to-cyan-900/30 rounded-xl p-6 border border-emerald-600/30 shadow-lg backdrop-blur-sm animate-in fade-in duration-500`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-lg ${selectedSpecialPrimes.size === 0 ? 'animate-pulse' : ''} ${currentStep === 6 ? 'animate-pulse' : ''}`}>
                6
              </div>
              <div>
                <h4 className={`text-lg font-bold tracking-tight ${selectedSpecialPrimes.size === 0 ? 'text-green-300 font-bold' : 'text-white'}`}>{selectedSpecialPrimes.size === 0 ? '👉 ' : ''}Résumé total</h4>
                <p className="text-xs text-slate-200">Somme de toutes vos primes</p>
              </div>
            </div>
            <ChevronRight className={`w-6 h-6 text-emerald-400 transition-all duration-300 ${currentStep === 6 ? 'animate-bounce' : ''}`} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-500/30 border border-blue-500/50 rounded-lg p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer">
              <p className="text-xs text-slate-300 mb-1 font-semibold uppercase tracking-wide">IFSE 1</p>
              <p className="text-3xl font-bold text-blue-300">{ifse1Amount}€</p>
              <p className="text-xs text-slate-400 mt-1">Prime de fonction</p>
            </div>

            <div className="bg-teal-500/30 border border-teal-500/50 rounded-lg p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-teal-500/20 cursor-pointer">
              <p className="text-xs text-slate-300 mb-1 font-semibold uppercase tracking-wide">IFSE 2</p>
              <p className="text-3xl font-bold text-teal-300">{ifse2Amount}€</p>
              <p className="text-xs text-slate-400 mt-1">Primes sélectionnées</p>
            </div>

            <div className="bg-purple-500/30 border border-purple-500/50 rounded-lg p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 cursor-pointer">
              <p className="text-xs text-slate-300 mb-1 font-semibold uppercase tracking-wide">IFSE 3</p>
              <p className="text-3xl font-bold text-purple-300">{ifse3Total}€</p>
              <p className="text-xs text-slate-400 mt-1">Primes week-end</p>
            </div>

            <div className="bg-orange-500/30 border border-orange-500/50 rounded-lg p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20 cursor-pointer">
              <p className="text-xs text-slate-300 mb-1 font-semibold uppercase tracking-wide">Spéciales</p>
              <p className="text-3xl font-bold text-orange-300">{specialPrimesAmount}€</p>
              <p className="text-xs text-slate-400 mt-1">Primes particulières</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500/30 via-emerald-500/30 to-teal-500/30 border border-green-500/60 rounded-lg p-6 shadow-lg">
            <p className="text-sm text-slate-300 mb-2 font-medium">Revenu mensuel additionnel</p>
            <p className="text-5xl font-bold text-green-300">{totalMonthly.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€</p>
            <p className="text-sm text-slate-300 mt-3 font-light">
              Soit <span className="font-bold text-green-200">{(totalMonthly * 12).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€</span> par an
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedCategory('')
              setSelectedFunctionIndex(null)
              setSelectedDirection('')
              setSelectedService('')
              setSelectedJob('')
              setSelectedIFSE2(new Set())
              setWeekendSaturdays(0)
              setWeekendSundays(0)
              setWeekendRateSat(40)
              setWeekendRateSun(40)
              setSelectedSpecialPrimes(new Set())
              setCurrentStep(1)
            }}
            className="w-full mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 border border-red-500/50 rounded-lg text-white font-semibold uppercase tracking-wide transition-all duration-300 transform hover:scale-102 shadow-lg hover:shadow-xl"
          >
            ← Retour au menu
          </button>

          <div className="mt-4 p-3 bg-gradient-to-r from-indigo-900/30 to-slate-800/30 border border-indigo-600/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-400">
              ℹ️ Ces montants sont calculés selon vos sélections. Consultez la RH pour confirmation avant demande de régularisation.
            </p>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  )
}
