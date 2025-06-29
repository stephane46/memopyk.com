import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

export default function PricingSection() {
  const t = useTranslations();
  
  const packages = [
    {
      name: t.pricing.packages.essential.name,
      price: 299,
      popular: false,
      features: t.pricing.packages.essential.features
    },
    {
      name: t.pricing.packages.premium.name,
      price: 599,
      popular: true,
      features: t.pricing.packages.premium.features
    },
    {
      name: t.pricing.packages.unlimited.name,
      price: 999,
      popular: false,
      features: t.pricing.packages.unlimited.features
    }
  ];

  const scrollToContact = () => {
    const element = document.getElementById("contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="pricing" className="py-20 bg-memopyk-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-memopyk-navy mb-4 font-poppins">{t.pricing.title}</h2>
          <p className="text-xl text-memopyk-blue-light">{t.pricing.subtitle}</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div key={pkg.name} className={`bg-memopyk-cream rounded-2xl p-8 relative ${
              pkg.popular 
                ? "border-2 border-memopyk-blue" 
                : "border-2 border-memopyk-blue-light hover:border-memopyk-highlight"
            } transition-colors`}>
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-memopyk-blue text-white px-6 py-2 rounded-full text-sm font-semibold">
                  {t.pricing.mostPopular}
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-memopyk-navy mb-4">{pkg.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-memopyk-highlight">${pkg.price}</span>
                <span className="text-memopyk-blue-light ml-2">{t.pricing.oneTime}</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                {pkg.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="text-green-500 mr-3" size={16} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                onClick={scrollToContact}
                className={pkg.popular 
                  ? "w-full bg-memopyk-blue text-white hover:bg-memopyk-blue-light" 
                  : "w-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                }
              >
                {t.pricing.choose} {pkg.name}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
