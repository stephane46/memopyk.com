import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { vpsDeployment } from "./vps-deployment";
import { 
  requireAuth, 
  rateLimitLogin, 
  validatePassword, 
  createSession, 
  destroySession, 
  validateSession 
} from "./auth";
import { 
  insertHeroVideoSchema,
  insertGalleryItemSchema,
  insertFaqSchema,
  insertSeoSettingSchema,
  insertDeploymentSchema,
  loginSchema
} from "@shared/schema";
import { z } from "zod";
import cookieParser from "cookie-parser";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cookieParser());

  // Authentication Routes
  app.post("/api/auth/login", rateLimitLogin, async (req, res) => {
    try {
      const { password } = loginSchema.parse(req.body);
      
      if (!validatePassword(password)) {
        // Increment failed attempt count
        if (req.loginAttempts) {
          req.loginAttempts.count++;
        }
        return res.status(401).json({ message: "Invalid password" });
      }

      const sessionId = createSession("admin");
      
      res.cookie("sessionId", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: "strict"
      });

      res.json({ message: "Login successful" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    const sessionId = req.cookies?.sessionId;
    if (sessionId) {
      destroySession(sessionId);
    }
    res.clearCookie("sessionId");
    res.json({ message: "Logout successful" });
  });

  app.get("/api/auth/verify", (req, res) => {
    const sessionId = req.cookies?.sessionId;
    if (!sessionId) {
      return res.status(401).json({ message: "No session" });
    }

    const userId = validateSession(sessionId);
    if (!userId) {
      return res.status(401).json({ message: "Invalid session" });
    }

    res.json({ user: { id: userId } });
  });

  // Database test endpoint (before auth for testing)
  app.get("/api/db-test", async (req, res) => {
    try {
      const { testDatabaseConnection } = await import("./db-test");
      const result = await testDatabaseConnection();
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Test failed", error: error.message });
    }
  });

  // Protected Routes
  app.use("/api", requireAuth);

  // Dashboard Stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats", error: error.message });
    }
  });

  // Hero Videos Routes
  app.get("/api/hero-videos", async (req, res) => {
    try {
      const videos = await storage.getHeroVideos();
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hero videos" });
    }
  });

  app.get("/api/hero-videos/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const video = await storage.getHeroVideo(id);
      if (!video) {
        return res.status(404).json({ message: "Hero video not found" });
      }
      res.json(video);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hero video" });
    }
  });

  app.post("/api/hero-videos", async (req, res) => {
    try {
      const videoData = insertHeroVideoSchema.parse(req.body);
      const video = await storage.createHeroVideo(videoData);
      res.status(201).json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create hero video" });
    }
  });

  app.put("/api/hero-videos/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const videoData = insertHeroVideoSchema.partial().parse(req.body);
      const video = await storage.updateHeroVideo(id, videoData);
      res.json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update hero video" });
    }
  });

  app.delete("/api/hero-videos/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteHeroVideo(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete hero video" });
    }
  });

  app.post("/api/hero-videos/reorder", async (req, res) => {
    try {
      const { videoIds } = z.object({ videoIds: z.array(z.string()) }).parse(req.body);
      await storage.reorderHeroVideos(videoIds);
      res.json({ message: "Reorder successful" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to reorder hero videos" });
    }
  });

  // Gallery Routes
  app.get("/api/gallery", async (req, res) => {
    try {
      const items = await storage.getGalleryItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gallery items" });
    }
  });

  app.get("/api/gallery/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const item = await storage.getGalleryItem(id);
      if (!item) {
        return res.status(404).json({ message: "Gallery item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gallery item" });
    }
  });

  app.post("/api/gallery", async (req, res) => {
    try {
      const itemData = insertGalleryItemSchema.parse(req.body);
      const item = await storage.createGalleryItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create gallery item" });
    }
  });

  app.put("/api/gallery/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const itemData = insertGalleryItemSchema.partial().parse(req.body);
      const item = await storage.updateGalleryItem(id, itemData);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update gallery item" });
    }
  });

  app.delete("/api/gallery/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteGalleryItem(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete gallery item" });
    }
  });

  app.post("/api/gallery/reorder", async (req, res) => {
    try {
      const { itemIds } = z.object({ itemIds: z.array(z.string()) }).parse(req.body);
      await storage.reorderGalleryItems(itemIds);
      res.json({ message: "Reorder successful" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to reorder gallery items" });
    }
  });

  // FAQ Routes
  app.get("/api/faqs", async (req, res) => {
    try {
      const faqs = await storage.getFaqs();
      res.json(faqs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch FAQs" });
    }
  });

  app.get("/api/faqs/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const faq = await storage.getFaq(id);
      if (!faq) {
        return res.status(404).json({ message: "FAQ not found" });
      }
      res.json(faq);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch FAQ" });
    }
  });

  app.post("/api/faqs", async (req, res) => {
    try {
      const faqData = insertFaqSchema.parse(req.body);
      const faq = await storage.createFaq(faqData);
      res.status(201).json(faq);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create FAQ" });
    }
  });

  app.put("/api/faqs/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const faqData = insertFaqSchema.partial().parse(req.body);
      const faq = await storage.updateFaq(id, faqData);
      res.json(faq);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update FAQ" });
    }
  });

  app.delete("/api/faqs/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteFaq(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete FAQ" });
    }
  });

  app.post("/api/faqs/reorder", async (req, res) => {
    try {
      const { faqIds } = z.object({ faqIds: z.array(z.string()) }).parse(req.body);
      console.log("Reordering FAQs with IDs:", faqIds);
      await storage.reorderFaqs(faqIds);
      console.log("Reorder completed successfully");
      res.json({ message: "Reorder successful" });
    } catch (error) {
      console.error("Reorder error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to reorder FAQs" });
    }
  });

  // SEO Settings Routes
  app.get("/api/seo-settings", async (req, res) => {
    try {
      const settings = await storage.getSeoSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SEO settings" });
    }
  });

  app.get("/api/seo-settings/page/:page", async (req, res) => {
    try {
      const page = req.params.page;
      const setting = await storage.getSeoSettingByPage(page);
      if (!setting) {
        return res.status(404).json({ message: "SEO setting not found" });
      }
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch SEO setting" });
    }
  });

  app.post("/api/seo-settings", async (req, res) => {
    try {
      const settingData = insertSeoSettingSchema.parse(req.body);
      const setting = await storage.createSeoSetting(settingData);
      res.status(201).json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create SEO setting" });
    }
  });

  app.put("/api/seo-settings/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const settingData = insertSeoSettingSchema.partial().parse(req.body);
      const setting = await storage.updateSeoSetting(id, settingData);
      res.json(setting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update SEO setting" });
    }
  });

  // Webhook endpoint for admin panel deployment control
  app.post('/api/webhook/deploy', async (req, res) => {
    try {
      const { environment, apiKey, message } = req.body;
      
      // Validate webhook API key
      const expectedApiKey = process.env.WEBHOOK_API_KEY || 'memopyk-admin-2024';
      if (!apiKey || apiKey !== expectedApiKey) {
        return res.status(401).json({ message: 'Invalid API key' });
      }
      
      // Validate environment
      if (!environment || !['staging', 'production'].includes(environment)) {
        return res.status(400).json({ message: 'Invalid environment. Must be staging or production' });
      }
      
      // Create deployment record
      const deployment = await storage.createDeployment({
        environment,
        version: 'latest',
        status: 'pending',
        startedAt: new Date(),
        notes: message || `Admin panel deployment to ${environment}`
      });
      
      // Trigger deployment asynchronously
      vpsDeployment.deployToEnvironment(environment, deployment.id).catch(error => {
        console.error(`Deployment ${deployment.id} failed:`, error);
      });
      
      res.json({
        success: true,
        deploymentId: deployment.id,
        message: `Deployment to ${environment} started`,
        environment
      });
      
    } catch (error) {
      console.error('Webhook deployment error:', error);
      res.status(500).json({ message: 'Deployment webhook failed' });
    }
  });

  // Deployment Routes
  app.get("/api/deploy/history/:env", async (req, res) => {
    try {
      const environment = req.params.env;
      const deployments = await storage.getDeploymentsByEnvironment(environment);
      res.json(deployments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deployment history" });
    }
  });

  app.post("/api/deploy/:env", async (req, res) => {
    try {
      const environment = req.params.env;
      const { version, notes } = z.object({
        version: z.string(),
        notes: z.string().optional(),
      }).parse(req.body);

      const deployment = await storage.createDeployment({
        environment,
        version,
        status: "pending",
        notes,
      });

      // Start real VPS deployment in background
      setTimeout(async () => {
        try {
          await vpsDeployment.deployToEnvironment(
            environment as 'staging' | 'production',
            deployment.id
          );
        } catch (error) {
          console.error('VPS deployment failed:', error);
          await storage.updateDeployment(deployment.id, {
            status: "failed",
            completedAt: new Date(),
          });
        }
      }, 1000);

      res.status(201).json(deployment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to start deployment" });
    }
  });

  // VPS Discovery endpoint  
  app.get("/api/deployments/discover-paths", requireAuth, async (req, res) => {
    try {
      const config = await vpsDeployment.discoverPaths();
      res.json(config);
    } catch (error) {
      console.error('VPS discovery failed:', error);
      res.status(500).json({ 
        message: "Failed to discover VPS paths",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Contacts Routes
  app.get("/api/contacts", async (req, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
