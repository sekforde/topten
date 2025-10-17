# Local KV Setup - Quick Reference

## ✅ What's Been Implemented

You now have a **fully functional local KV storage system** that lets you test the app without any Vercel account!

### Key Features

1. **In-Memory Storage** - Lightning fast access
2. **File Persistence** - Automatically saves to `.local-kv-data.json`
3. **Seamless Switching** - Toggle between local and Vercel KV with one env variable
4. **Drop-in Replacement** - 100% compatible with Vercel KV interface
5. **Auto-Save** - Debounced writes prevent excessive disk I/O
6. **Graceful Shutdown** - Data saved on process exit

## 🚀 Getting Started (3 Steps!)

### 1. Ensure you have `.env.local`

It should already be created with:
```bash
USE_LOCAL_KV=true
```

If not, run:
```bash
echo "USE_LOCAL_KV=true" > .env.local
```

### 2. Start the dev server

```bash
npm run dev
```

You should see:
```
[DB] Using local KV store
```

### 3. Open the app

Visit [http://localhost:3000](http://localhost:3000)

## 📁 Where's My Data?

All data is stored in:
```
/Users/nigelwatson/github/2025/topten/.local-kv-data.json
```

This file:
- ✅ Is automatically created on first write
- ✅ Updates in real-time as you use the app
- ✅ Is safe to delete (resets all data)
- ✅ Is gitignored (won't be committed)
- ✅ Is human-readable JSON

## 🔄 Switching to Remote Storage

### Option 1: Redis (Recommended for Vercel)

When you're ready to use Vercel Redis:

1. **Update `.env.local`:**
```bash
USE_LOCAL_KV=false
REDIS_URL=redis://default:your_password@your-redis.vercel-storage.com:6379
```

2. **Restart the server**

You should see:
```
[DB] Using Redis store
```

### Option 2: Vercel KV (Legacy)

If you still have Vercel KV:

1. **Update `.env.local`:**
```bash
USE_LOCAL_KV=false
KV_REST_API_URL=https://your-kv.vercel-storage.com
KV_REST_API_TOKEN=your_token_here
```

2. **Restart the server**

You should see:
```
[DB] Using Vercel KV store
```

## 🧪 Testing the Local KV

### Test Basic Functionality

1. Create a new list
2. Share the link (copy it)
3. Open in incognito/different browser
4. Join with a different name
5. Add items and rate them
6. Check `.local-kv-data.json` - you'll see all the data!

### Test Persistence

1. Use the app (create lists, add items, rate them)
2. Stop the server (Ctrl+C)
3. Check `.local-kv-data.json` - data is there
4. Restart the server
5. Your lists should still be there!

## 🛠️ Useful Commands

### Reset all data
```bash
rm .local-kv-data.json
```

### View current data (formatted)
```bash
cat .local-kv-data.json | jq .
# or without jq:
cat .local-kv-data.json
```

### Backup your data
```bash
cp .local-kv-data.json backup-$(date +%Y%m%d-%H%M%S).json
```

### Check which storage is active
```bash
cat .env.local | grep USE_LOCAL_KV
```

## 🐛 Troubleshooting

### "Cannot find module './local-kv'"

The server might be caching. Try:
```bash
rm -rf .next
npm run dev
```

### Data not saving

1. Check file permissions on project directory
2. Ensure you have disk space
3. Look for error messages in console
4. Verify `.local-kv-data.json` can be created

### Server not starting

1. Make sure port 3000 is free
2. Check for TypeScript errors: `npm run build`
3. Verify all dependencies: `npm install`

## 📊 Performance Comparison

| Operation | Local KV | Vercel KV |
|-----------|----------|-----------|
| Read latency | <1ms | 10-50ms |
| Write latency | <1ms (in-memory) | 20-100ms |
| Setup time | 0 seconds | 5-10 minutes |
| Cost | Free | Free tier, then paid |
| Best for | Development, testing | Production |

## 💡 Tips

1. **Multiple developers?** Each dev has their own `.local-kv-data.json`
2. **Sharing test data?** Commit a sample `.local-kv-data.sample.json` (without user tokens!)
3. **Large datasets?** Local KV can handle thousands of lists
4. **CI/CD?** Use local KV for automated tests

## 🎯 What's Next?

Now that local storage is working:

1. ✅ Test all features locally
2. ✅ Create some sample lists  
3. ✅ Try the mobile interface
4. ✅ When satisfied, deploy to Vercel with Vercel KV
5. ✅ Switch `.env.local` back to `USE_LOCAL_KV=true` for continued local dev

## 📚 More Info

- Full implementation details: `docs/LOCAL_STORAGE.md`
- Setup guide: `docs/SETUP.md`
- Main README: `README.md`

