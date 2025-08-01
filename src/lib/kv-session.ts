/**
 * Vercel KV Session Management
 * Replacement for Redis-based session management
 */

import { kv } from '@vercel/kv';
import { randomUUID } from 'crypto';

export interface Session {
  id: string;
  userId?: string;
  data: Record<string, any>;
  expiresAt: Date;
}

class KVSessionStore {
  private readonly prefix = 'session:';
  private readonly defaultTTL = 86400; // 24 hours in seconds

  async create(userId?: string, data: Record<string, any> = {}): Promise<Session> {
    const sessionId = randomUUID();
    const session: Session = {
      id: sessionId,
      userId,
      data,
      expiresAt: new Date(Date.now() + this.defaultTTL * 1000)
    };

    try {
      await kv.set(
        `${this.prefix}${sessionId}`,
        JSON.stringify(session),
        { ex: this.defaultTTL }
      );
      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      // Fallback to in-memory storage for development
      return session;
    }
  }

  async get(sessionId: string): Promise<Session | null> {
    try {
      const data = await kv.get(`${this.prefix}${sessionId}`);
      if (!data) return null;
      
      const session = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Check if session is expired
      if (new Date(session.expiresAt) < new Date()) {
        await this.destroy(sessionId);
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  async update(sessionId: string, data: Partial<Session>): Promise<boolean> {
    try {
      const session = await this.get(sessionId);
      if (!session) return false;

      const updated = { ...session, ...data };
      const ttl = Math.floor((new Date(updated.expiresAt).getTime() - Date.now()) / 1000);
      
      await kv.set(
        `${this.prefix}${sessionId}`,
        JSON.stringify(updated),
        { ex: ttl > 0 ? ttl : this.defaultTTL }
      );
      
      return true;
    } catch (error) {
      console.error('Failed to update session:', error);
      return false;
    }
  }

  async destroy(sessionId: string): Promise<boolean> {
    try {
      await kv.del(`${this.prefix}${sessionId}`);
      return true;
    } catch (error) {
      console.error('Failed to destroy session:', error);
      return false;
    }
  }

  async refresh(sessionId: string): Promise<boolean> {
    try {
      const session = await this.get(sessionId);
      if (!session) return false;

      session.expiresAt = new Date(Date.now() + this.defaultTTL * 1000);
      return await this.update(sessionId, session);
    } catch (error) {
      console.error('Failed to refresh session:', error);
      return false;
    }
  }

  // For development without KV
  private inMemoryStore = new Map<string, Session>();
  
  async createInMemory(userId?: string, data: Record<string, any> = {}): Promise<Session> {
    const sessionId = randomUUID();
    const session: Session = {
      id: sessionId,
      userId,
      data,
      expiresAt: new Date(Date.now() + this.defaultTTL * 1000)
    };
    
    this.inMemoryStore.set(sessionId, session);
    return session;
  }

  async getInMemory(sessionId: string): Promise<Session | null> {
    const session = this.inMemoryStore.get(sessionId);
    if (!session) return null;
    
    if (new Date(session.expiresAt) < new Date()) {
      this.inMemoryStore.delete(sessionId);
      return null;
    }
    
    return session;
  }
}

// Export singleton instance
export const sessionStore = new KVSessionStore();

// Helper functions for easy usage
export async function createSession(userId?: string, data: Record<string, any> = {}) {
  if (!process.env.KV_REST_API_URL) {
    return sessionStore.createInMemory(userId, data);
  }
  return sessionStore.create(userId, data);
}

export async function getSession(sessionId: string) {
  if (!process.env.KV_REST_API_URL) {
    return sessionStore.getInMemory(sessionId);
  }
  return sessionStore.get(sessionId);
}

export async function updateSession(sessionId: string, data: Partial<Session>) {
  return sessionStore.update(sessionId, data);
}

export async function destroySession(sessionId: string) {
  return sessionStore.destroy(sessionId);
}

export async function refreshSession(sessionId: string) {
  return sessionStore.refresh(sessionId);
}