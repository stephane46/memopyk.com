import { useLanguage } from '@/lib/i18n';

export default function SolutionSection() {
  const { language } = useLanguage();

  return (
    <section className="py-20" style={{ backgroundColor: '#F2EBDC' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Solution Section - Full Width */}
        <div className="bg-memopyk-navy rounded-3xl p-12 border border-memopyk-sky/30">
          <div className="text-center space-y-6">
            <p className="text-2xl md:text-3xl text-memopyk-cream font-bold leading-relaxed">
              {language === 'en' ? 
                'No more endless scrolling. Just meaningful memories.' :
                'Fini le défilement sans fin. Juste des souvenirs significatifs.'
              }
            </p>
            <p className="text-xl md:text-2xl text-memopyk-sky font-medium">
              {language === 'en' ? 
                'Professional films from your personal moments.' :
                'Films professionnels à partir de vos moments personnels.'
              }
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}