# Setup Guide for Family Top 10

## Quick Start for Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Choose Your Storage Backend

You have two options for local development:

#### Option A: Local File-Based Storage (No Vercel Account Needed)

Perfect for quick testing without any external dependencies!

1. Copy the example environment file:
```bash
cp .env.local.example .env.local
```

2. The file already has `USE_LOCAL_KV=true` set, so you're good to go!

3. Data will be stored in `.local-kv-data.json` (automatically created)

#### Option B: Vercel KV Database

#### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Link your project:
```bash
vercel link
```

3. Create a KV database:
```bash
vercel kv create
```

4. Pull environment variables:
```bash
vercel env pull .env.local
```

#### Option B2: Manual Vercel KV Setup

1. Go to your Vercel dashboard
2. Create a new KV database (Storage → KV → Create)
3. Copy the environment variables
4. Update `.env.local` file in the project root:

```bash
# Set this to false to use Vercel KV
USE_LOCAL_KV=false

# Add your Vercel KV credentials
KV_REST_API_URL=https://your-kv-instance.kv.vercel-storage.com
KV_REST_API_TOKEN=your-token-here
KV_REST_API_READ_ONLY_TOKEN=your-read-only-token-here
```

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### First Time Deployment

1. Push code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Vercel will auto-detect Next.js
5. Add environment variables (if not already linked):
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`
6. Click "Deploy"

### Subsequent Deployments

Just push to your main branch - Vercel will auto-deploy!

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `USE_LOCAL_KV` | Set to `true` for local file storage, `false` for Vercel KV | No (defaults to Vercel KV) |
| `KV_REST_API_URL` | Vercel KV REST API endpoint | Only if `USE_LOCAL_KV=false` |
| `KV_REST_API_TOKEN` | Vercel KV authentication token | Only if `USE_LOCAL_KV=false` |
| `KV_REST_API_READ_ONLY_TOKEN` | Read-only token (optional) | No |

## Troubleshooting

### "Failed to create list" error

- Check that KV environment variables are set correctly
- Ensure Vercel KV database is created and accessible
- Check the browser console for detailed error messages

### Lists not persisting between restarts

- In development, make sure `.env.local` exists with valid KV credentials
- In production, verify environment variables are set in Vercel dashboard

### Users can't join lists

- Ensure cookies are enabled in the browser
- Check that the list ID in the URL is valid
- Verify server actions are working (check browser network tab)

## Development Tips

### Test with Multiple Users

Open the app in different browsers or incognito windows to simulate multiple users.

### Reset Data

**For Local KV:**
Simply delete the data file:
```bash
rm .local-kv-data.json
```

**For Vercel KV:**
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Connect to your KV instance
vercel kv connect

# In the KV CLI, use FLUSHALL to clear all data
FLUSHALL
```

### Switching Between Local and Vercel KV

Simply change the `USE_LOCAL_KV` environment variable:

```bash
# In .env.local

# For local file storage:
USE_LOCAL_KV=true

# For Vercel KV:
USE_LOCAL_KV=false
```

The app will automatically use the appropriate storage backend on next restart.

### Data File Location

When using local KV, data is stored in `.local-kv-data.json` in the project root. This file:
- Is automatically created on first run
- Is updated whenever data changes
- Is in `.gitignore` (not committed)
- Can be deleted to reset all data

## Architecture Notes

- **No Authentication**: Users are identified by cookies per-list
- **Data Storage**: All data stored in Vercel KV (Redis)
- **Server Actions**: All mutations happen via Next.js server actions
- **Real-time Updates**: Page refreshes after mutations to show latest data

## Security Considerations

- Owner tokens are stored in HTTP-only cookies
- All mutations require valid user/owner identity
- No sensitive data should be stored (this is for family fun!)
- Lists are accessible to anyone with the link

## Features to Consider Adding

- [ ] Email/SMS reminders for family members to vote
- [ ] Export list as image or PDF
- [ ] Comments on items
- [ ] Vote history tracking
- [ ] Custom minimum vote thresholds
- [ ] Dark mode support
- [ ] List templates (common criteria sets)

