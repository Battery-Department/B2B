import OpenAI from 'openai';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

interface BatteryCustomizationOptions {
  logoPath?: string;
  logoUrl?: string;
  phoneNumber?: string;
  companyName?: string;
  batteryImagePath: string;
}

interface ImageEditResult {
  success: boolean;
  imageBase64?: string;
  imageUrl?: string;
  error?: string;
}

export class OpenAIImageService {
  private openai: OpenAI;
  
  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  /**
   * Convert logo to black and white for engraving
   */
  private async convertLogoToBlackWhite(logoPath: string): Promise<Buffer> {
    try {
      const logo = await sharp(logoPath)
        .grayscale()
        .normalize()
        .threshold(128)
        .resize(200, 100, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .png()
        .toBuffer();
      
      return logo;
    } catch (error) {
      console.error('Error converting logo to black and white:', error);
      throw new Error('Failed to process logo for engraving');
    }
  }

  /**
   * Composite logo onto battery image before sending to OpenAI
   */
  private async compositeLogoOnBattery(
    batteryImagePath: string, 
    logoPath?: string,
    phoneNumber?: string
  ): Promise<Buffer> {
    try {
      let composite = sharp(batteryImagePath);
      const metadata = await composite.metadata();
      const width = metadata.width || 1024;
      const height = metadata.height || 1024;

      // Calculate nameplate position (approximate based on the battery image)
      const nameplateX = Math.floor(width * 0.15);
      const nameplateY = Math.floor(height * 0.45);
      const nameplateWidth = Math.floor(width * 0.7);
      const nameplateHeight = Math.floor(height * 0.25);

      const composites: sharp.OverlayOptions[] = [];

      // Add logo if provided
      if (logoPath) {
        const logoBuffer = await this.convertLogoToBlackWhite(logoPath);
        const logoMetadata = await sharp(logoBuffer).metadata();
        
        // Position logo on left side of nameplate
        composites.push({
          input: logoBuffer,
          left: nameplateX + 20,
          top: nameplateY + Math.floor((nameplateHeight - (logoMetadata.height || 100)) / 2),
          blend: 'multiply' as any
        });
      }

      // Add phone number if provided
      if (phoneNumber) {
        // Create SVG text for phone number
        const textSvg = `
          <svg width="${nameplateWidth}" height="${nameplateHeight}">
            <text x="${nameplateWidth - 20}" y="${nameplateHeight / 2}" 
                  font-family="Arial, sans-serif" 
                  font-size="24" 
                  font-weight="bold"
                  fill="black" 
                  text-anchor="end"
                  dominant-baseline="middle">
              ${phoneNumber}
            </text>
          </svg>
        `;
        
        const textBuffer = Buffer.from(textSvg);
        composites.push({
          input: textBuffer,
          left: nameplateX,
          top: nameplateY,
          blend: 'multiply' as any
        });
      }

      // Apply composites if any
      if (composites.length > 0) {
        composite = composite.composite(composites);
      }

      return await composite.toBuffer();
    } catch (error) {
      console.error('Error compositing images:', error);
      throw error;
    }
  }

  /**
   * Edit battery image with company logo and phone number
   */
  async customizeBattery(options: BatteryCustomizationOptions): Promise<ImageEditResult> {
    try {
      // First, composite the logo and text onto the battery
      const compositedImage = await this.compositeLogoOnBattery(
        options.batteryImagePath,
        options.logoPath,
        options.phoneNumber
      );

      // Create a more specific prompt
      const prompt = `A professional product photo of a DeWalt FlexVolt battery with custom engraving on the silver nameplate. ${
        options.companyName ? `The company name "${options.companyName}" is engraved. ` : ''
      }${
        options.phoneNumber ? `The phone number "${options.phoneNumber}" is engraved on the right side. ` : ''
      }The engraving appears laser-etched into the metal surface with professional quality. High-resolution product photography.`;

      // Use DALL-E 3 for generation
      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        size: '1024x1024',
        quality: 'standard',
        n: 1,
        response_format: 'b64_json',
      });

      if (response.data && response.data[0]) {
        return {
          success: true,
          imageBase64: response.data[0].b64_json,
        };
      }

      return {
        success: false,
        error: 'No image generated',
      };

    } catch (error) {
      console.error('Error customizing battery:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Alternative method using just text (no logo upload)
   */
  async customizeBatteryTextOnly(
    companyName: string,
    phoneNumber?: string
  ): Promise<ImageEditResult> {
    try {
      const prompt = `Professional product photo of a yellow and black DeWalt FlexVolt 20V/60V MAX battery. 
The battery has a silver metal nameplate with laser-engraved text:
- Company name "${companyName}" engraved on the left side
${phoneNumber ? `- Phone number "${phoneNumber}" engraved on the right side` : ''}
The engraving is black text on the silver metal surface, appearing professionally laser-etched.
High-quality product photography with proper lighting and shadows.
The battery should look exactly like a DeWalt FlexVolt battery with the characteristic yellow and black colors.`;

      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        size: '1024x1024',
        quality: 'standard',
        n: 1,
        response_format: 'b64_json',
      });

      if (response.data && response.data[0]) {
        return {
          success: true,
          imageBase64: response.data[0].b64_json,
        };
      }

      return {
        success: false,
        error: 'No image generated',
      };

    } catch (error) {
      console.error('Error generating battery image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Save the edited image to disk
   */
  async saveEditedImage(
    imageBase64: string, 
    outputPath: string
  ): Promise<string> {
    try {
      const buffer = Buffer.from(imageBase64, 'base64');
      await fs.writeFile(outputPath, buffer);
      return outputPath;
    } catch (error) {
      console.error('Error saving edited image:', error);
      throw new Error('Failed to save edited image');
    }
  }

  /**
   * Batch process multiple contractor batteries
   */
  async batchCustomizeBatteries(
    contractors: Array<{
      name: string;
      logoPath?: string;
      phoneNumber?: string;
    }>,
    batteryImagePath: string,
    outputDir: string
  ): Promise<Map<string, ImageEditResult>> {
    const results = new Map<string, ImageEditResult>();

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    for (const contractor of contractors) {
      console.log(`Processing battery for ${contractor.name}...`);
      
      // Use text-only method for now (more reliable)
      const result = await this.customizeBatteryTextOnly(
        contractor.name,
        contractor.phoneNumber
      );

      if (result.success && result.imageBase64) {
        // Save the customized battery image
        const outputPath = path.join(
          outputDir, 
          `${contractor.name.toLowerCase().replace(/\s+/g, '-')}-battery.png`
        );
        
        await this.saveEditedImage(result.imageBase64, outputPath);
        result.imageUrl = outputPath;
      }

      results.set(contractor.name, result);

      // Add delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return results;
  }
}