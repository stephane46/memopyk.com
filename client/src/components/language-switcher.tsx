import { useLanguage } from "@/lib/i18n";
import { useLocation } from "wouter";

export default function LanguageSwitcher() {
  const { language } = useLanguage();
  const [location, navigate] = useLocation();

  const switchLanguage = (newLanguage: 'en' | 'fr') => {
    // Get the current path without the language prefix
    const currentPath = location.replace(/^\/(en|fr)/, '') || '';
    
    // Navigate to the same path in the new language
    navigate(`/${newLanguage}${currentPath}`, { replace: true });
  };

  return (
    <div className="flex items-center gap-2">
      {/* American Flag */}
      <button
        onClick={() => switchLanguage('en')}
        className={`relative flex flex-col items-center transition-all duration-200 hover:scale-105 ${
          language === 'en' ? 'opacity-100' : 'opacity-75 hover:opacity-100'
        }`}
        title="English"
      >
        <svg viewBox="0 0 24 18" className="w-6 h-4 border border-gray-300">
          {/* American Flag */}
          <rect width="24" height="18" fill="#B22234"/>
          <rect y="2" width="24" height="2" fill="white"/>
          <rect y="6" width="24" height="2" fill="white"/>
          <rect y="10" width="24" height="2" fill="white"/>
          <rect y="14" width="24" height="2" fill="white"/>
          <rect width="10" height="10" fill="#3C3B6E"/>
          {/* Stars pattern simplified */}
          <circle cx="2" cy="2" r="0.4" fill="white"/>
          <circle cx="4" cy="2" r="0.4" fill="white"/>
          <circle cx="6" cy="2" r="0.4" fill="white"/>
          <circle cx="8" cy="2" r="0.4" fill="white"/>
          <circle cx="3" cy="4" r="0.4" fill="white"/>
          <circle cx="5" cy="4" r="0.4" fill="white"/>
          <circle cx="7" cy="4" r="0.4" fill="white"/>
          <circle cx="2" cy="6" r="0.4" fill="white"/>
          <circle cx="4" cy="6" r="0.4" fill="white"/>
          <circle cx="6" cy="6" r="0.4" fill="white"/>
          <circle cx="8" cy="6" r="0.4" fill="white"/>
          <circle cx="3" cy="8" r="0.4" fill="white"/>
          <circle cx="5" cy="8" r="0.4" fill="white"/>
          <circle cx="7" cy="8" r="0.4" fill="white"/>
        </svg>
        {language === 'en' && (
          <div className="w-6 h-0.5 mt-1" style={{ backgroundColor: '#011526' }}></div>
        )}
      </button>

      {/* French Flag */}
      <button
        onClick={() => switchLanguage('fr')}
        className={`relative flex flex-col items-center transition-all duration-200 hover:scale-105 ${
          language === 'fr' ? 'opacity-100' : 'opacity-75 hover:opacity-100'
        }`}
        title="Français"
      >
        <svg viewBox="0 0 24 18" className="w-6 h-4 border border-gray-300">
          {/* French Flag */}
          <rect width="8" height="18" fill="#002395"/>
          <rect x="8" width="8" height="18" fill="white"/>
          <rect x="16" width="8" height="18" fill="#ED2939"/>
        </svg>
        {language === 'fr' && (
          <div className="w-6 h-0.5 mt-1" style={{ backgroundColor: '#011526' }}></div>
        )}
      </button>
    </div>
  );
}