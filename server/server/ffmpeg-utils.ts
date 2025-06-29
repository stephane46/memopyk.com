import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export interface VideoInfo {
  width: number;
  height: number;
  aspectRatio: number;
  duration: number;
}

export interface ImageResizeOptions {
  inputPath: string;
  outputPath: string;
  targetWidth: number;
  targetHeight: number;
  quality?: number;
}

/**
 * Get video metadata including dimensions and aspect ratio
 */
export async function getVideoInfo(videoPath: string): Promise<VideoInfo> {
  try {
    const command = `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`;
    const { stdout } = await execAsync(command);
    const data = JSON.parse(stdout);
    
    const videoStream = data.streams.find((stream: any) => stream.codec_type === 'video');
    if (!videoStream) {
      throw new Error('No video stream found');
    }

    const width = parseInt(videoStream.width);
    const height = parseInt(videoStream.height);
    const duration = parseFloat(data.format.duration);
    
    return {
      width,
      height,
      aspectRatio: width / height,
      duration
    };
  } catch (error) {
    throw new Error(`Failed to get video info: ${error}`);
  }
}

/**
 * Extract a frame from video at specified timestamp
 */
export async function extractVideoFrame(
  videoPath: string, 
  outputPath: string, 
  timestamp: number = 5
): Promise<string> {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const command = `ffmpeg -ss ${timestamp} -i "${videoPath}" -vframes 1 -q:v 2 "${outputPath}" -y`;
    await execAsync(command);
    
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to extract video frame: ${error}`);
  }
}

/**
 * Resize image to match target dimensions while maintaining aspect ratio
 */
export async function resizeImage(options: ImageResizeOptions): Promise<string> {
  try {
    const { inputPath, outputPath, targetWidth, targetHeight, quality = 85 } = options;
    
    console.log(`[FFmpeg RESIZE] Input: ${inputPath}`);
    console.log(`[FFmpeg RESIZE] Output: ${outputPath}`);
    console.log(`[FFmpeg RESIZE] Target size: ${targetWidth}×${targetHeight}`);
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`[FFmpeg RESIZE] Created directory: ${outputDir}`);
    }

    // Use ffmpeg to resize image with proper aspect ratio handling
    const command = `ffmpeg -i "${inputPath}" -vf "scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:color=black" -q:v ${quality} "${outputPath}" -y`;
    console.log(`[FFmpeg RESIZE] Running command: ${command}`);
    
    const result = await execAsync(command);
    console.log(`[FFmpeg RESIZE] Command completed successfully`);
    console.log(`[FFmpeg RESIZE] FFmpeg output: ${result}`);
    
    // Verify the file was created
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`[FFmpeg RESIZE] Output file created: ${outputPath} (${stats.size} bytes)`);
    } else {
      console.error(`[FFmpeg RESIZE] Output file not found: ${outputPath}`);
    }
    
    return outputPath;
  } catch (error) {
    console.error(`[FFmpeg RESIZE] Error:`, error);
    throw new Error(`Failed to resize image: ${error}`);
  }
}

/**
 * Process gallery item: extract video frame and resize image to match video dimensions
 */
export async function processGalleryItem(
  videoUrl: string,
  imageUrl: string,
  itemId: string
): Promise<{ processedImagePath: string; videoInfo: VideoInfo }> {
  try {
    // Create temporary directory for processing
    const tempDir = path.join(process.cwd(), 'temp', 'gallery', itemId);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Download video temporarily to get info
    const videoPath = path.join(tempDir, 'video.mp4');
    const imagePath = path.join(tempDir, 'original_image.jpg');
    const processedImagePath = path.join(tempDir, 'processed_image.jpg');

    // For now, assume local files or implement download logic
    // In production, you'd download from URLs first
    
    // Get video dimensions
    const videoInfo = await getVideoInfo(videoPath);
    
    // Resize image to match video aspect ratio
    await resizeImage({
      inputPath: imagePath,
      outputPath: processedImagePath,
      targetWidth: videoInfo.width,
      targetHeight: videoInfo.height
    });

    return {
      processedImagePath,
      videoInfo
    };
  } catch (error) {
    throw new Error(`Failed to process gallery item: ${error}`);
  }
}

/**
 * Create thumbnail from video at specified timestamp
 */
export async function createVideoThumbnail(
  videoUrl: string,
  outputPath: string,
  timestamp: number = 5,
  width: number = 640,
  height: number = 360
): Promise<string> {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Extract frame and resize in one command
    const command = `ffmpeg -ss ${timestamp} -i "${videoUrl}" -vf "scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black" -vframes 1 -q:v 2 "${outputPath}" -y`;
    await execAsync(command);
    
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to create video thumbnail: ${error}`);
  }
}

/**
 * Clean up temporary files for a specific gallery item
 */
export function cleanupTempFiles(itemId: string): void {
  try {
    const tempDir = path.join(process.cwd(), 'temp', 'gallery');
    const thumbnailPath = path.join(tempDir, `${itemId}_thumbnail.jpg`);
    const resizedPath = path.join(tempDir, `${itemId}_resized.jpg`);
    
    // Remove thumbnail file if it exists
    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
      console.log(`[CLEANUP] Removed thumbnail: ${thumbnailPath}`);
    }
    
    // Remove resized file if it exists
    if (fs.existsSync(resizedPath)) {
      fs.unlinkSync(resizedPath);
      console.log(`[CLEANUP] Removed resized image: ${resizedPath}`);
    }
  } catch (error) {
    console.error(`Failed to cleanup temp files for ${itemId}:`, error);
  }
}

/**
 * Clean up all temporary files in the gallery temp directory
 */
export function cleanupAllTempFiles(): void {
  try {
    const tempDir = path.join(process.cwd(), 'temp', 'gallery');
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      let cleanedCount = 0;
      
      files.forEach(file => {
        if (file.endsWith('_thumbnail.jpg') || file.endsWith('_resized.jpg')) {
          const filePath = path.join(tempDir, file);
          fs.unlinkSync(filePath);
          cleanedCount++;
        }
      });
      
      console.log(`[CLEANUP] Removed ${cleanedCount} temporary files from gallery`);
    }
  } catch (error) {
    console.error('Failed to cleanup all temp files:', error);
  }
}