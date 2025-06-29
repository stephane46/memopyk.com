import { CloudUpload, Users, Film } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

export default function ServicesSection() {
  const t = useTranslations();
  
  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-memopyk-navy mb-4 font-poppins">{t.services.title}</h2>
          <p className="text-xl text-memopyk-blue-light max-w-3xl mx-auto">
            {t.services.subtitle}
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Step 1: Upload */}
          <div className="text-center group">
            <div className="bg-gradient-to-br from-sky-100 to-sky-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <CloudUpload className="text-3xl text-memopyk-sky" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-memopyk-navy mb-4">{t.services.upload.title}</h3>
            <p className="text-memopyk-blue-light leading-relaxed">
              {t.services.upload.description}
            </p>
          </div>

          {/* Step 2: Collaborate */}
          <div className="text-center group">
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Users className="text-3xl text-memopyk-highlight" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-memopyk-navy mb-4">{t.services.collaborate.title}</h3>
            <p className="text-memopyk-blue-light leading-relaxed">
              {t.services.collaborate.description}
            </p>
          </div>

          {/* Step 3: Production */}
          <div className="text-center group">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Film className="text-3xl text-memopyk-blue-light" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-memopyk-navy mb-4">{t.services.production.title}</h3>
            <p className="text-memopyk-blue-light leading-relaxed">
              {t.services.production.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
