import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { SeoSetting } from '../../../shared/schema';

// Default SEO settings for fallback
const DEFAULT_SEO: SeoSetting = {
  id: 'default',
  createdAt: new Date(),
  updatedAt: new Date(),
  page: 'default',
  urlSlug: '',
  metaTitle: 'MEMOPYK - Professional Memory Film Service | Transform Your Photos & Videos',
  metaDescription: 'Transform your digital memories into beautifully edited cinematic experiences. Professional memory film service with bilingual support (EN/FR). Start your personalized film today.',
  ogTitle: 'MEMOPYK - Transform Your Memories Into Films',
  ogDescription: 'Professional memory preservation service creating compelling, organized, and shareable cinematic experiences from your photos and videos.',
  ogImageUrl: 'https://memopyk.com/og-default.jpg',
  twitterTitle: 'MEMOPYK - Memory Film Service',
  twitterDescription: 'Transform your photos & videos into professional memory films. Bilingual service available.',
  twitterImageUrl: 'https://memopyk.com/twitter-default.jpg',
  robotsDirectives: 'index,follow',
  canonicalUrl: 'https://memopyk.com',
  autoGenerateFaq: false,
  autoGenerateVideos: false,
  jsonLd: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MEMOPYK",
    "url": "https://memopyk.com",
    "logo": "https://memopyk.com/logo.png",
    "description": "Professional memory film service transforming digital memories into cinematic experiences",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+33-6-95-37-56-62",
      "contactType": "customer service",
      "email": "info@memopyk.com"
    }
  })
};

interface UseSeoOptions {
  page: string;
  locale?: 'en' | 'fr';
  enableFallback?: boolean;
}

export function useSeo({ page, locale = 'en', enableFallback = true }: UseSeoOptions) {
  const pageKey = locale === 'fr' ? `${page}-fr` : page;
  
  const { data: seoData, isLoading, error } = useQuery({
    queryKey: ['/api/seo-settings/page', pageKey],
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    retry: 2,
  });

  // Fallback logic
  const finalSeoData = seoData || (enableFallback ? DEFAULT_SEO : null);
  
  // Locale-specific URL adjustments
  const adjustedSeoData = finalSeoData ? {
    ...finalSeoData,
    canonicalUrl: locale === 'fr' 
      ? ((finalSeoData as any).canonicalUrl || '').replace('memopyk.com', 'memopyk.com/fr')
      : ((finalSeoData as any).canonicalUrl || '')
  } : null;

  return {
    seoData: adjustedSeoData,
    isLoading,
    error,
    hasFallback: !seoData && enableFallback
  };
}

// Hook for updating document head with hreflang support
export function useDocumentSeo(seoData: Partial<SeoSetting> | null, currentPage?: string, currentLocale?: 'en' | 'fr') {
  useEffect(() => {
    if (!seoData) return;

    // Update document title
    if (seoData.metaTitle) {
      document.title = seoData.metaTitle;
    }

    // Update meta tags
    const updateMetaTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    const updatePropertyTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    const updateLinkTag = (rel: string, href: string, attributes?: Record<string, string>) => {
      const selector = attributes?.hreflang 
        ? `link[rel="${rel}"][hreflang="${attributes.hreflang}"]`
        : `link[rel="${rel}"]`;
      
      let link = document.querySelector(selector) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        if (attributes) {
          Object.entries(attributes).forEach(([key, value]) => {
            link.setAttribute(key, value);
          });
        }
        document.head.appendChild(link);
      }
      link.href = href;
    };

    // Basic meta tags
    if (seoData.metaDescription) updateMetaTag('description', seoData.metaDescription);
    if (seoData.robotsDirectives) updateMetaTag('robots', seoData.robotsDirectives);

    // Open Graph tags
    if (seoData.ogTitle) updatePropertyTag('og:title', seoData.ogTitle);
    if (seoData.ogDescription) updatePropertyTag('og:description', seoData.ogDescription);
    if (seoData.ogImageUrl) updatePropertyTag('og:image', seoData.ogImageUrl);
    updatePropertyTag('og:type', 'website');
    if (seoData.canonicalUrl) updatePropertyTag('og:url', seoData.canonicalUrl);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    if (seoData.twitterTitle) updateMetaTag('twitter:title', seoData.twitterTitle);
    if (seoData.twitterDescription) updateMetaTag('twitter:description', seoData.twitterDescription);
    if (seoData.twitterImageUrl) updateMetaTag('twitter:image', seoData.twitterImageUrl);

    // Canonical link
    if (seoData.canonicalUrl) {
      updateLinkTag('canonical', seoData.canonicalUrl);
    }

    // hreflang alternate links
    if (currentPage && currentLocale) {
      // Remove existing hreflang links
      const existingHreflang = document.querySelectorAll('link[rel="alternate"][hreflang]');
      existingHreflang.forEach(link => link.remove());

      // Add hreflang for both languages
      const baseUrl = 'https://memopyk.com';
      const pagePath = currentPage === 'home' ? '' : `/${currentPage}`;
      
      // English version
      updateLinkTag('alternate', `${baseUrl}${pagePath}`, { hreflang: 'en' });
      
      // French version
      updateLinkTag('alternate', `${baseUrl}/fr${pagePath}`, { hreflang: 'fr' });
      
      // Default language (x-default)
      updateLinkTag('alternate', `${baseUrl}${pagePath}`, { hreflang: 'x-default' });
    }

    // JSON-LD structured data
    if (seoData.jsonLd) {
      // Remove existing JSON-LD
      const existing = document.querySelector('script[type="application/ld+json"]');
      if (existing) existing.remove();

      // Add new JSON-LD
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = typeof (seoData as any).jsonLd === 'string' ? (seoData as any).jsonLd : '';
      document.head.appendChild(script);
    }
  }, [seoData, currentPage, currentLocale]);
}