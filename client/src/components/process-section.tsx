import { useTranslations, useLanguage } from '@/lib/i18n';

export default function ProcessSection() {
  const t = useTranslations();
  const { language } = useLanguage();
  
  const steps = {
    en: [
      {
        number: "1",
        title: "You Upload",
        description: "Send us your photos and videos exactly as they are — no need to sort, rename, or organize. We accept all formats and even support collaborative uploads, so your whole family can contribute.",
        additionalInfo: "You'll also receive a short questionnaire to tell us more about your story — whether it's a vague idea or a detailed vision.",
        image: "/assets/How_we_work_Step1.png",
        bgColor: "from-blue-50 to-blue-100"
      },
      {
        number: "2", 
        title: "We Create",
        description: "We go through every file to identify the most meaningful moments. Then we propose a personalized storyline, suggest music, duration, and format — everything tailored to your memories.",
        additionalInfo: "Need to talk it through? A consultation is always available, free of charge.",
        image: "/assets/How_we_work_Step2a.png",
        bgColor: "from-orange-50 to-orange-100"
      },
      {
        number: "3",
        title: "You Enjoy & Share",
        description: "Once you approve the plan, we bring your memory film to life. Expect a beautifully crafted result within 1-3 weeks, with two revision rounds included.",
        additionalInfo: "You'll receive a high-quality, ready-to-share masterpiece — perfect for gifting or keeping.",
        image: "/assets/How_we_work_Step3.png",
        bgColor: "from-gray-50 to-gray-100"
      }
    ],
    fr: [
      {
        number: "1",
        title: "Vous Téléversez",
        description: "Envoyez-nous vos photos et vidéos exactement telles qu'elles sont — pas besoin de trier, renommer ou organiser. Nous acceptons tous les formats et supportons même les téléchargements collaboratifs, pour que toute votre famille puisse contribuer.",
        additionalInfo: "Vous recevrez également un court questionnaire pour nous en dire plus sur votre histoire — qu'il s'agisse d'une idée vague ou d'une vision détaillée.",
        image: "/assets/How_we_work_Step1.png",
        bgColor: "from-blue-50 to-blue-100"
      },
      {
        number: "2",
        title: "Nous Créons", 
        description: "Nous passons en revue chaque fichier pour identifier les moments les plus significatifs. Ensuite, nous proposons un scénario personnalisé, suggérons la musique, la durée et le format — tout adapté à vos souvenirs.",
        additionalInfo: "Besoin d'en discuter ? Une consultation est toujours disponible, gratuitement.",
        image: "/assets/How_we_work_Step2a.png",
        bgColor: "from-orange-50 to-orange-100"
      },
      {
        number: "3",
        title: "Vous Profitez & Partagez",
        description: "Une fois que vous approuvez le plan, nous donnons vie à votre film souvenir. Attendez-vous à un résultat magnifiquement conçu dans 1-3 semaines, avec deux rondes de révision incluses.",
        additionalInfo: "Vous recevrez un chef-d'œuvre de haute qualité, prêt à partager — parfait pour offrir ou garder.",
        image: "/assets/How_we_work_Step3.png",
        bgColor: "from-gray-50 to-gray-100"
      }
    ]
  };

  const currentSteps = steps[language] || steps.en;

  return (
    <section id="process" className={`pt-8 bg-memopyk-cream ${language === 'fr' ? 'pb-4' : 'pb-6'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 id="how-we-work" className="text-4xl md:text-5xl font-bold text-memopyk-navy mb-6 font-poppins pt-6">
            {language === 'en' ? 'How We Work' : 'Comment Nous Travaillons'}
          </h2>
          <p className="text-xl text-memopyk-blue-light max-w-3xl mx-auto leading-relaxed">
            {language === 'en' 
              ? '3 zero-stress steps to turn chaos into a memory film'
              : '3 étapes zéro stress pour transformer le chaos en film-souvenir'
            }
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {currentSteps.map((step, index) => {
            // Step 2 (index 1) is the complex MEMOPYK step, others are simple client steps
            const isComplexStep = index === 1;
            const isClientStep = index === 0 || index === 2;
            
            return (
              <div key={index} className="group relative">
                <div 
                  className={`rounded-3xl p-8 h-full flex flex-col shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 bg-memopyk-blue ${
                    isComplexStep 
                      ? 'border-4 border-memopyk-highlight' 
                      : 'border-2 border-memopyk-navy/20'
                  }`}
                  style={{ minHeight: '550px', display: 'flex', flexDirection: 'column' }}
                >
                  {/* Complexity Indicator for Step 2 */}
                  {isComplexStep && (
                    <div className="absolute -top-2 -right-2 bg-memopyk-highlight text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      {language === 'en' ? 'Our Expertise' : 'Notre Expertise'}
                    </div>
                  )}
                  
                  {/* Client Ease Indicator for Steps 1 & 3 */}
                  {isClientStep && (
                    <div className="absolute -top-2 -right-2 bg-memopyk-sky text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      {language === 'en' ? 'Easy for You' : 'Facile pour Vous'}
                    </div>
                  )}
                  {/* Image Container - Square with small bezel */}
                  <div className="relative mb-8 mx-auto" style={{ width: '200px', height: '200px', flexShrink: 0 }}>
                    <div className="w-full h-full flex items-center justify-center p-2 rounded-2xl" style={{ backgroundColor: '#F2EBDC' }}>
                      <img 
                        src={step.image}
                        alt={step.title}
                        className="w-full h-full object-contain filter drop-shadow-lg"
                        onError={(e) => {
                          console.error('Failed to load image:', step.image);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    {/* Step Number Badge */}
                    <div className="absolute -top-3 -left-3 w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-white bg-memopyk-navy">
                      <span className="text-white font-bold text-lg">{step.number}</span>
                    </div>
                  </div>
                  
                  {/* Title */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold leading-tight transition-colors duration-300 text-white group-hover:text-memopyk-sky">
                      {step.title}
                    </h3>
                  </div>
                  
                  {/* Description */}
                  <div className="flex-1 mb-6">
                    <p className="leading-relaxed text-memopyk-cream">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Additional Info */}
                  <div style={{ height: language === 'fr' ? '100px' : '80px', flexShrink: 0 }} className="pt-4 border-t border-memopyk-sky/30">
                    {step.additionalInfo && (
                      <div className="flex items-start space-x-2 h-full">
                        <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-memopyk-sky"></div>
                        <p className="text-sm leading-relaxed text-memopyk-sky">
                          {step.additionalInfo}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>


      </div>
    </section>
  );
}