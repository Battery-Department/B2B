// Construction Industry Knowledge Base for AI Battery Designer
// Comprehensive training dataset for optimal battery design suggestions

export interface IndustryPattern {
  industry: string
  patterns: {
    text_style: string
    typical_content: string[]
    positioning: string
    depth: string
    fonts: string[]
    compliance?: string[]
  }
  examples: string[]
  urgency_keywords: string[]
  safety_requirements: string[]
}

export interface VoicePattern {
  phrase: string
  intent: string
  parameters: any
  confidence: number
}

// Industry-specific patterns for construction workers
export const CONSTRUCTION_PATTERNS: IndustryPattern[] = [
  {
    industry: 'General Construction',
    patterns: {
      text_style: 'BOLD, ALL CAPS, HIGH CONTRAST',
      typical_content: ['COMPANY NAME', 'PHONE NUMBER', 'LICENSE #', 'OWNER NAME'],
      positioning: 'Company name prominent top, contact info smaller bottom',
      depth: '0.08-0.10mm for outdoor durability',
      fonts: ['Arial Black', 'Impact', 'Helvetica Bold'],
      compliance: ['Business License', 'Insurance Info', 'Bonding']
    },
    examples: [
      'MILLER CONSTRUCTION\n555-0123\nLIC #BC12345',
      'ABC BUILDERS EST. 1995\nJOHN MILLER OWNER\n(555) 123-4567',
      'HEAVY CONSTRUCTION LLC\nEMERGENCY: 555-0199'
    ],
    urgency_keywords: ['emergency', '24/7', 'urgent', 'immediate'],
    safety_requirements: ['OSHA compliant', 'Safety certified', 'Insured']
  },

  {
    industry: 'Electrical Contractors',
    patterns: {
      text_style: 'Professional, code-compliant, safety-focused',
      typical_content: ['COMPANY', 'ELECTRICAL LICENSE', 'PHONE', 'EMERGENCY #'],
      positioning: 'License # visible, emergency contact prominent',
      depth: '0.05-0.08mm standard, 0.10mm+ for outdoor',
      fonts: ['Helvetica', 'Arial', 'Times New Roman'],
      compliance: ['Electrical License', 'NECA Certification', 'IBEW']
    },
    examples: [
      'SPARK ELECTRIC\nLIC #E12345\n24/7 EMERGENCY\n555-0199',
      'WILSON ELECTRICAL\nMASTER ELECTRICIAN\nJOE WILSON\n555-0123',
      'POWER PROS LLC\nLIC #E67890\nCOMMERCIAL • RESIDENTIAL'
    ],
    urgency_keywords: ['emergency', '24/7', 'power outage', 'electrical'],
    safety_requirements: ['Licensed Master', 'Bonded', 'Insured', 'Code certified']
  },

  {
    industry: 'Plumbing & HVAC',
    patterns: {
      text_style: 'Clean, professional, service-focused',
      typical_content: ['COMPANY', 'LICENSE #', '24/7 SERVICE', 'PHONE'],
      positioning: 'Service availability prominent',
      depth: '0.06-0.08mm standard depth',
      fonts: ['Helvetica', 'Arial', 'Calibri'],
      compliance: ['Plumbing License', 'HVAC Certification', 'EPA Certified']
    },
    examples: [
      'JOHNSON PLUMBING\nLIC #P12345\n24/7 SERVICE\n555-0123',
      'COOLING EXPERTS\nHVAC LICENSE #H67890\nEPA CERTIFIED',
      'PIPE PROS\nEMERGENCY REPAIRS\n555-PIPES'
    ],
    urgency_keywords: ['emergency', 'leak', 'no heat', 'no ac', '24/7'],
    safety_requirements: ['Licensed', 'Bonded', 'Background checked']
  },

  {
    industry: 'Roofing',
    patterns: {
      text_style: 'Bold, weather-resistant design',
      typical_content: ['COMPANY', 'ROOFING LICENSE', 'INSURANCE INFO', 'PHONE'],
      positioning: 'Storm/emergency services prominent',
      depth: '0.08-0.12mm for weather exposure',
      fonts: ['Impact', 'Arial Black', 'Helvetica Bold'],
      compliance: ['Roofing License', 'Storm Certified', 'Insurance Claims']
    },
    examples: [
      'PEAK ROOFING\nSTORM DAMAGE EXPERTS\n555-ROOF',
      'APEX ROOFING LLC\nLIC #R12345\nINSURANCE CLAIMS\n24/7 TARPS',
      'SUMMIT ROOFING\nHAIL DAMAGE SPECIALISTS'
    ],
    urgency_keywords: ['storm', 'leak', 'emergency', 'hail', 'wind damage'],
    safety_requirements: ['Licensed', 'Insured', 'Safety trained', 'Fall protection']
  },

  {
    industry: 'Fleet Management',
    patterns: {
      text_style: 'Asset tracking focused, scannable',
      typical_content: ['COMPANY', 'FLEET ID', 'ASSET #', 'QR CODE'],
      positioning: 'ID numbers prominent for scanning',
      depth: '0.06-0.08mm for durability without damage',
      fonts: ['Courier New', 'Consolas', 'Arial'],
      compliance: ['DOT Numbers', 'Fleet Registration', 'Asset Tags']
    },
    examples: [
      'ABC CONSTRUCTION\nTRUCK-001\nDOT# 123456',
      'FLEET VEHICLE 12\nUNIT: A-045\nSERVICE DUE: 6/23',
      'COMPANY ASSET\nID: EQ-789\nINSP: 12/23'
    ],
    urgency_keywords: ['maintenance', 'service due', 'inspection', 'tracking'],
    safety_requirements: ['DOT compliant', 'Inspection current', 'Insurance valid']
  }
]

// Voice pattern recognition for construction site language
export const VOICE_PATTERNS: VoicePattern[] = [
  // Size adjustments
  { phrase: 'bigger', intent: 'increase_text_size', parameters: { textSize: '+20%' }, confidence: 0.9 },
  { phrase: 'smaller', intent: 'decrease_text_size', parameters: { textSize: '-15%' }, confidence: 0.9 },
  { phrase: 'larger', intent: 'increase_text_size', parameters: { textSize: '+25%' }, confidence: 0.9 },
  { phrase: 'tiny', intent: 'decrease_text_size', parameters: { textSize: '-30%' }, confidence: 0.8 },
  
  // Position adjustments
  { phrase: 'move up', intent: 'adjust_position', parameters: { textYPosition: -0.2 }, confidence: 0.9 },
  { phrase: 'move down', intent: 'adjust_position', parameters: { textYPosition: 0.2 }, confidence: 0.9 },
  { phrase: 'center it', intent: 'center_text', parameters: { textXPosition: 0, textAlign: 'center' }, confidence: 0.95 },
  { phrase: 'move left', intent: 'adjust_position', parameters: { textXPosition: -0.3 }, confidence: 0.9 },
  { phrase: 'move right', intent: 'adjust_position', parameters: { textXPosition: 0.3 }, confidence: 0.9 },
  
  // Style adjustments
  { phrase: 'bold', intent: 'make_bold', parameters: { fontFamily: 'Arial Black', textSize: '+10%' }, confidence: 0.9 },
  { phrase: 'thicker', intent: 'increase_depth', parameters: { engravingDepth: '+0.02' }, confidence: 0.8 },
  { phrase: 'deeper', intent: 'increase_depth', parameters: { engravingDepth: '+0.03' }, confidence: 0.9 },
  { phrase: 'lighter', intent: 'decrease_depth', parameters: { engravingDepth: '-0.02' }, confidence: 0.8 },
  
  // Readability concerns
  { phrase: "can't read it", intent: 'improve_readability', parameters: { textSize: '+30%', engravingDepth: '+0.02' }, confidence: 0.95 },
  { phrase: "too small", intent: 'increase_readability', parameters: { textSize: '+25%' }, confidence: 0.9 },
  { phrase: "hard to see", intent: 'improve_visibility', parameters: { textSize: '+20%', engravingDepth: '+0.01' }, confidence: 0.9 },
  
  // Industry-specific requests
  { phrase: 'emergency number', intent: 'add_emergency', parameters: { secondaryText: 'EMERGENCY: ', showSecondaryText: true }, confidence: 0.9 },
  { phrase: 'license number', intent: 'add_license', parameters: { secondaryText: 'LIC #', showSecondaryText: true }, confidence: 0.9 },
  { phrase: '24/7', intent: 'add_availability', parameters: { secondaryText: '24/7 SERVICE', showSecondaryText: true }, confidence: 0.95 },
  { phrase: 'company name', intent: 'set_company', parameters: { primaryText: 'COMPANY NAME' }, confidence: 0.8 },
  
  // Outdoor/durability requests
  { phrase: 'outdoor use', intent: 'outdoor_durability', parameters: { engravingDepth: 0.08, fontFamily: 'Arial Black' }, confidence: 0.9 },
  { phrase: 'weather resistant', intent: 'weather_proof', parameters: { engravingDepth: 0.10 }, confidence: 0.9 },
  { phrase: 'job site', intent: 'job_site_durable', parameters: { engravingDepth: 0.08, textSize: '+15%' }, confidence: 0.85 }
]

// Smart defaults based on detected context
export const SMART_DEFAULTS = {
  construction: {
    fontFamily: 'Arial Black',
    textSize: 0.18,
    engravingDepth: 0.08,
    textAlign: 'center',
    textYPosition: -0.1
  },
  
  electrical: {
    fontFamily: 'Helvetica',
    textSize: 0.15,
    engravingDepth: 0.06,
    textAlign: 'center',
    textYPosition: 0
  },
  
  plumbing: {
    fontFamily: 'Arial',
    textSize: 0.16,
    engravingDepth: 0.06,
    textAlign: 'center',
    textYPosition: -0.05
  },
  
  fleet: {
    fontFamily: 'Courier New',
    textSize: 0.14,
    engravingDepth: 0.05,
    textAlign: 'left',
    textYPosition: 0.1
  },
  
  professional: {
    fontFamily: 'Helvetica',
    textSize: 0.15,
    engravingDepth: 0.05,
    textAlign: 'center',
    textYPosition: 0
  }
}

// Context detection patterns
export const CONTEXT_DETECTION = {
  industries: {
    construction: ['construction', 'builder', 'contractor', 'build', 'site'],
    electrical: ['electric', 'electrician', 'power', 'voltage', 'wiring'],
    plumbing: ['plumbing', 'plumber', 'pipe', 'water', 'drain', 'hvac'],
    roofing: ['roof', 'roofing', 'shingle', 'gutter', 'storm'],
    fleet: ['truck', 'vehicle', 'fleet', 'unit', 'asset', 'equipment']
  },
  
  urgency: ['emergency', '24/7', 'urgent', 'immediate', 'asap', 'now'],
  outdoor: ['outdoor', 'outside', 'weather', 'jobsite', 'construction site', 'field'],
  professional: ['professional', 'business', 'corporate', 'company', 'office']
}

// Training prompts for AI model enhancement
export const TRAINING_PROMPTS = {
  company_names: [
    "Put ACME CONSTRUCTION in bold letters at the top",
    "I want MILLER ELECTRIC centered with professional font",
    "Add JOHNSON PLUMBING in large letters",
    "Put ABC ROOFING with our license number below"
  ],
  
  contact_info: [
    "Add our phone number 555-0123 below the name",
    "Put EMERGENCY: 555-0199 at the bottom",
    "Include our license number LIC #12345",
    "Add 24/7 SERVICE under the company name"
  ],
  
  positioning: [
    "Put it at the top of the battery",
    "Center everything on the battery",
    "Move the text up a bit",
    "Put the name on top and phone below"
  ],
  
  style: [
    "Make it look professional for business use",
    "Make it bold and easy to read outdoors",
    "Use industrial style lettering",
    "Make it weather resistant with deep engraving"
  ],
  
  industry_specific: [
    "Design it for electrical contractor use",
    "Make it suitable for construction site work",
    "Create a plumbing service battery label",
    "Design for fleet vehicle tracking"
  ]
}

// Utility functions for knowledge base integration
export class ConstructionKnowledgeProcessor {
  static detectIndustry(input: string): string | null {
    const lowerInput = input.toLowerCase()
    
    for (const [industry, keywords] of Object.entries(CONTEXT_DETECTION.industries)) {
      for (const keyword of keywords) {
        if (lowerInput.includes(keyword)) {
          return industry
        }
      }
    }
    return null
  }
  
  static getSmartDefaults(industry: string | null): any {
    if (industry && SMART_DEFAULTS[industry as keyof typeof SMART_DEFAULTS]) {
      return SMART_DEFAULTS[industry as keyof typeof SMART_DEFAULTS]
    }
    return SMART_DEFAULTS.professional
  }
  
  static processVoiceCommand(input: string): { intent: string; parameters: any; confidence: number } | null {
    const lowerInput = input.toLowerCase()
    
    for (const pattern of VOICE_PATTERNS) {
      if (lowerInput.includes(pattern.phrase)) {
        return {
          intent: pattern.intent,
          parameters: pattern.parameters,
          confidence: pattern.confidence
        }
      }
    }
    return null
  }
  
  static getIndustryExamples(industry: string): string[] {
    const pattern = CONSTRUCTION_PATTERNS.find(p => p.industry.toLowerCase().includes(industry.toLowerCase()))
    return pattern?.examples || []
  }
  
  static generateContextPrompt(userInput: string, detectedIndustry: string | null): string {
    const industry = detectedIndustry || 'professional'
    const pattern = CONSTRUCTION_PATTERNS.find(p => p.industry.toLowerCase().includes(industry))
    
    let contextPrompt = `
INDUSTRY CONTEXT: ${industry.toUpperCase()}
USER REQUEST: "${userInput}"

INDUSTRY-SPECIFIC GUIDELINES:
`
    
    if (pattern) {
      contextPrompt += `
- Style: ${pattern.patterns.text_style}
- Typical Content: ${pattern.patterns.typical_content.join(', ')}
- Positioning: ${pattern.patterns.positioning}
- Engraving Depth: ${pattern.patterns.depth}
- Recommended Fonts: ${pattern.patterns.fonts.join(', ')}
- Safety Requirements: ${pattern.safety_requirements.join(', ')}

EXAMPLES FROM THIS INDUSTRY:
${pattern.examples.map(ex => `"${ex}"`).join('\n')}
`
    }
    
    return contextPrompt
  }
}

export default ConstructionKnowledgeProcessor