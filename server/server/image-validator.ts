import fetch from 'node-fetch';

export interface ImageValidationResult {
  isValid: boolean;
  isReachable: boolean;
  dimensions?: { width: number; height: number };
  fileSize?: number;
  contentType?: string;
  loadTime: number;
  errors: string[];
  warnings: string[];
  optimizationSuggestions: string[];
}

export interface ImageValidationOptions {
  maxFileSize?: number; // in bytes, default 8MB
  requiredDimensions?: { width: number; height: number };
  optimalDimensions?: { width: number; height: number };
  allowedFormats?: string[];
  timeout?: number; // in milliseconds
}

const DEFAULT_OPTIONS: ImageValidationOptions = {
  maxFileSize: 8 * 1024 * 1024, // 8MB
  allowedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  timeout: 10000 // 10 seconds
};

export async function validateImageUrl(
  url: string, 
  type: 'og' | 'twitter' = 'og',
  options: ImageValidationOptions = {}
): Promise<ImageValidationResult> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const result: ImageValidationResult = {
    isValid: false,
    isReachable: false,
    loadTime: 0,
    errors: [],
    warnings: [],
    optimizationSuggestions: []
  };

  try {
    // Basic URL validation
    if (!url || typeof url !== 'string') {
      result.errors.push('Invalid URL provided');
      result.loadTime = Date.now() - startTime;
      return result;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      result.errors.push('Malformed URL format');
      result.loadTime = Date.now() - startTime;
      return result;
    }

    // HTTPS requirement
    if (parsedUrl.protocol !== 'https:') {
      result.errors.push('Images must be served over HTTPS for social sharing');
      result.loadTime = Date.now() - startTime;
      return result;
    }

    // Fetch image with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), opts.timeout);

    try {
      const response = await fetch(url, {
        method: 'HEAD', // Use HEAD to get headers without downloading full image
        signal: controller.signal,
        headers: {
          'User-Agent': 'MEMOPYK-SEO-Validator/1.0'
        }
      });

      clearTimeout(timeoutId);
      result.loadTime = Date.now() - startTime;

      if (!response.ok) {
        result.errors.push(`Image not accessible: HTTP ${response.status} ${response.statusText}`);
        return result;
      }

      result.isReachable = true;

      // Validate content type
      const contentType = response.headers.get('content-type');
      if (contentType) {
        result.contentType = contentType;
        if (!opts.allowedFormats?.includes(contentType)) {
          result.errors.push(`Unsupported image format: ${contentType}. Supported: ${opts.allowedFormats?.join(', ')}`);
        }
      } else {
        result.warnings.push('Content-Type header missing');
      }

      // Validate file size
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        result.fileSize = parseInt(contentLength, 10);
        if (opts.maxFileSize && result.fileSize > opts.maxFileSize) {
          result.errors.push(`File size too large: ${Math.round(result.fileSize / 1024 / 1024)}MB. Maximum: ${Math.round(opts.maxFileSize / 1024 / 1024)}MB`);
        }
      }

      // For comprehensive validation, we need to fetch the image to get dimensions
      // This is more expensive but provides complete validation
      if (result.errors.length === 0) {
        try {
          const imageResponse = await fetch(url, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'MEMOPYK-SEO-Validator/1.0'
            }
          });

          if (imageResponse.ok) {
            const buffer = await imageResponse.arrayBuffer();
            const dimensions = await getImageDimensions(Buffer.from(buffer));
            
            if (dimensions) {
              result.dimensions = dimensions;
              
              // Type-specific dimension validation
              if (type === 'og') {
                validateOGDimensions(result, dimensions);
              } else if (type === 'twitter') {
                validateTwitterDimensions(result, dimensions);
              }
            }
          }
        } catch (dimensionError) {
          result.warnings.push('Could not determine image dimensions');
        }
      }

      // Generate optimization suggestions
      generateOptimizationSuggestions(result, type);

      result.isValid = result.errors.length === 0;

    } catch (fetchError) {
      clearTimeout(timeoutId);
      result.loadTime = Date.now() - startTime;
      
      if (fetchError.name === 'AbortError') {
        result.errors.push(`Request timeout after ${opts.timeout}ms`);
      } else {
        result.errors.push(`Network error: ${fetchError.message}`);
      }
    }

  } catch (error) {
    result.loadTime = Date.now() - startTime;
    result.errors.push(`Validation error: ${error.message}`);
  }

  return result;
}

async function getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number } | null> {
  try {
    // Basic image dimension detection for common formats
    if (buffer.length < 24) return null;

    // PNG detection
    if (buffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a') {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }

    // JPEG detection
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      let offset = 2;
      while (offset < buffer.length - 8) {
        if (buffer[offset] === 0xFF) {
          const marker = buffer[offset + 1];
          if (marker >= 0xC0 && marker <= 0xC3) {
            const height = buffer.readUInt16BE(offset + 5);
            const width = buffer.readUInt16BE(offset + 7);
            return { width, height };
          }
          offset += 2 + buffer.readUInt16BE(offset + 2);
        } else {
          offset++;
        }
      }
    }

    // WebP detection (basic)
    if (buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP') {
      // Simplified WebP dimension detection
      const width = buffer.readUInt16LE(26);
      const height = buffer.readUInt16LE(28);
      return { width: width + 1, height: height + 1 };
    }

    return null;
  } catch (error) {
    return null;
  }
}

function validateOGDimensions(result: ImageValidationResult, dimensions: { width: number; height: number }) {
  const { width, height } = dimensions;
  const aspectRatio = width / height;
  const idealRatio = 1200 / 630; // 1.905

  // Check minimum dimensions
  if (width < 600 || height < 315) {
    result.errors.push(`Open Graph image too small: ${width}×${height}px. Minimum: 600×315px`);
  }

  // Check optimal dimensions
  if (width !== 1200 || height !== 630) {
    result.warnings.push(`Non-optimal dimensions: ${width}×${height}px. Recommended: 1200×630px`);
  }

  // Check aspect ratio
  if (Math.abs(aspectRatio - idealRatio) > 0.1) {
    result.warnings.push(`Aspect ratio ${aspectRatio.toFixed(2)}:1 may be cropped. Ideal: 1.91:1 (1200×630px)`);
  }

  // Large image warnings
  if (width > 2400 || height > 1260) {
    result.warnings.push('Image larger than necessary, consider optimizing for faster loading');
  }
}

function validateTwitterDimensions(result: ImageValidationResult, dimensions: { width: number; height: number }) {
  const { width, height } = dimensions;
  const aspectRatio = width / height;
  const idealRatio = 1200 / 600; // 2.0

  // Check minimum dimensions
  if (width < 600 || height < 300) {
    result.errors.push(`Twitter Card image too small: ${width}×${height}px. Minimum: 600×300px`);
  }

  // Check optimal dimensions
  if (width !== 1200 || height !== 600) {
    result.warnings.push(`Non-optimal dimensions: ${width}×${height}px. Recommended: 1200×600px`);
  }

  // Check aspect ratio
  if (Math.abs(aspectRatio - idealRatio) > 0.1) {
    result.warnings.push(`Aspect ratio ${aspectRatio.toFixed(2)}:1 may be cropped. Ideal: 2:1 (1200×600px)`);
  }
}

function generateOptimizationSuggestions(result: ImageValidationResult, type: 'og' | 'twitter') {
  const suggestions = result.optimizationSuggestions;

  // File size optimization
  if (result.fileSize && result.fileSize > 1024 * 1024) { // > 1MB
    suggestions.push('Consider compressing image to reduce file size and improve loading speed');
  }

  // Format optimization
  if (result.contentType === 'image/png' && result.fileSize && result.fileSize > 500 * 1024) {
    suggestions.push('Consider using JPEG format for photos to reduce file size');
  }

  // Dimension optimization
  if (result.dimensions) {
    const { width, height } = result.dimensions;
    
    if (type === 'og') {
      if (width !== 1200 || height !== 630) {
        suggestions.push('Use 1200×630px for optimal Open Graph display across all platforms');
      }
    }
    
    if (type === 'twitter') {
      if (width !== 1200 || height !== 600) {
        suggestions.push('Use 1200×600px for optimal Twitter Card display');
      }
    }
  }

  // CDN optimization
  if (result.loadTime > 2000) {
    suggestions.push('Consider using a CDN to improve image loading performance');
  }

  // Accessibility
  suggestions.push('Ensure image includes descriptive alt text for accessibility');
}