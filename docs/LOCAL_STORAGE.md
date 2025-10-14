# Local Storage Implementation

This document explains how the local file-based storage works as an alternative to Vercel KV.

## Overview

The app includes a local KV store implementation that:
- Stores data in memory for fast access
- Persists to a JSON file (`.local-kv-data.json`) for durability
- Mimics the Vercel KV interface so switching is seamless
- Automatically saves changes with debouncing to avoid excessive writes

## Architecture

### File: `src/lib/local-kv.ts`

The `LocalKV` class implements:
- `get<T>(key: string)` - Retrieve a value
- `set(key: string, value: unknown)` - Store a value
- `del(key: string)` - Delete a value
- `exists(key: string)` - Check if key exists
- `keys(pattern?: string)` - List keys (with optional pattern matching)
- `flushall()` - Clear all data

### File: `src/lib/db.ts`

The database layer automatically chooses between Local KV and Vercel KV based on the `USE_LOCAL_KV` environment variable:

```typescript
const USE_LOCAL_KV = process.env.USE_LOCAL_KV === 'true';

if (USE_LOCAL_KV) {
  const { getLocalKV } = await import('./local-kv');
  kvStore = getLocalKV();
} else {
  const { kv } = await import('@vercel/kv');
  kvStore = kv;
}
```

## Data Persistence

### Debounced Saves
Changes are automatically saved to disk with a 100ms debounce. This means:
- Multiple rapid changes only result in one file write
- Performance is maintained even with frequent updates
- No manual save calls needed

### Graceful Shutdown
The LocalKV instance hooks into process signals:
- `process.on('exit')` - Saves before normal exit
- `process.on('SIGINT')` - Saves on Ctrl+C
- `process.on('SIGTERM')` - Saves on termination signal

This ensures data is never lost, even if the server crashes.

## Data Format

The `.local-kv-data.json` file stores data as a flat key-value object:

```json
{
  "list:abc123": {
    "id": "abc123",
    "name": "Family Holiday Ideas",
    "criteria": [...],
    "items": [...],
    "users": [...]
  },
  "user_lists:xyz789": ["abc123", "def456"]
}
```

## Switching Storage Backends

### From Local to Vercel KV

1. Export your data (optional):
```bash
cp .local-kv-data.json backup.json
```

2. Update `.env.local`:
```bash
USE_LOCAL_KV=false
KV_REST_API_URL=your_url
KV_REST_API_TOKEN=your_token
```

3. Restart the server

Note: Data is not automatically migrated. You'll start with an empty database.

### From Vercel KV to Local

1. Update `.env.local`:
```bash
USE_LOCAL_KV=true
```

2. Restart the server

Note: Existing Vercel KV data remains in the cloud and is not downloaded.

## Data Migration (Manual)

If you need to migrate data between storage backends, you can:

1. **Read from current store** while it's running
2. **Export the JSON** structure
3. **Switch backends** in `.env.local`
4. **Import to new store** by manually creating the `.local-kv-data.json` file

Example migration script structure:
```typescript
// Read all keys from Vercel KV
const keys = await kv.keys('*');
const data: Record<string, unknown> = {};

for (const key of keys) {
  data[key] = await kv.get(key);
}

// Write to local file
fs.writeFileSync('.local-kv-data.json', JSON.stringify(data, null, 2));
```

## Performance Considerations

### Local KV
- ✅ Extremely fast (in-memory)
- ✅ No network latency
- ✅ No external dependencies
- ✅ Perfect for development and testing
- ⚠️ Single-server only (no distribution)
- ⚠️ Limited by server memory
- ⚠️ Data lost if file is deleted

### Vercel KV (Redis)
- ✅ Distributed across edge network
- ✅ Scales with traffic
- ✅ Persistent and reliable
- ✅ Production-ready
- ⚠️ Requires Vercel account
- ⚠️ Has network latency
- ⚠️ Costs money at scale

## Troubleshooting

### Data not persisting between restarts

Check that:
1. `.local-kv-data.json` is being created in the project root
2. The file has write permissions
3. The server is properly shutting down (not force-killed)

### File corruption

If the JSON file becomes corrupted:
1. Stop the server
2. Delete `.local-kv-data.json`
3. Restart the server (starts fresh)

### Large file size

The JSON file grows with your data. If it becomes too large:
1. Delete old lists you don't need
2. Consider switching to Vercel KV for production
3. Manually edit the JSON file to remove old entries

## Security Notes

- The `.local-kv-data.json` file is in `.gitignore` by default
- Don't commit this file - it contains user data
- File permissions default to your system settings
- Consider encrypting the file for sensitive data (not implemented)

## Future Enhancements

Possible improvements:
- [ ] Compression of JSON data
- [ ] Encryption at rest
- [ ] Automatic backups
- [ ] Migration scripts between backends
- [ ] Support for other databases (PostgreSQL, MongoDB, etc.)

