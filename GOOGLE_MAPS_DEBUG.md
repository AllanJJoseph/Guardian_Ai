# Google Maps Debugging Guide - SafeNet

## 🔴 Google Maps Not Loading? Follow This Guide

### Step 1: Check Browser Console for Errors

1. Open your website in Chrome/Firefox
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. You'll see colored messages like:
   - 🟢 ✓ Green = Working
   - 🔴 ❌ Red = Errors (IMPORTANT!)

Look for messages like:
```
✓ Google Maps script loaded successfully
❌ Failed to load Google Maps API script
❌ API Key Error: VITE_GOOGLE_MAPS_API_KEY is not in .env file
```

### Step 2: Verify API Key in .env File

1. Open `.env` file in your project root
2. Check the line:
   ```
   VITE_GOOGLE_MAPS_API_KEY=AIzaSyC...
   ```
3. Make sure:
   - It's NOT empty
   - It starts with `AIzaSy` (all Google API keys start this way)
   - There are NO extra spaces before or after

**If empty or missing:**
- Go to https://console.cloud.google.com/apis/credentials
- Copy your API key
- Paste it in `.env` file

### Step 3: Check API Restrictions (MOST COMMON ISSUE)

Your API key probably works fine but has restrictions that block your localhost.

**Check if restrictions are the problem:**

1. Go to https://console.cloud.google.com/apis/credentials
2. Click on your API key
3. Look at **Application restrictions**:
   - Should show: ● HTTP referrers (web sites) 
   - Website restrictions box should have:
     ```
     http://localhost:5173/*
     http://127.0.0.1:5173/*
     ```

**If NOT set correctly:**

1. Click the dropdown and select: **HTTP referrers (web sites)**
2. In the text box, paste:
   ```
   http://localhost:5173/*
   http://127.0.0.1:5173/*
   ```
3. Click **SAVE**
4. **WAIT 5-10 MINUTES** for changes to apply
5. Hard refresh browser: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)

### Step 4: Restart Development Server

After making any changes to `.env` or Google Cloud settings:

```bash
# Stop the dev server (Ctrl+C in terminal)
# Then:
npm run dev
```

### Step 5: Test Google Maps Step by Step

Follow this exact sequence:

1. Go to http://localhost:5173/missing-persons
2. Click on ANY missing person card
3. A detail modal pops up
4. Look for the green **"Get Directions"** button
5. Click it
6. A popup will ask: "Allow this site to access your location?"
   - Click **ALLOW**
7. The map should appear with directions

**If map doesn't appear:**
- Check browser console (F12) for red error messages
- Continue to "Step 6: Decode Error Messages" below

### Step 6: Decode Error Messages

Copy the error message from browser console and check what it means:

#### Error: "Could not find Maps instance"
- **Cause**: Google Maps API not loaded yet
- **Fix**: 1. Wait 5 seconds - the map is still loading
          2. If still nothing, restart dev server (Stop with Ctrl+C, run npm run dev)
          3. Clear browser cache (Ctrl+Shift+R)

#### Error: "Geolocation is not supported by this browser"
- **Cause**: Browser doesn't support geolocation
- **Fix**: Update to modern browser (Chrome, Firefox, Safari, Edge)
           Or use HTTPS (if not using localhost)

#### Error: "User denied permission"
- **Cause**: You clicked "Block" when browser asked for location
- **Fix**: 1. In browser address bar, click the lock/refresh icon
           2. Look for location/geolocation permission
           3. Change to "Allow"
           4. Refresh page and try again

#### Error: "Distance Matrix request failed: REQUEST_DENIED"
- **Cause**: Distance Matrix API not enabled OR restrictions blocking
- **Fix**: 1. Go to https://console.cloud.google.com/apis/library
           2. Search "Distance Matrix API"
           3. Click "ENABLE" if not already enabled
           4. Check HTTP referrer restrictions

#### Error: "Failed to load Google Maps API"
- **Check in this order:**
  1. API key in `.env` file is correct?
  2. API key restrictions allow `http://localhost:5173/*`?
  3. In Google Cloud Console - all 4 APIs enabled?
     ```
     ☑ Google Maps JavaScript API
     ☑ Directions API
     ☑ Distance Matrix API
     ☑ Places API
     ```
  4. No billing/quota issues on Google Cloud account?

### Step 7: Complete Checklist (Copy & Use)

```
TROUBLESHOOTING CHECKLIST
========================

API KEY SETUP:
☐ API key is in .env file
☐ API key is not empty (starts with "AIzaSy")
☐ No extra spaces before/after API key in .env

GOOGLE CLOUD SETUP:
☐ All 4 APIs are ENABLED
   ☐ Google Maps JavaScript API
   ☐ Directions API
   ☐ Distance Matrix API
   ☐ Places API

RESTRICTIONS:
☐ Application restrictions set to: HTTP referrers (web sites)
☐ Website restrictions include: http://localhost:5173/*
☐ Website restrictions include: http://127.0.0.1:5173/*

SERVER & BROWSER:
☐ Dev server running: npm run dev
☐ Browser cache cleared: Ctrl+Shift+R
☐ Using modern browser (Chrome, Firefox, Safari, Edge)

Testing:
☐ Visit http://localhost:5173/missing-persons
☐ Click on a person card
☐ Click "Get Directions" button (green)
☐ Click "ALLOW" when location permission asked
☐ Map appears with directions? ✓ SUCCESS!
```

### Step 8: Advanced Debugging

Open browser console (F12) and look for DETAILED messages:

You should see lines like:
```
🔑 Google Maps API Key Status: ✓ Set
📍 Loading Google Maps script...
✓ Google Maps script loaded successfully
📍 Requesting user location permission...
✓ Location obtained: { lat: 28.6304, lng: 77.2177 }
```

**If you DON'T see these messages:**
- Your API key might be wrong
- Or the .env file wasn't properly reloaded
- Solution: Restart dev server again

### Step 9: Nuclear Option - Deep Clean

If nothing works, do this:

```bash
# 1. Delete node_modules and cache
rm -r node_modules package-lock.json
# or on Windows:
rmdir /s /q node_modules

# 2. Reinstall everything
npm install

# 3. Delete .env and recreate it
# (Go to https://console.cloud.google.com/apis/credentials, copy API key)
# Use notepad to create .env with:
# VITE_GOOGLE_MAPS_API_KEY=your_api_key_here

# 4. Start fresh
npm run dev
```

### Step 10: Still Not Working? Check This

1. **Is your API key valid?**
   - Go to https://console.cloud.google.com/
   - Click on your project name at top
   - Check "Quotas" to see if you have free requests available

2. **Are you hitting API quota limits?**
   - Go to https://console.cloud.google.com/apis/dashboard
   - Look for "Google Maps JavaScript API"
   - Check if "Requests" shows high numbers

3. **Is your Google Cloud account in good standing?**
   - Check if you need to add a billing method
   - Go to Billing section in Google Cloud

4. **Try with a DIFFERENT browser**
   - Maybe it's a browser cache issue
   - Try Chrome if using Firefox, or vice versa

### Common URL Mistakes

❌ Your restrictions should NOT look like:
```
http://localhost:5173      ← Wrong, missing /*
localhost:5173/*           ← Wrong, missing http://
https://localhost:5173/*   ← Wrong, should be http:// for local
http://localhost/          ← Wrong, wrong port
```

✓ Your restrictions SHOULD look like:
```
http://localhost:5173/*
http://127.0.0.1:5173/*
```

---

## Getting Help

If you're still stuck, provide me with:

1. **Console errors** - Copy all red/pink text from browser console (F12)
2. **Screenshot** of restrictions page (https://console.cloud.google.com/apis/credentials)
3. **What you see** when you click "Get Directions"

Then I can debug the specific issue!
