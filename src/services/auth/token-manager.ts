/**
 * Token Manager
 * Centralized token management for Lithi ecosystem
 */

interface TokenData {
  token: string
  refreshToken?: string
  expiresAt: number
  serviceTokens?: Record<string, string>
}

class TokenManager {
  private tokenKey = 'lithi-auth-token'
  private refreshKey = 'lithi-refresh-token'
  private serviceTokensKey = 'lithi-service-tokens'

  // Get main authentication token
  async getToken(): Promise<string | null> {
    if (typeof window === 'undefined') {
      // Server-side: get from cookies or headers
      return null
    }

    try {
      const tokenData = localStorage.getItem(this.tokenKey)
      if (!tokenData) return null

      const parsed: TokenData = JSON.parse(tokenData)
      
      // Check if token is expired
      if (Date.now() > parsed.expiresAt) {
        // Try to refresh
        return await this.refreshToken()
      }

      return parsed.token
    } catch (error) {
      console.error('Error getting token:', error)
      return null
    }
  }

  // Get service-specific token
  async getServiceToken(service: string): Promise<string | null> {
    if (typeof window === 'undefined') return null

    try {
      const serviceTokens = localStorage.getItem(this.serviceTokensKey)
      if (!serviceTokens) return null

      const parsed = JSON.parse(serviceTokens)
      return parsed[service] || null
    } catch (error) {
      console.error('Error getting service token:', error)
      return null
    }
  }

  // Set main authentication token
  async setToken(token: string, expiresIn: number = 3600): Promise<void> {
    if (typeof window === 'undefined') return

    const tokenData: TokenData = {
      token,
      expiresAt: Date.now() + (expiresIn * 1000)
    }

    localStorage.setItem(this.tokenKey, JSON.stringify(tokenData))
  }

  // Set service-specific token
  async setServiceToken(service: string, token: string): Promise<void> {
    if (typeof window === 'undefined') return

    try {
      const existing = localStorage.getItem(this.serviceTokensKey)
      const serviceTokens = existing ? JSON.parse(existing) : {}
      
      serviceTokens[service] = token
      localStorage.setItem(this.serviceTokensKey, JSON.stringify(serviceTokens))
    } catch (error) {
      console.error('Error setting service token:', error)
    }
  }

  // Set refresh token
  async setRefreshToken(refreshToken: string): Promise<void> {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.refreshKey, refreshToken)
  }

  // Refresh authentication token
  async refreshToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null

    try {
      const refreshToken = localStorage.getItem(this.refreshKey)
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      // Call refresh endpoint
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      })

      if (!response.ok) {
        throw new Error('Failed to refresh token')
      }

      const data = await response.json()
      
      // Store new tokens
      await this.setToken(data.accessToken, data.expiresIn)
      if (data.refreshToken) {
        await this.setRefreshToken(data.refreshToken)
      }

      return data.accessToken
    } catch (error) {
      console.error('Error refreshing token:', error)
      // Clear invalid tokens
      this.clearTokens()
      return null
    }
  }

  // Clear all tokens (logout)
  clearTokens(): void {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem(this.tokenKey)
    localStorage.removeItem(this.refreshKey)
    localStorage.removeItem(this.serviceTokensKey)
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken()
    return !!token
  }

  // Get decoded token data
  async getTokenData(): Promise<any | null> {
    const token = await this.getToken()
    if (!token) return null

    try {
      // Decode JWT token (basic implementation)
      const parts = token.split('.')
      if (parts.length !== 3) return null

      const payload = JSON.parse(atob(parts[1]))
      return payload
    } catch (error) {
      console.error('Error decoding token:', error)
      return null
    }
  }

  // Exchange tokens between services
  async exchangeToken(sourceService: string, targetService: string): Promise<string | null> {
    try {
      const sourceToken = await this.getServiceToken(sourceService)
      if (!sourceToken) {
        throw new Error(`No token for service: ${sourceService}`)
      }

      const response = await fetch('/api/auth/exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sourceToken}`
        },
        body: JSON.stringify({
          sourceService,
          targetService
        })
      })

      if (!response.ok) {
        throw new Error('Failed to exchange token')
      }

      const data = await response.json()
      await this.setServiceToken(targetService, data.token)
      
      return data.token
    } catch (error) {
      console.error('Error exchanging token:', error)
      return null
    }
  }

  // Validate token
  async validateToken(token?: string): Promise<boolean> {
    const tokenToValidate = token || await this.getToken()
    if (!tokenToValidate) return false

    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenToValidate}`
        }
      })

      return response.ok
    } catch (error) {
      console.error('Error validating token:', error)
      return false
    }
  }
}

// Export singleton instance
export const tokenManager = new TokenManager()

// Export individual functions for convenience
export const getToken = () => tokenManager.getToken()
export const setToken = (token: string, expiresIn?: number) => tokenManager.setToken(token, expiresIn)
export const refreshToken = () => tokenManager.refreshToken()
export const clearTokens = () => tokenManager.clearTokens()
export const isAuthenticated = () => tokenManager.isAuthenticated()
export const getTokenData = () => tokenManager.getTokenData()
export const getServiceToken = (service: string) => tokenManager.getServiceToken(service)
export const setServiceToken = (service: string, token: string) => tokenManager.setServiceToken(service, token)