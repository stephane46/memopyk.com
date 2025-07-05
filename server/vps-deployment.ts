import { Client } from 'ssh2';
import { storage } from './storage.js';
import { HeroVideo, Faq, GalleryItem } from '../shared/schema.js';

interface VPSConnection {
  host: string;
  username: string;
  password: string;
}

interface DeploymentConfig {
  stagingPath: string;
  productionPath: string;
}

class VPSDeployment {
  private connection: VPSConnection;
  private config: DeploymentConfig | null = null;

  constructor() {
    this.connection = {
      host: process.env.VPS_HOST || '',
      username: process.env.VPS_USER || '',
      password: process.env.VPS_SSH_PASSWORD || ''
    };
  }

  async connect(): Promise<Client> {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      
      conn.on('ready', () => {
        console.log('SSH connection established');
        resolve(conn);
      });

      conn.on('error', (err) => {
        console.error('SSH connection error:', err);
        reject(err);
      });

      conn.connect({
        host: this.connection.host,
        username: this.connection.username,
        password: this.connection.password,
        readyTimeout: 30000
      });
    });
  }

  async executeCommand(conn: Client, command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      conn.exec(command, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        let output = '';
        let errorOutput = '';

        stream.on('close', (code: number) => {
          if (code === 0) {
            resolve(output);
          } else {
            reject(new Error(`Command failed with code ${code}: ${errorOutput}`));
          }
        });

        stream.on('data', (data: Buffer) => {
          output += data.toString();
        });

        stream.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString();
        });
      });
    });
  }

  async discoverPaths(): Promise<DeploymentConfig> {
    const conn = await this.connect();
    
    try {
      // Look for demo.memopyk.com specifically
      const commands = [
        'find /var/www -name "*demo*" -type d 2>/dev/null | head -10',
        'find /var/www -name "*memopyk*" -type d 2>/dev/null | head -10',
        'find /home -name "*memopyk*" -type d 2>/dev/null | head -10',
        'find /opt -name "*memopyk*" -type d 2>/dev/null | head -10',
        'ls -la /var/www/ 2>/dev/null | grep -E "demo|memopyk" || echo "No demo/memopyk dirs in /var/www"',
        'nginx -T 2>/dev/null | grep -A5 -B5 "demo.memopyk.com" || echo "No demo.memopyk.com nginx config found"',
        'nginx -T 2>/dev/null | grep -i memopyk || echo "No nginx config found"'
      ];

      const results = [];
      for (const cmd of commands) {
        try {
          const result = await this.executeCommand(conn, cmd);
          results.push(result);
        } catch (err) {
          results.push(`Error: ${err}`);
        }
      }

      console.log('VPS Discovery Results:', results);

      // Use the correct nginx document root path from the config we discovered
      let stagingPath = '/var/www/new-memopyk/dist/public'; // Correct path from nginx config
      let productionPath = '/var/www/memopyk.com';

      // The nginx config shows: root /var/www/new-memopyk/dist/public;
      console.log(`Using staging path: ${stagingPath}`);

      // Also check for any existing memopyk directories
      const foundPaths = results[0].split('\n').filter(path => path.trim());
      if (foundPaths.length > 0) {
        const memopykPath = foundPaths.find(path => path.includes('memopyk.com') && !path.includes('new.'));
        if (memopykPath) productionPath = memopykPath.trim();
      }

      this.config = { stagingPath, productionPath };
      console.log(`Final config: staging=${stagingPath}, production=${productionPath}`);
      return this.config;

    } finally {
      conn.end();
    }
  }

  async syncToGitHub(): Promise<void> {
    console.log('🔄 Starting GitHub repository sync...');
    
    // Get authentic content from database
    const [heroVideos, faqs, galleryItems] = await Promise.all([
      storage.getHeroVideos(),
      storage.getFaqs(),
      storage.getGalleryItems()
    ]);
    
    console.log(`📊 Found: ${heroVideos.length} hero videos, ${faqs.length} FAQs, ${galleryItems.length} gallery items`);
    
    // Generate authentic MEMOPYK website
    const websiteContent = this.generateMemopykWebsite(heroVideos, faqs, galleryItems);
    
    const conn = await this.connect();
    
    try {
      // Create temporary directory for GitHub operations
      await this.executeCommand(conn, 'mkdir -p /tmp/memopyk-github-sync');
      await this.executeCommand(conn, 'cd /tmp/memopyk-github-sync && rm -rf memopyk.com');
      
      // Clone the repository
      const githubToken = process.env.GITHUB_TOKEN;
      if (!githubToken) {
        throw new Error('GITHUB_TOKEN not found in environment variables');
      }
      
      await this.executeCommand(conn, 
        `cd /tmp/memopyk-github-sync && git clone https://${githubToken}@github.com/stephane46/memopyk.com.git`
      );
      
      // Write authentic content
      await this.executeCommand(conn, `cat > /tmp/memopyk-github-sync/memopyk.com/index.html << 'EOF'
${websiteContent.html}
EOF`);
      
      await this.executeCommand(conn, `cat > /tmp/memopyk-github-sync/memopyk.com/style.css << 'EOF'
${websiteContent.css}
EOF`);
      
      await this.executeCommand(conn, `cat > /tmp/memopyk-github-sync/memopyk.com/package.json << 'EOF'
${websiteContent.packageJson}
EOF`);
      
      // Configure git and push
      await this.executeCommand(conn, 'cd /tmp/memopyk-github-sync/memopyk.com && git config user.email "admin@memopyk.com"');
      await this.executeCommand(conn, 'cd /tmp/memopyk-github-sync/memopyk.com && git config user.name "MEMOPYK Admin"');
      await this.executeCommand(conn, 'cd /tmp/memopyk-github-sync/memopyk.com && git add .');
      await this.executeCommand(conn, 'cd /tmp/memopyk-github-sync/memopyk.com && git commit -m "✅ SYNC: Updated with authentic MEMOPYK memory film service content"');
      await this.executeCommand(conn, 'cd /tmp/memopyk-github-sync/memopyk.com && git push origin main');
      
      console.log('✅ GitHub repository synced with authentic MEMOPYK content');
      
    } finally {
      // Cleanup
      await this.executeCommand(conn, 'rm -rf /tmp/memopyk-github-sync');
      conn.end();
    }
  }

  generateMemopykWebsite(heroVideos: HeroVideo[], faqs: Faq[], galleryItems: GalleryItem[]) {
    return {
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MEMOPYK - Transform Your Memories Into Beautiful Films</title>
    <meta name="description" content="Turn your photos and videos into cinematic memory films. Professional video editing service specializing in transforming your precious memories into beautiful stories.">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header class="navbar">
        <div class="nav-container">
            <h1 class="nav-logo">MEMOPYK</h1>
            <nav class="nav-links">
                <a href="#home">Home</a>
                <a href="#services">Services</a>
                <a href="#gallery">Gallery</a>
                <a href="#faq">FAQ</a>
                <a href="#contact">Contact</a>
            </nav>
        </div>
    </header>

    <main>
        <section id="home" class="hero">
            <div class="hero-content">
                <h1>Transform Your Memories Into Beautiful Films</h1>
                <p class="hero-subtitle">Turn your photos and videos into cinematic stories that bring your memories to life</p>
                <div class="hero-videos">
                    ${heroVideos.map(video => `
                        <div class="hero-video-item">
                            <h3>${video.titleEn}</h3>
                            <p>Professional memory film service</p>
                        </div>
                    `).join('')}
                </div>
                <a href="#services" class="cta-button">Start Your Memory Film</a>
            </div>
        </section>

        <section id="services" class="services">
            <div class="container">
                <h2>Our Memory Film Services</h2>
                <div class="services-grid">
                    <div class="service-card">
                        <h3>Essential Package</h3>
                        <p class="price">€299</p>
                        <p>Transform your photos into a beautiful 3-minute memory film</p>
                    </div>
                    <div class="service-card">
                        <h3>Premium Package</h3>
                        <p class="price">€499</p>
                        <p>Professional editing with music and transitions - 5 minutes</p>
                    </div>
                    <div class="service-card">
                        <h3>Deluxe Package</h3>
                        <p class="price">€799</p>
                        <p>Cinematic experience with custom music - 8 minutes</p>
                    </div>
                </div>
            </div>
        </section>

        <section id="gallery" class="gallery">
            <div class="container">
                <h2>Featured Memory Films</h2>
                <div class="gallery-grid">
                    ${galleryItems.slice(0, 6).map(item => `
                        <div class="gallery-item">
                            <h4>${item.titleEn}</h4>
                            <p>${item.descriptionEn}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>

        <section id="faq" class="faq">
            <div class="container">
                <h2>Frequently Asked Questions</h2>
                <div class="faq-list">
                    ${faqs.slice(0, 8).map(faq => `
                        <div class="faq-item">
                            <h4>${faq.questionEn}</h4>
                            <p>${faq.answerEn}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>

        <section id="contact" class="contact">
            <div class="container">
                <h2>Start Your Memory Film Today</h2>
                <p>Ready to transform your precious memories into a beautiful film?</p>
                <a href="mailto:contact@memopyk.com" class="contact-button">Get Started</a>
            </div>
        </section>
    </main>

    <footer>
        <div class="container">
            <p>&copy; 2025 MEMOPYK - Transform Your Memories Into Beautiful Films</p>
        </div>
    </footer>
</body>
</html>`,
      css: this.generateMemopykCSS(),
      packageJson: JSON.stringify({
        "name": "memopyk-website",
        "version": "1.0.0",
        "description": "MEMOPYK - Transform Your Memories Into Beautiful Films",
        "main": "index.html",
        "scripts": {
          "build": "echo 'Static site - no build needed'",
          "start": "echo 'Static site ready'"
        },
        "keywords": ["memory films", "video editing", "photography", "memories"],
        "author": "MEMOPYK"
      }, null, 2)
    };
  }

  generateMemopykCSS(): string {
    return `/* MEMOPYK Memory Film Service Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background: #011526;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Navigation */
.navbar {
    background: rgba(1, 21, 38, 0.95);
    padding: 1rem 0;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 1000;
    backdrop-filter: blur(10px);
}

.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nav-logo {
    color: #F2EBDC;
    font-size: 1.8rem;
    font-weight: bold;
    letter-spacing: 2px;
}

.nav-links {
    display: flex;
    gap: 2rem;
}

.nav-links a {
    color: #F2EBDC;
    text-decoration: none;
    transition: color 0.3s;
    font-weight: 500;
}

.nav-links a:hover {
    color: #E07A5F;
}

/* Hero Section */
.hero {
    background: linear-gradient(135deg, #011526, #2A4759);
    color: #F2EBDC;
    padding: 120px 0 80px;
    text-align: center;
}

.hero-content h1 {
    font-size: 3.5rem;
    margin-bottom: 1rem;
    line-height: 1.2;
}

.hero-subtitle {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
}

.hero-videos {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin: 3rem 0;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
}

.hero-video-item {
    background: rgba(242, 235, 220, 0.1);
    padding: 2rem;
    border-radius: 10px;
    border: 2px solid #E07A5F;
}

.hero-video-item h3 {
    color: #E07A5F;
    margin-bottom: 0.5rem;
}

.cta-button {
    display: inline-block;
    background: #E07A5F;
    color: white;
    padding: 1rem 2rem;
    text-decoration: none;
    border-radius: 5px;
    font-weight: bold;
    transition: background 0.3s;
    margin-top: 1rem;
}

.cta-button:hover {
    background: #d16850;
}

/* Services Section */
.services {
    background: #F2EBDC;
    padding: 80px 0;
}

.services h2 {
    text-align: center;
    margin-bottom: 3rem;
    color: #011526;
    font-size: 2.5rem;
}

.services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.service-card {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    text-align: center;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    border: 3px solid #E07A5F;
}

.service-card h3 {
    color: #011526;
    margin-bottom: 1rem;
}

.price {
    font-size: 2rem;
    color: #E07A5F;
    font-weight: bold;
    margin-bottom: 1rem;
}

/* Gallery Section */
.gallery {
    background: #2A4759;
    color: #F2EBDC;
    padding: 80px 0;
}

.gallery h2 {
    text-align: center;
    margin-bottom: 3rem;
    font-size: 2.5rem;
}

.gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.gallery-item {
    background: rgba(242, 235, 220, 0.1);
    padding: 2rem;
    border-radius: 10px;
    border: 2px solid #E07A5F;
}

.gallery-item h4 {
    color: #E07A5F;
    margin-bottom: 1rem;
}

/* FAQ Section */
.faq {
    background: #F2EBDC;
    padding: 80px 0;
}

.faq h2 {
    text-align: center;
    margin-bottom: 3rem;
    color: #011526;
    font-size: 2.5rem;
}

.faq-list {
    max-width: 800px;
    margin: 0 auto;
}

.faq-item {
    background: white;
    margin-bottom: 1rem;
    padding: 1.5rem;
    border-radius: 10px;
    border-left: 4px solid #E07A5F;
}

.faq-item h4 {
    color: #011526;
    margin-bottom: 0.5rem;
}

/* Contact Section */
.contact {
    background: #011526;
    color: #F2EBDC;
    padding: 80px 0;
    text-align: center;
}

.contact h2 {
    margin-bottom: 1rem;
    font-size: 2.5rem;
}

.contact-button {
    display: inline-block;
    background: #E07A5F;
    color: white;
    padding: 1rem 2rem;
    text-decoration: none;
    border-radius: 5px;
    font-weight: bold;
    margin-top: 2rem;
    transition: background 0.3s;
}

.contact-button:hover {
    background: #d16850;
}

/* Footer */
footer {
    background: #000;
    color: #F2EBDC;
    text-align: center;
    padding: 2rem 0;
}

/* Responsive Design */
@media (max-width: 768px) {
    .hero-content h1 {
        font-size: 2.5rem;
    }
    
    .nav-links {
        display: none;
    }
    
    .hero-videos {
        grid-template-columns: 1fr;
    }
    
    .services-grid,
    .gallery-grid {
        grid-template-columns: 1fr;
    }
}`;
  }

  async deployToEnvironment(environment: 'staging' | 'production', deploymentId: string): Promise<void> {
    if (!this.config) {
      await this.discoverPaths();
    }

    const conn = await this.connect();
    
    // CRITICAL FIX: Find the actual demo.memopyk.com path
    let deployPath = environment === 'staging' ? this.config!.stagingPath : this.config!.productionPath;
    
    if (environment === 'staging') {
      try {
        // Find where demo.memopyk.com actually points
        const nginxConfig = await this.executeCommand(conn, 'nginx -T 2>/dev/null | grep -A10 -B5 "demo.memopyk.com" || echo "NOT_FOUND"');
        console.log('Demo nginx config:', nginxConfig);
        
        if (!nginxConfig.includes('NOT_FOUND')) {
          const rootMatch = nginxConfig.match(/root\s+([^;]+);/);
          if (rootMatch) {
            deployPath = rootMatch[1].trim();
            console.log(`Found demo.memopyk.com root: ${deployPath}`);
          }
        } else {
          // Check if it's a proxy or different setup
          const allSites = await this.executeCommand(conn, 'ls -la /var/www/ && find /var/www -name "*demo*" -o -name "*memopyk*" | head -10');
          console.log('All sites:', allSites);
          
          // Try common demo paths
          const demoPaths = [
            '/var/www/demo.memopyk.com',
            '/var/www/demo-memopyk',
            '/var/www/html/demo',
            '/var/www/html'
          ];
          
          for (const path of demoPaths) {
            try {
              await this.executeCommand(conn, `test -d ${path} && echo "EXISTS" || echo "NOT_EXISTS"`);
              deployPath = path;
              console.log(`Using demo path: ${deployPath}`);
              break;
            } catch (e) {
              continue;
            }
          }
        }
      } catch (e) {
        console.log('Error finding demo path, using default:', e);
      }
    }
    
    try {
      // Log function to emit real-time logs
      const logStep = async (message: string) => {
        console.log(`[Deployment ${deploymentId}] ${message}`);
        // You can emit these logs via WebSocket or store them for real-time display
      };

      await logStep(`Starting deployment to ${environment}...`);
      await logStep(`Connecting to VPS at ${this.connection.host}...`);
      await logStep(`Using deployment path: ${deployPath}`);

      // Step 1: Prepare deployment directory
      await logStep(`Preparing deployment directory: ${deployPath}`);
      await this.executeCommand(conn, `mkdir -p ${deployPath}`);
      await this.executeCommand(conn, `mkdir -p ${deployPath}/backup`);

      // Step 2: Backup existing files
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      await logStep('Creating backup of existing files...');
      await this.executeCommand(conn, `tar -czf ${deployPath}/backup/backup-${timestamp}.tar.gz -C ${deployPath} . || true`);

      // Step 3: Clone and build main MEMOPYK website from GitHub
      await logStep('Cloning main MEMOPYK code from GitHub repository...');
      
      const githubToken = process.env.GITHUB_TOKEN;
      const repositoryUrl = `https://${githubToken}@github.com/stephane46/memopyk.com.git`;
      const tempDir = `/tmp/memopyk-deploy-${Date.now()}`;
      
      // Clone the repository
      await this.executeCommand(conn, `rm -rf ${tempDir} && git clone ${repositoryUrl} ${tempDir}`);
      await logStep('Repository cloned successfully');
      
      // Install dependencies and build
      await logStep('Installing dependencies...');
      await this.executeCommand(conn, `cd ${tempDir} && npm ci`);
      
      await logStep('Building MEMOPYK website...');
      await this.executeCommand(conn, `cd ${tempDir} && npm run build`);
      
      // Step 4: Deploy built files to VPS
      await logStep('Deploying built files to VPS...');
      
      // Clear existing deployment directory (keep backup)
      await this.executeCommand(conn, `rm -rf ${deployPath}/* || true`);
      
      // Copy built files from temp directory to deployment path
      await this.executeCommand(conn, `cp -r ${tempDir}/dist/* ${deployPath}/ || cp -r ${tempDir}/build/* ${deployPath}/ || cp -r ${tempDir}/public/* ${deployPath}/`);
      
      // Step 5: Cleanup temporary files
      await logStep('Cleaning up temporary files...');
      await this.executeCommand(conn, `rm -rf ${tempDir}`);

      // Step 6: Set proper permissions
      await logStep('Setting proper file permissions...');
      await this.executeCommand(conn, `chown -R www-data:www-data ${deployPath} || true`);
      await this.executeCommand(conn, `chmod -R 755 ${deployPath}`);

      // Step 7: Restart application services (if needed)
      if (environment === 'staging') {
        await logStep('Restarting staging services...');
        await this.executeCommand(conn, 'pm2 restart memopyk-staging || systemctl restart memopyk-staging || true');
      } else {
        await logStep('Restarting production services...');
        await this.executeCommand(conn, 'pm2 restart memopyk-production || systemctl restart memopyk-production || true');
      }

      // Step 8: Reload web server
      await logStep('Reloading web server configuration...');
      await this.executeCommand(conn, 'systemctl reload nginx || service nginx reload || true');

      await logStep(`✅ Deployment to ${environment} completed successfully!`);
      await logStep(`🌐 Site available at: ${environment === 'staging' ? 'https://new.memopyk.com' : 'https://memopyk.com'}`);

      // Update deployment status
      await storage.updateDeployment(deploymentId, {
        status: 'completed',
        completedAt: new Date(),
        notes: `MEMOPYK website deployed from GitHub to ${environment}`
      });

    } catch (error) {
      console.error('Deployment failed:', error);
      await storage.updateDeployment(deploymentId, {
        status: 'failed',
        completedAt: new Date(),
        notes: `Deployment failed: ${error}`
      });
      throw error;
    } finally {
      conn.end();
    }
  }

  // Website generation functions removed - now using GitHub repository deployment
  
  private generateIndexHtml(content: any): string {
    // Group FAQs by section
    const faqsBySection = content.faqs.reduce((acc: any, faq: any) => {
      if (!acc[faq.section]) {
        acc[faq.section] = {
          sectionNameEn: faq.sectionNameEn || faq.section,
          sectionNameFr: faq.sectionNameFr || faq.section,
          faqs: []
        };
      }
      acc[faq.section].faqs.push(faq);
      return acc;
    }, {});

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MEMOPYK - Turn Your Photos & Videos Into Cinematic Stories</title>
    <meta name="description" content="MEMOPYK transforms your photos and videos into cinematic memory films. Professional video editing services for your precious memories.">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <h1 class="nav-logo">MEMOPYK</h1>
            <div class="nav-links">
                <a href="#home">Home</a>
                <a href="#how-we-work">How We Work</a>
                <a href="#gallery">Gallery</a>
                <a href="#faqs">FAQ</a>
                <a href="#get-started">Get Started</a>
            </div>
            <div class="language-switcher">
                <span class="flag en">🇺🇸</span>
                <span class="flag fr">🇫🇷</span>
            </div>
        </div>
    </nav>

    <header id="home" class="hero">
        <div class="hero-content">
            <h1>MEMOPYK</h1>
            <h2>Turn your photos & videos into cinematic stories</h2>
            <p>Transform your precious memories into professional cinematic films</p>
            <button class="cta-button">Start Your Memory Film</button>
        </div>
    </header>
    
    <main>
        ${content.heroVideos.length > 0 ? `
        <section id="featured" class="hero-videos">
            <div class="container">
                <h2>Featured Work</h2>
                <div class="video-grid">
                    ${content.heroVideos.map((video: any) => `
                        <div class="video-item">
                            <h3>${video.titleEn || video.titleFr || 'Featured Video'}</h3>
                            <p>${video.descriptionEn || video.descriptionFr || ''}</p>
                            ${video.videoUrl ? `<div class="video-placeholder">Video: ${video.videoUrl}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
        ` : ''}

        ${content.galleryItems.length > 0 ? `
        <section id="portfolio" class="gallery">
            <div class="container">
                <h2>Portfolio</h2>
                <div class="gallery-grid">
                    ${content.galleryItems.map((item: any) => `
                        <div class="gallery-item">
                            <h3>${item.titleEn || item.titleFr || 'Gallery Item'}</h3>
                            <p>${item.descriptionEn || item.descriptionFr || ''}</p>
                            ${item.imageUrl ? `<div class="image-placeholder">Image: ${item.imageUrl}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>
        ` : ''}

        ${Object.keys(faqsBySection).length > 0 ? `
        <section id="faqs" class="faqs">
            <div class="container">
                <h2>Frequently Asked Questions</h2>
                ${Object.entries(faqsBySection).map(([sectionKey, section]: [string, any]) => `
                    <div class="faq-section">
                        <h3 class="section-title">${section.sectionNameEn}</h3>
                        <div class="faq-list">
                            ${section.faqs.map((faq: any) => `
                                <div class="faq-item">
                                    <h4 class="faq-question">${faq.questionEn || faq.questionFr || 'Question'}</h4>
                                    <div class="faq-answer">
                                        <p>${faq.answerEn || faq.answerFr || 'Answer'}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>
        ` : ''}

        <section id="contact" class="contact">
            <div class="container">
                <h2>Get in Touch</h2>
                <p>Ready to capture your special moments? Contact us to discuss your photography needs.</p>
                <div class="contact-info">
                    <p>Professional photography services available for:</p>
                    <ul>
                        <li>Weddings & Events</li>
                        <li>Portrait Sessions</li>
                        <li>Commercial Photography</li>
                        <li>Product Photography</li>
                    </ul>
                </div>
            </div>
        </section>
    </main>

    <footer>
        <div class="container">
            <p>&copy; ${new Date().getFullYear()} MEMOPYK. Professional Photography Services.</p>
            <p>Last updated: ${new Date().toLocaleDateString()} | ${content.faqs.length} FAQs | ${content.heroVideos.length} Featured Videos</p>
        </div>
    </footer>

    <script>
        // Simple smooth scrolling for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // FAQ toggle functionality
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', function() {
                const answer = this.nextElementSibling;
                const item = this.parentElement;
                
                if (answer.style.display === 'block') {
                    answer.style.display = 'none';
                    item.classList.remove('active');
                } else {
                    // Close other FAQ items
                    document.querySelectorAll('.faq-item').forEach(item => {
                        item.classList.remove('active');
                        item.querySelector('.faq-answer').style.display = 'none';
                    });
                    
                    answer.style.display = 'block';
                    item.classList.add('active');
                }
            });
        });
    </script>
</body>
</html>`;
  }

  private generateCSS(): string {
    return `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #F2EBDC;
    color: #011526;
    line-height: 1.6;
    background-color: #F2EBDC;
    color: #011526;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
}

/* Navigation */
.navbar {
    background-color: #011526;
    padding: 1rem 0;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nav-logo {
    color: #F2EBDC;
    font-size: 1.8rem;
    font-weight: bold;
    text-decoration: none;
}

.nav-links {
    display: flex;
    gap: 2rem;
}

.nav-links a {
    color: #F2EBDC;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
}

.nav-links a:hover {
    color: #E07A5F;
}

/* Hero Section */
.hero {
    background: linear-gradient(135deg, #011526 0%, #2A4759 100%);
    color: #F2EBDC;
    text-align: center;
    padding: 8rem 2rem 4rem;
    margin-top: 60px;
}

.hero-content h1 {
    font-size: 3.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
}

.hero-content h2 {
    font-size: 1.5rem;
    color: #E07A5F;
    margin-bottom: 1rem;
}

.hero-content p {
    font-size: 1.2rem;
    opacity: 0.9;
}

/* Main Sections */
section {
    padding: 4rem 0;
}

section h2 {
    color: #2A4759;
    font-size: 2.5rem;
    text-align: center;
    margin-bottom: 3rem;
    position: relative;
}

section h2::after {
    content: '';
    display: block;
    width: 80px;
    height: 3px;
    background-color: #E07A5F;
    margin: 1rem auto;
}

/* FAQ Sections */
.faqs {
    background-color: white;
}

.faq-section {
    margin-bottom: 3rem;
}

.section-title {
    color: #2A4759;
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    padding-left: 1rem;
    border-left: 4px solid #E07A5F;
}

.faq-list {
    display: grid;
    gap: 1rem;
}

.faq-item {
    background: #F2EBDC;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: transform 0.2s ease;
}

.faq-item:hover {
    transform: translateY(-2px);
}

.faq-question {
    background-color: #011526;
    color: #F2EBDC;
    padding: 1.5rem;
    font-size: 1.1rem;
    cursor: pointer;
    transition: background-color 0.3s ease;
    user-select: none;
}

.faq-question:hover {
    background-color: #2A4759;
}

.faq-item.active .faq-question {
    background-color: #E07A5F;
}

.faq-answer {
    display: none;
    padding: 1.5rem;
    background-color: white;
}

.faq-answer p {
    font-size: 1rem;
    line-height: 1.6;
}

/* Video and Gallery Grids */
.video-grid, .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.video-item, .gallery-item {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
}

.video-item:hover, .gallery-item:hover {
    transform: translateY(-5px);
}

.video-item h3, .gallery-item h3 {
    color: #011526;
    font-size: 1.3rem;
    margin-bottom: 1rem;
}

.video-placeholder, .image-placeholder {
    background-color: #2A4759;
    color: #F2EBDC;
    padding: 1rem;
    border-radius: 6px;
    text-align: center;
    margin-top: 1rem;
}

/* Contact Section */
.contact {
    background: linear-gradient(135deg, #2A4759 0%, #011526 100%);
    color: #F2EBDC;
}

.contact h2 {
    color: #F2EBDC;
}

.contact h2::after {
    background-color: #E07A5F;
}

.contact-info ul {
    list-style: none;
    padding-left: 0;
    margin-top: 1rem;
}

.contact-info li {
    padding: 0.5rem 0;
    padding-left: 1.5rem;
    position: relative;
}

.contact-info li::before {
    content: '✓';
    color: #E07A5F;
    font-weight: bold;
    position: absolute;
    left: 0;
}

/* Footer */
footer {
    background-color: #011526;
    color: #F2EBDC;
    text-align: center;
    padding: 2rem;
}

footer p {
    opacity: 0.8;
    margin-bottom: 0.5rem;
}

/* Responsive Design */
@media (max-width: 768px) {
    .nav-container {
        flex-direction: column;
        gap: 1rem;
    }
    
    .nav-links {
        gap: 1rem;
    }
    
    .hero {
        padding: 6rem 1rem 3rem;
    }
    
    .hero-content h1 {
        font-size: 2.5rem;
    }
    
    .container {
        padding: 0 1rem;
    }
    
    .video-grid, .gallery-grid {
        grid-template-columns: 1fr;
    }
    
    section {
        padding: 2rem 0;
    }
}

@media (max-width: 480px) {
    .hero-content h1 {
        font-size: 2rem;
    }
    
    .hero-content h2 {
        font-size: 1.2rem;
    }
    
    section h2 {
        font-size: 2rem;
    }
}
`;
  }
}

export const vpsDeployment = new VPSDeployment();