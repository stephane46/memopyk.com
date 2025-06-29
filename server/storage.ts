import { 
  contacts, 
  projects, 
  users, 
  faqs,
  galleryItems,
  seoSettings,
  seoConsoleReports,
  advancedCrawlReports,
  type Contact, 
  type Project, 
  type User, 
  type Faq,
  type GalleryItem,
  type SeoSetting,
  type InsertContact, 
  type InsertProject, 
  type InsertUser,
  type InsertFaq,
  type InsertGalleryItem,
  type InsertSeoSetting
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createContact(contact: InsertContact): Promise<Contact>;
  getContacts(): Promise<Contact[]>;
  
  createProject(project: InsertProject): Promise<Project>;
  getProjects(): Promise<Project[]>;
  getProjectsByUserId(userId: number): Promise<Project[]>;
  
  getFaqs(): Promise<Faq[]>;
  createFaq(faq: InsertFaq): Promise<Faq>;
  updateFaq(id: string, faq: Partial<InsertFaq>): Promise<Faq>;
  deleteFaq(id: string): Promise<void>;
  reorderSections(sectionOrders: { section: string; sectionOrder: number }[]): Promise<void>;
  reorderFaqsInSection(faqOrders: { id: string; order: number }[]): Promise<void>;
  moveFaqToSection(faqId: string, newSection: string, newOrder: number): Promise<Faq>;
  updateSectionNames(section: string, sectionNameEn: string, sectionNameFr?: string): Promise<void>;
  
  getGalleryItems(): Promise<GalleryItem[]>;
  createGalleryItem(item: InsertGalleryItem): Promise<GalleryItem>;
  updateGalleryItem(id: string, item: Partial<InsertGalleryItem>): Promise<GalleryItem>;
  deleteGalleryItem(id: string): Promise<void>;
  reorderGalleryItems(itemOrders: { id: string; order: number }[]): Promise<void>;
  
  getSeoSettings(): Promise<SeoSetting[]>;
  getSeoSettingByPage(page: string): Promise<SeoSetting | undefined>;
  getSeoSettingById(id: string): Promise<SeoSetting | undefined>;
  createSeoSetting(setting: InsertSeoSetting): Promise<SeoSetting>;
  updateSeoSetting(id: string, setting: Partial<InsertSeoSetting>): Promise<SeoSetting>;
  deleteSeoSetting(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contacts: Map<number, Contact>;
  private projects: Map<number, Project>;
  private faqs: Map<string, Faq>;
  private galleryItems: Map<string, GalleryItem>;
  private seoSettings: Map<string, SeoSetting>;
  private currentUserId: number;
  private currentContactId: number;
  private currentProjectId: number;
  private currentFaqId: number;
  private currentGalleryItemId: number;

  constructor() {
    this.users = new Map();
    this.contacts = new Map();
    this.projects = new Map();
    this.faqs = new Map();
    this.galleryItems = new Map();
    this.seoSettings = new Map();
    this.currentUserId = 1;
    this.currentContactId = 1;
    this.currentProjectId = 1;
    this.currentFaqId = 1;
    this.currentGalleryItemId = 1;
    
    // Initialize with sample data
    this.initializeSampleFaqs();
    this.initializeSampleGalleryItems();
    this.initializeSampleSeoSettings();
  }

  private initializeSampleFaqs() {
    const sampleFaqs = [
      {
        questionEn: "How long does it take to create a memory film?",
        questionFr: "Combien de temps faut-il pour créer un film souvenir ?",
        answerEn: "Our typical turnaround time is 2-3 weeks for most projects. Premium packages include faster delivery options, and we offer rush services for special occasions with 3-day delivery.",
        answerFr: "Notre délai habituel est de 2 à 3 semaines pour la plupart des projets. Les forfaits Premium incluent des options de livraison plus rapides, et nous offrons des services express pour les occasions spéciales avec livraison en 3 jours.",
        order: 1,
        isActive: true
      },
      {
        questionEn: "What file formats do you accept?",
        questionFr: "Quels formats de fichiers acceptez-vous ?",
        answerEn: "We accept all common photo and video formats including JPG, PNG, HEIC, MP4, MOV, AVI, and many others. Our system automatically processes and optimizes your media regardless of the source device.",
        answerFr: "Nous acceptons tous les formats photo et vidéo courants, y compris JPG, PNG, HEIC, MP4, MOV, AVI, et bien d'autres. Notre système traite et optimise automatiquement vos médias quel que soit l'appareil source.",
        order: 2,
        isActive: true
      },
      {
        questionEn: "Is my content secure and private?",
        questionFr: "Mon contenu est-il sécurisé et privé ?",
        answerEn: "Absolutely. We use enterprise-grade security with encrypted storage and transmission. Only you and family members you invite can access your content. We never share or use your media for any other purpose.",
        answerFr: "Absolument. Nous utilisons une sécurité de niveau entreprise avec stockage et transmission cryptés. Seuls vous et les membres de votre famille que vous invitez peuvent accéder à votre contenu. Nous ne partageons jamais ni n'utilisons vos médias à d'autres fins.",
        order: 3,
        isActive: true
      },
      {
        questionEn: "Can I request changes to my memory film?",
        questionFr: "Puis-je demander des modifications à mon film souvenir ?",
        answerEn: "Yes! All our packages include unlimited revisions. We work with you until you're completely satisfied with your memory film. Our collaborative platform makes it easy to provide feedback and request specific changes.",
        answerFr: "Oui ! Tous nos forfaits incluent des révisions illimitées. Nous travaillons avec vous jusqu'à ce que vous soyez complètement satisfait de votre film souvenir. Notre plateforme collaborative facilite les commentaires et les demandes de modifications spécifiques.",
        order: 4,
        isActive: true
      },
      {
        questionEn: "What's included in the final delivery?",
        questionFr: "Qu'est-ce qui est inclus dans la livraison finale ?",
        answerEn: "You'll receive your memory film in multiple formats optimized for different uses: HD/4K video files, web-friendly versions for easy sharing, and depending on your package, physical keepsakes like USB drives or custom packaging.",
        answerFr: "Vous recevrez votre film souvenir en plusieurs formats optimisés pour différents usages : fichiers vidéo HD/4K, versions web pour un partage facile, et selon votre forfait, des souvenirs physiques comme des clés USB ou un emballage personnalisé.",
        order: 5,
        isActive: true
      }
    ];

    sampleFaqs.forEach(faq => {
      const id = `${this.currentFaqId++}`;
      this.faqs.set(id, {
        id,
        section: "getting-started",
        sectionNameEn: "Getting Started",
        sectionNameFr: "Commencer",
        sectionOrder: 1,
        order: faq.order || 1,
        isActive: faq.isActive ?? true,
        questionEn: faq.questionEn,
        questionFr: faq.questionFr,
        answerEn: faq.answerEn,
        answerFr: faq.answerFr,
        createdAt: new Date()
      });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = this.currentContactId++;
    const contact: Contact = { 
      ...insertContact, 
      id,
      message: insertContact.message || null,
      createdAt: new Date()
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async getContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const project: Project = { 
      ...insertProject, 
      id,
      userId: insertProject.userId || null,
      status: insertProject.status || "pending",
      createdAt: new Date()
    };
    this.projects.set(id, project);
    return project;
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return Array.from(this.projects.values())
      .filter(project => project.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getFaqs(): Promise<Faq[]> {
    return Array.from(this.faqs.values()).sort((a, b) => a.section.localeCompare(b.section));
  }

  async createFaq(insertFaq: InsertFaq): Promise<Faq> {
    const id = `${this.currentFaqId++}`;
    const faq: Faq = { 
      ...insertFaq,
      id,
      order: insertFaq.order || 1,
      sectionOrder: insertFaq.sectionOrder || 1,
      isActive: insertFaq.isActive ?? true,
      createdAt: new Date()
    };
    this.faqs.set(id, faq);
    return faq;
  }

  async updateFaq(id: string, updates: Partial<InsertFaq>): Promise<Faq> {
    const existing = this.faqs.get(id);
    if (!existing) {
      throw new Error(`FAQ with id ${id} not found`);
    }
    
    const updated: Faq = {
      ...existing,
      ...updates
    };
    
    this.faqs.set(id, updated);
    return updated;
  }

  async deleteFaq(id: string): Promise<void> {
    const deleted = this.faqs.delete(id);
    if (!deleted) {
      throw new Error(`FAQ with id ${id} not found`);
    }
  }

  async reorderSections(sectionOrders: { section: string; sectionOrder: number }[]): Promise<void> {
    for (const { section, sectionOrder } of sectionOrders) {
      for (const faq of Array.from(this.faqs.values())) {
        if (faq.section === section) {
          faq.sectionOrder = sectionOrder;
        }
      }
    }
  }

  async reorderFaqsInSection(faqOrders: { id: string; order: number }[]): Promise<void> {
    for (const { id, order } of faqOrders) {
      const faq = this.faqs.get(id);
      if (faq) {
        faq.order = order;
      }
    }
  }

  async moveFaqToSection(faqId: string, newSection: string, newOrder: number): Promise<Faq> {
    const faq = this.faqs.get(faqId);
    if (!faq) {
      throw new Error(`FAQ with id ${faqId} not found`);
    }
    
    // Find section names from existing FAQs in the target section
    const existingFaq = Array.from(this.faqs.values()).find(f => f.section === newSection);
    if (!existingFaq) {
      throw new Error(`Section ${newSection} not found`);
    }
    
    faq.section = newSection;
    faq.sectionNameEn = existingFaq.sectionNameEn;
    faq.sectionNameFr = existingFaq.sectionNameFr;
    faq.sectionOrder = existingFaq.sectionOrder;
    faq.order = newOrder;
    
    return faq;
  }

  async updateSectionNames(section: string, sectionNameEn: string, sectionNameFr?: string): Promise<void> {
    // Update all FAQs in the section with new names
    Array.from(this.faqs.values()).forEach(faq => {
      if (faq.section === section) {
        faq.sectionNameEn = sectionNameEn;
        if (sectionNameFr) {
          faq.sectionNameFr = sectionNameFr;
        }
      }
    });
  }

  private initializeSampleGalleryItems() {
    // Initialize with current gallery content
    const sampleItems = [
      {
        id: "1",
        titleEn: "Sea Vitamin",
        titleFr: "Vitamine de Mer",
        descriptionEn: "50 videos • 300 photos • 5 min • USD 350",
        descriptionFr: "50 vidéos • 300 photos • 5 min • 350 USD",
        additionalInfoEn: ["Capturing precious moments from your seaside adventure", "Professional editing with music and transitions"],
        additionalInfoFr: ["Capturer les moments précieux de votre aventure balnéaire", "Montage professionnel avec musique et transitions"],
        priceEn: "USD 350",
        priceFr: "350 USD",
        imageUrlEn: "https://images.unsplash.com/photo-1609220136736-443140cffec6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        imageUrlFr: "https://images.unsplash.com/photo-1609220136736-443140cffec6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
        videoUrlEn: null,
        videoUrlFr: null,
        altTextEn: "Multi-generational family portrait",
        altTextFr: "Portrait de famille multigénérationnelle",
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    sampleItems.forEach((item) => {
      this.galleryItems.set(item.id, item as GalleryItem);
    });
  }

  async getGalleryItems(): Promise<GalleryItem[]> {
    return Array.from(this.galleryItems.values()).sort((a, b) => a.order - b.order);
  }

  async createGalleryItem(insertItem: InsertGalleryItem): Promise<GalleryItem> {
    const id = `gallery-${this.currentGalleryItemId++}`;
    const item: GalleryItem = { 
      ...insertItem,
      id,
      order: insertItem.order ?? 0,
      isActive: insertItem.isActive ?? true,
      priceEn: insertItem.priceEn ?? null,
      priceFr: insertItem.priceFr ?? null,
      videoUrlEn: insertItem.videoUrlEn ?? null,
      videoUrlFr: insertItem.videoUrlFr ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.galleryItems.set(id, item);
    return item;
  }

  async updateGalleryItem(id: string, updates: Partial<InsertGalleryItem>): Promise<GalleryItem> {
    const item = this.galleryItems.get(id);
    if (!item) {
      throw new Error(`Gallery item ${id} not found`);
    }
    
    const updated: GalleryItem = {
      ...item,
      ...updates,
      updatedAt: new Date(),
    };
    this.galleryItems.set(id, updated);
    return updated;
  }

  async deleteGalleryItem(id: string): Promise<void> {
    this.galleryItems.delete(id);
  }

  async reorderGalleryItems(itemOrders: { id: string; order: number }[]): Promise<void> {
    itemOrders.forEach(({ id, order }) => {
      const item = this.galleryItems.get(id);
      if (item) {
        item.order = order;
        item.updatedAt = new Date();
      }
    });
  }

  private initializeSampleSeoSettings() {
    const homeSetting: SeoSetting = {
      id: crypto.randomUUID(),
      page: "home",
      urlSlug: "/",
      metaTitle: "MEMOPYK - Transform Your Photos & Videos Into Personal Films",
      metaDescription: "Professional memory film service that transforms your photo and video collections into beautifully edited cinematic keepsakes. Preserve your memories forever.",
      robotsDirectives: "index,follow",
      canonicalUrl: "https://memopyk.com/",
      ogTitle: "MEMOPYK - Transform Your Photos & Videos Into Personal Films",
      ogDescription: "Professional memory film service that transforms your photo and video collections into beautifully edited cinematic keepsakes.",
      ogImageUrl: "https://memopyk.com/og-image.jpg",
      twitterTitle: "MEMOPYK - Transform Your Photos & Videos Into Personal Films",
      twitterDescription: "Professional memory film service that transforms your photo and video collections into beautifully edited cinematic keepsakes.",
      twitterImageUrl: "https://memopyk.com/twitter-image.jpg",
      jsonLd: null,
      autoGenerateFaq: false,
      autoGenerateVideos: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.seoSettings.set(homeSetting.id, homeSetting);
  }

  async getSeoSettings(): Promise<SeoSetting[]> {
    return Array.from(this.seoSettings.values());
  }

  async getSeoSettingByPage(page: string): Promise<SeoSetting | undefined> {
    return Array.from(this.seoSettings.values()).find(setting => setting.page === page);
  }

  async getSeoSettingById(id: string): Promise<SeoSetting | undefined> {
    return this.seoSettings.get(id);
  }

  async createSeoSetting(insertSetting: InsertSeoSetting): Promise<SeoSetting> {
    const id = crypto.randomUUID();
    const setting: SeoSetting = { 
      id,
      page: insertSetting.page,
      urlSlug: insertSetting.urlSlug,
      metaTitle: insertSetting.metaTitle ?? null,
      metaDescription: insertSetting.metaDescription ?? null,
      robotsDirectives: insertSetting.robotsDirectives ?? "index,follow",
      canonicalUrl: insertSetting.canonicalUrl ?? null,
      ogTitle: insertSetting.ogTitle ?? null,
      ogDescription: insertSetting.ogDescription ?? null,
      ogImageUrl: insertSetting.ogImageUrl ?? null,
      twitterTitle: insertSetting.twitterTitle ?? null,
      twitterDescription: insertSetting.twitterDescription ?? null,
      twitterImageUrl: insertSetting.twitterImageUrl ?? null,
      jsonLd: insertSetting.jsonLd ?? null,
      autoGenerateFaq: insertSetting.autoGenerateFaq ?? false,
      autoGenerateVideos: insertSetting.autoGenerateVideos ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.seoSettings.set(id, setting);
    return setting;
  }

  async updateSeoSetting(id: string, updates: Partial<InsertSeoSetting>): Promise<SeoSetting> {
    const setting = this.seoSettings.get(id);
    if (!setting) {
      throw new Error(`SEO setting ${id} not found`);
    }
    
    const updated: SeoSetting = {
      ...setting,
      ...Object.fromEntries(
        Object.entries(updates).map(([key, value]) => [key, value ?? null])
      ),
      updatedAt: new Date(),
    };
    this.seoSettings.set(id, updated);
    return updated;
  }

  async deleteSeoSetting(id: string): Promise<void> {
    this.seoSettings.delete(id);
  }
}

// Database storage implementation
export class DbStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const result = await db.insert(contacts).values(insertContact).returning();
    return result[0];
  }

  async getContacts(): Promise<Contact[]> {
    return await db.select().from(contacts).orderBy(contacts.createdAt);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(insertProject).returning();
    return result[0];
  }

  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(projects.createdAt);
  }

  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(projects.createdAt);
  }

  async getFaqs(): Promise<Faq[]> {
    return await db.select().from(faqs).orderBy(faqs.sectionOrder, faqs.order);
  }

  async createFaq(insertFaq: InsertFaq): Promise<Faq> {
    const result = await db.insert(faqs).values(insertFaq).returning();
    return result[0];
  }

  async updateFaq(id: string, updates: Partial<InsertFaq>): Promise<Faq> {
    try {
      const result = await db.update(faqs).set(updates).where(eq(faqs.id, id)).returning();
      if (result.length === 0) {
        throw new Error(`FAQ with id ${id} not found`);
      }
      return result[0];
    } catch (error: any) {
      console.error('Database update error:', error);
      throw new Error(`Failed to update FAQ: ${error.message}`);
    }
  }

  async deleteFaq(id: string): Promise<void> {
    try {
      const result = await db.delete(faqs).where(eq(faqs.id, id)).returning();
      console.log('Delete result:', result);
      
      if (result.length === 0) {
        console.log(`FAQ with id ${id} was already deleted or not found`);
        // Don't throw error if already deleted - this is expected behavior
        return;
      }
      
      console.log(`Successfully deleted FAQ ${id}`);
    } catch (error) {
      console.error('Database delete error:', error);
      throw new Error(`Failed to delete FAQ: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async reorderSections(sectionOrders: { section: string; sectionOrder: number }[]): Promise<void> {
    for (const { section, sectionOrder } of sectionOrders) {
      await db.update(faqs)
        .set({ sectionOrder })
        .where(eq(faqs.section, section));
    }
  }

  async reorderFaqsInSection(faqOrders: { id: string; order: number }[]): Promise<void> {
    for (const { id, order } of faqOrders) {
      await db.update(faqs)
        .set({ order })
        .where(eq(faqs.id, id));
    }
  }

  async moveFaqToSection(faqId: string, newSection: string, newOrder: number): Promise<Faq> {
    // Get the target section info
    const targetSectionFaq = await db.select()
      .from(faqs)
      .where(eq(faqs.section, newSection))
      .limit(1);
      
    if (targetSectionFaq.length === 0) {
      throw new Error(`Section ${newSection} not found`);
    }
    
    const result = await db.update(faqs)
      .set({ 
        section: newSection,
        sectionNameEn: targetSectionFaq[0].sectionNameEn,
        sectionNameFr: targetSectionFaq[0].sectionNameFr,
        sectionOrder: targetSectionFaq[0].sectionOrder,
        order: newOrder
      })
      .where(eq(faqs.id, faqId))
      .returning();
      
    if (result.length === 0) {
      throw new Error(`FAQ with id ${faqId} not found`);
    }
    
    return result[0];
  }

  async updateSectionNames(section: string, sectionNameEn: string, sectionNameFr?: string): Promise<void> {
    const updateData: any = { sectionNameEn };
    if (sectionNameFr !== undefined) {
      updateData.sectionNameFr = sectionNameFr;
    }

    console.log('Updating section names:', { section, sectionNameEn, sectionNameFr, updateData });
    
    const result = await db.update(faqs)
      .set(updateData)
      .where(eq(faqs.section, section))
      .returning();
      
    console.log('Section names update result:', result.length, 'FAQs updated');
  }

  async getGalleryItems(): Promise<GalleryItem[]> {
    return await db.select().from(galleryItems).where(eq(galleryItems.isActive, true)).orderBy(galleryItems.order);
  }

  async createGalleryItem(insertItem: InsertGalleryItem): Promise<GalleryItem> {
    const id = `gallery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const result = await db.insert(galleryItems).values({ ...insertItem, id }).returning();
    return result[0];
  }

  async updateGalleryItem(id: string, updates: Partial<InsertGalleryItem>): Promise<GalleryItem> {
    const result = await db.update(galleryItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(galleryItems.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error(`Gallery item with id ${id} not found`);
    }
    
    return result[0];
  }

  async deleteGalleryItem(id: string): Promise<void> {
    await db.delete(galleryItems).where(eq(galleryItems.id, id));
  }

  async reorderGalleryItems(itemOrders: { id: string; order: number }[]): Promise<void> {
    for (const { id, order } of itemOrders) {
      await db.update(galleryItems)
        .set({ order, updatedAt: new Date() })
        .where(eq(galleryItems.id, id));
    }
  }

  async getSeoSettings(): Promise<SeoSetting[]> {
    return await db.select().from(seoSettings).orderBy(seoSettings.page);
  }

  async getSeoSettingByPage(page: string): Promise<SeoSetting | undefined> {
    const result = await db.select().from(seoSettings).where(eq(seoSettings.page, page)).limit(1);
    return result[0];
  }

  async getSeoSettingById(id: string): Promise<SeoSetting | undefined> {
    const result = await db.select().from(seoSettings).where(eq(seoSettings.id, id)).limit(1);
    return result[0];
  }

  async createSeoSetting(insertSetting: InsertSeoSetting): Promise<SeoSetting> {
    const result = await db.insert(seoSettings).values(insertSetting).returning();
    return result[0];
  }

  async updateSeoSetting(id: string, updates: Partial<InsertSeoSetting>): Promise<SeoSetting> {
    const result = await db.update(seoSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(seoSettings.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error(`SEO setting with id ${id} not found`);
    }
    
    return result[0];
  }

  async deleteSeoSetting(id: string): Promise<void> {
    await db.delete(seoSettings).where(eq(seoSettings.id, id));
  }
}

// Use database storage if DATABASE_URL is available, otherwise use memory storage
export const storage = process.env.DATABASE_URL ? new DbStorage() : new MemStorage();

// Log connection status
if (process.env.DATABASE_URL) {
  console.log("[Storage] Connecting to Supabase database...");
} else {
  console.log("[Storage] Using memory storage - no DATABASE_URL found");
}
