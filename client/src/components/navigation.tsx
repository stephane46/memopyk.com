import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useLocation } from "wouter";
import LanguageSwitcher from "@/components/language-switcher";
import { useTranslations, useLanguage } from "@/lib/i18n";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [, navigate] = useLocation();
  const t = useTranslations();
  const { language } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const goToHome = () => {
    navigate(`/${language}`);
    setIsMenuOpen(false);
  };

  const scrollToSection = (sectionId: string) => {
    // If not on homepage, navigate to homepage first
    if (!window.location.pathname.match(/^\/(en|fr)\/?$/)) {
      navigate(`/${language}#${sectionId}`);
      setIsMenuOpen(false);
      return;
    }
    
    // If on homepage, scroll to section with offset for fixed header
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80; // Navigation height is h-20 (80px)
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${
      isScrolled ? "bg-memopyk-cream shadow-sm" : "bg-memopyk-cream"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <button onClick={goToHome} className="flex flex-col items-center text-center py-2 hover:opacity-80 transition-opacity">
            <img src="/assets/logo.svg" alt="MEMOPYK" className="h-8 w-auto mt-1" />
            <p className="text-xs mt-2 mb-1 max-w-xs leading-tight whitespace-pre-line text-memopyk-blue">
              {t.navigation.tagline}
            </p>
          </button>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <button 
                onClick={() => scrollToSection("how-we-work")}
                className="text-gray-600 hover:text-memopyk-blue transition-colors"
              >
                {t.navigation.howItWorks}
              </button>

              <button 
                onClick={() => scrollToSection("gallery-title")}
                className="text-gray-600 hover:text-memopyk-blue transition-colors"
              >
                {t.navigation.gallery}
              </button>
              <button 
                onClick={() => scrollToSection("get-started-title")}
                className="text-gray-600 hover:text-memopyk-blue transition-colors"
              >
                {language === 'en' ? 'Get Started' : 'Commencer'}
              </button>
              <LanguageSwitcher />
            </div>
          </div>
          
          {/* Mobile Navigation Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <button 
                onClick={() => scrollToSection("how-we-work")}
                className="block px-3 py-2 text-gray-600 hover:text-memopyk-blue w-full text-left"
              >
                {t.navigation.howItWorks}
              </button>
              <button 
                onClick={() => scrollToSection("gallery-title")}
                className="block px-3 py-2 text-gray-600 hover:text-memopyk-blue w-full text-left"
              >
                {t.navigation.gallery}
              </button>
              <button 
                onClick={() => scrollToSection("get-started-title")}
                className="block px-3 py-2 text-gray-600 hover:text-memopyk-blue w-full text-left"
              >
                {language === 'en' ? 'Get Started' : 'Commencer'}
              </button>
              <div className="px-3 py-2">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
