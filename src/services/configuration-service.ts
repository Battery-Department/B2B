interface ConfigurationData {
  id?: string;
  projectName: string;
  jobDuration: number;
  workHoursPerDay: number;
  startDate: string;
  jobsiteCount: number;
  primaryLocation: string;
  environment: string;
  crewSize: number;
  shiftPattern: string;
  experienceLevel: string;
  selectedTools: Record<string, number>;
  usageIntensity: 'light' | 'moderate' | 'heavy';
  requireBackup: boolean;
  requireFastCharging: boolean;
  budgetLimit: number;
  recommendedConfig: {
    '6Ah': number;
    '9Ah': number;
    '15Ah': number;
  };
  totalCost: number;
  totalRuntime: number;
  chargersNeeded: number;
  dailyPowerRequirement: number;
  peakPowerDemand: number;
  savings: number;
  createdAt?: string;
  updatedAt?: string;
}

interface EmailConfigurationRequest {
  configuration: ConfigurationData;
  recipientEmail: string;
  recipientName?: string;
  includeQuote?: boolean;
}

export class ConfigurationService {
  private static readonly STORAGE_KEY = 'battery_configurations';

  // Save configuration to localStorage
  static saveConfiguration(config: ConfigurationData): string {
    const configId = config.id || this.generateId();
    const timestamp = new Date().toISOString();
    
    const configWithMetadata: ConfigurationData = {
      ...config,
      id: configId,
      createdAt: config.createdAt || timestamp,
      updatedAt: timestamp
    };

    // Get existing configurations
    const existingConfigs = this.getAllConfigurations();
    
    // Update or add new configuration
    const updatedConfigs = existingConfigs.filter(c => c.id !== configId);
    updatedConfigs.push(configWithMetadata);
    
    // Keep only last 10 configurations
    const recentConfigs = updatedConfigs
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())
      .slice(0, 10);

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentConfigs));
    return configId;
  }

  // Get all saved configurations
  static getAllConfigurations(): ConfigurationData[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading configurations:', error);
      return [];
    }
  }

  // Get configuration by ID
  static getConfiguration(id: string): ConfigurationData | null {
    const configs = this.getAllConfigurations();
    return configs.find(c => c.id === id) || null;
  }

  // Delete configuration
  static deleteConfiguration(id: string): boolean {
    const configs = this.getAllConfigurations();
    const filtered = configs.filter(c => c.id !== id);
    
    if (filtered.length < configs.length) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      return true;
    }
    return false;
  }

  // Email configuration (would typically call an API endpoint)
  static async emailConfiguration(request: EmailConfigurationRequest): Promise<boolean> {
    try {
      // In a real implementation, this would call your email API
      const emailData = {
        to: request.recipientEmail,
        subject: `Battery Configuration for ${request.configuration.projectName}`,
        html: this.generateEmailHTML(request.configuration, request.recipientName),
        attachments: request.includeQuote ? [this.generateQuotePDF(request.configuration)] : []
      };

      // For now, just simulate success
      console.log('Email configuration:', emailData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Error sending configuration email:', error);
      return false;
    }
  }

  // Generate unique ID
  private static generateId(): string {
    return 'config_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Generate email HTML
  private static generateEmailHTML(config: ConfigurationData, recipientName?: string): string {
    const greeting = recipientName ? `Hello ${recipientName},` : 'Hello,';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background: linear-gradient(135deg, #006FEE, #0084FF); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .config-summary { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .battery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
          .battery-card { background: white; border: 2px solid #e6f4ff; border-radius: 8px; padding: 15px; text-align: center; }
          .cost-summary { background: #e6f9f0; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e6f4ff; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Your Battery Configuration</h1>
          <p>Project: ${config.projectName}</p>
        </div>
        
        <div class="content">
          <p>${greeting}</p>
          <p>Here's your customized battery configuration for ${config.projectName}:</p>
          
          <div class="config-summary">
            <h3>Project Details</h3>
            <ul>
              <li><strong>Duration:</strong> ${config.jobDuration} days</li>
              <li><strong>Crew Size:</strong> ${config.crewSize} workers</li>
              <li><strong>Work Hours:</strong> ${config.workHoursPerDay} hours/day</li>
              <li><strong>Location:</strong> ${config.primaryLocation}</li>
              <li><strong>Environment:</strong> ${config.environment}</li>
            </ul>
          </div>

          <h3>Recommended Battery Configuration</h3>
          <div class="battery-grid">
            ${Object.entries(config.recommendedConfig).map(([battery, count]) => 
              count > 0 ? `
                <div class="battery-card">
                  <h4>${count}× ${battery} Battery</h4>
                  <p>$${this.getBatteryPrice(battery)} each</p>
                </div>
              ` : ''
            ).join('')}
          </div>

          <div class="cost-summary">
            <h3>Cost Summary</h3>
            <p><strong>Total Batteries:</strong> ${Object.values(config.recommendedConfig).reduce((a, b) => a + b, 0)} units</p>
            <p><strong>Total Runtime:</strong> ${config.totalRuntime} hours</p>
            <p><strong>Chargers Needed:</strong> ${config.chargersNeeded} units</p>
            <p><strong>Total Investment:</strong> $${config.totalCost.toFixed(2)}</p>
            <p><strong>You Save:</strong> $${config.savings.toFixed(2)}</p>
          </div>

          <p>This configuration is designed to meet your specific power requirements while maximizing value and runtime.</p>
          <p>Ready to proceed? Contact us to place your order or discuss any modifications.</p>
        </div>

        <div class="footer">
          <p>Generated by Lithi AI Battery Dashboard</p>
          <p>Questions? Contact our team at support@lithi.ai</p>
        </div>
      </body>
      </html>
    `;
  }

  // Generate quote PDF (placeholder)
  private static generateQuotePDF(config: ConfigurationData) {
    // In a real implementation, this would generate a PDF quote
    return {
      filename: `battery-quote-${config.projectName.replace(/\s+/g, '-')}.pdf`,
      content: 'PDF content would be generated here'
    };
  }

  // Get battery price by type
  private static getBatteryPrice(battery: string): number {
    const prices: Record<string, number> = {
      '6Ah': 95,
      '9Ah': 125,
      '15Ah': 245
    };
    return prices[battery] || 0;
  }

  // Export configuration to JSON
  static exportConfiguration(config: ConfigurationData): void {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `battery-config-${config.projectName.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Import configuration from JSON
  static async importConfiguration(file: File): Promise<ConfigurationData | null> {
    try {
      const text = await file.text();
      const config = JSON.parse(text);
      
      // Validate configuration structure
      if (this.isValidConfiguration(config)) {
        return config;
      }
      throw new Error('Invalid configuration format');
    } catch (error) {
      console.error('Error importing configuration:', error);
      return null;
    }
  }

  // Validate configuration structure
  private static isValidConfiguration(config: any): config is ConfigurationData {
    return (
      config &&
      typeof config.projectName === 'string' &&
      typeof config.crewSize === 'number' &&
      typeof config.recommendedConfig === 'object' &&
      config.recommendedConfig['6Ah'] !== undefined &&
      config.recommendedConfig['9Ah'] !== undefined &&
      config.recommendedConfig['15Ah'] !== undefined
    );
  }

  // Get configuration summary for display
  static getConfigurationSummary(config: ConfigurationData) {
    const totalBatteries = Object.values(config.recommendedConfig).reduce((a, b) => a + b, 0);
    const totalTools = Object.values(config.selectedTools).reduce((a, b) => a + b, 0);
    
    return {
      projectName: config.projectName,
      totalBatteries,
      totalTools,
      totalCost: config.totalCost,
      savings: config.savings,
      runtime: config.totalRuntime,
      lastModified: config.updatedAt || config.createdAt
    };
  }
}