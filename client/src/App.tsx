import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLanguage } from "@/lib/i18n";
import { useEffect } from "react";
import Home from "@/pages/home";
import AlternativeHome from "@/pages/alternative-home";
import AdminPanel from "@/pages/admin";
import NotFound from "@/pages/not-found";
import LegalNoticeEN from "@/pages/legal-notice-en";
import LegalNoticeFR from "@/pages/legal-notice-fr";
import PrivacyPolicy from "@/pages/privacy-policy";
import CookiePolicy from "@/pages/cookie-policy";
import TermsOfSale from "@/pages/terms-of-sale";
import TermsOfUse from "@/pages/terms-of-use";

function Router() {
  const [location, navigate] = useLocation();
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    // Handle root URL redirect
    if (location === '/') {
      navigate(`/${language}`, { replace: true });
      return;
    }

    // Extract language from URL
    const urlLanguage = location.split('/')[1];
    if (urlLanguage === 'en' || urlLanguage === 'fr') {
      if (urlLanguage !== language) {
        setLanguage(urlLanguage);
      }
    } else if (!location.startsWith('/admin')) {
      // If no valid language in URL (except admin routes), redirect to current language
      navigate(`/${language}${location}`, { replace: true });
    }
  }, [location, language, setLanguage, navigate]);

  return (
    <Switch>
      <Route path="/en" component={Home} />
      <Route path="/fr" component={Home} />
      <Route path="/en/alternative" component={AlternativeHome} />
      <Route path="/fr/alternative" component={AlternativeHome} />
      <Route path="/en/legal-notice" component={LegalNoticeEN} />
      <Route path="/fr/legal-notice" component={LegalNoticeFR} />
      <Route path="/en/privacy-policy" component={PrivacyPolicy} />
      <Route path="/fr/privacy-policy" component={PrivacyPolicy} />
      <Route path="/en/cookie-policy" component={CookiePolicy} />
      <Route path="/fr/cookie-policy" component={CookiePolicy} />
      <Route path="/en/terms-of-sale" component={TermsOfSale} />
      <Route path="/fr/terms-of-sale" component={TermsOfSale} />
      <Route path="/en/terms-of-use" component={TermsOfUse} />
      <Route path="/fr/terms-of-use" component={TermsOfUse} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/" component={() => null} /> {/* Handled by useEffect redirect */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
