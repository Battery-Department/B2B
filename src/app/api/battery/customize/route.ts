import { NextRequest, NextResponse } from 'next/server';
import { OpenAIImageService } from '@/lib/openai-image-service-v2';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout for image processing

interface CustomizeBatteryRequest {
  contractors: Array<{
    name: string;
    logoUrl?: string;
    logoBase64?: string;
    phoneNumber?: string;
  }>;
  batteryImageBase64?: string;
  batteryImageUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CustomizeBatteryRequest = await request.json();
    
    // Validate request
    if (!body.contractors || body.contractors.length === 0) {
      return NextResponse.json(
        { error: 'No contractors provided' },
        { status: 400 }
      );
    }

    if (!body.batteryImageBase64 && !body.batteryImageUrl) {
      return NextResponse.json(
        { error: 'No battery image provided' },
        { status: 400 }
      );
    }

    // Get OpenAI API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Initialize OpenAI service
    const openAIService = new OpenAIImageService(apiKey);

    // Create temp directory for processing
    const tempDir = path.join(process.cwd(), 'temp', 'battery-customization');
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    // Save battery base image
    let batteryImagePath: string;
    if (body.batteryImageBase64) {
      batteryImagePath = path.join(tempDir, 'battery-base.png');
      const batteryBuffer = Buffer.from(body.batteryImageBase64, 'base64');
      await writeFile(batteryImagePath, batteryBuffer);
    } else {
      // For URL, we'll need to download it first
      batteryImagePath = path.join(tempDir, 'battery-base.png');
      const response = await fetch(body.batteryImageUrl!);
      const arrayBuffer = await response.arrayBuffer();
      await writeFile(batteryImagePath, Buffer.from(arrayBuffer));
    }

    // Process each contractor
    const results: Array<{
      contractorName: string;
      success: boolean;
      imageBase64?: string;
      error?: string;
    }> = [];

    for (const contractor of body.contractors) {
      try {
        console.log(`Processing battery for ${contractor.name}...`);

        // Save logo if provided
        let logoPath: string | undefined;
        if (contractor.logoBase64) {
          logoPath = path.join(tempDir, `${contractor.name}-logo.png`);
          const logoBuffer = Buffer.from(contractor.logoBase64, 'base64');
          await writeFile(logoPath, logoBuffer);
        } else if (contractor.logoUrl) {
          logoPath = path.join(tempDir, `${contractor.name}-logo.png`);
          const response = await fetch(contractor.logoUrl);
          const arrayBuffer = await response.arrayBuffer();
          await writeFile(logoPath, Buffer.from(arrayBuffer));
        }

        // Customize battery
        const result = await openAIService.customizeBattery({
          batteryImagePath,
          logoPath,
          phoneNumber: contractor.phoneNumber,
          companyName: contractor.name,
        });

        if (result.success && result.imageBase64) {
          results.push({
            contractorName: contractor.name,
            success: true,
            imageBase64: result.imageBase64,
          });
        } else {
          results.push({
            contractorName: contractor.name,
            success: false,
            error: result.error || 'Unknown error',
          });
        }

        // Add delay between requests to respect rate limits
        if (body.contractors.indexOf(contractor) < body.contractors.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`Error processing contractor ${contractor.name}:`, error);
        results.push({
          contractorName: contractor.name,
          success: false,
          error: error instanceof Error ? error.message : 'Processing error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      processedCount: results.filter(r => r.success).length,
      totalCount: results.length,
    });

  } catch (error) {
    console.error('Battery customization error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to customize batteries',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to test the service
export async function GET() {
  return NextResponse.json({
    status: 'Battery customization API is ready',
    endpoints: {
      POST: '/api/battery/customize',
      body: {
        contractors: [
          {
            name: 'Company Name',
            logoUrl: 'optional - URL to logo image',
            logoBase64: 'optional - base64 encoded logo',
            phoneNumber: 'optional - phone number to engrave',
          }
        ],
        batteryImageBase64: 'base64 encoded battery image',
        batteryImageUrl: 'or URL to battery image',
      }
    },
    example: {
      contractors: [
        { name: 'RH White', logoUrl: 'https://rhwhite.com/logo.png', phoneNumber: '(555) 123-4567' },
        { name: 'GLC CMA', logoUrl: 'https://glccma.com/logo.png', phoneNumber: '(555) 234-5678' },
      ],
      batteryImageUrl: 'https://example.com/battery.png'
    }
  });
}