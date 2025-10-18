# Clerk Authentication Setup Guide

## 🎯 Overview
This app now uses Clerk for authentication, enabling:
- Secure user authentication across multiple devices
- Cross-subdomain SSO (single sign-on)
- Professional auth UI out of the box

## 📋 Setup Steps

### 1. Get Your Clerk API Keys

1. Go to https://dashboard.clerk.com
2. Select your application (or create a new one)
3. Go to **API Keys** in the sidebar
4. Copy your keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

### 2. Configure Environment Variables

Create/update `.env.local` in your project root:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Optional: Customize Clerk redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Existing environment variables
USE_LOCAL_KV=true
```

### 3. Configure Cross-Subdomain Authentication

For authentication to work across subdomains (e.g., `app1.yourdomain.com`, `app2.yourdomain.com`):

1. In Clerk Dashboard, go to **Domains**
2. Add your production domain (e.g., `yourdomain.com`)
3. Clerk will automatically handle authentication across all subdomains

On Vercel:
- Deploy each app to its own subdomain
- Clerk will manage sessions across all of them automatically
- Users sign in once and stay signed in everywhere

### 4. Create Sign-In and Sign-Up Pages

Create `/src/app/sign-in/[[...sign-in]]/page.tsx`:
```tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <SignIn />
    </div>
  )
}
```

Create `/src/app/sign-up/[[...sign-up]]/page.tsx`:
```tsx
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <SignUp />
    </div>
  )
}
```

## 🚀 What's Changed

### Authentication Flow
- **Before**: Cookie-based tokens, manual identity management
- **After**: Clerk handles all authentication automatically

### User Identity
- Users now have persistent Clerk IDs across all devices
- No more manual token sharing needed
- Profile information (name, email, avatar) from Clerk

### Cross-Device & Cross-Subdomain
- Sign in once, stay signed in everywhere
- Works across all your subdomains automatically
- Managed centrally through Clerk dashboard

## 📱 Testing

1. Run your development server: `npm run dev`
2. Visit your app
3. Click sign in - you'll see Clerk's auth UI
4. Create an account or sign in
5. Join a list - your Clerk identity is used automatically
6. Open the same list on another device/browser
7. Sign in with the same Clerk account
8. You'll see the same identity and ratings!

## 🌐 Production Deployment (Vercel + Subdomains)

1. Deploy your apps to Vercel subdomains:
   - `app1.yourdomain.com`
   - `app2.yourdomain.com`

2. In Clerk Dashboard:
   - Add `yourdomain.com` as your production domain
   - Clerk automatically handles auth for all subdomains

3. Users can:
   - Sign in on `app1.yourdomain.com`
   - Navigate to `app2.yourdomain.com`
   - Already be signed in automatically!

## 🔧 Customization

### Styling
Clerk components match your app's theme automatically. For advanced customization:
- https://clerk.com/docs/components/customization/overview

### User Data
Access user information in server actions:
```typescript
import { currentUser } from '@clerk/nextjs/server'

const user = await currentUser()
console.log(user?.firstName, user?.lastName, user?.emailAddresses)
```

### Client-Side
```typescript
import { useUser } from '@clerk/nextjs'

const { user, isSignedIn } = useUser()
```

## 📚 Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Integration](https://clerk.com/docs/quickstarts/nextjs)
- [Cross-Subdomain SSO](https://clerk.com/docs/deployments/domains)

