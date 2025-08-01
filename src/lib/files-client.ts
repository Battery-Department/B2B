// Files API Client for Managing Design Assets
// Supports templates, logos, and reference images for battery design

interface FileMetadata {
  id: string
  filename: string
  size: number
  type: string
  purpose: 'template' | 'logo' | 'reference' | 'dataset'
  created_at: string
  status: 'processing' | 'processed' | 'error'
}

interface UploadResponse {
  file_id: string
  filename: string
  size: number
  status: string
}

class FilesAPIClient {
  private apiKey: string
  private baseURL: string = 'https://api.anthropic.com/v1/files'
  
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || ''
    if (!this.apiKey) {
      console.warn('ANTHROPIC_API_KEY not found for Files API')
    }
  }
  
  /**
   * Upload a file for use in battery design
   * Supports: PDFs (templates), images (logos/references), datasets
   */
  async uploadFile(file: File, purpose: 'template' | 'logo' | 'reference' | 'dataset' = 'reference'): Promise<UploadResponse> {
    if (!this.apiKey) {
      throw new Error('Files API requires ANTHROPIC_API_KEY')
    }
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('purpose', purpose)
    
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'files-api-2025-04-14'
      },
      body: formData
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }))
      throw new Error(`File upload failed: ${error.message || response.statusText}`)
    }
    
    const result = await response.json()
    
    // Store file metadata for design context
    this.storeFileMetadata(result, purpose)
    
    return result
  }
  
  /**
   * List uploaded files for design templates and assets
   */
  async listFiles(): Promise<FileMetadata[]> {
    if (!this.apiKey) {
      return []
    }
    
    try {
      const response = await fetch(this.baseURL, {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'files-api-2025-04-14'
        }
      })
      
      if (!response.ok) {
        console.warn('Failed to fetch files list')
        return []
      }
      
      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.warn('Error fetching files:', error)
      return []
    }
  }
  
  /**
   * Get file metadata and usage information
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    if (!this.apiKey) {
      return null
    }
    
    try {
      const response = await fetch(`${this.baseURL}/${fileId}`, {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'files-api-2025-04-14'
        }
      })
      
      if (!response.ok) {
        return null
      }
      
      return await response.json()
    } catch (error) {
      console.warn('Error fetching file metadata:', error)
      return null
    }
  }
  
  /**
   * Delete uploaded file
   */
  async deleteFile(fileId: string): Promise<boolean> {
    if (!this.apiKey) {
      return false
    }
    
    try {
      const response = await fetch(`${this.baseURL}/${fileId}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'files-api-2025-04-14'
        }
      })
      
      return response.ok
    } catch (error) {
      console.warn('Error deleting file:', error)
      return false
    }
  }
  
  /**
   * Create document content block for Messages API
   */
  createDocumentBlock(fileId: string, title?: string, context?: string) {
    return {
      type: 'document',
      source: {
        type: 'file',
        file_id: fileId
      },
      title,
      context,
      citations: { enabled: true }
    }
  }
  
  /**
   * Create image content block for Messages API
   */
  createImageBlock(fileId: string) {
    return {
      type: 'image',
      source: {
        type: 'file',
        file_id: fileId
      }
    }
  }
  
  /**
   * Store file metadata locally for quick access
   */
  private storeFileMetadata(fileData: any, purpose: string) {
    try {
      const stored = localStorage.getItem('design_files') || '[]'
      const files = JSON.parse(stored)
      
      files.push({
        ...fileData,
        purpose,
        uploaded_at: new Date().toISOString()
      })
      
      // Keep only last 50 files to prevent storage overflow
      if (files.length > 50) {
        files.splice(0, files.length - 50)
      }
      
      localStorage.setItem('design_files', JSON.stringify(files))
    } catch (error) {
      console.warn('Could not store file metadata:', error)
    }
  }
  
  /**
   * Get locally stored files for quick UI updates
   */
  getStoredFiles(): FileMetadata[] {
    try {
      const stored = localStorage.getItem('design_files') || '[]'
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
}

// Enhanced Design Context with Files Support
export interface EnhancedDesignContext {
  customerType?: string
  batteryModel?: string
  orderQuantity?: number
  industryHints?: string[]
  templateFiles?: string[] // File IDs for design templates
  logoFiles?: string[]     // File IDs for company logos
  referenceFiles?: string[] // File IDs for reference images
}

// Singleton instance
export const filesClient = new FilesAPIClient()

// Utility functions for design integration
export const designFileUtils = {
  /**
   * Upload company logo for automatic integration
   */
  async uploadCompanyLogo(file: File): Promise<string | null> {
    try {
      const result = await filesClient.uploadFile(file, 'logo')
      return result.file_id
    } catch (error) {
      console.error('Logo upload failed:', error)
      return null
    }
  },
  
  /**
   * Upload design template (PDF/image)
   */
  async uploadDesignTemplate(file: File): Promise<string | null> {
    try {
      const result = await filesClient.uploadFile(file, 'template')
      return result.file_id
    } catch (error) {
      console.error('Template upload failed:', error)
      return null
    }
  },
  
  /**
   * Create enhanced prompt with file references
   */
  createEnhancedPrompt(userInput: string, context: EnhancedDesignContext): any {
    const messages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: `DESIGN REQUEST: ${userInput}\n\nCONTEXT: ${JSON.stringify(context)}` }
        ]
      }
    ]
    
    // Add template files
    if (context.templateFiles?.length) {
      context.templateFiles.forEach(fileId => {
        messages[0].content.push(filesClient.createDocumentBlock(fileId, 'Design Template', 'Reference template for battery design'))
      })
    }
    
    // Add logo files
    if (context.logoFiles?.length) {
      context.logoFiles.forEach(fileId => {
        messages[0].content.push(filesClient.createImageBlock(fileId))
      })
    }
    
    // Add reference files
    if (context.referenceFiles?.length) {
      context.referenceFiles.forEach(fileId => {
        messages[0].content.push(filesClient.createImageBlock(fileId))
      })
    }
    
    return messages
  }
}

export default FilesAPIClient