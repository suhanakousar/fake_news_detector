# Firebase OAuth Setup for Render

## 🐛 Issue

Your Render domain `truthlens-4t56.onrender.com` is not authorized in Firebase, causing OAuth errors:

```
Firebase: Error (auth/unauthorized-domain)
```

## ✅ Solution: Add Render Domain to Firebase

### Step 1: Go to Firebase Console

1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your project

### Step 2: Navigate to Authentication Settings

1. Click **"Authentication"** in the left sidebar
2. Click **"Settings"** tab
3. Scroll down to **"Authorized domains"** section

### Step 3: Add Your Render Domain

1. Click **"Add domain"** button
2. Enter your Render domain: `truthlens-4t56.onrender.com`
3. Click **"Add"**

### Step 4: Verify

Your authorized domains should now include:
- `localhost` (default)
- `truthlens-4t56.onrender.com` (your Render domain)
- Any other domains you've added

## 📝 Important Notes

### Domain Format

- ✅ **Correct**: `truthlens-4t56.onrender.com` (no `https://` or trailing slash)
- ❌ **Wrong**: `https://truthlens-4t56.onrender.com`
- ❌ **Wrong**: `truthlens-4t56.onrender.com/`

### Multiple Environments

If you have multiple Render services (staging, production), add each domain:

- `truthlens-staging.onrender.com`
- `truthlens-production.onrender.com`
- `truthlens-4t56.onrender.com` (your current one)

### Custom Domain

If you set up a custom domain later (e.g., `truthlens.com`), add that too.

## 🔄 After Adding Domain

1. **No code changes needed** - Firebase will automatically allow OAuth from the new domain
2. **Test immediately** - Try Google/Facebook login again
3. **May take a few seconds** - Changes can take 1-2 minutes to propagate

## ✅ Verification

After adding the domain, you should see:
- ✅ No more `auth/unauthorized-domain` errors
- ✅ Google OAuth popup works
- ✅ Facebook OAuth works (if configured)
- ✅ Firebase authentication succeeds

## 🚨 Common Issues

### Still Getting Errors?

1. **Check domain spelling** - Must match exactly (case-sensitive)
2. **Wait a few minutes** - Firebase may need time to propagate
3. **Clear browser cache** - Old errors might be cached
4. **Check Firebase project** - Make sure you're editing the correct project

### Multiple Projects?

If you have multiple Firebase projects:
- Make sure you're adding the domain to the **correct project**
- Check your `.env` file has the right Firebase config
- Verify `FIREBASE_PROJECT_ID` matches the project you're editing

---

**After adding the domain, OAuth should work immediately!** 🎉

