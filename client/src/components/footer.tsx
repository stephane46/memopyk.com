import { Facebook, Instagram, Youtube, Twitter, MessageCircle, Mail } from "lucide-react";
import { useTranslations, useLanguage } from "@/lib/i18n";
import { Link } from "wouter";

export default function Footer() {
  const t = useTranslations();
  const { language } = useLanguage();
  
  return (
    <footer className="bg-memopyk-navy text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <img src="/assets/logo.svg" alt="MEMOPYK" className="h-8 w-auto mb-4 brightness-0 invert" />
            <p className="text-gray-300 mb-6 max-w-md">
              {t.footer?.description || "Transform your photo and video collections into beautifully edited keepsakes. Professional memory films that tell your family's unique story."}
            </p>
            <div className="flex space-x-4">
              <a href="#" className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                <Youtube size={20} />
              </a>
              <a href="#" className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">
              {language === 'en' ? 'Legal' : 'Légal'}
            </h4>
            <ul className="space-y-3 text-gray-300">
              <li><Link href={`/${language}/legal-notice`} className="hover:text-white transition-colors">
                {language === 'en' ? 'Legal Notice' : 'Mentions Légales'}
              </Link></li>
              <li><Link href={`/${language}/privacy-policy`} className="hover:text-white transition-colors">
                {language === 'en' ? 'Privacy Policy' : 'Politique de confidentialité'}
              </Link></li>
              <li><Link href={`/${language}/cookie-policy`} className="hover:text-white transition-colors">
                {language === 'en' ? 'Cookie Policy' : 'Politique de cookies'}
              </Link></li>
              <li><Link href={`/${language}/terms-of-sale`} className="hover:text-white transition-colors">
                {language === 'en' ? 'Terms of Sale' : 'Conditions Générales de Vente'}
              </Link></li>
              <li><Link href={`/${language}/terms-of-use`} className="hover:text-white transition-colors">
                {language === 'en' ? 'Terms of Use' : 'Conditions Générales d\'Utilisation'}
              </Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">
              {language === 'en' ? 'Support' : 'Assistance'}
            </h4>
            <ul className="space-y-3 text-gray-300">
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              <li>
                <a href="https://wa.me/33695375662" className="hover:text-white transition-colors flex items-center">
                  <MessageCircle size={16} className="mr-2" />
                  {language === 'en' ? 'Contact us' : 'Contactez-nous'}
                </a>
              </li>
              <li>
                <a href="mailto:info@memopyk.com" className="hover:text-white transition-colors flex items-center">
                  <Mail size={16} className="mr-2" />
                  info@memopyk.com
                </a>
              </li>
              <li><a href="/admin" className="hover:text-memopyk-highlight transition-colors text-xs opacity-70">Admin</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-memopyk-blue mt-12 pt-8 text-center text-memopyk-blue-light">
          <p>&copy; 2025 MEMOPYK. All rights reserved. Made with ❤️ for families around the world.</p>
        </div>
      </div>
    </footer>
  );
}
