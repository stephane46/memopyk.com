import { useLanguage } from '@/lib/i18n';
import { ChevronRight } from 'lucide-react';

export default function AlternativeProcessSection() {
  const { language } = useLanguage();

  const steps = {
    en: [
      {
        number: "1",
        title: "You Upload",
        tagline: "Easy for You",
        description: "Dump everything—any format, any mess. Family can upload too. We'll handle the chaos.",
        bulletPoints: ["Any file format accepted", "Family collaboration supported", "Zero organization required"],
        image: "/assets/How_we_work_Step1.png",
        bgTint: "bg-memopyk-sky/5"
      },
      {
        number: "2", 
        title: "We Create",
        tagline: "Our Expertise",
        description: "Our editors sift, storyboard, and score the moments that matter—then send you a one-page plan.",
        bulletPoints: ["Professional story crafting", "Custom music selection", "One-page approval process"],
        image: "/assets/How_we_work_Step2a.png",
        bgTint: "bg-memopyk-highlight/5",
        featured: true
      },
      {
        number: "3",
        title: "You Enjoy & Share",
        tagline: "Easy for You", 
        description: "Approve the outline → get a cinematic film in 1-3 weeks (2 free revisions). Watch, gift, share.",
        bulletPoints: ["1-3 week delivery", "2 free revisions included", "Cinema-quality result"],
        image: "/assets/How_we_work_Step3.png",
        bgTint: "bg-memopyk-sky/5",
        testimonial: "'I cried happy tears!' – Emma R."
      }
    ],
    fr: [
      {
        number: "1",
        title: "Vous Téléversez",
        tagline: "Simple pour Vous",
        description: "Envoyez tout—n'importe quel format, n'importe quel désordre. La famille peut contribuer aussi. Nous gérons le chaos.",
        bulletPoints: ["Tous formats acceptés", "Collaboration familiale supportée", "Aucune organisation requise"],
        image: "/assets/How_we_work_Step1.png",
        bgTint: "bg-memopyk-sky/5"
      },
      {
        number: "2",
        title: "Nous Créons", 
        tagline: "Notre Expertise",
        description: "Nos monteurs trient, scénarisent et scorent les moments qui comptent—puis vous envoient un plan d'une page.",
        bulletPoints: ["Création d'histoire professionnelle", "Sélection musicale personnalisée", "Processus d'approbation simple"],
        image: "/assets/How_we_work_Step2a.png",
        bgTint: "bg-memopyk-highlight/5",
        featured: true
      },
      {
        number: "3",
        title: "Vous Profitez & Partagez",
        tagline: "Simple pour Vous",
        description: "Approuvez le plan → obtenez un film cinématographique en 1-3 semaines (2 révisions gratuites). Regardez, offrez, partagez.",
        bulletPoints: ["Livraison en 1-3 semaines", "2 révisions gratuites incluses", "Résultat qualité cinéma"],
        image: "/assets/How_we_work_Step3.png",
        bgTint: "bg-memopyk-sky/5",
        testimonial: "'J'ai pleuré de joie !' – Emma R."
      }
    ]
  };

  const currentSteps = steps[language] || steps.en;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-memopyk-navy mb-6 font-poppins">
            {language === 'en' ? 'How We Turn Chaos into Cinema' : 'Comment Nous Transformons le Chaos en Cinéma'}
          </h2>
          <p className="text-xl text-memopyk-blue-light max-w-3xl mx-auto leading-relaxed">
            {language === 'en' 
              ? '3 zero-stress steps to your own memory film'
              : '3 étapes sans stress vers votre propre film souvenir'
            }
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {currentSteps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Connecting Arrow (desktop only) */}
              {index < currentSteps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ChevronRight className="text-memopyk-sky w-8 h-8" />
                </div>
              )}
              
              {/* Card */}
              <div className={`
                relative h-full rounded-2xl p-8 transition-all duration-300 group-hover:shadow-lg
                ${step.bgTint}
                ${step.featured ? 'ring-2 ring-memopyk-highlight/20 md:scale-105' : ''}
              `}>
                {/* Tagline */}
                <div className="text-center mb-4">
                  <span className="text-sm font-medium text-memopyk-blue-light uppercase tracking-wide">
                    {step.tagline}
                  </span>
                </div>

                {/* Number Badge */}
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-memopyk-navy flex items-center justify-center shadow-md">
                    <span className="text-2xl font-bold text-memopyk-cream">
                      {step.number}
                    </span>
                  </div>
                </div>

                {/* Image */}
                <div className="flex justify-center mb-6">
                  <div className="w-32 h-32 bg-memopyk-cream rounded-xl flex items-center justify-center">
                    <img 
                      src={step.image} 
                      alt={`Step ${step.number}`}
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                </div>

                {/* Title */}
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-memopyk-navy">
                    {step.title}
                  </h3>
                </div>

                {/* Description */}
                <div className="text-center mb-6">
                  <p className="text-memopyk-blue leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Bullet Points */}
                <div className="space-y-2 mb-6">
                  {step.bulletPoints.map((point, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-memopyk-highlight flex-shrink-0"></div>
                      <span className="text-sm text-memopyk-blue-light">{point}</span>
                    </div>
                  ))}
                </div>

                {/* Testimonial (Step 3 only, on hover) */}
                {step.testimonial && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
                    <p className="text-sm italic text-memopyk-highlight">
                      {step.testimonial}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Ribbon */}
        <div className="bg-memopyk-cream/50 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-center space-x-4 text-sm text-memopyk-blue-light">
            <span className="font-medium">
              {language === 'en' ? 'Day 0: Upload' : 'Jour 0: Téléversement'}
            </span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium">
              {language === 'en' ? 'Day 2: Storyboard' : 'Jour 2: Scénario'}
            </span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium">
              {language === 'en' ? 'Day 7-21: Delivery' : 'Jour 7-21: Livraison'}
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <a
            href="#get-started-title"
            className="inline-flex items-center px-8 py-4 bg-memopyk-highlight text-white font-semibold rounded-full hover:bg-memopyk-highlight/90 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            {language === 'en' ? 'Start My Film' : 'Commencer Mon Film'}
            <ChevronRight className="ml-2 w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
}