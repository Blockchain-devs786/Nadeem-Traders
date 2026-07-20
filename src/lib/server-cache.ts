class ServerCache {
  private cache = new Map<string, { value: any; expiresAt: number }>();

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key: string, value: any, ttlMs: number = 300000) { // Default TTL: 5 minutes
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clearAll() {
    this.cache.clear();
  }
}

export const serverCache = new ServerCache();
