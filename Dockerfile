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

# Copy built files to correct location for production serving
RUN mkdir -p server/public && cp -r dist/public/* server/public/

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/ || exit 1

# Expose port
EXPOSE ${PORT:-3000}

# Start the application
CMD ["npm", "start"]