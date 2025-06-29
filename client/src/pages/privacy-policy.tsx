import { useLanguage } from "@/lib/i18n";
import { useEffect } from "react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function PrivacyPolicy() {
  const { language } = useLanguage();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch legal content dynamically
  const { data: legalContent, isLoading } = useQuery({
    queryKey: ['/api/legal-content'],
    queryFn: () => apiRequest('/api/legal-content', { method: 'GET' }),
    refetchInterval: 5000, // Auto-refresh every 5 seconds to catch changes
  });

  if (isLoading || !legalContent) {
    return (
      <div className="min-h-screen bg-memopyk-cream">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-20">
          <div className="bg-memopyk-cream rounded-lg shadow-lg p-8 border border-memopyk-blue/10">
            <div className="animate-pulse">
              <div className="h-8 bg-memopyk-blue/20 rounded mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-memopyk-blue/20 rounded"></div>
                <div className="h-4 bg-memopyk-blue/20 rounded"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-memopyk-cream">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-20">
        <div className="bg-memopyk-cream rounded-lg shadow-lg p-8 border border-memopyk-blue/10">
          <h1 className="text-3xl font-bold text-memopyk-navy font-poppins mb-8">
            {legalContent[language].privacyPolicy.title}
          </h1>

          {legalContent[language].privacyPolicy.sections.map((section: any, index: number) => (
            <section key={index} className="mb-8">
              <h2 className="text-xl font-semibold text-memopyk-navy mb-4 font-poppins">{section.title}</h2>
              <div className="text-memopyk-blue space-y-2 legal-content">
                {section.content.map((item: any, itemIndex: number) => (
                  <p key={itemIndex} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: item.value }}></p>
                ))}
              </div>
            </section>
          ))}

          <p className="text-sm text-memopyk-blue-light mt-8">
            Last updated: {legalContent[language].privacyPolicy.lastUpdated}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}