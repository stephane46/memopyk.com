FROM node:22-alpine

# Install system dependencies including FFmpeg
RUN apk add --no-cache \
    ffmpeg \
    git \
    curl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Frontend files are already built to dist/public by Vite
# No additional copying needed - the serveStatic function will find them there

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/ || exit 1

# Expose port
EXPOSE ${PORT:-3000}

# Debug build process and file structure
RUN echo "=== Build Debug Info ===" && \
    ls -la && \
    echo "=== Running npm run build ===" && \
    npm run build && \
    echo "=== Build completed, checking dist structure ===" && \
    ls -la dist/ && \
    if [ -d "dist/public" ]; then echo "Found dist/public"; ls -la dist/public/; else echo "No dist/public directory"; fi && \
    echo "=== Build files inspection complete ==="

# Start with simple Node.js server for debugging
CMD ["sh", "-c", "echo 'Starting debug server on port 3000' && node -e 'require(\"http\").createServer((req,res)=>{console.log(req.method,req.url);res.writeHead(200,{\"Content-Type\":\"text/plain\"});res.end(\"Debug server running - \" + new Date().toISOString())}).listen(3000,\"0.0.0.0\",()=>console.log(\"Debug server listening on 0.0.0.0:3000\"))'"]