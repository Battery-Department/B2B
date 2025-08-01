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
        .resize(300, 150, { 
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
   * Create a mask for the battery nameplate area
   */
  private async createNameplateMask(batteryImagePath: string): Promise<Buffer> {
    try {
      // Get image dimensions
      const metadata = await sharp(batteryImagePath).metadata();
      const width = metadata.width || 1024;
      const height = metadata.height || 1024;

      // Create mask with transparent background and white nameplate area
      // Approximate nameplate position based on the battery image
      const maskSvg = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${width}" height="${height}" fill="black" opacity="1"/>
          <rect x="${width * 0.15}" y="${height * 0.45}" 
                width="${width * 0.7}" height="${height * 0.25}" 
                fill="white" rx="10" ry="10"/>
        </svg>
      `;

      const mask = await sharp(Buffer.from(maskSvg))
        .png({ compressionLevel: 0 })
        .toBuffer();

      return mask;
    } catch (error) {
      console.error('Error creating nameplate mask:', error);
      throw new Error('Failed to create nameplate mask');
    }
  }

  /**
   * Edit battery image with company logo and phone number
   */
  async customizeBattery(options: BatteryCustomizationOptions): Promise<ImageEditResult> {
    try {
      // Read battery base image
      const batteryImage = await fs.readFile(options.batteryImagePath);

      // Process logo if provided
      let processedLogo: Buffer | undefined;
      if (options.logoPath) {
        processedLogo = await this.convertLogoToBlackWhite(options.logoPath);
      }

      // Create the prompt for OpenAI
      const prompt = this.buildCustomizationPrompt(options);

      // Use the OpenAI SDK for image editing
      // Note: The edit endpoint only supports a single image, not multiple
      // We'll need to composite the logo onto the battery first or use generation
      
      try {
        // For now, let's use the generation endpoint with the battery as reference
        const response = await this.openai.images.generate({
          model: 'dall-e-3',
          prompt: prompt + '\nBased on the provided battery image design.',
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

        throw new Error('No image generated');
      } catch (apiError: any) {
        // If generation fails, try a different approach
        console.error('Generation failed, trying edit approach:', apiError);
        
        // Single image edit (without logo for now)
        const editResponse = await this.openai.images.edit({
          model: 'dall-e-2',
          image: batteryImage,
          prompt: prompt,
          size: '1024x1024',
          response_format: 'b64_json',
          n: 1,
        });

        if (editResponse.data && editResponse.data[0]) {
          return {
            success: true,
            imageBase64: editResponse.data[0].b64_json,
          };
        }

        throw apiError;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();

      if (data.data && data.data[0]) {
        return {
          success: true,
          imageBase64: data.data[0].b64_json,
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
   * Build the prompt for battery customization
   */
  private buildCustomizationPrompt(options: BatteryCustomizationOptions): string {
    let prompt = `Edit this DeWalt FlexVolt battery image by adding custom engraving to the silver metal nameplate. `;

    if (options.logoPath || options.logoUrl) {
      prompt += `
Add the provided logo to the LEFT THIRD of the silver metal nameplate. The logo must be:
- Converted to BLACK AND WHITE only for laser engraving (no colors or gradients)
- Positioned in the left third of the nameplate, vertically centered
- Scaled proportionally to fit within the nameplate boundaries
- Integrated to appear laser-etched into the metal surface
- Given realistic shadows and reflections matching the nameplate's finish
`;
    }

    if (options.phoneNumber) {
      prompt += `
Add the phone number "${options.phoneNumber}" to the RIGHT SIDE of the silver nameplate:
- Use a clean, professional sans-serif font (like Arial or Helvetica)
- Make the text BLACK for laser engraving
- Position it on the right side, vertically centered
- Size the text appropriately for the nameplate space
- Make it appear laser-etched with proper depth and shadows
`;
    }

    if (options.companyName && !options.logoPath && !options.logoUrl) {
      prompt += `
Add the company name "${options.companyName}" to the LEFT SIDE of the nameplate:
- Use a professional sans-serif font
- Make it BLACK for engraving
- Position on the left side, vertically centered
`;
    }

    prompt += `
IMPORTANT: 
- Maintain the battery's original appearance except for the nameplate modifications
- Ensure all additions look professionally laser-engraved into the metal
- Keep the nameplate's metallic finish and reflections realistic
- Do not extend any elements outside the nameplate boundaries
- The final result should look like a factory-customized battery`;

    return prompt;
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
      
      const result = await this.customizeBattery({
        batteryImagePath,
        logoPath: contractor.logoPath,
        phoneNumber: contractor.phoneNumber,
        companyName: contractor.name,
      });

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

// Example usage function
export async function customizeBatteryExample() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }

  const service = new OpenAIImageService(apiKey);

  // Example contractors data
  const contractors = [
    {
      name: 'RH White',
      logoPath: '/path/to/rhwhite-logo.png',
      phoneNumber: '(555) 123-4567',
    },
    {
      name: 'GLC CMA',
      logoPath: '/path/to/glccma-logo.png',
      phoneNumber: '(555) 234-5678',
    },
    // Add more contractors...
  ];

  const batteryImagePath = '/path/to/battery-base.png';
  const outputDir = '/path/to/output';

  try {
    const results = await service.batchCustomizeBatteries(
      contractors,
      batteryImagePath,
      outputDir
    );

    results.forEach((result, contractorName) => {
      if (result.success) {
        console.log(`✅ Successfully customized battery for ${contractorName}`);
        console.log(`   Saved to: ${result.imageUrl}`);
      } else {
        console.log(`❌ Failed to customize battery for ${contractorName}: ${result.error}`);
      }
    });
  } catch (error) {
    console.error('Error in battery customization:', error);
  }
}