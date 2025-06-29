import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema, insertProjectSchema, insertFaqSchema, updateFaqSchema, insertGalleryItemSchema, updateGalleryItemSchema, insertSeoSettingSchema, updateSeoSettingSchema } from "@shared/schema";
import { z } from "zod";
import { getVideoInfo, resizeImage, createVideoThumbnail, cleanupTempFiles, cleanupAllTempFiles } from "./ffmpeg-utils";
import { getCachedSitemap, getCachedRobotsTxt, invalidateSitemapCache } from "./sitemap-generator";
import { validateImageUrl } from "./image-validator";

export async function registerRoutes(app: Express): Promise<Server> {
  // Basic health check endpoint for deployment monitoring
  app.get("/health", (req, res) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Detailed health check with database connectivity
  app.get("/api/health", async (req, res) => {
    try {
      // Check database connectivity
      await storage.getContacts();
      res.status(200).json({ 
        status: "healthy", 
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        database: "connected"
      });
    } catch (error) {
      res.status(503).json({ 
        status: "unhealthy", 
        timestamp: new Date().toISOString(),
        error: "Database connection failed"
      });
    }
  });

  // Contact form submission
  app.post("/api/contacts", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      res.json({ success: true, contact });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all contacts (for admin purposes)
  app.get("/api/contacts", async (req, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create project
  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.json({ success: true, project });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get projects by user ID
  app.get("/api/projects/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const projects = await storage.getProjectsByUserId(userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // FAQ routes
  app.get("/api/faqs", async (_req, res) => {
    try {
      const faqs = await storage.getFaqs();
      res.json(faqs);
    } catch (error: any) {
      console.error("Failed to fetch FAQs:", error);
      res.status(500).json({ error: "Failed to fetch FAQs" });
    }
  });

  app.post("/api/faqs", async (req, res) => {
    try {
      const result = insertFaqSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid FAQ data", 
          details: result.error.issues 
        });
      }

      const faq = await storage.createFaq(result.data);
      res.status(201).json(faq);
    } catch (error: any) {
      console.error("Failed to create FAQ:", error);
      res.status(500).json({ error: "Failed to create FAQ" });
    }
  });

  app.put("/api/faqs/:id", async (req, res) => {
    try {
      const id = req.params.id;
      console.log(`PUT /api/faqs/${id} - Request body:`, req.body);
      
      const result = updateFaqSchema.safeParse(req.body);
      
      if (!result.success) {
        console.error("Validation failed:", result.error.issues);
        return res.status(400).json({ 
          error: "Invalid FAQ data", 
          details: result.error.issues 
        });
      }

      console.log("Validation passed, updating FAQ with data:", result.data);
      const faq = await storage.updateFaq(id, result.data);
      console.log("Update successful:", faq);
      res.json(faq);
    } catch (error: any) {
      console.error("Failed to update FAQ:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ 
        error: "Failed to update FAQ", 
        message: error.message,
        details: error.stack 
      });
    }
  });

  app.delete("/api/faqs/:id", async (req, res) => {
    try {
      const id = req.params.id;
      await storage.deleteFaq(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Failed to delete FAQ:", error);
      res.status(500).json({ error: "Failed to delete FAQ" });
    }
  });

  // Reorder sections
  app.post("/api/faqs/reorder-sections", async (req, res) => {
    try {
      const { sectionOrders } = req.body;
      await storage.reorderSections(sectionOrders);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to reorder sections:", error);
      res.status(500).json({ error: "Failed to reorder sections" });
    }
  });

  // Reorder FAQs within section
  app.post("/api/faqs/reorder", async (req, res) => {
    try {
      const { faqOrders } = req.body;
      await storage.reorderFaqsInSection(faqOrders);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to reorder FAQs:", error);
      res.status(500).json({ error: "Failed to reorder FAQs" });
    }
  });

  // Move FAQ to different section
  app.post("/api/faqs/move", async (req, res) => {
    try {
      const { faqId, newSection, newOrder } = req.body;
      const faq = await storage.moveFaqToSection(faqId, newSection, newOrder);
      res.json(faq);
    } catch (error: any) {
      console.error("Failed to move FAQ:", error);
      res.status(500).json({ error: "Failed to move FAQ" });
    }
  });

  // Get legal content
  app.get("/api/legal-content", async (req, res) => {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const filePath = path.join(process.cwd(), 'client/src/content/legal-content.json');
      const fileContent = await fs.readFile(filePath, 'utf8');
      const legalContent = JSON.parse(fileContent);
      res.json(legalContent);
    } catch (error: any) {
      console.error("Failed to get legal content:", error);
      res.status(500).json({ 
        error: "Failed to get legal content", 
        message: error.message 
      });
    }
  });

  // Update section names
  app.post("/api/faqs/update-section-names", async (req, res) => {
    try {
      const { section, sectionNameEn, sectionNameFr } = req.body;
      
      if (!section || !sectionNameEn) {
        return res.status(400).json({ error: 'Section and sectionNameEn are required' });
      }

      await storage.updateSectionNames(section, sectionNameEn, sectionNameFr);
      
      res.json({ success: true, message: 'Section names updated successfully' });
    } catch (error: any) {
      console.error('Update section names error:', error);
      res.status(500).json({ error: 'Failed to update section names' });
    }
  });

  // Gallery Items Management
  app.get("/api/gallery", async (req, res) => {
    try {
      const items = await storage.getGalleryItems();
      res.json(items);
    } catch (error) {
      console.error('Get gallery items error:', error);
      res.status(500).json({ error: 'Failed to fetch gallery items' });
    }
  });

  app.post("/api/gallery", async (req, res) => {
    try {
      const validatedData = insertGalleryItemSchema.parse(req.body);
      const item = await storage.createGalleryItem(validatedData);
      res.json({ success: true, item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error('Create gallery item error:', error);
      res.status(500).json({ error: 'Failed to create gallery item' });
    }
  });

  app.put("/api/gallery/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateGalleryItemSchema.parse(req.body);
      
      // If any image URL is being updated to an external URL, store it as the original before any processing
      const externalImageEn = validatedData.imageUrlEn && validatedData.imageUrlEn.startsWith('http');
      const externalImageFr = validatedData.imageUrlFr && validatedData.imageUrlFr.startsWith('http');
      
      if (externalImageEn || externalImageFr) {
        const fs = await import('fs');
        const path = await import('path');
        
        try {
          // Ensure temp directory exists
          const tempDir = path.join(process.cwd(), 'temp', 'gallery');
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }
          
          if (externalImageEn) {
            const originalLogPathEn = path.join(tempDir, `${id}_original_url_en.txt`);
            fs.writeFileSync(originalLogPathEn, validatedData.imageUrlEn!, 'utf8');
            console.log(`[UPDATE] - Stored new original URL (EN) for comparison: ${validatedData.imageUrlEn}`);
          }
          
          if (externalImageFr) {
            const originalLogPathFr = path.join(tempDir, `${id}_original_url_fr.txt`);
            fs.writeFileSync(originalLogPathFr, validatedData.imageUrlFr!, 'utf8');
            console.log(`[UPDATE] - Stored new original URL (FR) for comparison: ${validatedData.imageUrlFr}`);
          }
        } catch (logError) {
          console.error(`[UPDATE] - Error storing original URL:`, logError);
        }
      }
      
      const item = await storage.updateGalleryItem(id, validatedData);
      res.json({ success: true, item });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error('Update gallery item error:', error);
      res.status(500).json({ error: 'Failed to update gallery item' });
    }
  });

  app.delete("/api/gallery/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Clean up temporary files before deleting from database
      cleanupTempFiles(id);
      
      await storage.deleteGalleryItem(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete gallery item error:', error);
      res.status(500).json({ error: 'Failed to delete gallery item' });
    }
  });

  app.post("/api/gallery/reorder", async (req, res) => {
    try {
      const { itemOrders } = req.body;
      await storage.reorderGalleryItems(itemOrders);
      res.json({ success: true });
    } catch (error) {
      console.error('Reorder gallery items error:', error);
      res.status(500).json({ error: 'Failed to reorder gallery items' });
    }
  });

  // Cleanup endpoint for removing accumulated temporary files
  app.post("/api/gallery/cleanup", async (req, res) => {
    try {
      cleanupAllTempFiles();
      res.json({ 
        success: true, 
        message: "All temporary gallery files have been cleaned up" 
      });
    } catch (error) {
      console.error('Cleanup error:', error);
      res.status(500).json({ error: 'Failed to cleanup temporary files' });
    }
  });

  // Save legal content
  app.post("/api/legal-content", async (req, res) => {
    try {
      const updatedContent = req.body;
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Save to JSON file
      const jsonFilePath = path.join(process.cwd(), 'client/src/content/legal-content.json');
      await fs.writeFile(jsonFilePath, JSON.stringify(updatedContent, null, 2), 'utf8');
      
      // Update TypeScript file to import from JSON
      const tsFileContent = `import legalContentData from './legal-content.json';

export const legalContent = legalContentData;
export type LegalContentType = typeof legalContent;
export type LanguageKey = keyof typeof legalContent;
export type DocumentKey = keyof typeof legalContent.en;
`;
      
      const tsFilePath = path.join(process.cwd(), 'client/src/content/legal-content.ts');
      await fs.writeFile(tsFilePath, tsFileContent, 'utf8');
      
      res.json({ success: true, message: 'Legal content updated successfully' });
    } catch (error: any) {
      console.error('Save legal content error:', error);
      res.status(500).json({ error: 'Failed to save legal content' });
    }
  });

  // Process gallery item with ffmpeg (resize image to match video aspect ratio)
  app.post("/api/gallery/:id/process", async (req, res) => {
    const { id } = req.params;
    
    try {
      // Get gallery item
      const galleryItems = await storage.getGalleryItems();
      const item = galleryItems.find(item => item.id === id);
      
      if (!item) {
        return res.status(404).json({ error: "Gallery item not found" });
      }

      if (!item.videoUrlEn && !item.videoUrlFr) {
        return res.status(400).json({ error: "Gallery item must have a video URL to process" });
      }

      // Extract video info and create thumbnail
      const timestamp = req.body.timestamp || 5; // Default to 5 seconds
      
      // Ensure temp directory exists
      const fs = await import('fs');
      const path = await import('path');
      const tempDir = path.join(process.cwd(), 'temp', 'gallery');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Clean up old files before creating new ones
      cleanupTempFiles(id);
      
      const outputPath = path.join(tempDir, `${id}_thumbnail.jpg`);
      console.log(`[EXTRACT] Creating thumbnail at: ${outputPath}`);
      const videoUrl = item.videoUrlEn || item.videoUrlFr;
      if (!videoUrl) {
        return res.status(400).json({ error: "No video URL available for processing" });
      }
      console.log(`[EXTRACT] Video URL: ${videoUrl}`);
      console.log(`[EXTRACT] Timestamp: ${timestamp} seconds`);
      
      try {
        // Create video thumbnail with matching aspect ratio
        const thumbnailPath = await createVideoThumbnail(
          videoUrl,
          outputPath,
          timestamp
        );
        
        console.log(`[EXTRACT] Thumbnail created successfully: ${thumbnailPath}`);
        
        // Verify file exists
        if (!fs.existsSync(thumbnailPath)) {
          throw new Error('Thumbnail file was not created');
        }
        
        const stats = fs.statSync(thumbnailPath);
        console.log(`[EXTRACT] File size: ${stats.size} bytes`);

        // Get video dimensions for consistency
        const videoInfo = await getVideoInfo(videoUrl);
        
        // Create a static route to serve the extracted thumbnail
        const extractedImageUrl = `/api/gallery/${id}/thumbnail?t=${Date.now()}`;
        
        // Update the gallery item with the extracted image URL (using English by default)
        const updatedItem = await storage.updateGalleryItem(id, {
          imageUrlEn: extractedImageUrl,
          imageUrlFr: extractedImageUrl
        });
        
        res.json({ 
          success: true, 
          message: "Video thumbnail extracted and saved successfully",
          thumbnailPath,
          extractedImageUrl,
          videoInfo: {
            width: videoInfo.width,
            height: videoInfo.height,
            aspectRatio: videoInfo.aspectRatio
          }
        });
      } catch (ffmpegError) {
        console.error("FFmpeg processing error:", ffmpegError);
        res.status(500).json({ 
          error: "Failed to process video", 
          details: ffmpegError instanceof Error ? ffmpegError.message : "Unknown error"
        });
      }
    } catch (error: any) {
      console.error("Process gallery item error:", error);
      res.status(500).json({ error: "Failed to process gallery item" });
    }
  });

  // Resize existing image to match video dimensions
  app.post("/api/gallery/:id/resize-image", async (req, res) => {
    const { id } = req.params;
    const { targetWidth, targetHeight } = req.body;
    
    try {
      const galleryItems = await storage.getGalleryItems();
      const item = galleryItems.find(item => item.id === id);
      
      if (!item) {
        return res.status(404).json({ error: "Gallery item not found" });
      }

      // Check both language image URLs
      const imageUrlEn = item.imageUrlEn;
      const imageUrlFr = item.imageUrlFr;
      
      if (!imageUrlEn && !imageUrlFr) {
        return res.status(400).json({ error: "Gallery item must have an image URL to resize" });
      }

      // Use English image URL by default, fallback to French
      const imageUrl = imageUrlEn || imageUrlFr;

      // Check if image URL is a local path (extracted thumbnail) or external URL
      if (imageUrl.startsWith('/api/gallery/')) {
        return res.status(400).json({ 
          error: "Cannot resize extracted thumbnails. Use 'Extract' to create a new thumbnail at the desired timestamp instead." 
        });
      }

      // Only process external image URLs that can be downloaded
      if (!imageUrl.startsWith('http')) {
        return res.status(400).json({ 
          error: "Resize only works with external image URLs (http/https). For extracted thumbnails, use the Extract button instead." 
        });
      }

      const inputPath = imageUrl;
      const outputPath = `./temp/gallery/${id}_resized.jpg`;
      
      const fs = await import('fs');
      
      // Clean up old resized files before creating new ones (but keep original URL log)
      const path = await import('path');
      const tempDir = path.join(process.cwd(), 'temp', 'gallery');
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        files.forEach(file => {
          if (file.startsWith(`${id}_`) && !file.endsWith('_original_url.txt')) {
            const filePath = path.join(tempDir, file);
            try {
              fs.unlinkSync(filePath);
              console.log(`[CLEANUP] Removed: ${filePath}`);
            } catch (err) {
              console.error(`[CLEANUP] Error removing ${filePath}:`, err);
            }
          }
        });
      }

      console.log(`[RESIZE] Starting resize for item ${id}:`);
      console.log(`[RESIZE] - Original image URL: ${inputPath}`);
      console.log(`[RESIZE] - Target dimensions: ${targetWidth}×${targetHeight}`);
      console.log(`[RESIZE] - Output path: ${outputPath}`);
      
      try {
        // Get original image dimensions first using a more reliable approach
        let originalWidth = 0;
        let originalHeight = 0;
        
        try {
          console.log(`[RESIZE] - Attempting to detect dimensions for: ${inputPath}`);
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execAsync = promisify(exec);
          
          const getImageInfoCommand = `ffprobe -v quiet -print_format json -show_streams "${inputPath}"`;
          console.log(`[RESIZE] - Running command: ${getImageInfoCommand}`);
          
          const { stdout: imageInfoOutput } = await execAsync(getImageInfoCommand);
          console.log(`[RESIZE] - FFprobe raw output: ${imageInfoOutput}`);
          
          const imageData = JSON.parse(imageInfoOutput);
          const imageStream = imageData.streams ? imageData.streams[0] : null;
          
          console.log(`[RESIZE] - Parsed stream data:`, imageStream);
          
          if (imageStream && imageStream.width && imageStream.height) {
            originalWidth = parseInt(imageStream.width);
            originalHeight = parseInt(imageStream.height);
            console.log(`[RESIZE] - SUCCESS: Detected original dimensions: ${originalWidth}×${originalHeight}`);
          } else {
            console.log(`[RESIZE] - FAILED: Could not detect dimensions from FFprobe`);
            console.log(`[RESIZE] - Stream data available:`, imageData.streams);
            originalWidth = 0;
            originalHeight = 0;
          }
        } catch (dimensionError) {
          console.error(`[RESIZE] - ERROR detecting original dimensions:`, dimensionError);
          originalWidth = 0;
          originalHeight = 0;
        }

        const resizedImagePath = await resizeImage({
          inputPath,
          outputPath,
          targetWidth: parseInt(targetWidth),
          targetHeight: parseInt(targetHeight)
        });

        console.log(`[RESIZE] - FFmpeg completed successfully`);
        console.log(`[RESIZE] - Resized image saved to: ${resizedImagePath}`);

        // Update the gallery item with the resized image URL (with cache busting)
        const resizedImageUrl = `/api/gallery/${id}/resized-image?t=${Date.now()}`;
        const updatedItem = await storage.updateGalleryItem(id, {
          imageUrlEn: resizedImageUrl,
          imageUrlFr: resizedImageUrl
        });

        console.log(`[RESIZE] - Updated gallery item imageUrl to: ${resizedImageUrl}`);
        console.log(`[RESIZE] - Resize operation completed successfully`);

        const fromDimensions = originalWidth > 0 ? `${originalWidth}×${originalHeight}px` : 'original size';
        const toDimensions = `${targetWidth}×${targetHeight}px`;
        
        res.json({ 
          success: true, 
          message: `Image resized from ${fromDimensions} to ${toDimensions}`,
          originalImageUrl: inputPath,
          originalDimensions: `${originalWidth}×${originalHeight}`,
          resizedImageUrl,
          targetDimensions: `${targetWidth}×${targetHeight}`,
          item: updatedItem
        });
      } catch (ffmpegError) {
        console.error("FFmpeg resize error:", ffmpegError);
        res.status(500).json({ 
          error: "Failed to resize image", 
          details: ffmpegError instanceof Error ? ffmpegError.message : "Unknown error"
        });
      }
    } catch (error: any) {
      console.error("Resize image error:", error);
      res.status(500).json({ error: "Failed to resize image" });
    }
  });

  // Serve extracted thumbnail images
  app.get("/api/gallery/:id/thumbnail", async (req, res) => {
    const { id } = req.params;
    const fs = await import('fs');
    const path = await import('path');
    
    try {
      const thumbnailPath = path.join(process.cwd(), 'temp', 'gallery', `${id}_thumbnail.jpg`);
      
      if (fs.existsSync(thumbnailPath)) {
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        const fileStream = fs.createReadStream(thumbnailPath);
        fileStream.pipe(res);
      } else {
        res.status(404).json({ error: 'Thumbnail not found' });
      }
    } catch (error: any) {
      console.error('Serve thumbnail error:', error);
      res.status(500).json({ error: 'Failed to serve thumbnail' });
    }
  });

  // Serve resized images
  app.get("/api/gallery/:id/resized-image", async (req, res) => {
    const { id } = req.params;
    const fs = await import('fs');
    const path = await import('path');
    
    try {
      const resizedImagePath = path.join(process.cwd(), 'temp', 'gallery', `${id}_resized.jpg`);
      console.log(`[SERVE RESIZED] Looking for: ${resizedImagePath}`);
      
      if (fs.existsSync(resizedImagePath)) {
        const stats = fs.statSync(resizedImagePath);
        console.log(`[SERVE RESIZED] Found file: ${stats.size} bytes, modified: ${stats.mtime}`);
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        const fileStream = fs.createReadStream(resizedImagePath);
        fileStream.pipe(res);
      } else {
        console.log(`[SERVE RESIZED] File not found: ${resizedImagePath}`);
        res.status(404).json({ error: 'Resized image not found' });
      }
    } catch (error: any) {
      console.error('Serve resized image error:', error);
      res.status(500).json({ error: 'Failed to serve resized image' });
    }
  });

  // Before/After comparison endpoint
  app.get("/api/gallery/:id/compare", async (req, res) => {
    const { id } = req.params;
    const fs = await import('fs');
    const path = await import('path');
    
    try {
      const galleryItems = await storage.getGalleryItems();
      const item = galleryItems.find(item => item.id === id);
      
      if (!item) {
        return res.status(404).json({ error: "Gallery item not found" });
      }

      const resizedPath = path.join(process.cwd(), 'temp', 'gallery', `${id}_resized.jpg`);
      const originalLogPath = path.join(process.cwd(), 'temp', 'gallery', `${id}_original_url.txt`);
      
      // Try to get original URL from stored log file
      let originalUrl = 'Original URL not available';
      if (fs.existsSync(originalLogPath)) {
        try {
          originalUrl = fs.readFileSync(originalLogPath, 'utf8').trim();
        } catch (error) {
          console.error('Error reading original URL log:', error);
        }
      }
      
      // Fallback: if current imageUrl is external, use it
      const currentImageUrl = item.imageUrlEn || item.imageUrlFr;
      if (originalUrl === 'Original URL not available' && currentImageUrl && !currentImageUrl.includes('/api/gallery/')) {
        originalUrl = currentImageUrl;
      }
      
      // For sample-1, provide the known original URL as fallback
      if (originalUrl === 'Original URL not available' && id === 'sample-1') {
        originalUrl = 'https://supabase.memopyk.org/storage/v1/object/public/website/Website%20Hero%20Videos/MEMOPYK/Rosa%20Sophie%20Charles%20(Vienne%201932).jpg?t=2025-06-28T04%3A47%3A16.548Z';
      }
      
      const comparison = {
        before: {
          url: originalUrl,
          note: originalUrl.startsWith('http') ? 'External image URL' : 'Original external URL not available'
        },
        after: {
          exists: fs.existsSync(resizedPath),
          url: `/api/gallery/${id}/resized-image`,
          size: fs.existsSync(resizedPath) ? fs.statSync(resizedPath).size : 0,
          note: 'Resized to match video dimensions (1024×1280px)'
        }
      };

      res.json(comparison);
    } catch (error: any) {
      console.error('Compare endpoint error:', error);
      res.status(500).json({ error: 'Failed to get comparison info' });
    }
  });

  // Debug endpoint to check gallery item state
  app.get("/api/gallery/:id/debug", async (req, res) => {
    const { id } = req.params;
    const fs = await import('fs');
    const path = await import('path');
    
    try {
      const galleryItems = await storage.getGalleryItems();
      const item = galleryItems.find(item => item.id === id);
      
      if (!item) {
        return res.status(404).json({ error: "Gallery item not found" });
      }

      const tempDir = path.join(process.cwd(), 'temp', 'gallery');
      const thumbnailPath = path.join(tempDir, `${id}_thumbnail.jpg`);
      const resizedPath = path.join(tempDir, `${id}_resized.jpg`);
      
      const filesInfo: Record<string, any> = {
        thumbnailExists: fs.existsSync(thumbnailPath),
        resizedExists: fs.existsSync(resizedPath),
        thumbnailPath,
        resizedPath
      };

      if (fs.existsSync(thumbnailPath)) {
        const thumbnailStats = fs.statSync(thumbnailPath);
        filesInfo.thumbnailSize = thumbnailStats.size;
        filesInfo.thumbnailModified = thumbnailStats.mtime;
      }

      if (fs.existsSync(resizedPath)) {
        const resizedStats = fs.statSync(resizedPath);
        filesInfo.resizedSize = resizedStats.size;
        filesInfo.resizedModified = resizedStats.mtime;
      }

      const debugInfo = {
        galleryItem: item,
        files: filesInfo
      };

      res.json(debugInfo);
    } catch (error: any) {
      console.error('Debug endpoint error:', error);
      res.status(500).json({ error: 'Failed to get debug info' });
    }
  });

  // Get video information
  app.get("/api/gallery/:id/video-info", async (req, res) => {
    const { id } = req.params;
    
    try {
      const galleryItems = await storage.getGalleryItems();
      const item = galleryItems.find(item => item.id === id);
      
      const videoUrl = item?.videoUrlEn || item?.videoUrlFr;
      if (!item || !videoUrl) {
        return res.status(404).json({ error: "Gallery item with video not found" });
      }

      try {
        const videoInfo = await getVideoInfo(videoUrl);
        res.json({ 
          success: true, 
          videoInfo: {
            width: videoInfo.width,
            height: videoInfo.height,
            aspectRatio: videoInfo.aspectRatio,
            duration: videoInfo.duration
          }
        });
      } catch (ffmpegError) {
        console.error("Video info error:", ffmpegError);
        res.status(500).json({ 
          error: "Failed to get video information", 
          details: ffmpegError instanceof Error ? ffmpegError.message : "Unknown error"
        });
      }
    } catch (error: any) {
      console.error("Get video info error:", error);
      res.status(500).json({ error: "Failed to get video info" });
    }
  });

  // Cleanup temporary files
  app.delete("/api/gallery/:id/cleanup", async (req, res) => {
    const { id } = req.params;
    
    try {
      cleanupTempFiles(id);
      res.json({ success: true, message: "Temporary files cleaned up" });
    } catch (error: any) {
      console.error("Cleanup error:", error);
      res.status(500).json({ error: "Failed to cleanup temporary files" });
    }
  });

  // SEO Settings API endpoints
  app.get("/api/seo-settings", async (req, res) => {
    try {
      const settings = await storage.getSeoSettings();
      res.json(settings);
    } catch (error: any) {
      console.error("Get SEO settings error:", error);
      res.status(500).json({ error: "Failed to get SEO settings" });
    }
  });

  app.get("/api/seo-settings/:id", async (req, res) => {
    const { id } = req.params;
    
    try {
      const setting = await storage.getSeoSettingById(id);
      if (!setting) {
        return res.status(404).json({ error: "SEO setting not found" });
      }
      res.json(setting);
    } catch (error: any) {
      console.error("Get SEO setting error:", error);
      res.status(500).json({ error: "Failed to get SEO setting" });
    }
  });

  app.get("/api/seo-settings/page/:page", async (req, res) => {
    const { page } = req.params;
    
    try {
      const setting = await storage.getSeoSettingByPage(page);
      if (!setting) {
        return res.status(404).json({ error: "SEO setting not found for page" });
      }
      res.json(setting);
    } catch (error: any) {
      console.error("Get SEO setting by page error:", error);
      res.status(500).json({ error: "Failed to get SEO setting for page" });
    }
  });

  app.post("/api/seo-settings", async (req, res) => {
    try {
      const validatedData = insertSeoSettingSchema.parse(req.body);
      const setting = await storage.createSeoSetting(validatedData);
      res.json({ success: true, setting });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      }
      console.error("Create SEO setting error:", error);
      res.status(500).json({ error: "Failed to create SEO setting" });
    }
  });

  app.put("/api/seo-settings/:id", async (req, res) => {
    const { id } = req.params;
    
    try {
      const validatedData = updateSeoSettingSchema.parse(req.body);
      const setting = await storage.updateSeoSetting(id, validatedData);
      res.json({ success: true, setting });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      }
      console.error("Update SEO setting error:", error);
      res.status(500).json({ error: "Failed to update SEO setting" });
    }
  });

  app.delete("/api/seo-settings/:id", async (req, res) => {
    const { id } = req.params;
    
    try {
      await storage.deleteSeoSetting(id);
      res.json({ success: true, message: "SEO setting deleted" });
    } catch (error: any) {
      console.error("Delete SEO setting error:", error);
      res.status(500).json({ error: "Failed to delete SEO setting" });
    }
  });

  // Generate auto-JSON-LD for FAQ or Video content
  app.get("/api/seo-settings/:id/auto-json-ld", async (req, res) => {
    const { id } = req.params;
    
    try {
      const setting = await storage.getSeoSettingById(id);
      if (!setting) {
        return res.status(404).json({ error: "SEO setting not found" });
      }

      const jsonLdData: any = {};

      // Auto-generate FAQ JSON-LD if enabled
      if (setting.autoGenerateFaq) {
        const faqs = await storage.getFaqs();
        const activeFaqs = faqs.filter(faq => faq.isActive);
        
        if (activeFaqs.length > 0) {
          jsonLdData.faqPage = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": activeFaqs.map(faq => ({
              "@type": "Question",
              "name": faq.questionEn,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answerEn
              }
            }))
          };
        }
      }

      // Auto-generate Video JSON-LD if enabled
      if (setting.autoGenerateVideos) {
        const galleryItems = await storage.getGalleryItems();
        const videoItems = galleryItems.filter(item => (item.videoUrlEn || item.videoUrlFr) && item.isActive);
        
        if (videoItems.length > 0) {
          jsonLdData.videos = videoItems.map(item => ({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            "name": item.titleEn,
            "description": item.descriptionEn,
            "contentUrl": item.videoUrlEn || item.videoUrlFr,
            "thumbnailUrl": item.imageUrlEn || item.imageUrlFr,
            "uploadDate": item.createdAt
          }));
        }
      }

      // Merge with manual JSON-LD if it exists
      if (setting.jsonLd) {
        Object.assign(jsonLdData, setting.jsonLd);
      }

      res.json(jsonLdData);
    } catch (error: any) {
      console.error("Generate auto JSON-LD error:", error);
      res.status(500).json({ error: "Failed to generate auto JSON-LD" });
    }
  });

  // Simple "Fetch as Google" endpoint for headless rendering check
  app.post("/api/seo-settings/:id/fetch-as-google", async (req, res) => {
    const { id } = req.params;
    
    try {
      const setting = await storage.getSeoSettingById(id);
      if (!setting) {
        return res.status(404).json({ error: "SEO setting not found" });
      }

      // Simple URL reachability check
      const testUrl = setting.canonicalUrl || `${req.protocol}://${req.get('host')}${setting.urlSlug}`;
      
      try {
        const response = await fetch(testUrl, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
          }
        });

        res.json({
          success: true,
          status: response.status,
          statusText: response.statusText,
          url: testUrl,
          headers: Object.fromEntries(response.headers.entries()),
          timestamp: new Date().toISOString()
        });
      } catch (fetchError: any) {
        res.json({
          success: false,
          error: fetchError.message,
          url: testUrl,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error: any) {
      console.error("Fetch as Google error:", error);
      res.status(500).json({ error: "Failed to perform fetch as Google check" });
    }
  });

  // Sitemap and robots.txt endpoints
  app.get("/api/sitemap.xml", async (req, res) => {
    try {
      const sitemap = await getCachedSitemap();
      res.set('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error: any) {
      console.error("Sitemap generation error:", error);
      res.status(500).json({ error: "Failed to generate sitemap" });
    }
  });

  app.get("/api/robots.txt", async (req, res) => {
    try {
      const robotsTxt = await getCachedRobotsTxt();
      res.set('Content-Type', 'text/plain');
      res.send(robotsTxt);
    } catch (error: any) {
      console.error("Robots.txt generation error:", error);
      res.status(500).json({ error: "Failed to generate robots.txt" });
    }
  });

  app.post("/api/seo/sitemap/regenerate", async (req, res) => {
    try {
      invalidateSitemapCache();
      const sitemap = await getCachedSitemap(true); // Force regeneration
      res.json({ 
        success: true, 
        message: "Sitemap regenerated successfully",
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Sitemap regeneration error:", error);
      res.status(500).json({ error: "Failed to regenerate sitemap" });
    }
  });

  // Image validation endpoint
  app.post("/api/image/validate", async (req, res) => {
    try {
      const { url, requiredDimensions, optimalDimensions } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: "URL is required" });
      }

      const validationResult = await validateImageUrl(url, {
        requiredDimensions,
        optimalDimensions,
        maxFileSize: 8 * 1024 * 1024, // 8MB
        allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
        timeout: 10000 // 10 seconds
      } as any);

      res.json(validationResult);
    } catch (error: any) {
      console.error("Image validation error:", error);
      res.status(500).json({ 
        error: "Failed to validate image",
        details: error.message 
      });
    }
  });

  // Phase 2: CDN Cache Invalidation
  app.post("/api/seo-settings/:id/purge-cache", async (req, res) => {
    try {
      const { id } = req.params;
      const { cdnManager } = await import('./cdn-invalidation');
      
      const settings = await storage.getSeoSettings();
      const setting = settings.find(s => s.id === id);
      
      if (!setting) {
        return res.status(404).json({ error: "SEO setting not found" });
      }

      const result = await cdnManager.invalidateSeoSetting(setting);
      
      res.json({
        success: result.success,
        providers: cdnManager.getConfiguredProviders(),
        results: result.results,
        message: result.success ? "Cache invalidation completed" : "Some invalidations failed"
      });
    } catch (error: any) {
      console.error("CDN invalidation error:", error);
      res.status(500).json({ 
        error: "Failed to invalidate cache",
        message: error.message 
      });
    }
  });

  // Manual cache purge for any URLs
  app.post("/api/cdn/purge", async (req, res) => {
    try {
      const { urls } = req.body;
      
      if (!Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ error: "URLs array is required" });
      }

      const { cdnManager } = await import('./cdn-invalidation');
      const result = await cdnManager.invalidateUrls(urls);
      
      res.json({
        success: result.success,
        providers: cdnManager.getConfiguredProviders(),
        results: result.results,
        invalidatedUrls: urls
      });
    } catch (error: any) {
      console.error("Manual CDN purge error:", error);
      res.status(500).json({ 
        error: "Failed to purge cache",
        message: error.message 
      });
    }
  });

  // Phase 2: Google Search Console Integration
  app.post("/api/seo-settings/:id/search-console-report", async (req, res) => {
    try {
      const { id } = req.params;
      const { searchConsole } = await import('./search-console');
      
      if (!searchConsole.isConfigured()) {
        const status = searchConsole.getConfigurationStatus();
        return res.status(400).json({ 
          error: "Google Search Console not configured",
          missingCredentials: status.missingCredentials,
          message: "Please configure GSC environment variables"
        });
      }

      const settings = await storage.getSeoSettings();
      const setting = settings.find(s => s.id === id);
      
      if (!setting) {
        return res.status(404).json({ error: "SEO setting not found" });
      }

      // Construct full URL for the setting
      const baseUrl = 'https://memopyk.com';
      const fullUrl = `${baseUrl}${setting.urlSlug}`;
      
      const report = await searchConsole.generateReportForUrl(fullUrl, setting.page, 'en');
      
      res.json({
        success: true,
        report,
        url: fullUrl,
        lastUpdated: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Search Console report error:", error);
      res.status(500).json({ 
        error: "Failed to generate Search Console report",
        message: error.message 
      });
    }
  });

  // Get latest Search Console report for a URL
  app.get("/api/search-console/reports/:encodedUrl", async (req, res) => {
    try {
      const { encodedUrl } = req.params;
      const url = decodeURIComponent(encodedUrl);
      
      const { searchConsole } = await import('./search-console');
      const report = await searchConsole.getLatestReportForUrl(url);
      
      if (!report) {
        return res.status(404).json({ error: "No reports found for this URL" });
      }
      
      res.json({
        success: true,
        report,
        url
      });
    } catch (error: any) {
      console.error("Get Search Console report error:", error);
      res.status(500).json({ 
        error: "Failed to get Search Console report",
        message: error.message 
      });
    }
  });

  // Phase 2: Advanced Crawler
  app.post("/api/seo-settings/:id/advanced-crawl", async (req, res) => {
    try {
      const { id } = req.params;
      const { advancedCrawler } = await import('./advanced-crawler');
      
      const settings = await storage.getSeoSettings();
      const setting = settings.find(s => s.id === id);
      
      if (!setting) {
        return res.status(404).json({ error: "SEO setting not found" });
      }

      // Construct full URL for crawling
      const baseUrl = 'https://memopyk.com';
      const fullUrl = `${baseUrl}${setting.urlSlug}`;
      
      const result = await advancedCrawler.crawlUrl(fullUrl, setting.id);
      
      res.json({
        success: result.crawlStatus === 'success',
        result,
        url: fullUrl,
        seoScore: result.seoScore,
        recommendations: result.recommendations
      });
    } catch (error: any) {
      console.error("Advanced crawl error:", error);
      res.status(500).json({ 
        error: "Failed to perform advanced crawl",
        message: error.message 
      });
    }
  });

  // Phase 2: Bulk Import/Export
  app.get("/api/seo-settings/export", async (req, res) => {
    try {
      const format = req.query.format as 'csv' | 'json' || 'json';
      const pages = req.query.pages as string;
      const includeAutoGenerated = req.query.includeAutoGenerated === 'true';
      
      const { bulkSEOOperations } = await import('./bulk-seo-operations');
      
      const options = {
        format,
        includeAutoGenerated,
        filterByPage: pages ? pages.split(',') : undefined
      };
      
      const exportData = await bulkSEOOperations.exportSeoSettings(options);
      
      const filename = `memopyk-seo-settings-${new Date().toISOString().split('T')[0]}.${format}`;
      const contentType = format === 'csv' ? 'text/csv' : 'application/json';
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', contentType);
      res.send(exportData);
    } catch (error: any) {
      console.error("Export error:", error);
      res.status(500).json({ 
        error: "Failed to export SEO settings",
        message: error.message 
      });
    }
  });

  app.post("/api/seo-settings/import", async (req, res) => {
    try {
      const { data, format } = req.body;
      
      if (!data || !format) {
        return res.status(400).json({ error: "Data and format are required" });
      }

      if (!['csv', 'json'].includes(format)) {
        return res.status(400).json({ error: "Format must be 'csv' or 'json'" });
      }

      const { bulkSEOOperations } = await import('./bulk-seo-operations');
      const result = await bulkSEOOperations.importSeoSettings(data, format);
      
      res.json({
        success: result.success,
        imported: result.imported,
        updated: result.updated,
        errors: result.errors,
        summary: result.summary
      });
    } catch (error: any) {
      console.error("Import error:", error);
      res.status(500).json({ 
        error: "Failed to import SEO settings",
        message: error.message 
      });
    }
  });

  // Get export template
  app.get("/api/seo-settings/template", async (req, res) => {
    try {
      const format = req.query.format as 'csv' | 'json' || 'json';
      
      const { bulkSEOOperations } = await import('./bulk-seo-operations');
      const template = bulkSEOOperations.generateTemplate(format);
      
      const filename = `memopyk-seo-template.${format}`;
      const contentType = format === 'csv' ? 'text/csv' : 'application/json';
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', contentType);
      res.send(template);
    } catch (error: any) {
      console.error("Template generation error:", error);
      res.status(500).json({ 
        error: "Failed to generate template",
        message: error.message 
      });
    }
  });

  // Get export statistics
  app.get("/api/seo-settings/export-stats", async (req, res) => {
    try {
      const { bulkSEOOperations } = await import('./bulk-seo-operations');
      const stats = await bulkSEOOperations.getExportStats();
      
      res.json({
        success: true,
        stats
      });
    } catch (error: any) {
      console.error("Export stats error:", error);
      res.status(500).json({ 
        error: "Failed to get export statistics",
        message: error.message 
      });
    }
  });

  // Phase 3: Scheduler Management
  app.get("/api/scheduler/schedules", async (req, res) => {
    try {
      const { seoScheduler } = await import('./scheduler');
      const schedules = seoScheduler.getSchedules();
      
      res.json({
        success: true,
        schedules
      });
    } catch (error: any) {
      console.error("Get schedules error:", error);
      res.status(500).json({ 
        error: "Failed to get schedules",
        message: error.message 
      });
    }
  });

  app.put("/api/scheduler/schedules/:pageId", async (req, res) => {
    try {
      const { pageId } = req.params;
      const updates = req.body;
      
      const { seoScheduler } = await import('./scheduler');
      const schedule = await seoScheduler.updateSchedule(pageId, updates);
      
      res.json({
        success: true,
        schedule
      });
    } catch (error: any) {
      console.error("Update schedule error:", error);
      res.status(500).json({ 
        error: "Failed to update schedule",
        message: error.message 
      });
    }
  });

  app.post("/api/scheduler/schedules/:pageId/trigger", async (req, res) => {
    try {
      const { pageId } = req.params;
      
      const { seoScheduler } = await import('./scheduler');
      await seoScheduler.triggerImmediateRun(pageId);
      
      res.json({
        success: true,
        message: "Immediate run triggered"
      });
    } catch (error: any) {
      console.error("Trigger immediate run error:", error);
      res.status(500).json({ 
        error: "Failed to trigger immediate run",
        message: error.message 
      });
    }
  });

  app.get("/api/scheduler/results", async (req, res) => {
    try {
      const { pageId, limit } = req.query;
      
      const { seoScheduler } = await import('./scheduler');
      const results = seoScheduler.getCrawlResults(
        pageId as string, 
        limit ? parseInt(limit as string) : 50
      );
      
      res.json({
        success: true,
        results
      });
    } catch (error: any) {
      console.error("Get crawl results error:", error);
      res.status(500).json({ 
        error: "Failed to get crawl results",
        message: error.message 
      });
    }
  });

  app.get("/api/scheduler/metrics", async (req, res) => {
    try {
      const { seoScheduler } = await import('./scheduler');
      const metrics = seoScheduler.getMonitoringMetrics();
      
      res.json({
        success: true,
        metrics
      });
    } catch (error: any) {
      console.error("Get scheduler metrics error:", error);
      res.status(500).json({ 
        error: "Failed to get scheduler metrics",
        message: error.message 
      });
    }
  });

  // Phase 3: Monitoring & Alerting
  app.get("/api/monitoring/dashboard", async (req, res) => {
    try {
      const { monitoringSystem } = await import('./monitoring');
      const dashboard = monitoringSystem.getDashboardData();
      
      res.json({
        success: true,
        dashboard
      });
    } catch (error: any) {
      console.error("Get monitoring dashboard error:", error);
      res.status(500).json({ 
        error: "Failed to get monitoring dashboard",
        message: error.message 
      });
    }
  });

  app.get("/api/monitoring/alerts", async (req, res) => {
    try {
      const { limit, type, severity } = req.query;
      
      const { monitoringSystem } = await import('./monitoring');
      const alerts = monitoringSystem.getAlerts(
        limit ? parseInt(limit as string) : 50,
        type as any,
        severity as any
      );
      
      res.json({
        success: true,
        alerts
      });
    } catch (error: any) {
      console.error("Get alerts error:", error);
      res.status(500).json({ 
        error: "Failed to get alerts",
        message: error.message 
      });
    }
  });

  app.post("/api/monitoring/alerts/:alertId/acknowledge", async (req, res) => {
    try {
      const { alertId } = req.params;
      
      const { monitoringSystem } = await import('./monitoring');
      const acknowledged = monitoringSystem.acknowledgeAlert(alertId);
      
      res.json({
        success: acknowledged,
        message: acknowledged ? "Alert acknowledged" : "Alert not found"
      });
    } catch (error: any) {
      console.error("Acknowledge alert error:", error);
      res.status(500).json({ 
        error: "Failed to acknowledge alert",
        message: error.message 
      });
    }
  });

  app.post("/api/monitoring/alerts/acknowledge-all", async (req, res) => {
    try {
      const { monitoringSystem } = await import('./monitoring');
      const count = monitoringSystem.acknowledgeAllAlerts();
      
      res.json({
        success: true,
        acknowledgedCount: count,
        message: `Acknowledged ${count} alerts`
      });
    } catch (error: any) {
      console.error("Acknowledge all alerts error:", error);
      res.status(500).json({ 
        error: "Failed to acknowledge all alerts",
        message: error.message 
      });
    }
  });

  app.put("/api/monitoring/config", async (req, res) => {
    try {
      const updates = req.body;
      
      const { monitoringSystem } = await import('./monitoring');
      const config = monitoringSystem.updateConfig(updates);
      
      res.json({
        success: true,
        config
      });
    } catch (error: any) {
      console.error("Update monitoring config error:", error);
      res.status(500).json({ 
        error: "Failed to update monitoring config",
        message: error.message 
      });
    }
  });

  // Phase 3: Advanced Search Console Metrics
  app.get("/api/search-console/metrics/:pageId", async (req, res) => {
    try {
      const { pageId } = req.params;
      const { period } = req.query;
      
      const settings = await storage.getSeoSettings();
      const setting = settings.find(s => s.id === pageId);
      
      if (!setting) {
        return res.status(404).json({ error: "SEO setting not found" });
      }

      const baseUrl = 'https://memopyk.com';
      const fullUrl = `${baseUrl}${setting.urlSlug}`;
      
      const { gscMetrics } = await import('./search-console-metrics');
      const metrics = await gscMetrics.getMetricsForUrl(fullUrl, period as any);
      
      if (!metrics) {
        return res.status(404).json({ error: "No metrics available" });
      }

      const sparklineData = gscMetrics.getSparklineData(metrics);
      
      res.json({
        success: true,
        metrics,
        sparklineData
      });
    } catch (error: any) {
      console.error("Get GSC metrics error:", error);
      res.status(500).json({ 
        error: "Failed to get Search Console metrics",
        message: error.message 
      });
    }
  });

  app.get("/api/search-console/metrics/:pageId/export", async (req, res) => {
    try {
      const { pageId } = req.params;
      const { period } = req.query;
      
      const settings = await storage.getSeoSettings();
      const setting = settings.find(s => s.id === pageId);
      
      if (!setting) {
        return res.status(404).json({ error: "SEO setting not found" });
      }

      const baseUrl = 'https://memopyk.com';
      const fullUrl = `${baseUrl}${setting.urlSlug}`;
      
      const { gscMetrics } = await import('./search-console-metrics');
      const metrics = await gscMetrics.getMetricsForUrl(fullUrl, period as any);
      
      if (!metrics) {
        return res.status(404).json({ error: "No metrics available" });
      }

      const csvData = gscMetrics.generateCSVReport(metrics);
      const filename = `gsc-metrics-${setting.page}-${period || '7d'}-${new Date().toISOString().split('T')[0]}.csv`;
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'text/csv');
      res.send(csvData);
    } catch (error: any) {
      console.error("Export GSC metrics error:", error);
      res.status(500).json({ 
        error: "Failed to export Search Console metrics",
        message: error.message 
      });
    }
  });

  app.get("/api/search-console/performance-report", async (req, res) => {
    try {
      const { gscMetrics } = await import('./search-console-metrics');
      const report = await gscMetrics.getPagePerformanceReport();
      
      res.json({
        success: true,
        report
      });
    } catch (error: any) {
      console.error("Get performance report error:", error);
      res.status(500).json({ 
        error: "Failed to get performance report",
        message: error.message 
      });
    }
  });

  app.get("/api/search-console/queries/:pageId", async (req, res) => {
    try {
      const { pageId } = req.params;
      const { limit } = req.query;
      
      const settings = await storage.getSeoSettings();
      const setting = settings.find(s => s.id === pageId);
      
      if (!setting) {
        return res.status(404).json({ error: "SEO setting not found" });
      }

      const baseUrl = 'https://memopyk.com';
      const fullUrl = `${baseUrl}${setting.urlSlug}`;
      
      const { gscMetrics } = await import('./search-console-metrics');
      const queries = await gscMetrics.getTopQueries(fullUrl, limit ? parseInt(limit as string) : 10);
      
      res.json({
        success: true,
        queries
      });
    } catch (error: any) {
      console.error("Get top queries error:", error);
      res.status(500).json({ 
        error: "Failed to get top queries",
        message: error.message 
      });
    }
  });

  // Phase 3: Cache Management
  app.get("/api/cache/stats", async (req, res) => {
    try {
      const { seoCache } = await import('./redis-cache');
      const stats = seoCache.getStats();
      
      res.json({
        success: true,
        stats
      });
    } catch (error: any) {
      console.error("Get cache stats error:", error);
      res.status(500).json({ 
        error: "Failed to get cache statistics",
        message: error.message 
      });
    }
  });

  app.post("/api/cache/flush", async (req, res) => {
    try {
      const { seoCache } = await import('./redis-cache');
      await seoCache.invalidateAll();
      
      res.json({
        success: true,
        message: "Cache flushed successfully"
      });
    } catch (error: any) {
      console.error("Flush cache error:", error);
      res.status(500).json({ 
        error: "Failed to flush cache",
        message: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
