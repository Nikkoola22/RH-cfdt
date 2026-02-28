import React, { useState } from "react";
import { X, Settings, Users, FileText, Bell, Save, Trash2 } from "lucide-react";

interface AdminPanelProps {
  onClose: () => void;
}

interface NewsItem {
  id: number;
  title: string;
  content: string;
  active: boolean;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'news' | 'settings'>('news');
  const [newsItems, setNewsItems] = useState<NewsItem[]>([
    { id: 1, title: "Nouvelle convention collective", content: "La nouvelle convention a été signée...", active: true },
    { id: 2, title: "Assemblée générale", content: "L'AG aura lieu le 15 décembre...", active: true },
  ]);
  const [newNews, setNewNews] = useState({ title: "", content: "" });

  const handleAddNews = () => {
    if (newNews.title && newNews.content) {
      setNewsItems([
        ...newsItems,
        { id: Date.now(), title: newNews.title, content: newNews.content, active: true }
      ]);
      setNewNews({ title: "", content: "" });
    }
  };

  const handleDeleteNews = (id: number) => {
    setNewsItems(newsItems.filter(item => item.id !== id));
  };

  const handleToggleNews = (id: number) => {
    setNewsItems(newsItems.map(item => 
      item.id === id ? { ...item, active: !item.active } : item
    ));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col glass-card-light">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 relative flex-shrink-0 glass-banner">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors glass-pill"
          >
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Settings className="w-7 h-7" />
            Panneau d'Administration
          </h2>
          <p className="text-purple-100 text-sm mt-1">
            Gérez le contenu de l'application CFDT
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => setActiveTab('news')}
            className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'news'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Bell className="w-5 h-5" />
            Actualités
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'settings'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-5 h-5" />
            Paramètres
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'news' && (
            <div className="space-y-6">
              {/* Add News Form */}
              <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-300 glass-card-light">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Ajouter une actualité
                </h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newNews.title}
                    onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                    placeholder="Titre de l'actualité"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <textarea
                    value={newNews.content}
                    onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
                    placeholder="Contenu de l'actualité"
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                  <button
                    onClick={handleAddNews}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-lg hover:shadow-xl flex items-center gap-2 btn-cta"
                  >
                    <Save className="w-4 h-4" />
                    Publier
                  </button>
                </div>
              </div>

              {/* News List */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-600" />
                  Actualités existantes ({newsItems.length})
                </h3>
                {newsItems.map(item => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border-2 transition-all glass-card-light ${
                      item.active ? 'bg-white border-purple-200' : 'bg-gray-100 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{item.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{item.content}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleNews(item.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            item.active
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          {item.active ? 'Actif' : 'Inactif'}
                        </button>
                        <button
                          onClick={() => handleDeleteNews(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6 glass-card-light">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Informations de l'application
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <p><strong>Version :</strong> 2.0.0</p>
                  <p><strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}</p>
                  <p><strong>Environnement :</strong> Production</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 glass-card-light">
                <strong>💡 Note :</strong> Les paramètres avancés seront disponibles dans une prochaine version.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition-all text-sm glass-pill"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
