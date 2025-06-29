import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import type { GalleryItem } from "@shared/schema";

export default function GallerySection() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [location] = useLocation();
  const language = location.startsWith('/fr') ? 'fr' : 'en';

  const { data: galleryItems = [], isLoading } = useQuery<GalleryItem[]>({
    queryKey: ['/api/gallery'],
  });

  const filmSamples = [
    {
      id: 1,
      title: "Sea Vitamin",
      description: "50 videos • 300 photos • 5 min • USD 350",
      additionalInfo: [
        "Capturing precious moments from your seaside adventure",
        "Professional editing with music and transitions"
      ],
      image: "https://images.unsplash.com/photo-1609220136736-443140cffec6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      alt: "Multi-generational family portrait"
    },
    {
      id: 2,
      title: "Sarah & Michael's Wedding",
      description: "Love story • 12 minutes • 2024",
      additionalInfo: [
        "From preparation to celebration, every emotion captured",
        "Cinematic storytelling with romantic music selection"
      ],
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      alt: "Wedding celebration"
    },
    {
      id: 3,
      title: "Emma's First Year",
      description: "Growth journey • 8 minutes • 2024",
      additionalInfo: [
        "Documenting every milestone from birth to first steps",
        "Heartwarming narrative with gentle background music"
      ],
      image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      alt: "Baby's first year milestones"
    },
    {
      id: 4,
      title: "European Adventure 2024",
      description: "Travel memories • 18 minutes • 2024",
      additionalInfo: [
        "Epic journey across multiple countries and cultures",
        "Adventure-style editing with dynamic transitions"
      ],
      image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      alt: "Family vacation travel memories"
    },
    {
      id: 5,
      title: "Class of 2024 Celebration",
      description: "Achievement story • 10 minutes • 2024",
      additionalInfo: [
        "Years of hard work culminating in this proud moment",
        "Inspirational storytelling with uplifting soundtrack"
      ],
      image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      alt: "Graduation celebration"
    },
    {
      id: 6,
      title: "Max's Adventures",
      description: "Pet memories • 6 minutes • 2024",
      additionalInfo: [
        "Playful moments and loyal companionship captured",
        "Fun and energetic editing style with pet-friendly music"
      ],
      image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      alt: "Pet's life journey"
    }
  ];

  return (
    <section id="gallery" className="py-20 bg-memopyk-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 id="gallery-title" className="text-4xl font-bold text-memopyk-navy mb-4 font-poppins pt-6">Beautiful Memory Films We've Created</h2>
          <p className="text-xl text-memopyk-blue-light max-w-3xl mx-auto">
            {language === 'en' 
              ? 'Ordinary moments transformed into extraordinary stories.'
              : 'Des moments ordinaires transformés en histoires extraordinaires.'
            }
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {(galleryItems.length > 0 ? galleryItems : filmSamples).map((film, index) => {
            const videoUrl = language === 'fr' 
              ? ('videoUrlFr' in film && film.videoUrlFr) || ('videoUrlEn' in film && film.videoUrlEn)
              : ('videoUrlEn' in film && film.videoUrlEn) || ('videoUrlFr' in film && film.videoUrlFr);
            const hasVideo = !!videoUrl;
            const filmId = String(film.id);
            const isFlipped = flippedCards.has(filmId);
            
            // Use 60% opacity for all cards
            const opacity = 0.6;
            
            // Check if this is second row (indices 3, 4, 5 in 3-column grid)
            const isSecondRow = index >= 3 && index <= 5;
            
            const handleClick = () => {
              if (hasVideo && videoUrl) {
                setSelectedVideo(videoUrl as string);
              } else {
                // Flip card for photo-only items
                setFlippedCards(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(filmId)) {
                    newSet.delete(filmId);
                  } else {
                    newSet.add(filmId);
                  }
                  return newSet;
                });
              }
            };

            return (
              <div key={film.id} className="group cursor-pointer">
                <div className={`relative w-full h-64 md:h-80 perspective-1000 ${isFlipped && !hasVideo ? 'flipped' : ''}`}>
                  <div className="relative w-full h-full transition-transform duration-700 transform-style-preserve-3d">
                    {/* Front Face */}
                    <div className="absolute inset-0 w-full h-full backface-hidden" onClick={handleClick}>
                      <div className={`relative overflow-hidden h-64 shadow-xl hover:shadow-2xl transition-shadow duration-300 ${isSecondRow ? '' : 'rounded-xl'}`}>
                        <img 
                          src={(() => {
                            if (language === 'fr') {
                              return ('imageUrlFr' in film ? film.imageUrlFr : null) || 
                                     ('imageUrlEn' in film ? film.imageUrlEn : null) || 
                                     ('image' in film ? film.image : null) || '';
                            } else {
                              return ('imageUrlEn' in film ? film.imageUrlEn : null) || 
                                     ('imageUrlFr' in film ? film.imageUrlFr : null) || 
                                     ('image' in film ? film.image : null) || '';
                            }
                          })()} 
                          alt={(() => {
                            if (language === 'fr') {
                              return ('altTextFr' in film ? film.altTextFr : null) || 
                                     ('altTextEn' in film ? film.altTextEn : null) || 
                                     ('alt' in film ? film.alt : null) || '';
                            } else {
                              return ('altTextEn' in film ? film.altTextEn : null) || 
                                     ('altTextFr' in film ? film.altTextFr : null) || 
                                     ('alt' in film ? film.alt : null) || '';
                            }
                          })()}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-96 max-w-[95%] rounded-xl h-8"
                             style={{
                               background: `linear-gradient(135deg, rgba(1,21,38,${opacity}) 0%, rgba(42,71,89,${opacity}) 50%, rgba(1,21,38,${opacity}) 100%)`,
                               border: `1px solid rgba(137,186,217,${opacity})`
                             }}>
                          <div className="flex items-center justify-center h-full px-4 text-white">
                            <p className="text-[13px] opacity-90 leading-tight text-center">
                              {'descriptionEn' in film ? (language === 'fr' ? film.descriptionFr : film.descriptionEn) : film.description}
                            </p>
                          </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          {hasVideo ? (
                            <div className="w-16 h-16 rounded-full bg-memopyk-highlight/80 flex items-center justify-center shadow-xl pulse-orange-enhanced backdrop-blur-sm">
                              <svg className="w-6 h-6 text-memopyk-cream ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-memopyk-cream/60 flex items-center justify-center shadow-xl border-2 border-memopyk-cream backdrop-blur-sm">
                              <svg className="w-6 h-6 text-memopyk-navy ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Back Face - for photo-only items */}
                    {!hasVideo && (
                      <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180" onClick={handleClick}>
                        <div className={`bg-memopyk-navy text-memopyk-cream h-64 p-6 flex flex-col justify-center items-center text-center shadow-xl hover:shadow-2xl transition-shadow duration-300 ${isSecondRow ? '' : 'rounded-xl'}`}>
                          <div className="mb-4">
                            <svg className="w-16 h-16 text-memopyk-highlight mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold mb-3">
                            {language === 'en' ? 'Sorry!' : 'Désolés !'}
                          </h3>
                          <p className="text-sm opacity-90 mb-4">
                            {language === 'en' 
                              ? "We cannot show this video as we don't have the consent of its owner" 
                              : "Nous ne pouvons pas diffuser cette vidéo car nous n'avons pas l'accord de son propriétaire."}
                          </p>
                          <p className="text-xs opacity-75">
                            <a 
                              href="#get-started-title" 
                              className="text-memopyk-highlight hover:text-memopyk-cream transition-colors duration-200 underline"
                              onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('get-started-title')?.scrollIntoView({ 
                                  behavior: 'smooth',
                                  block: 'start'
                                });
                              }}
                            >
                              {language === 'en' ? 'Contact us' : 'Contactez-nous'}
                            </a>
                            {language === 'en' 
                              ? ' to learn more about creating your custom souvenir film.' 
                              : ' pour en savoir plus sur la création de votre film souvenir personnalisé.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Simple Description Text */}
                <div className="-mt-12">
                  {/* Title and Price section */}
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-memopyk-navy">
                      {'titleEn' in film ? (language === 'fr' ? film.titleFr : film.titleEn) : film.title}
                    </h3>
                    {'priceEn' in film && (
                      (language === 'fr' ? film.priceFr : film.priceEn) && (
                        <span className="text-lg font-bold text-memopyk-highlight">
                          {language === 'fr' ? film.priceFr : film.priceEn}
                        </span>
                      )
                    )}
                  </div>
                  {/* Project details section */}
                  <div className="text-sm leading-relaxed text-memopyk-blue-light">
                    {(() => {
                      const additionalInfo = 'additionalInfoEn' in film 
                        ? (language === 'fr' ? film.additionalInfoFr : film.additionalInfoEn)
                        : film.additionalInfo;
                      
                      if (additionalInfo && additionalInfo.length > 0) {
                        return (
                          <div>
                            {additionalInfo.slice(0, 3).map((info: string, index: number) => (
                              <p key={index} className="mb-1">{info}</p>
                            ))}
                          </div>
                        );
                      } else {
                        return (
                          <div>
                            <p className="mb-1">• Professional memory film production</p>
                            <p className="mb-1">• Custom storytelling with music</p>
                            <p className="mb-1">• Lifetime memories preserved</p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        

      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedVideo(null)}>
          <div className="relative max-w-4xl w-full bg-black rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 z-10 bg-memopyk-cream/20 hover:bg-memopyk-cream/40 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center text-white transition-colors"
            >
              ×
            </button>
            <video 
              src={selectedVideo} 
              controls 
              autoPlay 
              className="w-full h-auto max-h-[80vh]"
              onError={() => {
                console.error('Failed to load video:', selectedVideo);
                setSelectedVideo(null);
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
