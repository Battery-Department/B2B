/**
 * Redis compatibility layer using Vercel KV
 */

import { kv } from '@vercel/kv'

export class Redis {
  async get(key: string) {
    return kv.get(key)
  }

  async set(key: string, value: any, mode?: string, duration?: number) {
    if (mode === 'EX' && duration) {
      return kv.setex(key, duration, value)
    }
    return kv.set(key, value)
  }

  async del(key: string) {
    return kv.del(key)
  }

  async exists(key: string) {
    return kv.exists(key)
  }

  async expire(key: string, seconds: number) {
    return kv.expire(key, seconds)
  }

  async incr(key: string) {
    return kv.incr(key)
  }

  async decr(key: string) {
    return kv.decr(key)
  }

  async lpush(key: string, ...values: any[]) {
    return kv.lpush(key, ...values)
  }

  async rpush(key: string, ...values: any[]) {
    return kv.rpush(key, ...values)
  }

  async lrange(key: string, start: number, stop: number) {
    return kv.lrange(key, start, stop)
  }

  async sadd(key: string, ...members: any[]) {
    return kv.sadd(key, ...members)
  }

  async smembers(key: string) {
    return kv.smembers(key)
  }

  async srem(key: string, ...members: any[]) {
    return kv.srem(key, ...members)
  }

  async hset(key: string, field: string, value: any) {
    return kv.hset(key, field, value)
  }

  async hget(key: string, field: string) {
    return kv.hget(key, field)
  }

  async hgetall(key: string) {
    return kv.hgetall(key)
  }

  async zadd(key: string, score: number, member: string) {
    return kv.zadd(key, { score, member })
  }

  async zrange(key: string, start: number, stop: number) {
    return kv.zrange(key, start, stop)
  }

  async ttl(key: string) {
    return kv.ttl(key)
  }

  async ping() {
    return 'PONG'
  }

  async flushall() {
    // Not supported in Vercel KV
    console.warn('flushall not supported in Vercel KV')
  }

  on(event: string, handler: Function) {
    // Event handling not needed for Vercel KV
  }

  disconnect() {
    // No disconnect needed for Vercel KV
  }
}

// In-memory fallback for development
class InMemoryRedis {
  private store = new Map<string, any>()
  private expires = new Map<string, number>()

  async get(key: string) {
    this.checkExpired(key)
    return this.store.get(key)
  }

  async set(key: string, value: any, mode?: string, duration?: number) {
    this.store.set(key, value)
    if (mode === 'EX' && duration) {
      this.expires.set(key, Date.now() + duration * 1000)
    }
    return 'OK'
  }

  async del(key: string) {
    this.store.delete(key)
    this.expires.delete(key)
    return 1
  }

  async exists(key: string) {
    this.checkExpired(key)
    return this.store.has(key) ? 1 : 0
  }

  async expire(key: string, seconds: number) {
    if (this.store.has(key)) {
      this.expires.set(key, Date.now() + seconds * 1000)
      return 1
    }
    return 0
  }

  async incr(key: string) {
    const val = parseInt(await this.get(key) || '0')
    const newVal = val + 1
    await this.set(key, newVal.toString())
    return newVal
  }

  async decr(key: string) {
    const val = parseInt(await this.get(key) || '0')
    const newVal = val - 1
    await this.set(key, newVal.toString())
    return newVal
  }

  private checkExpired(key: string) {
    const expiry = this.expires.get(key)
    if (expiry && Date.now() > expiry) {
      this.store.delete(key)
      this.expires.delete(key)
    }
  }

  // List operations
  async lpush(key: string, ...values: any[]) {
    let list = this.store.get(key) || []
    list.unshift(...values)
    this.store.set(key, list)
    return list.length
  }

  async rpush(key: string, ...values: any[]) {
    let list = this.store.get(key) || []
    list.push(...values)
    this.store.set(key, list)
    return list.length
  }

  async lrange(key: string, start: number, stop: number) {
    const list = this.store.get(key) || []
    return list.slice(start, stop + 1)
  }

  // Set operations
  async sadd(key: string, ...members: any[]) {
    let set = this.store.get(key) || new Set()
    members.forEach(m => set.add(m))
    this.store.set(key, set)
    return members.length
  }

  async smembers(key: string) {
    const set = this.store.get(key) || new Set()
    return Array.from(set)
  }

  async srem(key: string, ...members: any[]) {
    let set = this.store.get(key)
    if (!set) return 0
    let removed = 0
    members.forEach(m => {
      if (set.delete(m)) removed++
    })
    return removed
  }

  // Hash operations
  async hset(key: string, field: string, value: any) {
    let hash = this.store.get(key) || {}
    hash[field] = value
    this.store.set(key, hash)
    return 1
  }

  async hget(key: string, field: string) {
    const hash = this.store.get(key) || {}
    return hash[field]
  }

  async hgetall(key: string) {
    return this.store.get(key) || {}
  }

  // Sorted set operations
  async zadd(key: string, score: number, member: string) {
    let zset = this.store.get(key) || []
    zset.push({ score, member })
    zset.sort((a: any, b: any) => a.score - b.score)
    this.store.set(key, zset)
    return 1
  }

  async zrange(key: string, start: number, stop: number) {
    const zset = this.store.get(key) || []
    return zset.slice(start, stop + 1).map((item: any) => item.member)
  }

  async ttl(key: string) {
    const expiry = this.expires.get(key)
    if (!expiry) return -1
    return Math.floor((expiry - Date.now()) / 1000)
  }

  async ping() {
    return 'PONG'
  }

  async flushall() {
    this.store.clear()
    this.expires.clear()
    return 'OK'
  }

  on(event: string, handler: Function) {
    // No-op for in-memory
  }

  disconnect() {
    // No-op for in-memory
  }
}

// Export the appropriate implementation
const useKV = !!process.env.KV_REST_API_URL
const redisClient = useKV ? new Redis() : new InMemoryRedis()

console.log(useKV ? '✅ Using Vercel KV for Redis operations' : '⚠️ Using in-memory Redis fallback')

export { redisClient }
export default redisClient