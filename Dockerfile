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

# Copy built frontend files to the location expected by production server
# The serveStatic function looks for files at import.meta.dirname + "/public"
# In production, this resolves to dist/public since the server bundle is in dist/
RUN mkdir -p dist/public && cp -r dist/public/* dist/public/ 2>/dev/null || cp -r dist/* dist/public/ 2>/dev/null || true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/ || exit 1

# Expose port
EXPOSE ${PORT:-3000}

# Start the application
CMD ["npm", "start"]