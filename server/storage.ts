import { drizzle } from "drizzle-orm/postgres-js";
import { asc, desc, eq, ilike } from "drizzle-orm";
import postgres from "postgres";
import {
  heroVideos,
  galleryItems,
  faqs,
  seoSettings,
  contacts,
  deployments,
  type HeroVideo,
  type InsertHeroVideo,
  type GalleryItem,
  type InsertGalleryItem,
  type Faq,
  type InsertFaq,
  type SeoSetting,
  type InsertSeoSetting,
  type Contact,
  type InsertContact,
  type Deployment,
  type InsertDeployment,
} from "../shared/schema.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

// Debug: Log the connection string to verify it's correct
console.log("Database connection string found:", connectionString.replace(/:[^:@]*@/, ":[PASSWORD]@"));

console.log("Database connection string found:", connectionString.split('@')[0] + '@[HOST]');

// Create a connection to the database
const client = postgres(connectionString);
const db = drizzle(client);

// Test the actual connection endpoint  
client`SELECT inet_server_addr() as server_ip, inet_server_port() as server_port, current_database() as db_name`
  .then(result => {
    console.log("ACTUAL DATABASE CONNECTION:", result[0]);
  })
  .catch(err => {
    console.error("Database connection test failed:", err);
  });

export interface IStorage {
  // Hero Videos
  getHeroVideos(): Promise<HeroVideo[]>;
  getHeroVideo(id: string): Promise<HeroVideo | undefined>;
  createHeroVideo(video: InsertHeroVideo): Promise<HeroVideo>;
  updateHeroVideo(id: string, video: Partial<InsertHeroVideo>): Promise<HeroVideo>;
  deleteHeroVideo(id: string): Promise<void>;
  reorderHeroVideos(videoIds: string[]): Promise<void>;

  // Gallery Items
  getGalleryItems(): Promise<GalleryItem[]>;
  getGalleryItem(id: string): Promise<GalleryItem | undefined>;
  createGalleryItem(item: InsertGalleryItem): Promise<GalleryItem>;
  updateGalleryItem(id: string, item: Partial<InsertGalleryItem>): Promise<GalleryItem>;
  deleteGalleryItem(id: string): Promise<void>;
  reorderGalleryItems(itemIds: string[]): Promise<void>;

  // FAQs
  getFaqs(): Promise<Faq[]>;
  getFaq(id: string): Promise<Faq | undefined>;
  getFaqsBySection(section: string): Promise<Faq[]>;
  createFaq(faq: InsertFaq): Promise<Faq>;
  updateFaq(id: string, faq: Partial<InsertFaq>): Promise<Faq>;
  deleteFaq(id: string): Promise<void>;
  reorderFaqs(faqIds: string[]): Promise<void>;

  // SEO Settings
  getSeoSettings(): Promise<SeoSetting[]>;
  getSeoSettingByPage(page: string): Promise<SeoSetting | undefined>;
  createSeoSetting(setting: InsertSeoSetting): Promise<SeoSetting>;
  updateSeoSetting(id: string, setting: Partial<InsertSeoSetting>): Promise<SeoSetting>;
  deleteSeoSetting(id: string): Promise<void>;

  // Contacts
  getContacts(): Promise<Contact[]>;
  getContact(id: string): Promise<Contact | undefined>;

  // Deployments
  getDeployments(): Promise<Deployment[]>;
  getDeploymentsByEnvironment(environment: string): Promise<Deployment[]>;
  createDeployment(deployment: InsertDeployment): Promise<Deployment>;
  updateDeployment(id: string, deployment: Partial<Deployment>): Promise<Deployment>;

  // Stats
  getStats(): Promise<{
    heroVideos: number;
    galleryItems: number;
    faqSections: number;
    contacts: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Hero Videos
  async getHeroVideos(): Promise<HeroVideo[]> {
    return await db.select().from(heroVideos).orderBy(asc(heroVideos.orderIndex));
  }

  async getHeroVideo(id: string): Promise<HeroVideo | undefined> {
    const result = await db.select().from(heroVideos).where(eq(heroVideos.id, id));
    return result[0];
  }

  async createHeroVideo(video: InsertHeroVideo): Promise<HeroVideo> {
    const result = await db.insert(heroVideos).values(video).returning();
    return result[0];
  }

  async updateHeroVideo(id: string, video: Partial<InsertHeroVideo>): Promise<HeroVideo> {
    const result = await db.update(heroVideos)
      .set({ ...video, updatedAt: new Date() })
      .where(eq(heroVideos.id, id))
      .returning();
    return result[0];
  }

  async deleteHeroVideo(id: string): Promise<void> {
    await db.delete(heroVideos).where(eq(heroVideos.id, id));
  }

  async reorderHeroVideos(videoIds: string[]): Promise<void> {
    for (let i = 0; i < videoIds.length; i++) {
      await db.update(heroVideos)
        .set({ orderIndex: i })
        .where(eq(heroVideos.id, videoIds[i]));
    }
  }

  // Gallery Items
  async getGalleryItems(): Promise<GalleryItem[]> {
    return await db.select().from(galleryItems).orderBy(asc(galleryItems.orderIndex));
  }

  async getGalleryItem(id: string): Promise<GalleryItem | undefined> {
    const result = await db.select().from(galleryItems).where(eq(galleryItems.id, id));
    return result[0];
  }

  async createGalleryItem(item: InsertGalleryItem): Promise<GalleryItem> {
    const result = await db.insert(galleryItems).values(item).returning();
    return result[0];
  }

  async updateGalleryItem(id: string, item: Partial<InsertGalleryItem>): Promise<GalleryItem> {
    const result = await db.update(galleryItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(galleryItems.id, id))
      .returning();
    return result[0];
  }

  async deleteGalleryItem(id: string): Promise<void> {
    await db.delete(galleryItems).where(eq(galleryItems.id, id));
  }

  async reorderGalleryItems(itemIds: string[]): Promise<void> {
    for (let i = 0; i < itemIds.length; i++) {
      await db.update(galleryItems)
        .set({ orderIndex: i })
        .where(eq(galleryItems.id, itemIds[i]));
    }
  }

  // FAQs
  async getFaqs(): Promise<Faq[]> {
    return await db.select().from(faqs).orderBy(asc(faqs.sectionOrder), asc(faqs.orderIndex));
  }

  async getFaq(id: string): Promise<Faq | undefined> {
    const result = await db.select().from(faqs).where(eq(faqs.id, id));
    return result[0];
  }

  async getFaqsBySection(section: string): Promise<Faq[]> {
    return await db.select().from(faqs)
      .where(eq(faqs.section, section))
      .orderBy(asc(faqs.orderIndex));
  }

  async createFaq(faq: InsertFaq): Promise<Faq> {
    // Get existing FAQs in the same section to determine proper orderIndex
    const existingFaqsInSection = await this.getFaqsBySection(faq.section);
    const maxOrderIndex = existingFaqsInSection.length;
    
    // Get max sectionOrder for new sections
    const allFaqs = await db.select().from(faqs);
    const existingSectionOrder = allFaqs.find(f => f.section === faq.section)?.sectionOrder;
    const maxSectionOrder = existingSectionOrder ?? Math.max(0, ...allFaqs.map(f => f.sectionOrder), -1) + 1;
    
    const faqWithOrder = {
      ...faq,
      orderIndex: maxOrderIndex,
      sectionOrder: maxSectionOrder
    };
    
    const result = await db.insert(faqs).values(faqWithOrder).returning();
    return result[0];
  }

  async updateFaq(id: string, faq: Partial<InsertFaq>): Promise<Faq> {
    const result = await db.update(faqs)
      .set({ ...faq, updatedAt: new Date() })
      .where(eq(faqs.id, id))
      .returning();
    return result[0];
  }

  async deleteFaq(id: string): Promise<void> {
    await db.delete(faqs).where(eq(faqs.id, id));
  }

  async reorderFaqs(faqIds: string[]): Promise<void> {
    console.log("Starting reorderFaqs with:", faqIds);
    
    // Get all current FAQs to understand their sections
    const allFaqs = await this.getFaqs();
    const faqMap = new Map(allFaqs.map(faq => [faq.id, faq]));
    
    // Track sections in the order they appear in the reordered list
    const sectionsInOrder: string[] = [];
    const sectionFaqs = new Map<string, string[]>();
    
    for (const faqId of faqIds) {
      const faq = faqMap.get(faqId);
      if (!faq) continue;
      
      if (!sectionFaqs.has(faq.section)) {
        sectionsInOrder.push(faq.section);
        sectionFaqs.set(faq.section, []);
      }
      sectionFaqs.get(faq.section)!.push(faqId);
    }
    
    console.log("Sections in order:", sectionsInOrder);
    console.log("Section FAQs:", Array.from(sectionFaqs.entries()));
    
    // Update each FAQ with correct sectionOrder and orderIndex
    for (let sectionIdx = 0; sectionIdx < sectionsInOrder.length; sectionIdx++) {
      const section = sectionsInOrder[sectionIdx];
      const faqsInSection = sectionFaqs.get(section)!;
      
      for (let faqIdx = 0; faqIdx < faqsInSection.length; faqIdx++) {
        const faqId = faqsInSection[faqIdx];
        console.log(`Setting FAQ ${faqId} to sectionOrder ${sectionIdx}, orderIndex ${faqIdx}`);
        
        await db.update(faqs)
          .set({ 
            sectionOrder: sectionIdx,
            orderIndex: faqIdx,
            updatedAt: new Date()
          })
          .where(eq(faqs.id, faqId));
      }
    }
    
    console.log("Reorder completed");
  }

  // SEO Settings
  async getSeoSettings(): Promise<SeoSetting[]> {
    return await db.select().from(seoSettings);
  }

  async getSeoSettingByPage(page: string): Promise<SeoSetting | undefined> {
    const result = await db.select().from(seoSettings).where(eq(seoSettings.page, page));
    return result[0];
  }

  async createSeoSetting(setting: InsertSeoSetting): Promise<SeoSetting> {
    const result = await db.insert(seoSettings).values(setting).returning();
    return result[0];
  }

  async updateSeoSetting(id: string, setting: Partial<InsertSeoSetting>): Promise<SeoSetting> {
    const result = await db.update(seoSettings)
      .set({ ...setting, updatedAt: new Date() })
      .where(eq(seoSettings.id, id))
      .returning();
    return result[0];
  }

  async deleteSeoSetting(id: string): Promise<void> {
    await db.delete(seoSettings).where(eq(seoSettings.id, id));
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return await db.select().from(contacts).orderBy(desc(contacts.createdAt));
  }

  async getContact(id: string): Promise<Contact | undefined> {
    const result = await db.select().from(contacts).where(eq(contacts.id, id));
    return result[0];
  }

  // Deployments
  async getDeployments(): Promise<Deployment[]> {
    return await db.select().from(deployments).orderBy(desc(deployments.startedAt));
  }

  async getDeploymentsByEnvironment(environment: string): Promise<Deployment[]> {
    return await db.select().from(deployments)
      .where(eq(deployments.environment, environment))
      .orderBy(desc(deployments.startedAt));
  }

  async createDeployment(deployment: InsertDeployment): Promise<Deployment> {
    const result = await db.insert(deployments).values(deployment).returning();
    return result[0];
  }

  async updateDeployment(id: string, deployment: Partial<Deployment>): Promise<Deployment> {
    const result = await db.update(deployments)
      .set(deployment)
      .where(eq(deployments.id, id))
      .returning();
    return result[0];
  }

  // Stats
  async getStats(): Promise<{
    heroVideos: number;
    galleryItems: number;
    faqSections: number;
    contacts: number;
  }> {
    const [heroVideoCount] = await db.select({ count: heroVideos.id }).from(heroVideos);
    const [galleryItemCount] = await db.select({ count: galleryItems.id }).from(galleryItems);
    const [contactCount] = await db.select({ count: contacts.id }).from(contacts);
    
    // Count unique FAQ sections
    const faqSectionsResult = await db.selectDistinct({ section: faqs.section }).from(faqs);
    
    return {
      heroVideos: heroVideoCount?.count ? Object.keys(heroVideoCount).length : 0,
      galleryItems: galleryItemCount?.count ? Object.keys(galleryItemCount).length : 0,
      faqSections: faqSectionsResult.length,
      contacts: contactCount?.count ? Object.keys(contactCount).length : 0,
    };
  }
}

export const storage = new DatabaseStorage();