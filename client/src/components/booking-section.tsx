import { Calendar, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations, useLanguage } from "@/lib/i18n";

export default function BookingSection() {
  const t = useTranslations();
  const { language } = useLanguage();

  const openZohoBooking = () => {
    const bookingUrl = language === 'en' 
      ? 'https://memopyk.zohobookings.eu/#/239189000000097018'
      : 'https://memopyk.zohobookings.eu/#/239189000000110018';
    window.open(bookingUrl, '_blank');
  };

  return (
    <section id="booking" className="py-20 bg-gradient-to-br from-memopyk-sky to-memopyk-blue-light">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-memopyk-navy mb-6 font-poppins">
            {language === 'en' ? 'Book Your Free Consultation' : 'Réservez Votre Consultation Gratuite'}
          </h2>
          <p className="text-xl text-memopyk-navy max-w-3xl mx-auto leading-relaxed">
            {language === 'en' 
              ? 'Schedule a personalized consultation to discuss your memory film project. We\'ll understand your vision and guide you through the process.'
              : 'Planifiez une consultation personnalisée pour discuter de votre projet de film souvenir. Nous comprendrons votre vision et vous guiderons tout au long du processus.'
            }
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <Calendar className="text-memopyk-highlight mx-auto mb-4" size={40} />
            <h3 className="text-lg font-semibold text-memopyk-navy mb-2 font-poppins">
              {language === 'en' ? 'Flexible Scheduling' : 'Planification Flexible'}
            </h3>
            <p className="text-memopyk-blue text-sm">
              {language === 'en' 
                ? 'Choose a time that works for you from our available slots'
                : 'Choisissez un créneau qui vous convient parmi nos disponibilités'
              }
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <Clock className="text-memopyk-highlight mx-auto mb-4" size={40} />
            <h3 className="text-lg font-semibold text-memopyk-navy mb-2 font-poppins">
              {language === 'en' ? '30-Minute Session' : 'Session de 30 Minutes'}
            </h3>
            <p className="text-memopyk-blue text-sm">
              {language === 'en' 
                ? 'Dedicated time to understand your story and requirements'
                : 'Temps dédié pour comprendre votre histoire et vos exigences'
              }
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <Users className="text-memopyk-highlight mx-auto mb-4" size={40} />
            <h3 className="text-lg font-semibold text-memopyk-navy mb-2 font-poppins">
              {language === 'en' ? 'Expert Guidance' : 'Conseils d\'Expert'}
            </h3>
            <p className="text-memopyk-blue text-sm">
              {language === 'en' 
                ? 'Get professional advice on your memory film project'
                : 'Obtenez des conseils professionnels sur votre projet de film souvenir'
              }
            </p>
          </div>
        </div>

        <Button 
          onClick={openZohoBooking}
          size="lg"
          className="bg-memopyk-highlight text-white px-10 py-4 text-lg font-semibold hover:bg-memopyk-highlight/90 transform hover:scale-105 transition-all duration-200 shadow-lg"
        >
          {language === 'en' ? 'Schedule Your Consultation' : 'Planifier Votre Consultation'}
        </Button>

        <p className="text-memopyk-navy/70 mt-4 text-sm">
          {language === 'en' 
            ? 'No commitment required • Completely free • Takes just 2 minutes to book'
            : 'Aucun engagement requis • Complètement gratuit • Réservation en 2 minutes'
          }
        </p>
      </div>
    </section>
  );
}