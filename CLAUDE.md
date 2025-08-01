# Claude Code Instructions - Battery Department Project

## 🚀 Battery Department E-Commerce Platform

This is a comprehensive B2B e-commerce platform specializing in custom-engraved FlexVolt batteries for contractors. The platform features AI-powered design tools, real-time battery customization, and a streamlined checkout process with a 10% deposit payment system.

## ⚠️ CRITICAL: MANDATORY FILE READING BEFORE ANY WORK ⚠️

**STOP! You MUST read these files first using the Read tool:**

1. **🔴 REQUIRED**: `/Users/oliver/Lithi_AI/battery-dashboard-clean-repo/BATTERY_DASHBOARD_TRAINING_GUIDE.md`
   - This contains ALL project context, architecture, and implementation details
   - Read the ENTIRE file before making any changes
   - Contains mobile AI design, deposit system, checkout experience, and patterns

2. **🔴 REQUIRED FOR CONTEXT**: `/Users/oliver/Lithi_AI/battery-dashboard/LITHI_AI_PROJECT_CONTEXT.md`
   - Legacy project context and navigation structure
   - Contains API details, database schema, and more

3. **🔴 REQUIRED FOR UI**: `/Users/oliver/Lithi_AI/battery-dashboard/DESIGN_SYSTEM.md`
   - Read this for ANY user interface changes
   - Contains exact color values, component standards, and styling rules

**DO NOT PROCEED WITHOUT READING THESE FILES FIRST**

## 🚀 Recent Major Updates (January 2025)

### Unified Battery Editor Interface ✅ DEPLOYED (January 31, 2025)
- **Problem Fixed**: Fragmented UI with floating controls and duplicate buttons
- **Solution**: Created `UnifiedBatteryEditor` component consolidating all controls
- **Changes**:
  - Removed floating blue box and detached +/- buttons above battery
  - Consolidated multiple "Send to Colleague" buttons into one
  - Inline font size controls for each text line
  - Single clean editing panel below battery image
  - Removed logo upload feature completely
  - Fixed orphaned share modal code causing syntax errors
- **Result**: Clean, mobile-responsive interface with all controls in one place
- **Deployed**: https://battery-dashboard-clean-repo-oyrjw8njx.vercel.app

### 10% Deposit Pricing System ✅ DEPLOYED
- **6Ah FlexVolt**: $149 retail → $14.90 deposit (10%)
- **9Ah FlexVolt**: $239 retail → $23.90 deposit (10%) 
- **15Ah FlexVolt**: $359 retail → $35.90 deposit (10%)
- Changed "Save X%" to "10% Deposit" labels
- Updated checkout: "Total Deposit (10%)" and "Total Due Upon Completion"
- Added disclaimer about 30-day lead time

### Mobile AI Design Interface ✅ COMPLETED
- Natural language input moved above the fold
- Simplified cards without sub-headings
- Glassmorphic "Approve Design" button replaced uploads
- Enhanced AI summary with larger battery images
- Restored volume discount progress in battery selection
- Pre-filled checkout data from user inputs

### Enhanced Checkout Experience ✅ COMPLETED
- Mobile-responsive design optimized
- Apple Pay integration ready
- Stripe payment processing configured
- Trust indicators and security badges
- Pre-filled customer data from design session

### Layout Reorganization & Bug Fixes (January 31, 2025) ✅ COMPLETED
- **Text Size Controls**: Moved above metal plate on battery with absolute positioning
- **Battery Image**: Increased size by 12.5% (scaleFactor: 1.35) and centered
- **Line 1/2 Buttons**: Repositioned directly below battery (100px width, 10px gap)
- **Text Input Field**: Moved below buttons with 80% width, max 500px
- **Floating Tour Button**: Converted from auto-play to FAB in bottom-right
- **Pulsing Outline**: Added for active line selection feedback
- **JSX Syntax Error Fix**: Fixed unclosed `<div>` tag in TextInputSection causing build failure
  - Error was on line 1433: Missing closing `</div>` for `<div className="mb-4">`
  - Added proper closing tag to complete the JSX structure
  - Deployment URL: https://battery-dashboard-clean-repo-42cothss1.vercel.app

## Project Overview

This is the Battery Department e-commerce platform specializing in FlexVolt batteries for contractors. The platform uses a consistent, modern design language throughout.

## Key Design Elements to Always Follow

### Primary Colors

- Primary Blue: `#006FEE`
- Dark Blue: `#0050B3`
- Blue Gradient: `linear-gradient(to right, #006FEE, #0050B3)`

### Component Patterns

1. **Cards**: White background, 12px radius, 2px solid #E6F4FF border, 24px padding
2. **Buttons**: Primary (#006FEE), Secondary (white with border), always with hover effects
3. **Inputs**: 2px borders, #F9FAFB background, focus glow effect
4. **Headers**: Blue gradient for main headers, white for section headers

### Must-Have Effects

- Hover lift: `translateY(-4px)` with shadow
- Focus glow: `0 0 0 3px rgba(0, 111, 238, 0.1)`
- Transitions: `all 0.3s ease` for smooth animations
- Blue shadows for primary elements

### Product Information - UPDATED PRICING

- FlexVolt Batteries with 10% Deposit System:
  - 6Ah: $149 retail → $14.90 deposit (10%)
  - 9Ah: $239 retail → $23.90 deposit (10%)
  - 15Ah: $359 retail → $35.90 deposit (10%)
- All batteries are 20V/60V MAX compatible
- Focus on contractor/professional use cases
- Volume discounts: 10% ($1000+), 15% ($2500+), 20% ($5000+)
- 30-day lead time for custom orders

### Typography Rules

- Font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
- Headings: 700-800 weight, #111827 color
- Body: 400-500 weight, #374151 color
- Always use proper hierarchy

### Layout Standards

- Max content width: 1280px
- Chat max width: 840px
- Card grid gap: 24px
- Section padding: 32px
- Consistent spacing using 4px base unit

### Quality Checklist

Before completing any task:

- [ ] Read DESIGN_SYSTEM.md
- [ ] Use exact color values
- [ ] Implement all hover states
- [ ] Add proper transitions
- [ ] Follow spacing system
- [ ] Test responsive behavior
- [ ] Ensure loading states
- [ ] Check accessibility

## File Locations - UPDATED PATHS

- **Training Guide**: `/Users/oliver/Lithi_AI/battery-dashboard-clean-repo/BATTERY_DASHBOARD_TRAINING_GUIDE.md`
- **Design System**: `/Users/oliver/Lithi_AI/battery-dashboard/DESIGN_SYSTEM.md`
- **Main App**: `/Users/oliver/Lithi_AI/battery-dashboard-clean-repo/src/app`
- **Customer Pages**: `/Users/oliver/Lithi_AI/battery-dashboard-clean-repo/src/app/customer`

## Key Implemented Pages

1. **AI Design Interface**: `/src/app/customer/design-with-ai/page.tsx`
   - Mobile-first natural language input
   - Glassmorphic approve button
   - Battery selection with volume discounts
   - Progressive checkout integration

2. **Enhanced Checkout**: `/src/app/customer/checkout/enhanced-page.tsx`
   - 10% deposit system integrated
   - Apple Pay + Stripe ready
   - Mobile-responsive design
   - Pre-filled customer data

3. **Customer Header**: `/src/components/layout/CustomerHeader.tsx`
   - Responsive navigation
   - Cart integration
   - Brand consistency

## Development Workflow

### Before Starting Any Work:
1. **Read Training Guide**: `/Users/oliver/Lithi_AI/battery-dashboard-clean-repo/BATTERY_DASHBOARD_TRAINING_GUIDE.md`
2. **Check Design System**: `/Users/oliver/Lithi_AI/battery-dashboard/DESIGN_SYSTEM.md`
3. **Review Recent Updates**: Check this CLAUDE.md for latest changes

### Build & Deploy Process:
1. Always run `npm run build` before deployment
2. Test mobile responsiveness
3. Verify deposit calculations work correctly
4. Check checkout flow end-to-end
5. Deploy with `vercel --prod`

### Key Data Structures:
```tsx
// Battery pricing with deposits
price: 14.90, // Deposit amount (10%)
retailPrice: 149, // Full retail price
depositPercentage: 10

// Volume discount thresholds
threshold: 1000, percentage: 10
threshold: 2500, percentage: 15
threshold: 5000, percentage: 20
```

## 🔧 System Architecture Overview

### Core Features Implemented

1. **Custom Battery Engraving System**
   - Real-time canvas-based battery preview
   - Text engraving with Line 1 and Line 2
   - Logo upload and positioning
   - 20% larger battery images for better visibility
   - Automatic image capture for checkout

2. **AI-Powered Design Interface**
   - Natural language input for battery customization
   - Claude AI integration for design suggestions
   - Mobile-first responsive design
   - Glassmorphic UI elements

3. **10% Deposit Payment System**
   - Pay 10% upfront to lock in orders
   - Remaining 90% due when batteries ship
   - 30-day lead time for custom orders
   - USA-based manufacturing and assembly

4. **Enhanced Checkout Experience**
   - Custom battery preview in cart
   - Stripe payment integration
   - Apple Pay support ready
   - Pre-filled customer data from design session

### Key Technologies

- **Frontend**: Next.js 14.2.30, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion animations
- **State Management**: Zustand (engraving-store)
- **AI Integration**: Claude API via custom endpoints
- **Canvas**: HTML5 Canvas for battery rendering
- **Payment**: Stripe integration ready
- **Database**: Prisma ORM with PostgreSQL

## 📁 Project Structure

```
/src
├── app/                      # Next.js app directory
│   ├── customer/            # Customer-facing pages
│   │   ├── engraving/       # Battery customization interface
│   │   ├── design-with-ai/  # AI design assistant
│   │   ├── checkout/        # Enhanced checkout flow
│   │   └── cart/           # Shopping cart
│   └── api/                # API endpoints
│       ├── chat/           # AI chat endpoints
│       └── cart/           # Cart management
├── components/             # React components
│   ├── engraving/         # Engraving-specific components
│   │   ├── EnhancedEngravingDesigner.tsx
│   │   ├── FlexVoltCanvasPreview.tsx
│   │   └── EnhancedBatteryPreview.tsx
│   └── layout/            # Layout components
├── lib/                   # Utility functions
│   └── engraving-store.ts # Zustand store for engraving state
└── styles/               # Global styles
```

## 🚀 Key Scripts & Commands

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Generate Prisma client
npx prisma generate
```

### Environment Variables (.env.local)
```env
# Claude AI Integration
ANTHROPIC_API_KEY=your-key-here

# Database
DATABASE_URL=your-postgres-url

# Stripe (when ready)
STRIPE_SECRET_KEY=your-stripe-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-publishable-key

# AI Features
NEXT_PUBLIC_AI_FEATURES_ENABLED=true
NEXT_PUBLIC_ENABLE_EXTENDED_THINKING=true
```

## 🎨 Design System Key Points

### Colors
- Primary Blue: `#006FEE`
- Dark Blue: `#0050B3`
- Blue Gradient: `linear-gradient(to right, #006FEE, #0050B3)`
- Success Green: `#10B981`
- White: `#FFFFFF`
- Gray backgrounds: `#F9FAFB`

### Component Patterns
- Cards: White background, 12px radius, 2px solid #E6F4FF border
- Buttons: Primary blue with hover effects
- Inputs: 2px borders, focus glow effect
- Transitions: `all 0.3s ease`

## 🔄 Current User Flow

1. **Landing** → Customer clicks "Design Your Battery"
2. **AI Design** → Natural language input or template selection
3. **Battery Selection** → Choose 6Ah, 9Ah, or 15Ah with volume discounts
4. **Customization** → Add text or logo engraving
5. **Preview** → Real-time battery preview with engraving
6. **Cart** → Review custom battery with preview image
7. **Checkout** → Pay 10% deposit, see delivery timeline

## 🐛 Known Issues & Solutions

### Page Load Scroll
- Fixed with scroll-to-top on mount
- Enhanced global CSS to prevent unwanted scrolling

### Logo Upload
- Fixed with proper state updates and re-render triggers
- Canvas captures after design changes

### Mobile Responsiveness
- All interfaces optimized for mobile-first
- Touch-friendly controls and spacing

## 📈 Performance Optimizations

- Dynamic imports for heavy components
- Image optimization with Next.js Image
- Canvas rendering optimizations
- LocalStorage for cart persistence
- Lazy loading for non-critical components

## 🔐 Security Considerations

- API routes protected with proper CORS
- Input sanitization for user text
- File upload validation for logos
- Secure payment processing ready
- Environment variables for sensitive data

## 🚦 Deployment Process

1. **Local Testing**: Run `npm run build` to ensure no errors
2. **Commit Changes**: Use descriptive commit messages
3. **Deploy**: Run `vercel --prod` for production deployment
4. **Verify**: Check deployment URL for all features

## 📝 Maintenance Notes

- Canvas preview images are captured automatically
- Cart data persists in localStorage
- Engraving state managed by Zustand store
- All prices include 10% deposit calculation
- USA manufacturing badge and payment structure visible

## Remember

ALWAYS maintain the established design patterns. When in doubt, refer to the training guide and design system. The 10% deposit system is now the primary pricing model across all products.

## 🏗️ Massachusetts Construction Scraper - Google Places API Scripts

### Overview
Complete scripts and process for collecting construction contractor data using Google Places API. Successfully collected 180 high-quality Boston-area contractors with full contact information, ratings, and reviews.

### Project Location
`/Users/oliver/Lithi_AI/battery-dashboard-clean-repo/massachusetts-construction-scraper/`

### Key Scripts Created

#### 1. Direct Data Collection Script (`direct_test.py`)
This is the main script that successfully collected the contractor data:

```python
#!/usr/bin/env python3
"""Direct test to get businesses without processing filters"""

import asyncio
import json
from pathlib import Path
from api_client import GooglePlacesClient
from utils import load_config
import pandas as pd

async def main():
    # Load config
    config = load_config()
    
    # Initialize client
    async with GooglePlacesClient(config['google_api_key']) as client:
        print("Searching for construction businesses in Boston...")
        
        # Search for different types of contractors
        queries = [
            "construction companies in Boston",
            "general contractors in Boston", 
            "roofing contractors in Boston",
            "carpentry contractors in Boston",
            "HVAC contractors in Boston",
            "electrical contractors in Boston",
            "plumbing contractors in Boston",
            "concrete contractors in Boston",
            "painting contractors in Boston",
            "flooring contractors in Boston"
        ]
        
        all_businesses = []
        
        for query in queries:
            print(f"\nSearching: {query}")
            places = await client.search_places(query, radius=30000, max_results=60)
            print(f"Found {len(places)} results")
            
            # Get details for each place
            for place in places[:30]:  # Limit to 30 per query
                try:
                    details = await client.get_place_details(place['place_id'])
                    if details:
                        all_businesses.append(details)
                        print(f"  - {details.get('name')} | {details.get('rating', 'N/A')} stars | {details.get('user_ratings_total', 0)} reviews")
                except Exception as e:
                    print(f"  Error getting details: {e}")
                
                if len(all_businesses) >= 300:
                    break
            
            if len(all_businesses) >= 300:
                break
                
        print(f"\nTotal businesses collected: {len(all_businesses)}")
        
        # Save raw data
        output_file = Path("output/exports/boston_contractors_300.json")
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w') as f:
            json.dump(all_businesses, f, indent=2, default=str)
        
        print(f"Saved to: {output_file}")
        
        # Create simple CSV
        csv_data = []
        for b in all_businesses:
            csv_data.append({
                'name': b.get('name', ''),
                'address': b.get('formatted_address', ''),
                'phone': b.get('formatted_phone_number', ''),
                'website': b.get('website', ''),
                'rating': b.get('rating', ''),
                'reviews': b.get('user_ratings_total', 0),
                'types': ', '.join(b.get('types', [])),
                'status': b.get('business_status', '')
            })
        
        df = pd.DataFrame(csv_data)
        csv_file = Path("output/exports/boston_contractors_300.csv")
        df.to_csv(csv_file, index=False)
        print(f"Saved CSV to: {csv_file}")
        
        # Summary
        print(f"\nSummary:")
        print(f"- Total businesses: {len(all_businesses)}")
        print(f"- With phone: {sum(1 for b in all_businesses if b.get('formatted_phone_number'))}")
        print(f"- With website: {sum(1 for b in all_businesses if b.get('website'))}")
        print(f"- Average rating: {sum(b.get('rating', 0) for b in all_businesses) / len(all_businesses) if all_businesses else 0:.2f}")

if __name__ == "__main__":
    asyncio.run(main())
```

#### 2. Data Aggregation Script (`combine_all_businesses.py`)
Script to combine multiple data collection runs and remove duplicates:

```python
#!/usr/bin/env python3
"""Combine all JSON files into final dataset of 300 businesses"""

import json
from pathlib import Path
import pandas as pd

# Load all three JSON files
all_businesses = []
seen_names = set()  # Use business names for deduplication

files = [
    'output/exports/boston_contractors_raw.json',  # First 100
    'output/exports/boston_contractors_300.json',   # Next 200
    'output/exports/boston_contractors_additional_100.json'  # Final 100
]

print("Loading and combining files...")
for file_path in files:
    with open(file_path, 'r') as f:
        data = json.load(f)
        print(f"\n{file_path}: {len(data)} businesses")
        
        # Add businesses, checking for duplicates by name and address
        added_count = 0
        for business in data:
            # Create unique identifier from name and address
            name = business.get('name', '')
            address = business.get('formatted_address', '')
            unique_key = f"{name}|{address}"
            
            if unique_key and unique_key not in seen_names:
                all_businesses.append(business)
                seen_names.add(unique_key)
                added_count += 1
        
        print(f"  Added {added_count} unique businesses")

print(f"\nTotal unique businesses collected: {len(all_businesses)}")

# Save combined JSON
output_json = Path('output/exports/boston_contractors_complete_300.json')
with open(output_json, 'w') as f:
    json.dump(all_businesses, f, indent=2, default=str)
    
print(f"Saved combined JSON to: {output_json}")

# Create combined CSV with all important fields
csv_data = []
for idx, b in enumerate(all_businesses):
    csv_data.append({
        'id': idx + 1,
        'name': b.get('name', ''),
        'address': b.get('formatted_address', ''),
        'phone': b.get('formatted_phone_number', ''),
        'website': b.get('website', ''),
        'rating': b.get('rating', ''),
        'reviews': b.get('user_ratings_total', 0),
        'types': ', '.join(b.get('types', [])),
        'status': b.get('business_status', '')
    })

df = pd.DataFrame(csv_data)
csv_file = Path('output/exports/boston_contractors_complete_300.csv')
df.to_csv(csv_file, index=False)
print(f"Saved combined CSV to: {csv_file}")
```

### Configuration Setup

#### 1. Environment Configuration (`config.yaml`)
```yaml
# Google API Configuration
google_api_key: "YOUR_GOOGLE_PLACES_API_KEY"

# Search settings
search_radius: 30000  # 30km radius
max_results_per_query: 60

# Output settings
output_dir: "output/exports"
```

#### 2. API Client Configuration
The scraper uses the existing `GooglePlacesClient` from `api_client.py` which handles:
- Rate limiting
- Error handling
- Async operations
- Place details fetching

### Data Collection Process

1. **Initial Setup**
   - Removed all image/photo downloading functionality
   - Simplified data collection to focus on core business information
   - Used direct API calls bypassing complex filtering

2. **Search Queries Used**
   - Construction companies in Boston
   - General contractors in Boston
   - Roofing contractors in Boston
   - Carpentry contractors in Boston
   - HVAC contractors in Boston
   - Electrical contractors in Boston
   - Plumbing contractors in Boston
   - Concrete contractors in Boston
   - Painting contractors in Boston
   - Flooring contractors in Boston

3. **Data Fields Collected**
   - Business name
   - Full address
   - Phone number (formatted)
   - Website URL
   - Google rating (0-5)
   - Number of reviews
   - Business types/categories
   - Operational status
   - Geographic coordinates (lat/lng)

### Running the Scripts

1. **Install Dependencies**
   ```bash
   pip install googlemaps pandas asyncio
   ```

2. **Set API Key**
   ```bash
   export GOOGLE_API_KEY="your-api-key"
   # Or add to config.yaml
   ```

3. **Run Data Collection**
   ```bash
   python3 direct_test.py
   ```

4. **Combine Multiple Runs** (if needed)
   ```bash
   python3 combine_all_businesses.py
   ```

### Output Files

- **JSON Output**: `output/exports/boston_contractors_complete_300.json`
  - Full business details including all API response fields
  - 180 unique businesses (after deduplication)
  
- **CSV Output**: `output/exports/boston_contractors_complete_300.csv`
  - Simplified tabular format
  - Fields: id, name, address, phone, website, rating, reviews, types, status

### Data Quality Metrics

- **Total Businesses**: 180 unique contractors
- **Phone Coverage**: 98.3% (177/180)
- **Website Coverage**: 92.8% (167/180)
- **Average Rating**: 4.89/5.0
- **Total Reviews**: 36,694
- **Geographic Coverage**: 49 cities/towns in Greater Boston

### Usage Examples

#### Python - Load and Use Data
```python
import json
import pandas as pd

# Load JSON data
with open('boston_contractors_complete_300.json', 'r') as f:
    contractors = json.load(f)

# Access business info
for contractor in contractors:
    print(f"{contractor['name']} - {contractor.get('website', 'No website')}")
    print(f"  Phone: {contractor.get('formatted_phone_number', 'No phone')}")
    print(f"  Rating: {contractor.get('rating', 'N/A')} ({contractor.get('user_ratings_total', 0)} reviews)")

# Load CSV data
df = pd.read_csv('boston_contractors_complete_300.csv')
print(df.head())
```

#### Extract Domains
```python
# Extract domains from websites
domains = []
for contractor in contractors:
    website = contractor.get('website', '')
    if website:
        domain = website.replace('http://', '').replace('https://', '').split('/')[0]
        domains.append(domain)
```

### API Cost Estimation
- Places Search: ~$0.032 per search
- Place Details: ~$0.017 per place
- Total cost for 180 businesses: ~$3-5 (depending on search iterations)
