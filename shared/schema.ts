import { pgTable, text, serial, integer, boolean, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  package: text("package").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").references(() => users.id),
  package: text("package").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const faqs = pgTable("faqs", {
  id: uuid("id").defaultRandom().primaryKey(),
  section: text("section").notNull(), // Language-neutral identifier (e.g., "general", "services")
  sectionNameEn: text("section_name_en").notNull(), // English display name (e.g., "General")
  sectionNameFr: text("section_name_fr").notNull(), // French display name (e.g., "Général")
  sectionOrder: integer("section_order").default(0), // Order of sections
  order: integer("order").default(0), // Order within section
  isActive: boolean("is_active").default(true), // Show/hide FAQ
  questionEn: text("question_en").notNull(),
  questionFr: text("question_fr").notNull(),
  answerEn: text("answer_en").notNull(),
  answerFr: text("answer_fr").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const galleryItems = pgTable("gallery_items", {
  id: text("id").primaryKey(),
  titleEn: text("title_en").notNull(),
  titleFr: text("title_fr").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionFr: text("description_fr").notNull(),
  additionalInfoEn: text("additional_info_en").array().notNull(),
  additionalInfoFr: text("additional_info_fr").array().notNull(),
  priceEn: text("price_en"), // e.g. "USD 325", "$450"
  priceFr: text("price_fr"), // e.g. "325 USD", "450 $", "300 €"
  imageUrlEn: text("image_url_en").notNull(),
  imageUrlFr: text("image_url_fr").notNull(),
  videoUrlEn: text("video_url_en"), // English version video
  videoUrlFr: text("video_url_fr"), // French version video
  altTextEn: text("alt_text_en").notNull(),
  altTextFr: text("alt_text_fr").notNull(),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const seoSettings = pgTable("seo_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  page: text("page").notNull(), // e.g. "home", "faq", "videos"
  urlSlug: text("url_slug").notNull(), // e.g. "/", "/faq", "/videos"
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  robotsDirectives: text("robots_directives").default("index,follow"),
  canonicalUrl: text("canonical_url"),
  ogTitle: text("og_title"),
  ogDescription: text("og_description"),
  ogImageUrl: text("og_image_url"),
  twitterTitle: text("twitter_title"),
  twitterDescription: text("twitter_description"),
  twitterImageUrl: text("twitter_image_url"),
  jsonLd: jsonb("json_ld"), // Manual JSON-LD snippet
  autoGenerateFaq: boolean("auto_generate_faq").default(false).notNull(),
  autoGenerateVideos: boolean("auto_generate_videos").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const seoConsoleReports = pgTable("seo_console_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  url: text("url").notNull(),
  pageKey: text("page_key").notNull(),
  locale: text("locale").notNull().default("en"),
  indexingStatus: text("indexing_status"), // 'indexed', 'not_indexed', 'blocked', 'error'
  lastCrawlTime: timestamp("last_crawl_time"),
  crawlErrors: jsonb("crawl_errors"), // Array of error objects
  mobileUsabilityIssues: jsonb("mobile_usability_issues"),
  coreWebVitals: jsonb("core_web_vitals"), // LCP, FID, CLS scores
  impressions: integer("impressions"),
  clicks: integer("clicks"),
  averagePosition: integer("average_position"),
  clickThroughRate: integer("click_through_rate"),
  coverage: text("coverage"), // 'valid', 'error', 'excluded', 'warning'
  reportDate: timestamp("report_date").defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const advancedCrawlReports = pgTable("advanced_crawl_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  seoSettingId: uuid("seo_setting_id").references(() => seoSettings.id),
  url: text("url").notNull(),
  crawlStatus: text("crawl_status").notNull(), // 'success', 'error', 'timeout'
  httpStatus: integer("http_status"),
  responseTime: integer("response_time"), // milliseconds
  headHtml: text("head_html"), // Captured <head> content
  metaSnapshot: jsonb("meta_snapshot"), // Extracted meta tags
  screenshotUrl: text("screenshot_url"),
  errorDetails: text("error_details"),
  performanceMetrics: jsonb("performance_metrics"), // Load times, resource counts
  seoScore: integer("seo_score"), // 0-100 calculated score
  recommendations: jsonb("recommendations"), // Array of improvement suggestions
  previousReportId: uuid("previous_report_id"), // For diffing
  diffSummary: jsonb("diff_summary"), // Changes from previous crawl
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertContactSchema = createInsertSchema(contacts).pick({
  name: true,
  email: true,
  package: true,
  message: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  userId: true,
  package: true,
  status: true,
});

export const insertFaqSchema = createInsertSchema(faqs).pick({
  section: true,
  sectionNameEn: true,
  sectionNameFr: true,
  sectionOrder: true,
  order: true,
  isActive: true,
  questionEn: true,
  questionFr: true,
  answerEn: true,
  answerFr: true,
});

export const updateFaqSchema = insertFaqSchema.partial();

export const insertGalleryItemSchema = createInsertSchema(galleryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateGalleryItemSchema = insertGalleryItemSchema.partial();

export const insertSeoSettingSchema = createInsertSchema(seoSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSeoSettingSchema = insertSeoSettingSchema.partial();

export const insertSeoConsoleReportSchema = createInsertSchema(seoConsoleReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdvancedCrawlReportSchema = createInsertSchema(advancedCrawlReports).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type Faq = typeof faqs.$inferSelect;

export type InsertGalleryItem = z.infer<typeof insertGalleryItemSchema>;
export type GalleryItem = typeof galleryItems.$inferSelect;

export type InsertSeoSetting = z.infer<typeof insertSeoSettingSchema>;
export type SeoSetting = typeof seoSettings.$inferSelect;
