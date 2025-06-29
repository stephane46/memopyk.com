import { FileText, Calculator, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations, useLanguage } from "@/lib/i18n";

export default function QuoteSection() {
  const t = useTranslations();
  const { language } = useLanguage();

  const openZohoQuestionnaire = () => {
    const quoteUrl = language === 'en'
      ? 'https://forms.zohopublic.eu/memopyk/form/FicheClientBriefMEMOPYK/formperma/YE6rWV_Ol5h3ymyxx11AHlXPaH7f6A-mJhbpQXOKbS4'
      : 'https://forms.zohopublic.eu/memopyk/form/MemoryfilmQuestionnaire/formperma/rDwLhQKfCo6KzBbhbWwKfkM6exQ-hwxJc0aaOcKVoW0';
    window.open(quoteUrl, '_blank');
  };

  return (
    <section id="quote" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-memopyk-navy mb-6 font-poppins">
            {language === 'en' ? 'Get Your Custom Quote' : 'Obtenez Votre Devis Personnalisé'}
          </h2>
          <p className="text-xl text-memopyk-blue-light max-w-3xl mx-auto leading-relaxed">
            {language === 'en' 
              ? 'Tell us about your project and receive a detailed, personalized quote within 24 hours. Every memory film is unique, just like your story.'
              : 'Parlez-nous de votre projet et recevez un devis détaillé et personnalisé sous 24 heures. Chaque film souvenir est unique, tout comme votre histoire.'
            }
          </p>
        </div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="bg-memopyk-highlight/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <FileText className="text-memopyk-highlight" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-memopyk-navy mb-2 font-poppins">
              {language === 'en' ? '1. Share Your Vision' : '1. Partagez Votre Vision'}
            </h3>
            <p className="text-memopyk-blue text-sm">
              {language === 'en' 
                ? 'Complete our detailed questionnaire about your project goals and preferences'
                : 'Complétez notre questionnaire détaillé sur vos objectifs et préférences de projet'
              }
            </p>
          </div>

          <div className="text-center">
            <div className="bg-memopyk-sky/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Calculator className="text-memopyk-blue" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-memopyk-navy mb-2 font-poppins">
              {language === 'en' ? '2. We Calculate' : '2. Nous Calculons'}
            </h3>
            <p className="text-memopyk-blue text-sm">
              {language === 'en' 
                ? 'Our team reviews your requirements and creates a customized pricing proposal'
                : 'Notre équipe examine vos exigences et crée une proposition de prix personnalisée'
              }
            </p>
          </div>

          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-memopyk-navy mb-2 font-poppins">
              {language === 'en' ? '3. Receive Quote' : '3. Recevez le Devis'}
            </h3>
            <p className="text-memopyk-blue text-sm">
              {language === 'en' 
                ? 'Get your detailed quote with transparent pricing and project timeline'
                : 'Obtenez votre devis détaillé avec des prix transparents et le calendrier du projet'
              }
            </p>
          </div>
        </div>

        <div className="bg-memopyk-cream rounded-2xl p-8 mb-8">
          <h3 className="text-xl font-semibold text-memopyk-navy mb-4 font-poppins">
            {language === 'en' ? 'What We Need to Know:' : 'Ce Que Nous Devons Savoir :'}
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-left">
            <ul className="space-y-2 text-memopyk-blue">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-memopyk-highlight rounded-full mr-3"></div>
                {language === 'en' ? 'Number of photos/videos' : 'Nombre de photos/vidéos'}
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-memopyk-highlight rounded-full mr-3"></div>
                {language === 'en' ? 'Desired film length' : 'Durée souhaitée du film'}
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-memopyk-highlight rounded-full mr-3"></div>
                {language === 'en' ? 'Special requirements' : 'Exigences spéciales'}
              </li>
            </ul>
            <ul className="space-y-2 text-memopyk-blue">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-memopyk-highlight rounded-full mr-3"></div>
                {language === 'en' ? 'Timeline preferences' : 'Préférences de calendrier'}
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-memopyk-highlight rounded-full mr-3"></div>
                {language === 'en' ? 'Music preferences' : 'Préférences musicales'}
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-memopyk-highlight rounded-full mr-3"></div>
                {language === 'en' ? 'Output format needs' : 'Besoins de format de sortie'}
              </li>
            </ul>
          </div>
        </div>

        <Button 
          onClick={openZohoQuestionnaire}
          size="lg"
          className="bg-memopyk-navy text-white px-10 py-4 text-lg font-semibold hover:bg-memopyk-blue transform hover:scale-105 transition-all duration-200 shadow-lg"
        >
          {language === 'en' ? 'Start Your Quote Request' : 'Commencer Votre Demande de Devis'}
        </Button>

        <p className="text-memopyk-blue-light mt-4 text-sm">
          {language === 'en' 
            ? 'Takes 5-7 minutes • No obligation • Detailed pricing breakdown included'
            : 'Prend 5-7 minutes • Aucune obligation • Ventilation détaillée des prix incluse'
          }
        </p>
      </div>
    </section>
  );
}