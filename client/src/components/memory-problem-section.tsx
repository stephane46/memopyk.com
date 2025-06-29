import { useTranslations, useLanguage } from '@/lib/i18n';

export default function MemoryProblemSection() {
  const t = useTranslations();
  const { language } = useLanguage();

  return (
    <section className="py-20" style={{ backgroundColor: '#FEBDC' }}>
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
          
          {/* Problem Text Content */}
          <div className="order-2 lg:order-2 space-y-8">
            <div className="space-y-6">
              <p 
                className="text-lg leading-relaxed text-memopyk-blue"
                dangerouslySetInnerHTML={{ __html: t.memoryProblem.dailyCapture }}
              />
              
              <p className="text-lg leading-relaxed italic text-memopyk-blue">
                {t.memoryProblem.laterQuote}
              </p>
              
              <p 
                className="text-lg leading-relaxed text-memopyk-blue"
                dangerouslySetInnerHTML={{ __html: t.memoryProblem.neverComes }}
              />
              
              <p className="text-lg leading-relaxed text-memopyk-blue">
                {t.memoryProblem.buried}
              </p>
              
              <p 
                className="text-lg leading-relaxed font-medium text-memopyk-blue"
                dangerouslySetInnerHTML={{ __html: t.memoryProblem.neverRelived }}
              />
            </div>
            
            <div className="pt-8 border-t-2 border-memopyk-blue">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 font-poppins text-memopyk-blue leading-tight">
                <span className="text-memopyk-highlight">How to turn</span>{' '}
                <span className="text-memopyk-blue">your forgotten moments</span>{' '}
                <span className="text-memopyk-highlight">into unforgettable stories?</span>
              </h2>
            </div>
          </div>
        </div>
        
        {/* Solution Section - Full Width */}
        <div className="bg-memopyk-blue rounded-3xl p-12 border border-memopyk-sky/30">
          <div className="text-center space-y-6">
            <p className="text-2xl md:text-3xl text-memopyk-cream font-bold leading-relaxed">
              {t.memoryProblem.memopykSolution}
            </p>
            <p className="text-xl md:text-2xl text-memopyk-sky font-medium">
              {t.memoryProblem.noMoreScrolling}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}