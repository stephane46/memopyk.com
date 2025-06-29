import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useTranslations, useLanguage } from "@/lib/i18n";

interface VideoSlide {
  url: string;
  id: number;
}

const videoSlides: VideoSlide[] = [
  {
    id: 1,
    url: "https://supabase.memopyk.org/storage/v1/object/public/website/Website%20Hero%20Videos/MEMOPYK/VideoHero1.mp4"
  },
  {
    id: 2,
    url: "https://supabase.memopyk.org/storage/v1/object/public/website/Website%20Hero%20Videos/MEMOPYK/VideoHero2.mp4"
  },
  {
    id: 3,
    url: "https://supabase.memopyk.org/storage/v1/object/public/website/Website%20Hero%20Videos/MEMOPYK/VideoHero3.mp4"
  },
  {
    id: 4,
    url: "https://supabase.memopyk.org/storage/v1/object/public/website/Website%20Hero%20Videos/MEMOPYK/VideoHero4.mp4"
  }
];

export default function HeroSection() {
  const t = useTranslations();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const autoPlayRef = useRef<NodeJS.Timeout>();

  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % videoSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + videoSlides.length) % videoSlides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-advance slides every 8 seconds
  useEffect(() => {
    if (isPlaying) {
      autoPlayRef.current = setInterval(nextSlide, 8000);
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isPlaying]);

  // Handle video play/pause
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentSlide) {
          video.currentTime = 0;
          video.play().catch(() => {
            // Handle autoplay restrictions
            setIsPlaying(false);
          });
        } else {
          video.pause();
        }
      }
    });
  }, [currentSlide]);

  const overlayText = {
    en: {
      line1: "The best of your life's dearest moments",
      line2: "to relive, cherish and share"
    },
    fr: {
      line1: "Les meilleurs moments de votre vie",
      line2: "à revivre, à chérir et à partager"
    }
  };

  const { language } = useLanguage();
  const currentText = language === 'fr' ? overlayText.fr : overlayText.en;

  return (
    <section className="relative w-full h-screen overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full">
        {videoSlides.map((slide, index) => (
          <video
            key={slide.id}
            ref={(el) => {
              videoRefs.current[index] = el;
            }}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          >
            <source src={slide.url} type="video/mp4" />
          </video>
        ))}
      </div>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="hero-title text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-8 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            <div className="mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{currentText.line1}</div>
            <div className="text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{currentText.line2}</div>
          </h1>
          

        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-memopyk-highlight/80 hover:bg-memopyk-highlight text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
        aria-label="Previous video"
      >
        <ChevronLeft size={24} />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-memopyk-highlight/80 hover:bg-memopyk-highlight text-white p-3 rounded-full transition-all duration-200 backdrop-blur-sm"
        aria-label="Next video"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
        {videoSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index === currentSlide
                ? 'bg-memopyk-highlight scale-125'
                : 'bg-white/60 hover:bg-white/80'
            }`}
            aria-label={`Go to video ${index + 1}`}
          />
        ))}
      </div>


    </section>
  );
}