import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import AlternativeMemoryProblemSection from "@/components/alternative-memory-problem-section";
import ProcessSection from "@/components/process-section";
import GallerySection from "@/components/gallery-section";
import BookingQuoteSection from "@/components/booking-quote-section";
import SolutionSection from "@/components/solution-section";
import FaqSection from "@/components/faq-section";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F2EBDC' }}>
      <Navigation />
      <HeroSection />
      <AlternativeMemoryProblemSection />
      <ProcessSection />
      <GallerySection />
      <BookingQuoteSection />
      <SolutionSection />
      <FaqSection />
      <Footer />
    </div>
  );
}