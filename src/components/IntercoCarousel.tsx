import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Rss, ExternalLink } from 'lucide-react'

interface IntercoArticle {
  title: string
  link: string
  pubDate: string
  category?: string
  description?: string
}

export default function IntercoCarousel() {
  const [articles, setArticles] = useState<IntercoArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  useEffect(() => {
    const fetchIntercoArticles = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/interco-rss')
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des actualités')
        }

        const data = await response.json()
        setArticles(data.items || [])
        setError(null)
      } catch (err) {
        console.error('Erreur Interco Carousel:', err)
        setError('Impossible de charger les actualités')
        setArticles([])
      } finally {
        setLoading(false)
      }
    }

    fetchIntercoArticles()

    // Rafraîchir toutes les 15 minutes
    const interval = setInterval(fetchIntercoArticles, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return

    const scrollAmount = 400
    const newScrollPosition =
      scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount)

    scrollContainerRef.current.scrollTo({
      left: newScrollPosition,
      behavior: 'smooth'
    })
  }

  const handleScroll = () => {
    if (!scrollContainerRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      // Vérifier l'état initial
      handleScroll()
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [articles])

  if (loading) {
    return (
      <div className="w-full bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-xl p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Rss className="w-8 h-8 text-indigo-400" />
          </div>
          <p className="text-slate-300">Chargement des actualités...</p>
        </div>
      </div>
    )
  }

  if (error || articles.length === 0) {
    return (
      <div className="w-full bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-xl p-8 text-center">
        <p className="text-slate-400">{error || 'Aucune actualité disponible'}</p>
      </div>
    )
  }

  return (
    <section className="w-full mt-12 mb-8">
      <div className="max-w-6xl mx-auto px-2 sm:px-4">
        {/* Titre */}
        <div className="flex items-center gap-3 mb-6">
          <Rss className="w-6 h-6 text-indigo-400 animate-pulse" />
          <h3 className="text-2xl sm:text-3xl font-light text-white">
            Actualités Interco CFDT
          </h3>
        </div>

        {/* Carrousel avec boutons de navigation */}
        <div className="relative">
          {/* Bouton gauche */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white p-2 rounded-full shadow-lg transition-all duration-150 hover:scale-110 -ml-4"
              aria-label="Défiler vers la gauche"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Conteneur de défilement */}
          <div
            ref={scrollContainerRef}
            className="interco-carousel-track flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2"
          >
            {articles.map((article, index) => (
              <a
                key={`${article.link}-${index}`}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group snap-start flex-shrink-0 w-full sm:w-96 h-80 rounded-xl bg-gradient-to-br from-slate-800/50 via-indigo-900/40 to-slate-800/50 border border-indigo-500/30 hover:border-indigo-400/60 overflow-hidden transition-all duration-200 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-2 backdrop-blur glass-card"
              >
                {/* Contenu */}
                <div className="p-6 h-full flex flex-col justify-between">
                  {/* Catégorie et date */}
                  <div className="flex items-start justify-between gap-3">
                    {article.category && (
                      <span className="inline-block px-3 py-1 bg-indigo-500/20 border border-indigo-400/50 rounded-full text-xs font-medium text-indigo-300 flex-shrink-0">
                        {article.category}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {new Date(article.pubDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Titre */}
                  <div>
                    <h4 className="text-lg font-semibold text-white leading-tight mb-3 line-clamp-3 group-hover:text-indigo-300 transition-colors">
                      {article.title}
                    </h4>
                  </div>

                  {/* Description et lien */}
                  <div className="space-y-4">
                    {article.description && (
                      <p className="text-sm text-slate-300 line-clamp-2">
                        {article.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-indigo-400 group-hover:text-indigo-300 transition-colors">
                      <span className="text-sm font-medium">Lire l'article</span>
                      <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>

                {/* Dégradé au survol */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-purple-500/0 opacity-0 group-hover:opacity-20 transition-opacity duration-200 pointer-events-none" />
              </a>
            ))}
          </div>

          {/* Bouton droit */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white p-2 rounded-full shadow-lg transition-all duration-150 hover:scale-110 -mr-4"
              aria-label="Défiler vers la droite"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Info */}
        <p className="text-center text-xs text-slate-500 mt-4">
          Actualités de <a href="https://interco.cfdt.fr/actualites/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors">interco.cfdt.fr</a>
        </p>
      </div>
    </section>
  )
}
