# Family Top 10

A lightweight, link-based web app where families (or small groups) can collaboratively build and rank "Top 10" lists asynchronously. No accounts, no logins—just shared participation.

## Features

- 🎯 **No Sign-ups Required** - Share a link, join with a display name, and start voting
- ⭐ **5-Star Rating System** - Rate items 1-5 stars on custom criteria
- 📱 **Mobile First** - Optimized for phones with large, friendly touch targets
- 🔄 **Real-time Rankings** - Watch the list update as votes come in
- 🔒 **Owner Controls** - Lock lists, remove items, and manage criteria
- 🎨 **Beautiful UI** - Clean, modern design with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ installed
- (Optional) A Vercel account if you want to use Vercel KV instead of local storage

### Quick Start (No Vercel Account Needed!)

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up local storage:

```bash
cp .env.local.example .env.local
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

That's it! The app will use local file-based storage (`.local-kv-data.json`) so you can test immediately without any external services.

### Using Vercel KV (Optional)

If you want to use Vercel KV instead:

1. Create a new KV database in your Vercel project dashboard
2. Update `.env.local`:

```bash
USE_LOCAL_KV=false
KV_REST_API_URL=your_kv_rest_api_url
KV_REST_API_TOKEN=your_kv_rest_api_token
KV_REST_API_READ_ONLY_TOKEN=your_kv_read_only_token
```

3. Restart the dev server

## How It Works

1. **Create a List** - Define a list name and custom rating criteria (e.g., Cost, Fun, Quality)
2. **Share the Link** - Send the generated link to family or friends
3. **Join & Add Items** - Others join with a display name and add items to rate
4. **Rate Items** - Everyone rates items 1-5 stars on each criterion (or marks "No experience")
5. **See Rankings** - Items are automatically ranked by average score

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Vercel KV
- **Deployment**: Vercel

## Project Structure

```
src/
├── actions/          # Server actions for data mutations
├── app/              # Next.js app router pages
│   ├── create/       # Create list page
│   ├── list/[id]/    # Individual list view
│   └── page.tsx      # Landing page
├── components/       # Reusable UI components
├── lib/              # Utilities and database functions
└── types/            # TypeScript type definitions
```

## Deploy on Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add your KV environment variables in the Vercel dashboard
4. Deploy!

The app will automatically use Vercel KV in production.

## Contributing

This is a personal project, but feel free to fork and customize for your own use!

## License

MIT
