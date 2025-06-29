import { Calendar, Clock, Users, FileText, Calculator, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

export default function BookingQuoteSection() {
  const { language } = useLanguage();

  const openZohoBooking = () => {
    const bookingUrl = language === 'en' 
      ? 'https://memopyk.zohobookings.eu/#/239189000000097018'
      : 'https://memopyk.zohobookings.eu/#/239189000000110018';
    window.open(bookingUrl, '_blank');
  };

  const openZohoQuestionnaire = () => {
    const quoteUrl = language === 'en'
      ? 'https://forms.zohopublic.eu/memopyk/form/FicheClientBriefMEMOPYK/formperma/YE6rWV_Ol5h3ymyxx11AHlXPaH7f6A-mJhbpQXOKbS4'
      : 'https://forms.zohopublic.eu/memopyk/form/MemoryfilmQuestionnaire/formperma/rDwLhQKfCo6KzBbhbWwKfkM6exQ-hwxJc0aaOcKVoW0';
    window.open(quoteUrl, '_blank');
  };

  return (
    <section id="booking-quote" className="pt-4 pb-6 bg-gradient-to-br from-memopyk-sky to-memopyk-blue-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Explanatory Header */}
        <div className="text-center mb-16">
          <h2 id="get-started-title" className="text-5xl font-bold text-memopyk-navy mb-6 font-poppins pt-6">
            {language === 'en' ? 'How to Get Started with MEMOPYK' : 'Comment Commencer avec MEMOPYK'}
          </h2>
          <p className="text-xl text-memopyk-navy max-w-4xl mx-auto leading-relaxed">
            {language === 'en' 
              ? 'Whether you prefer a personal consultation or want to get a detailed quote first, we make it easy to begin your memory film journey.'
              : 'Que vous préfériez une consultation personnelle ou que vous souhaitiez d\'abord obtenir un devis détaillé, nous facilitons le début de votre parcours de film souvenir.'
            }
          </p>
        </div>

        {/* Side-by-side sections */}
        <div className="relative grid lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Booking Section - Left Side */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-memopyk-blue/10">
            <div className="text-center">
              <div className="bg-memopyk-highlight/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Calendar className="text-memopyk-highlight" size={40} />
              </div>
              
              <h3 className="text-3xl font-bold text-memopyk-navy mb-4 font-poppins">
                {language === 'en' ? 'Talk to Us First' : 'Parlons d\'Abord'}
              </h3>
              
              <p className="text-lg text-memopyk-blue-light mb-8 leading-relaxed">
                {language === 'en' 
                  ? 'Perfect if you want to discuss your vision, ask questions, and get personalized guidance before moving forward.'
                  : 'Parfait si vous voulez discuter de votre vision, poser des questions et obtenir des conseils personnalisés avant de continuer.'
                }
              </p>

              {/* Benefits */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center text-left">
                  <Clock className="text-memopyk-highlight mr-3 flex-shrink-0" size={20} />
                  <span className="text-memopyk-navy">
                    {language === 'en' ? '30-minute free consultation' : 'Consultation gratuite de 30 minutes'}
                  </span>
                </div>
                <div className="flex items-center text-left">
                  <Users className="text-memopyk-highlight mr-3 flex-shrink-0" size={20} />
                  <span className="text-memopyk-navy">
                    {language === 'en' ? 'Expert guidance and advice' : 'Conseils et orientation d\'expert'}
                  </span>
                </div>
                <div className="flex items-center text-left">
                  <CheckCircle className="text-memopyk-highlight mr-3 flex-shrink-0" size={20} />
                  <span className="text-memopyk-navy">
                    {language === 'en' ? 'No commitment required' : 'Aucun engagement requis'}
                  </span>
                </div>
              </div>

              <Button 
                onClick={openZohoBooking}
                size="lg"
                className="w-full bg-memopyk-highlight text-white px-8 py-4 text-lg font-semibold hover:bg-memopyk-highlight/90 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                {language === 'en' ? 'Book Free Consultation' : 'Réserver une Consultation Gratuite'}
              </Button>

              <p className="text-memopyk-navy/70 mt-4 text-sm">
                {language === 'en' 
                  ? 'Available slots • Takes 2 minutes to book'
                  : 'Créneaux disponibles • Réservation en 2 minutes'
                }
              </p>
            </div>
          </div>

          {/* Vertical Divider - Hidden on mobile */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-px h-64 bg-gradient-to-b from-transparent via-memopyk-navy/20 to-transparent"></div>

          {/* Quote Section - Right Side */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-memopyk-blue/10">
            <div className="text-center">
              <div className="bg-memopyk-navy/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Calculator className="text-memopyk-navy" size={40} />
              </div>
              
              <h3 className="text-3xl font-bold text-memopyk-navy mb-4 font-poppins">
                {language === 'en' ? 'Get Pricing First' : 'Obtenez d\'Abord le Prix'}
              </h3>
              
              <p className="text-lg text-memopyk-blue-light mb-8 leading-relaxed">
                {language === 'en' 
                  ? 'Ideal if you want to know the investment required and get a detailed project breakdown before scheduling a call.'
                  : 'Idéal si vous voulez connaître l\'investissement requis et obtenir une ventilation détaillée du projet avant de planifier un appel.'
                }
              </p>

              {/* Benefits */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center text-left">
                  <FileText className="text-memopyk-navy mr-3 flex-shrink-0" size={20} />
                  <span className="text-memopyk-navy">
                    {language === 'en' ? 'Detailed project questionnaire' : 'Questionnaire de projet détaillé'}
                  </span>
                </div>
                <div className="flex items-center text-left">
                  <Calculator className="text-memopyk-navy mr-3 flex-shrink-0" size={20} />
                  <span className="text-memopyk-navy">
                    {language === 'en' ? 'Custom pricing within 24 hours' : 'Prix personnalisé sous 24 heures'}
                  </span>
                </div>
                <div className="flex items-center text-left">
                  <CheckCircle className="text-memopyk-navy mr-3 flex-shrink-0" size={20} />
                  <span className="text-memopyk-navy">
                    {language === 'en' ? 'Transparent cost breakdown' : 'Ventilation transparente des coûts'}
                  </span>
                </div>
              </div>

              <Button 
                onClick={openZohoQuestionnaire}
                size="lg"
                className="w-full bg-memopyk-navy text-white px-8 py-4 text-lg font-semibold hover:bg-memopyk-blue transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                {language === 'en' ? 'Request Custom Quote' : 'Demander un Devis Personnalisé'}
              </Button>

              <p className="text-memopyk-navy/70 mt-4 text-sm">
                {language === 'en' 
                  ? 'Takes 5-7 minutes • No obligation required'
                  : 'Prend 5-7 minutes • Aucune obligation requise'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <div className="text-center mt-12">
          <p className="text-memopyk-navy/80 text-lg">
            {language === 'en' 
              ? 'Both options lead to the same beautiful outcome - your perfect memory film. Choose what feels right for you.'
              : 'Les deux options mènent au même beau résultat - votre film souvenir parfait. Choisissez ce qui vous convient.'
            }
          </p>
        </div>
      </div>
    </section>
  );
}