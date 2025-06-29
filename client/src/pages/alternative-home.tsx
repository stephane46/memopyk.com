import { useTranslations } from '@/lib/i18n';
import HeroSection from '@/components/hero-section';
import ProcessSection from '@/components/process-section';
import GallerySection from '@/components/gallery-section';
import BookingSection from '@/components/booking-section';
import QuoteSection from '@/components/quote-section';
import ContactSection from '@/components/contact-section';
import FaqSection from '@/components/faq-section';
import Footer from '@/components/footer';
import AlternativeMemoryProblemSection from '@/components/alternative-memory-problem-section';

export default function AlternativeHome() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-memopyk-cream">
      <HeroSection />
      <AlternativeMemoryProblemSection />
      <ProcessSection />
      <GallerySection />
      <BookingSection />
      <QuoteSection />
      <ContactSection />
      <FaqSection />
      <Footer />
    </div>
  );
}