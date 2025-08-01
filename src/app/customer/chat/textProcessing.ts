// Text content processor with auto-formatting
export const processContent = (content: string): string => {
  // Define pattern matches for auto-formatting
  const patterns = [
    // Speed values (30-40 mph, 50-60 mph, etc.)
    {
      pattern: /(\d+(?:-\d+)?\s*mph)/gi,
      replacement: '<span class="highlight-value">$1</span>'
    },
    
    // Time durations (1-2 hours, 30-60 minutes, etc.)
    {
      pattern: /(\d+(?:-\d+)?\s*(?:hour|minute|second)s?)/gi,
      replacement: '<span class="highlight-duration">$1</span>'
    },
    
    // Product names (all caps with optional numbers)
    {
      pattern: /\b([A-Z]{2,}(?:\s[A-Z0-9]{2,})*)\b/g,
      replacement: '<span class="highlight-product">$1</span>'
    },
    
    // Technical specifications (numbers with units)
    {
      pattern: /(\d+(?:\.\d+)?(?:Ah|V|kWh|W))/g,
      replacement: '<span class="highlight-spec">$1</span>'
    },
    
    // Automatic category detection (colon at end of short phrase)
    {
      pattern: /^(.{3,50}?):\s*$/gm,
      replacement: '<div class="auto-category">$1:</div>'
    },
    
    // Bullet point triggers (* or - at start of line)
    {
      pattern: /^[*•-]\s+(.+)$/gm,
      replacement: '<div class="auto-bullet"><span class="bullet-dot"></span>$1</div>'
    },
    
    // Comparison triggers (vs., compared to, better than, etc.)
    {
      pattern: /\b(compared to|vs\.?|better than|higher than|more than|less than)\b/gi,
      replacement: '<span class="highlight-comparison">$1</span>'
    },
    
    // Key benefit triggers (improved, enhanced, efficient, etc.)
    {
      pattern: /\b(improved|enhanced|efficient|powerful|longer|faster|better)\b/gi,
      replacement: '<span class="highlight-benefit">$1</span>'
    }
  ]
  
  // Apply all patterns
  let processedContent = content
  patterns.forEach(({ pattern, replacement }) => {
    processedContent = processedContent.replace(pattern, replacement)
  })
  
  return processedContent
}

// Command parser for markdown-like formatting
export const parseCommands = (text: string): string => {
  // Process bold text: **text** or __text__
  text = text.replace(/(\*\*|__)(.*?)\1/g, '<span class="cmd-bold">$2</span>')
  
  // Process highlights: ==text== or ^^text^^
  text = text.replace(/(==|\^\^)(.*?)\1/g, '<span class="cmd-highlight">$2</span>')
  
  // Process specifications: {{text}}
  text = text.replace(/\{\{(.*?)\}\}/g, '<span class="cmd-spec">$1</span>')
  
  // Process technical values: `text`
  text = text.replace(/`([^`]+)`/g, '<code class="cmd-code">$1</code>')
  
  // Process category headers: ## Header
  text = text.replace(/^##\s+(.+)$/gm, '<h3 class="cmd-category">$1</h3>')
  
  // Process bullet lists: * item or - item
  text = text.replace(/^(?:\*|-)\s+(.+)$/gm, '<div class="cmd-bullet-item"><span class="cmd-bullet"></span>$1</div>')
  
  // Process numeric values with unit: !50 mph! or !1-2 hours!
  text = text.replace(/!([\d\s\-\.]+(?:\s*[a-zA-Z/]+)?)!/g, '<span class="cmd-value">$1</span>')
  
  // Process product names: [PRODUCT NAME]
  text = text.replace(/\[([A-Z0-9\s]+)\]/g, '<span class="cmd-product">$1</span>')
  
  return text
}