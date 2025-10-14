import fs from 'fs';
import path from 'path';

/**
 * Local in-memory KV store with file persistence
 * Mimics the Vercel KV interface for local development
 */
class LocalKV {
  private data: Map<string, unknown>;
  private filePath: string;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(filePath: string = '.local-kv-data.json') {
    this.filePath = path.join(process.cwd(), filePath);
    this.data = new Map();
    this.loadFromFile();
  }

  private loadFromFile(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.data = new Map(Object.entries(parsed));
        console.log(`[LocalKV] Loaded ${this.data.size} keys from ${this.filePath}`);
      } else {
        console.log('[LocalKV] No existing data file found, starting fresh');
      }
    } catch (error) {
      console.error('[LocalKV] Error loading data from file:', error);
      this.data = new Map();
    }
  }

  private saveToFile(): void {
    try {
      const obj = Object.fromEntries(this.data.entries());
      fs.writeFileSync(this.filePath, JSON.stringify(obj, null, 2), 'utf-8');
      console.log(`[LocalKV] Saved ${this.data.size} keys to ${this.filePath}`);
    } catch (error) {
      console.error('[LocalKV] Error saving data to file:', error);
    }
  }

  private scheduleSave(): void {
    // Debounce saves to avoid too many file writes
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveToFile();
      this.saveTimeout = null;
    }, 100);
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const value = this.data.get(key);
    console.log(`[LocalKV] GET ${key}: ${value ? 'found' : 'not found'} (${this.data.size} keys in memory)`);
    return (value as T) || null;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.data.set(key, value);
    console.log(`[LocalKV] SET ${key} (${this.data.size} keys in memory)`);
    // Immediately save to disk for critical operations to avoid timing issues
    this.saveToFile();
  }

  async del(key: string): Promise<number> {
    const existed = this.data.has(key);
    this.data.delete(key);
    // Immediately save to disk for critical operations
    this.saveToFile();
    return existed ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    return this.data.has(key) ? 1 : 0;
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.data.keys());
    
    if (!pattern) {
      return allKeys;
    }

    // Simple pattern matching (supports * wildcard)
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);

    return allKeys.filter(key => regex.test(key));
  }

  async flushall(): Promise<void> {
    this.data.clear();
    this.saveToFile();
  }

  // Immediately save to disk (useful for graceful shutdown)
  flush(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.saveToFile();
  }
}

// Singleton instance
let localKVInstance: LocalKV | null = null;

export function getLocalKV(): LocalKV {
  if (!localKVInstance) {
    console.log('[LocalKV] Creating new singleton instance');
    localKVInstance = new LocalKV();
    
    // Ensure data is saved on process exit
    const cleanup = () => {
      if (localKVInstance) {
        localKVInstance.flush();
      }
    };

    process.on('exit', cleanup);
    process.on('SIGINT', () => {
      cleanup();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      cleanup();
      process.exit(0);
    });
  } else {
    console.log('[LocalKV] Reusing existing singleton instance');
  }
  
  return localKVInstance;
}

