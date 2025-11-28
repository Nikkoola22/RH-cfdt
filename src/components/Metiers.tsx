import React from "react";
import { ArrowLeft, Palette, Crown, FileText, Wrench, Users, Activity, Heart } from "lucide-react";

interface MetierCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  filiere: string;
}

const MetierCard: React.FC<MetierCardProps & { onClose: () => void }> = ({ icon, title, description, filiere }) => {
  const handleNavigate = () => {
    const urls: Record<string, string> = {
      'culturelle': 'https://interco.cfdt.fr/vos-metiers/fonction-publique-territoriale/filiere-culturelle/',
      'emplois-fonctionnels': 'https://interco.cfdt.fr/vos-metiers/fonction-publique-territoriale/metiers-de-direction/',
      'administrative': 'https://interco.cfdt.fr/vos-metiers/fonction-publique-territoriale/filiere-administrative/',
      'technique': 'https://interco.cfdt.fr/vos-metiers/fonction-publique-territoriale/filiere-technique/',
      'animation': 'https://interco.cfdt.fr/vos-metiers/fonction-publique-territoriale/filiere-animation/',
      'sportive': 'https://interco.cfdt.fr/vos-metiers/fonction-publique-territoriale/filiere-sportive/',
      'medico-sociale': 'https://interco.cfdt.fr/vos-metiers/fonction-publique-territoriale/filiere-medico-sociale/'
    };
    
    if (urls[filiere]) {
      window.open(urls[filiere], '_blank');
    }
  };

  return (
    <div className="group bg-white rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-transparent hover:border-blue-400 cursor-pointer"
      onClick={handleNavigate}
    >
      <div className="text-6xl mb-6 w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-blue-900 mb-4">{title}</h3>
      <p className="text-gray-700 text-sm leading-relaxed mb-6">{description}</p>
      <button className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 transform group-hover:scale-105">
        <span>Voir les grilles</span>
        <ArrowLeft className="w-4 h-4 rotate-180" />
      </button>
    </div>
  );
};

const Metiers: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Intro Section */}
      <section className="bg-slate-800/50 py-12 text-center border-b border-slate-700">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
              <Wrench className="w-8 h-8 text-cyan-400" />
              Vos métiers
            </h2>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition-all text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          </div>
          <p className="text-slate-300 text-lg leading-relaxed">
            Retrouvez l'actualité qui vous concerne en sélectionnant ci-dessous votre métier, votre filière ou mission. Accédez aux grilles indiciaires et aux informations spécifiques à votre domaine d'activité.
          </p>
        </div>
      </section>

      {/* Metiers Grid */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <MetierCard
            icon={<Palette className="w-full h-full" />}
            title="Filière Culturelle"
            description="Professionnels de la culture, du patrimoine, des bibliothèques, des musées et des activités artistiques."
            filiere="culturelle"
            onClose={onClose}
          />
          <MetierCard
            icon={<Crown className="w-full h-full" />}
            title="Emplois Fonctionnels et Experts"
            description="Postes de direction, d'encadrement supérieur et d'expertise technique de haut niveau."
            filiere="emplois-fonctionnels"
            onClose={onClose}
          />
          <MetierCard
            icon={<FileText className="w-full h-full" />}
            title="Filière Administrative"
            description="Administrateurs, attachés, rédacteurs et adjoints administratifs territoriaux."
            filiere="administrative"
            onClose={onClose}
          />
          <MetierCard
            icon={<Wrench className="w-full h-full" />}
            title="Filière Technique"
            description="Ingénieurs, techniciens et agents techniques spécialisés dans les infrastructures et l'environnement."
            filiere="technique"
            onClose={onClose}
          />
          <MetierCard
            icon={<Users className="w-full h-full" />}
            title="Filière Animation"
            description="Animateurs territoriaux, coordinateurs d'activités socio-éducatives et culturelles."
            filiere="animation"
            onClose={onClose}
          />
          <MetierCard
            icon={<Activity className="w-full h-full" />}
            title="Filière Sportive"
            description="Conseillers et éducateurs territoriaux des activités physiques et sportives."
            filiere="sportive"
            onClose={onClose}
          />
          <MetierCard
            icon={<Heart className="w-full h-full" />}
            title="Filière Médico-Sociale"
            description="Professionnels de la santé, du social et de l'aide à la personne dans les collectivités."
            filiere="medico-sociale"
            onClose={onClose}
          />
        </div>
      </section>
    </div>
  );
};

export default Metiers;
