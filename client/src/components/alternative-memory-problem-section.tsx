import { useTranslations, useLanguage } from '@/lib/i18n';

export default function AlternativeMemoryProblemSection() {
  const t = useTranslations();
  const { language } = useLanguage();

  return (
    <section className="pt-14 pb-8" style={{ backgroundColor: '#FEBDC' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Problem Section - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
          {/* Visual */}
          <div className="order-1 lg:order-1 relative">
            <div className="relative">
              <img 
                src="/assets/KeyVisualS.png" 
                alt={language === 'en' 
                  ? "Mind overwhelmed with scattered digital memories across devices"
                  : "Esprit submergé par des souvenirs numériques éparpillés sur plusieurs appareils"
                }
                className="w-full h-auto filter drop-shadow-2xl"
              />
            </div>
          </div>
          
          {/* Problem Text Content - Improved Version */}
          <div className="order-2 lg:order-2 space-y-8">
            {/* Clear Value Proposition Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-memopyk-navy leading-tight font-poppins">
                {language === 'en' ? (
                  <>
                    Turn Your Photos & Videos Into{' '}
                    <span className="text-memopyk-highlight">Unforgettable Personal Films</span>
                  </>
                ) : (
                  <>
                    Transformez Vos Photos & Vidéos En{' '}
                    <span className="text-memopyk-highlight">Films Personnels Inoubliables</span>
                  </>
                )}
              </h1>
              
              {/* Concise Problem & Solution */}
              <p className="text-xl md:text-2xl leading-relaxed text-memopyk-blue font-medium">
                {language === 'en' ? (
                  <>
                    Most memories stay buried in phones and hard drives. MEMOPYK transforms your scattered photos and videos into beautiful, personal films—so you can <strong>relive, share, and cherish</strong> your story.
                  </>
                ) : (
                  <>
                    La plupart des souvenirs restent enfouis dans les téléphones et disques durs. MEMOPYK transforme vos photos et vidéos éparpillées en beaux films personnels—pour que vous puissiez <strong>revivre, partager et chérir</strong> votre histoire.
                  </>
                )}
              </p>
              
              {/* Unique Value Points */}
              <div className="flex flex-wrap gap-4 mt-6">
                <span className="bg-memopyk-navy text-memopyk-cream px-4 py-2 rounded-full text-sm font-medium">
                  {language === 'en' ? 'Effortless' : 'Sans Effort'}
                </span>
                <span className="bg-memopyk-navy text-memopyk-cream px-4 py-2 rounded-full text-sm font-medium">
                  {language === 'en' ? 'Personal' : 'Personnel'}
                </span>
                <span className="bg-memopyk-navy text-memopyk-cream px-4 py-2 rounded-full text-sm font-medium">
                  {language === 'en' ? 'Done for You' : 'Fait pour Vous'}
                </span>
              </div>
              
              {/* Prominent CTA */}
              <div className="mt-8">
                <a 
                  href="#booking"
                  className="bg-memopyk-highlight text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-memopyk-highlight/90 transition-colors inline-block"
                >
                  {language === 'en' ? 'Create My Film' : 'Créer Mon Film'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}