import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useTranslations, useLanguage } from "@/lib/i18n";
import { getQueryFn } from "@/lib/queryClient";
import type { Faq } from "@shared/schema";

export default function FaqSection() {
  const [openItems, setOpenItems] = useState<string[]>([]);
  const { language } = useLanguage();
  const t = useTranslations();

  const { data: faqs = [], isLoading } = useQuery<Faq[]>({
    queryKey: ['/api/faqs'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // Group FAQs by section
  const faqsBySection = faqs.reduce((acc, faq) => {
    if (!acc[faq.section]) {
      acc[faq.section] = [];
    }
    acc[faq.section].push(faq);
    return acc;
  }, {} as Record<string, Faq[]>);

  const sections = Object.keys(faqsBySection);

  // Get section display name
  const getSectionName = (section: string, faqs: Faq[]) => {
    const firstFaq = faqs[0];
    return language === 'fr' ? firstFaq.sectionNameFr : firstFaq.sectionNameEn;
  };

  return (
    <section className="pt-4 pb-20 bg-memopyk-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-memopyk-navy mb-4 font-poppins">
            {t.faq.title}
          </h2>
          <p className="text-lg text-memopyk-blue max-w-2xl mx-auto">
            {t.faq.subtitle}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : sections.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-memopyk-blue-light">
              {t.faq.noQuestions}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section}>
                <h3 className="text-2xl font-bold text-memopyk-navy mb-6 text-center">
                  {getSectionName(section, faqsBySection[section])}
                </h3>
                <div className="space-y-4">
                  {faqsBySection[section].map((faq) => {
                    const isOpen = openItems.includes(faq.id);
                    const question = language === 'fr' ? faq.questionFr : faq.questionEn;
                    const answer = language === 'fr' ? faq.answerFr : faq.answerEn;

                    return (
                      <div
                        key={faq.id}
                        className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
                      >
                        <button
                          onClick={() => toggleItem(faq.id)}
                          className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                        >
                          <span 
                            className="font-semibold text-memopyk-navy text-lg"
                            dangerouslySetInnerHTML={{ __html: question }}
                          />
                          <ChevronDown
                            className={`w-5 h-5 text-memopyk-blue transition-transform ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        
                        {isOpen && (
                          <div className="px-6 pb-4">
                            <div 
                              className="pt-2 text-memopyk-blue-light leading-relaxed faq-content"
                              dangerouslySetInnerHTML={{ __html: answer }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}