import React, { useMemo, useState } from 'react';
import { faqData, FAQItem } from '../data/FAQdata';
import { Search, ChevronDown, ChevronUp, Tag, ArrowLeft } from 'lucide-react';

interface Props {
  onBack?: () => void;
}

const categories = Array.from(new Set(faqData.map((f) => f.category)));

const CATEGORY_STYLES: Record<string, { btnActive: string; btnInactive: string; badge: string; border: string; icon: string }> = {
  'temps-travail': {
    btnActive: 'bg-orange-600 text-white',
    btnInactive: 'bg-white text-orange-700 shadow-sm',
    badge: 'bg-orange-50 text-orange-700',
    border: 'border-orange-400',
    icon: 'text-orange-500'
  },
  formation: {
    btnActive: 'bg-purple-600 text-white',
    btnInactive: 'bg-white text-purple-700 shadow-sm',
    badge: 'bg-purple-50 text-purple-700',
    border: 'border-purple-400',
    icon: 'text-purple-500'
  },
  conges: {
    btnActive: 'bg-green-600 text-white',
    btnInactive: 'bg-white text-green-700 shadow-sm',
    badge: 'bg-green-50 text-green-700',
    border: 'border-green-400',
    icon: 'text-green-500'
  },
  absences: {
    btnActive: 'bg-red-600 text-white',
    btnInactive: 'bg-white text-red-700 shadow-sm',
    badge: 'bg-red-50 text-red-700',
    border: 'border-red-400',
    icon: 'text-red-500'
  },
  general: {
    btnActive: 'bg-slate-600 text-white',
    btnInactive: 'bg-white text-slate-700 shadow-sm',
    badge: 'bg-slate-50 text-slate-700',
    border: 'border-slate-400',
    icon: 'text-slate-500'
  }
};

const FAQ: React.FC<Props> = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<Record<number, boolean>>({});

  const highlightText = (text: string, q: string) => {
    if (!q) return text;
    try {
      const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")})`, 'ig'));
      return parts.map((part, i) =>
        part.toLowerCase() === q.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      );
    } catch (e) {
      return text;
    }
  };

  // Render simple inline markdown (**bold**) + preserve highlights
  const formatInline = (text: string, q: string) => {
    // Split by **bold** markers
    const parts: Array<{ bold: boolean; text: string }> = [];
    const regex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      if (m.index > lastIndex) {
        parts.push({ bold: false, text: text.slice(lastIndex, m.index) });
      }
      parts.push({ bold: true, text: m[1] });
      lastIndex = m.index + m[0].length;
    }
    if (lastIndex < text.length) parts.push({ bold: false, text: text.slice(lastIndex) });

    // Map to React nodes applying highlight inside each segment
    return parts.map((p, i) => {
      const highlighted = highlightText(p.text, q);
      return p.bold ? (
        <strong key={i} className="font-semibold">{highlighted}</strong>
      ) : (
        <span key={i}>{highlighted}</span>
      );
    });
  };

  // Format answer text into paragraphs and simple bullet lists, applying inline formatting
  const renderFormattedAnswer = (text: string, q: string) => {
    const lines = text.split(/\r?\n/);
    const nodes: React.ReactNode[] = [];
    let listBuffer: { indent: number; content: string }[] = [];

    const flushList = () => {
      if (!listBuffer.length) return;
      // group by indent (simple handling)
      const groups: Record<number, string[]> = {};
      listBuffer.forEach((l) => {
        (groups[l.indent] ||= []).push(l.content);
      });
      // render groups in order of indent (lowest first)
      Object.keys(groups)
        .sort((a, b) => Number(a) - Number(b))
        .forEach((indent) => {
          const items = groups[Number(indent)];
          nodes.push(
            <ul key={`ul-${nodes.length}`} className={Number(indent) > 0 ? 'ml-6 list-disc' : 'list-disc'}>
              {items.map((it, idx) => (
                <li key={idx} className="mb-1 text-sm text-gray-700">{formatInline(it.trim().replace(/^[-*]\s?/, ''), q)}</li>
              ))}
            </ul>
          );
        });
      listBuffer = [];
    };

    for (const line of lines) {
      if (!line.trim()) {
        flushList();
        nodes.push(<div key={`br-${nodes.length}`} className="my-2" />);
        continue;
      }

      const matchList = line.match(/^(\s*)[-*]\s+(.*)$/);
      if (matchList) {
        const indent = matchList[1].length;
        listBuffer.push({ indent, content: matchList[0] });
        continue;
      }

      // normal paragraph
      flushList();
      nodes.push(
        <p key={`p-${nodes.length}`} className="text-sm text-gray-700 mb-2">
          {formatInline(line, q)}
        </p>
      );
    }

    flushList();
    return <div className="prose prose-sm max-w-full">{nodes}</div>;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqData.filter((item) => {
      if (activeCategory && item.category !== activeCategory) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
      );
    });
  }, [query, activeCategory]);

  const toggle = (id: number) => setOpenIds((s) => ({ ...s, [id]: !s[id] }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">FAQ</h1>
              <p className="mt-2 text-base sm:text-lg text-gray-600">Questions fréquentes — guide rapide pour les agents</p>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                aria-label="Retour"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4 animate-slide-up">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000" />
            <div className="relative bg-white rounded-2xl p-1">
              <div className="flex items-center bg-white px-4 py-3 rounded-xl shadow-lg">
                <Search className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher une question ou un mot-clé..."
                  className="w-full bg-transparent outline-none text-base text-gray-800 placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-2 p-4 bg-white rounded-2xl shadow-lg">
            <span className="text-sm font-semibold text-gray-700">Filtrer par:</span>
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 transform ${activeCategory === null ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              ✓ Tous
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory((c) => (c === cat ? null : cat))}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 transform flex items-center gap-2 ${
                  activeCategory === cat 
                    ? `${CATEGORY_STYLES[cat].btnActive} shadow-lg scale-105` 
                    : `${CATEGORY_STYLES[cat].btnInactive} hover:shadow-md`
                }`}
              >
                <Tag className="w-4 h-4" />
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <div className="text-gray-400 text-lg">🔍 Aucun résultat trouvé</div>
              <p className="text-gray-500 text-sm mt-2">pour "{query}"</p>
            </div>
          )}

          {filtered.map((item: FAQItem, index: number) => (
            <article 
              key={item.id} 
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <button
                onClick={() => toggle(item.id)}
                className={`w-full text-left transition-all duration-300 transform rounded-xl overflow-hidden border-l-4 ${CATEGORY_STYLES[item.category].border}`}
              >
                <div className={`bg-white shadow-md hover:shadow-xl p-5 sm:p-6 transform transition-all duration-300 ${openIds[item.id] ? 'ring-2 ring-blue-300/50' : 'hover:scale-[1.01]'}`}>
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Category Badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${CATEGORY_STYLES[item.category].badge}`}>
                          {item.category}
                        </span>
                      </div>
                      
                      {/* Question */}
                      <h3 className={`text-lg sm:text-xl font-bold transition-colors duration-200 ${openIds[item.id] ? 'text-blue-700' : 'text-gray-800'}`}>
                        {highlightText(item.question, query)}
                      </h3>
                    </div>

                    {/* Chevron Icon */}
                    <div className={`flex-shrink-0 p-2 rounded-full transition-all duration-300 ${openIds[item.id] ? `${CATEGORY_STYLES[item.category].btnActive} text-white shadow-lg` : 'bg-gray-100 text-gray-500'}`}>
                      {openIds[item.id] ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {/* Answer - Collapsible */}
                  <div className={`overflow-hidden transition-all duration-300 ${openIds[item.id] ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <div className="pt-4 border-t border-gray-200">
                      <div className="prose prose-sm max-w-none text-gray-700">
                        {renderFormattedAnswer(item.answer, query)}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </article>
          ))}
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
            animation: fade-in 0.6s ease-out forwards;
            opacity: 0;
          }
          .animate-slide-up {
            animation: slide-up 0.5s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
};

export default FAQ;
