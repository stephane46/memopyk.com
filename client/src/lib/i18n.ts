import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'fr';

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguage = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'memopyk-language',
    }
  )
);

export const translations = {
  en: {
    navigation: {
      services: 'Services',
      howItWorks: 'How We Work',
      gallery: 'Gallery',
      pricing: 'Pricing',
      getStarted: 'Get Started',
      tagline: 'We transform your personal photos and videos\ninto unforgettable souvenir films',
    },
    memoryProblem: {
      dailyCapture: "<strong>Every day, each of us captures life in thousands of photos and videos</strong>, from family gatherings and vacations to simple everyday moments at home.",
      laterQuote: "\"I'll sort through them later...\"",
      neverComes: "But \"later\" rarely comes. There's <strong>never enough time, energy, or the right tools</strong>.",
      buried: "These memories stay buried in phones, forgotten in hard drives, and piled up in cardboard boxes...",
      neverRelived: "They will never be <strong>relived, cherished and shared</strong>.",
      solution: "How to turn your forgotten moments into unforgettable stories?",
      memopykSolution: "MEMOPYK creates personal souvenir films from your accumulating photos and videos.",
      noMoreScrolling: "No more endless scrolling. Just meaningful memories."
    },
    hero: {
      title: 'Transform Your',
      titleHighlight: 'Memories',
      titleEnd: 'Into Beautiful Films',
      subtitle: 'Turn your photo and video collections into professionally edited keepsakes. We handle everything from upload to final film, creating emotion-driven stories your family will treasure forever.',
      cta: 'Start Your Film Journey',
      watchSample: 'Watch Sample Film',
    },
    services: {
      title: '3 Simple Steps to Your Perfect Memory Film',
      subtitle: 'Our streamlined process makes it effortless to transform your scattered memories into a cohesive, emotion-driven film that tells your story beautifully.',
      upload: {
        title: 'Effortless Upload',
        description: 'Simply drop all your raw media—from phones, cameras, or hard drives—into our secure portal. We handle duplicates and ensure no file is ever lost.',
      },
      collaborate: {
        title: 'Collaborative Selection',
        description: 'In our private interface, families can browse thumbnails, select favorites, organize folders, and add comments with real-time syncing for everyone.',
      },
      production: {
        title: 'Professional Production',
        description: 'Our creative editors weave your best moments into a cohesive, emotion-driven film with music, transitions, titles, and professional color grading.',
      },
    },
    process: {
      title: 'Why Choose MEMOPYK?',
      subtitle: 'We combine cutting-edge technology with artistic expertise to deliver memory films that exceed expectations.',
      secure: {
        title: 'Secure & Private',
        description: 'Your precious memories are protected with enterprise-grade security. Only you and your invited family members can access your content.',
      },
      collaboration: {
        title: 'Real-Time Collaboration',
        description: 'Family members can collaborate in real-time, selecting favorites and adding comments from anywhere in the world.',
      },
      editing: {
        title: 'Professional Editing',
        description: 'Our expert editors use professional tools and techniques to create cinematic quality films with perfect pacing and emotional flow.',
      },
      turnaround: {
        title: 'Fast Turnaround',
        description: 'Most projects are completed within 2-3 weeks, with rush options available for special occasions.',
      },
    },
    pricing: {
      title: 'Simple, Transparent Pricing',
      subtitle: 'Choose the package that fits your needs. All plans include unlimited revisions and lifetime access.',
      packages: {
        essential: {
          name: 'Essential',
          features: [
            'Up to 100 photos/videos',
            '5-minute memory film',
            'Music & titles included',
            '2-week delivery',
            'HD quality (1080p)',
          ],
        },
        premium: {
          name: 'Premium',
          features: [
            'Up to 300 photos/videos',
            '10-minute memory film',
            'Custom music & graphics',
            '1-week delivery',
            '4K quality (Ultra HD)',
            'Family collaboration tools',
          ],
        },
        unlimited: {
          name: 'Unlimited',
          features: [
            'Unlimited photos/videos',
            '20-minute memory film',
            'Original soundtrack creation',
            '3-day rush delivery',
            '4K + bonus formats',
            'Priority support',
            'Physical keepsake included',
          ],
        },
      },
      mostPopular: 'Most Popular',
      oneTime: 'one-time',
      choose: 'Choose',
    },
    contact: {
      title: 'Ready to Preserve Your Memories?',
      subtitle: 'Join thousands of families who have transformed their photo collections into beautiful, shareable films. Start your memory journey today.',
      form: {
        name: 'Your Name',
        email: 'Your Email',
        package: 'Select Package',
        message: 'Tell us about your project (optional)',
        submit: 'Start My Memory Film Project',
        sending: 'Sending...',
      },
      features: {
        secure: 'Secure & Private',
        fast: 'Fast Turnaround',
        revisions: 'Unlimited Revisions',
      },
      packages: {
        essential: 'Essential - $299',
        premium: 'Premium - $599',
        unlimited: 'Unlimited - $999',
      },
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: 'Find answers to common questions about our memory film services.',
      noQuestions: 'No questions available at the moment.',
    },
    footer: {
      description: 'Transform your photo and video collections into beautifully edited keepsakes. Professional memory films that tell your family\'s unique story.',
      services: {
        title: 'Services',
        memoryFilms: 'Memory Films',
        photoOrganization: 'Photo Organization',
        videoEditing: 'Video Editing',
        customProjects: 'Custom Projects',
      },
      support: {
        title: 'Support',
        faq: 'FAQ',
        contact: 'Contact Us',
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
      },
      copyright: '© 2024 MEMOPYK. All rights reserved. Made with ❤️ for families around the world.',
    },
  },
  fr: {
    navigation: {
      services: 'Services',
      howItWorks: 'Comment nous travaillons',
      gallery: 'Galerie',
      pricing: 'Tarifs',
      getStarted: 'Commencer',
      tagline: 'Nous transformons vos photos et vidéos\npersonnelles en films souvenirs inoubliables',
    },
    memoryProblem: {
      dailyCapture: "<strong>Chaque jour, chacun d'entre nous immortalise sa vie dans des milliers de photos et de vidéos</strong>, qu'il s'agisse de réunions de famille, de vacances ou de simples moments de la vie quotidienne à la maison..",
      laterQuote: "« Je les trierai plus tard... »",
      neverComes: "Mais ce « plus tard » arrive rarement. On n'a <strong>jamais assez de temps, d'énergie ou d'outils</strong>.",
      buried: "Ces souvenirs restent enfouis dans les téléphones, oubliés dans les disques durs, entassés dans des cartons....",
      neverRelived: "lls ne seront jamais <strong>revécus, chéris et partagés</strong>.",
      solution: "Comment transformer vos moments oubliés en histoires inoubliables ?",
      memopykSolution: "MEMOPYK crée des films souvenirs personnels à partir de vos photos et vidéos accumulées.",
      noMoreScrolling: "Fin du défilement sans fin. Juste des souvenirs significatifs."
    },
    hero: {
      title: 'Transformez vos',
      titleHighlight: 'Souvenirs',
      titleEnd: 'en Beaux Films',
      subtitle: 'Transformez vos collections de photos et vidéos en souvenirs professionnellement édités. Nous nous occupons de tout, du téléchargement au film final, créant des histoires émouvantes que votre famille chérira pour toujours.',
      cta: 'Commencez votre Film Souvenir',
      watchSample: 'Voir un Exemple',
    },
    services: {
      title: '3 Étapes Simples pour votre Film Souvenir Parfait',
      subtitle: 'Notre processus simplifié permet de transformer facilement vos souvenirs éparpillés en un film cohérent et émouvant qui raconte votre histoire magnifiquement.',
      upload: {
        title: 'Téléchargement Sans Effort',
        description: 'Déposez simplement tous vos médias bruts—depuis téléphones, appareils photo ou disques durs—dans notre portail sécurisé. Nous gérons les doublons et nous assurons qu\'aucun fichier ne soit jamais perdu.',
      },
      collaborate: {
        title: 'Sélection Collaborative',
        description: 'Dans notre interface privée, les familles peuvent parcourir les miniatures, sélectionner les favoris, organiser les dossiers et ajouter des commentaires avec synchronisation en temps réel pour tous.',
      },
      production: {
        title: 'Production Professionnelle',
        description: 'Nos éditeurs créatifs tissent vos meilleurs moments en un film cohérent et émouvant avec musique, transitions, titres et étalonnage professionnel.',
      },
    },
    process: {
      title: 'Pourquoi Choisir MEMOPYK?',
      subtitle: 'Nous combinons technologie de pointe et expertise artistique pour livrer des films souvenirs qui dépassent les attentes.',
      secure: {
        title: 'Sécurisé et Privé',
        description: 'Vos précieux souvenirs sont protégés par une sécurité de niveau entreprise. Seuls vous et les membres de votre famille invités peuvent accéder à votre contenu.',
      },
      collaboration: {
        title: 'Collaboration en Temps Réel',
        description: 'Les membres de la famille peuvent collaborer en temps réel, sélectionner les favoris et ajouter des commentaires depuis n\'importe où dans le monde.',
      },
      editing: {
        title: 'Montage Professionnel',
        description: 'Nos éditeurs experts utilisent des outils et techniques professionnels pour créer des films de qualité cinématographique avec un rythme parfait et un flux émotionnel.',
      },
      turnaround: {
        title: 'Livraison Rapide',
        description: 'La plupart des projets sont terminés en 2-3 semaines, avec des options express disponibles pour les occasions spéciales.',
      },
    },
    pricing: {
      title: 'Tarifs Simples et Transparents',
      subtitle: 'Choisissez le forfait qui correspond à vos besoins. Tous les plans incluent des révisions illimitées et un accès à vie.',
      packages: {
        essential: {
          name: 'Essentiel',
          features: [
            'Jusqu\'à 100 photos/vidéos',
            'Film souvenir de 5 minutes',
            'Musique et titres inclus',
            'Livraison en 2 semaines',
            'Qualité HD (1080p)',
          ],
        },
        premium: {
          name: 'Premium',
          features: [
            'Jusqu\'à 300 photos/vidéos',
            'Film souvenir de 10 minutes',
            'Musique et graphiques personnalisés',
            'Livraison en 1 semaine',
            'Qualité 4K (Ultra HD)',
            'Outils de collaboration familiale',
          ],
        },
        unlimited: {
          name: 'Illimité',
          features: [
            'Photos/vidéos illimitées',
            'Film souvenir de 20 minutes',
            'Création de bande sonore originale',
            'Livraison express en 3 jours',
            'Formats 4K + bonus',
            'Support prioritaire',
            'Souvenir physique inclus',
          ],
        },
      },
      mostPopular: 'Plus Populaire',
      oneTime: 'unique',
      choose: 'Choisir',
    },
    contact: {
      title: 'Prêt à Préserver vos Souvenirs?',
      subtitle: 'Rejoignez des milliers de familles qui ont transformé leurs collections de photos en beaux films partageables. Commencez votre voyage souvenir aujourd\'hui.',
      form: {
        name: 'Votre Nom',
        email: 'Votre Email',
        package: 'Sélectionner un Forfait',
        message: 'Parlez-nous de votre projet (optionnel)',
        submit: 'Commencer mon Projet de Film Souvenir',
        sending: 'Envoi...',
      },
      features: {
        secure: 'Sécurisé et Privé',
        fast: 'Livraison Rapide',
        revisions: 'Révisions Illimitées',
      },
      packages: {
        essential: 'Essentiel - 299$',
        premium: 'Premium - 599$',
        unlimited: 'Illimité - 999$',
      },
    },
    faq: {
      title: 'Questions Fréquemment Posées',
      subtitle: 'Trouvez des réponses aux questions courantes sur nos services.',
      noQuestions: 'Aucune question disponible pour le moment.',
    },
    footer: {
      description: 'Transformez vos collections de photos et vidéos en souvenirs magnifiquement édités. Films souvenirs professionnels qui racontent l\'histoire unique de votre famille.',
      services: {
        title: 'Services',
        memoryFilms: 'Films Souvenirs',
        photoOrganization: 'Organisation de Photos',
        videoEditing: 'Montage Vidéo',
        customProjects: 'Projets Personnalisés',
      },
      support: {
        title: 'Support',
        faq: 'FAQ',
        contact: 'Nous Contacter',
        privacy: 'Politique de Confidentialité',
        terms: 'Conditions d\'Utilisation',
      },
      copyright: '© 2024 MEMOPYK. Tous droits réservés. Fait avec ❤️ pour les familles du monde entier.',
    },
  },
};

export function useTranslations() {
  const { language } = useLanguage();
  return {
    ...translations[language],
    hero: {
      ...translations[language].hero,
      language
    }
  };
}