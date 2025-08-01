import sharp from 'sharp';
import { put } from '@vercel/blob';

// Meta Ad Specifications
export const META_AD_FORMATS = {
  // Feed Ads
  FEED_SQUARE: { width: 1200, height: 1200, aspectRatio: '1:1', name: 'Feed Square' },
  FEED_LANDSCAPE: { width: 1200, height: 628, aspectRatio: '1.91:1', name: 'Feed Landscape' },
  
  // Stories
  STORY_PORTRAIT: { width: 1080, height: 1920, aspectRatio: '9:16', name: 'Story Portrait' },
  
  // Reels
  REELS_VERTICAL: { width: 1080, height: 1920, aspectRatio: '9:16', name: 'Reels Vertical' },
  
  // Carousel
  CAROUSEL_SQUARE: { width: 1080, height: 1080, aspectRatio: '1:1', name: 'Carousel Square' },
  CAROUSEL_LANDSCAPE: { width: 1080, height: 566, aspectRatio: '1.91:1', name: 'Carousel Landscape' },
  
  // Instagram Feed
  INSTAGRAM_SQUARE: { width: 1080, height: 1080, aspectRatio: '1:1', name: 'Instagram Square' },
  INSTAGRAM_PORTRAIT: { width: 1080, height: 1350, aspectRatio: '4:5', name: 'Instagram Portrait' },
  
  // Video Thumbnails
  VIDEO_LANDSCAPE: { width: 1280, height: 720, aspectRatio: '16:9', name: 'Video Landscape' },
  VIDEO_SQUARE: { width: 1080, height: 1080, aspectRatio: '1:1', name: 'Video Square' },
} as const;

export type MetaAdFormat = keyof typeof META_AD_FORMATS;

interface ProcessingOptions {
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  preserveOriginal?: boolean;
  watermark?: {
    text?: string;
    image?: Buffer;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  };
}

interface ProcessedImage {
  format: MetaAdFormat;
  url: string;
  width: number;
  height: number;
  size: number;
  blobPath: string;
}

export class ImageProcessor {
  private static instance: ImageProcessor;
  
  static getInstance(): ImageProcessor {
    if (!ImageProcessor.instance) {
      ImageProcessor.instance = new ImageProcessor();
    }
    return ImageProcessor.instance;
  }

  /**
   * Process image for all Meta ad formats
   */
  async processForAllFormats(
    imageBuffer: Buffer,
    baseFilename: string,
    userId: string,
    options: ProcessingOptions = {}
  ): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];
    
    // Get original image metadata
    const metadata = await sharp(imageBuffer).metadata();
    console.log(`Processing image: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);

    // Process each Meta format
    for (const [formatKey, formatSpec] of Object.entries(META_AD_FORMATS)) {
      try {
        const processed = await this.processForFormat(
          imageBuffer,
          formatKey as MetaAdFormat,
          baseFilename,
          userId,
          options
        );
        results.push(processed);
      } catch (error) {
        console.error(`Failed to process format ${formatKey}:`, error);
      }
    }

    return results;
  }

  /**
   * Process image for specific Meta ad format
   */
  async processForFormat(
    imageBuffer: Buffer,
    format: MetaAdFormat,
    baseFilename: string,
    userId: string,
    options: ProcessingOptions = {}
  ): Promise<ProcessedImage> {
    const formatSpec = META_AD_FORMATS[format];
    const { quality = 85, format: outputFormat = 'jpeg' } = options;

    // Create Sharp instance
    let sharpInstance = sharp(imageBuffer);

    // Smart crop/resize to maintain aspect ratio
    const processedBuffer = await sharpInstance
      .resize(formatSpec.width, formatSpec.height, {
        fit: 'cover', // Crop to fill dimensions
        position: 'center', // Crop from center
      })
      .jpeg({ quality, progressive: true })
      .toBuffer();

    // Apply watermark if specified
    let finalBuffer = processedBuffer;
    if (options.watermark) {
      finalBuffer = await this.applyWatermark(processedBuffer, options.watermark);
    }

    // Generate blob path
    const timestamp = Date.now();
    const formatName = format.toLowerCase().replace(/_/g, '-');
    const extension = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
    const blobPath = `processed-images/${userId}/${timestamp}/${baseFilename}-${formatName}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(blobPath, finalBuffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: `image/${outputFormat}`,
    });

    return {
      format,
      url: blob.url,
      width: formatSpec.width,
      height: formatSpec.height,
      size: finalBuffer.length,
      blobPath,
    };
  }

  /**
   * Apply watermark to image
   */
  private async applyWatermark(
    imageBuffer: Buffer, 
    watermark: NonNullable<ProcessingOptions['watermark']>
  ): Promise<Buffer> {
    const image = sharp(imageBuffer);
    const { width, height } = await image.metadata();

    if (watermark.text) {
      // Text watermark
      const textSvg = `
        <svg width="${width}" height="${height}">
          <text x="50%" y="95%" 
                text-anchor="middle" 
                font-family="Arial, sans-serif" 
                font-size="24" 
                font-weight="bold"
                fill="white" 
                stroke="black" 
                stroke-width="1"
                opacity="0.8">
            ${watermark.text}
          </text>
        </svg>
      `;
      
      return image
        .composite([{ input: Buffer.from(textSvg), gravity: 'southeast' }])
        .toBuffer();
    }

    if (watermark.image) {
      // Image watermark
      const position = watermark.position || 'bottom-right';
      const gravity = this.getGravityFromPosition(position);
      
      return image
        .composite([{ input: watermark.image, gravity }])
        .toBuffer();
    }

    return imageBuffer;
  }

  /**
   * Convert position string to Sharp gravity
   */
  private getGravityFromPosition(position: string): string {
    const gravityMap: Record<string, string> = {
      'top-left': 'northwest',
      'top-right': 'northeast',
      'bottom-left': 'southwest',
      'bottom-right': 'southeast',
      'center': 'center',
    };
    return gravityMap[position] || 'southeast';
  }

  /**
   * Optimize image while maintaining 4K quality
   */
  async optimizeForQuality(
    imageBuffer: Buffer,
    targetSize?: number
  ): Promise<Buffer> {
    const metadata = await sharp(imageBuffer).metadata();
    
    // If already optimal size, return as-is
    if (targetSize && imageBuffer.length <= targetSize) {
      return imageBuffer;
    }

    // Progressive optimization
    let quality = 95;
    let optimized = imageBuffer;

    while (quality >= 70 && (!targetSize || optimized.length > targetSize)) {
      optimized = await sharp(imageBuffer)
        .jpeg({ 
          quality, 
          progressive: true,
          mozjpeg: true // Better compression
        })
        .toBuffer();
      
      quality -= 5;
    }

    return optimized;
  }

  /**
   * Create thumbnail for preview
   */
  async createThumbnail(
    imageBuffer: Buffer,
    size: number = 300
  ): Promise<Buffer> {
    return sharp(imageBuffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  /**
   * Extract dominant colors from image
   */
  async extractColors(imageBuffer: Buffer): Promise<string[]> {
    const { dominant } = await sharp(imageBuffer)
      .resize(100, 100)
      .raw()
      .toBuffer({ resolveWithObject: true });

    // This is a simplified version - in production you'd use a proper color extraction library
    return ['#006FEE', '#0050B3', '#F8FAFC']; // Fallback to brand colors
  }

  /**
   * Validate image meets Meta's requirements
   */
  async validateForMeta(imageBuffer: Buffer): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const metadata = await sharp(imageBuffer).metadata();
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check minimum resolution
    if (metadata.width && metadata.width < 1080) {
      errors.push('Image width must be at least 1080px for optimal quality');
    }

    if (metadata.height && metadata.height < 1080) {
      errors.push('Image height must be at least 1080px for optimal quality');
    }

    // Check file size (Meta recommends < 30MB)
    if (imageBuffer.length > 30 * 1024 * 1024) {
      warnings.push('Image size is over 30MB, consider optimization');
    }

    // Check aspect ratio compatibility
    const aspectRatio = metadata.width && metadata.height ? metadata.width / metadata.height : 1;
    const supportedRatios = [1, 1.91, 0.56, 0.8]; // 1:1, 1.91:1, 9:16, 4:5
    
    const isCompatible = supportedRatios.some(ratio => 
      Math.abs(aspectRatio - ratio) < 0.1
    );

    if (!isCompatible) {
      warnings.push('Image aspect ratio may require cropping for optimal display');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// Export singleton instance
export const imageProcessor = ImageProcessor.getInstance();