import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const company = searchParams.get('company');
    const type = searchParams.get('type');
    const limit = searchParams.get('limit');
    
    // Load the JSON file
    const filePath = path.join(
      process.cwd(),
      'massachusetts-construction-scraper',
      'output',
      'exports',
      'CLEAN_MA_CONSTRUCTION_711_20250729_152752.json'
    );
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      // Return sample data if file doesn't exist
      return NextResponse.json([
        {
          name: "Mike's Electrical Services",
          formatted_address: "123 Main St, Medford, MA 02155, USA",
          website: "mikeselectrical.com",
          rating: 4.8,
          user_ratings_total: 127,
          types: ["electrical_contractor", "electrician"],
          reviews: [
            {
              text: "Mike's team secured all our tools after we had theft issues on the job site",
              rating: 5,
              author_name: "John D."
            }
          ]
        }
      ]);
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    let data = JSON.parse(fileContent);
    
    // Filter by company name if provided
    if (company) {
      data = data.filter((item: any) => 
        item.name.toLowerCase().includes(company.toLowerCase())
      );
    }
    
    // Filter by type if provided
    if (type) {
      data = data.filter((item: any) => 
        item.types.some((t: string) => t.includes(type))
      );
    }
    
    // Limit results if specified
    if (limit) {
      data = data.slice(0, parseInt(limit));
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error loading contractors data:', error);
    return NextResponse.json(
      { error: 'Failed to load contractors data' },
      { status: 500 }
    );
  }
}

// Get a specific company by ID
export async function POST(request: NextRequest) {
  try {
    const { companyName } = await request.json();
    
    if (!companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }
    
    const filePath = path.join(
      process.cwd(),
      'massachusetts-construction-scraper',
      'output',
      'exports',
      'CLEAN_MA_CONSTRUCTION_711_20250729_152752.json'
    );
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Data file not found' },
        { status: 404 }
      );
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    const company = data.find((item: any) => 
      item.name.toLowerCase() === companyName.toLowerCase() ||
      item.name.toLowerCase().includes(companyName.toLowerCase())
    );
    
    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(company);
  } catch (error) {
    console.error('Error finding company:', error);
    return NextResponse.json(
      { error: 'Failed to find company' },
      { status: 500 }
    );
  }
}