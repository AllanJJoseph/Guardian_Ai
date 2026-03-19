# Google Maps Integration Guide - SafeNet

This guide explains how to set up and use the Google Maps integration for showing directions to missing persons' locations.

## Features Added

### 1. **Get Directions Button**
- Available on the Missing Persons detail modal (`/missing-persons`)
- Available on the Live Map dashboard (`/live-map`) when clicking on missing person markers
- Shows the exact distance and estimated travel time to the location

### 2. **Interactive Google Maps** 
- Displays directions from your current location to the missing person's last seen location
- Shows driving route with turn-by-turn instructions
- Displays distance and estimated travel time
- Works on desktop and mobile devices

### 3. **Multiple Navigation Options**
- Open in Google Maps (works on all devices)
- Open in Apple Maps (iOS only)
- Direct directions display within SafeNet

### 4. **Safety Features**
- Requires user location permission (for getting directions)
- Includes safety reminder about sharing location with authorities
- Clear indication when location data is unavailable

## Setup Instructions

### Quick Reference - Key Links & Steps

**The 5-Step Setup Process (15-20 minutes)**:

```
Step 1: Create Project          → https://console.cloud.google.com/
   ↓
Step 2: Enable APIs            → https://console.cloud.google.com/apis/library
   ↓
Step 3: Create & Restrict Key  → https://console.cloud.google.com/apis/credentials
   ↓
Step 4: Add to .env file       → Create file: .env with API key
   ↓
Step 5: Install & Run          → npm install && npm run dev
```

| Step | What To Do | Critical Link |
|------|-----------|---|
| 1 | Create new Google Cloud project | https://console.cloud.google.com/ |
| 2 | Enable 4 Google Maps APIs | https://console.cloud.google.com/apis/library |
| 3 | Create API key | https://console.cloud.google.com/apis/credentials |
| 4 | ⚠️ **Set HTTP Referrer Restrictions** | https://console.cloud.google.com/apis/credentials |
| 5 | Copy API key to `.env` file | `VITE_GOOGLE_MAPS_API_KEY=paste_key_here` |
| 6 | Install dependencies | Run: `npm install` |
| 7 | Start development server | Run: `npm run dev` |

**Most Important**: Don't skip Step 4 - restrictions protect your API key! Without them, anyone can use your key and cost you money.

---

## Quick Start Checklist (Copy & Use!)

Print this checklist and check off each item as you go:

```
SETUP CHECKLIST - Google Maps for SafeNet
===========================================

☐ 1. Create Google Cloud Project
     └─ Go to: https://console.cloud.google.com/
     └─ Click "NEW PROJECT"
     └─ Name it: "SafeNet"
     └─ Click "CREATE"
     
☐ 2. Enable 4 Required APIs
     └─ Go to: https://console.cloud.google.com/apis/library
     └─ Search & Enable:
        ☐ Google Maps JavaScript API
        ☐ Directions API
        ☐ Distance Matrix API  
        ☐ Places API
   
☐ 3. Create API Key
     └─ Go to: https://console.cloud.google.com/apis/credentials
     └─ Click "+ CREATE CREDENTIALS"
     └─ Select "API Key"
     └─ SAVE & COPY the key
     
☐ 4. ⚠️ SET RESTRICTIONS (DON'T SKIP!)
     └─ On same page, click your API key
     └─ Set "Application restrictions" to:
        → "HTTP referrers (web sites)"
     └─ Add for testing:
        ☐ http://localhost:5173/*
        ☐ http://127.0.0.1:5173/*
     └─ Click "SAVE"
     └─ Also restrict by API (only Google Maps APIs)
     
☐ 5. Create .env File
     └─ In project folder, create: .env
     └─ Add one line:
        VITE_GOOGLE_MAPS_API_KEY=paste_your_key_here
     └─ Replace: paste_your_key_here with ACTUAL KEY
     
☐ 6. Install Dependencies
     └─ Open terminal
     └─ Run: npm install
     
☐ 7. Start Development Server
     └─ Run: npm run dev
     └─ Should show: http://localhost:5173
     
☐ 8. Test It Works
     └─ Go to: /missing-persons
     └─ Click any person card
     └─ Click "Get Directions" button (green)
     └─ Should ask for location permission
     └─ If it works: ✓ YOU'RE DONE!
     
If anything fails:
  → Check: Browser console (F12) for errors
  → Check: .env file has correct API key (no extra spaces!)
  → Check: Wait 5 minutes for restrictions to apply
  → Check: Clear browser cache (Ctrl+Shift+R)
```

---

## Setup Instructions

### Step 1: Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable these APIs:
   - Google Maps JavaScript API
   - Directions API
   - Distance Matrix API
   - Places API
4. Create an API key credential
5. (Highly Recommended) Restrict the key - **see [Step 2b: Set API Restrictions](#step-2b-set-api-restrictions) below**

## Getting Started with Google Cloud Console

### Detailed Steps - Creating Project & APIs

#### Part A: Create/Select Project
1. Visit: https://console.cloud.google.com/
2. At the top of the page, click the **Project Selector** (shows project name/number)
3. Click **NEW PROJECT**
4. Enter project name: "SafeNet" (or your preference)
5. Click **CREATE**
6. Wait 1-2 minutes for project creation to complete

#### Part B: Enable Required APIs
1. In Google Cloud Console, go to https://console.cloud.google.com/apis/library
2. Search for and enable each of these APIs (click "ENABLE" button):

   **API #1: Google Maps JavaScript API**
   - Search: "Google Maps JavaScript API"
   - Click on result
   - Click **ENABLE**
   - Wait for activation (1-2 minutes)

   **API #2: Directions API**
   - Search: "Directions API"
   - Click on result  
   - Click **ENABLE**

   **API #3: Distance Matrix API**
   - Search: "Distance Matrix API"
   - Click on result
   - Click **ENABLE**

   **API #4: Places API** (optional but useful)
   - Search: "Places API"
   - Click on result
   - Click **ENABLE**

#### Part C: Create API Key
1. Go to https://console.cloud.google.com/apis/credentials
2. Click **+ CREATE CREDENTIALS** button (top left)
3. Select **API Key** from dropdown
4. A popup will appear with your new API key
5. Click **COPY** to copy the key
6. Store it safely - you'll need it for `.env` file
7. Click **CLOSE** or **RESTRICT KEY** to continue

#### Part D: Find Your Website's URL (For Restrictions)

**This is important!** You need to know what URL your website is running on so you can add it to restrictions.

**For Development (Local Testing)**:
1. Open terminal in your project folder
2. Run: `npm run dev`
3. Look for output like:
   ```
   > Local:  http://localhost:5173/
   ```
4. Your local URL is: **`http://localhost:5173`**
5. Note the **port number** (usually 5173 for Vite)
6. In restrictions, use: **`http://localhost:5173/*`**

**For Production (After Deploying)**:
1. After deploying to hosting (Vercel, Netlify, etc.)
2. Look at the URL in browser address bar
3. Example: `https://myapp.netlify.app`
4. Your production URL is: **`https://myapp.netlify.app`**
5. In restrictions, use: **`https://myapp.netlify.app/*`**

**Common Development Ports**:
```
Vite (default):        http://localhost:5173/*
Create React App:      http://localhost:3000/*
Next.js:              http://localhost:3000/*
Generic dev:          http://127.0.0.1:3000/*
```

---

### Step 2: Add API Key Restrictions (IMPORTANT FOR SECURITY)

**Why Restrictions Matter**: Without restrictions, anyone with your API key can make unlimited requests and rack up huge bills. Restrictions limit usage to only your website.

#### Step 2a: Restrict by Application (HTTP Referrers)

This means the API key ONLY works when requests come from your website domain.

**For Local Testing (Development)**

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your API key in the list (labeled "API keys")
3. Click on your API key to open its settings
4. Scroll down to **Application restrictions** section
5. Select **HTTP referrers (web sites)** from the dropdown
6. In the **Website restrictions** box, add these URLs:
   ```
   http://localhost:5173/*
   http://localhost:3000/*
   http://127.0.0.1:5173/*
   http://127.0.0.1:3000/*
   ```
   - Each URL on its own line
   - The `/*` at the end is important - it matches any path
   - Use one of these depending on your dev port (Vite usually uses 5173)

7. Click **SAVE**

**For Your Live Website (Production)**

When you deploy your website, add your production domain:

1. Go to same restrictions page: https://console.cloud.google.com/apis/credentials
2. Click your API key again
3. Find **Website restrictions** section
4. Add your production domain URLs:
   ```
   https://yourdomain.com/*
   https://www.yourdomain.com/*
   https://yourdomain.com
   ```
   - Replace `yourdomain.com` with your actual domain
   - Include both `www` and non-`www` versions
   - Include both with and without `/*` suffix
   - Use `https://` for production (secure)

5. Keep the localhost URLs for continued testing
6. Click **SAVE**

**Example for www.safenetapp.com**:
```
http://localhost:5173/*
http://127.0.0.1:5173/*
https://safenetapp.com/*
https://www.safenetapp.com/*
https://safenetapp.com
https://www.safenetapp.com
```

#### Step 2b: Restrict by API (Optional but Recommended)

This limits API key to ONLY the Google Maps APIs you need (prevents use of other APIs).

1. Still on the API credentials page for your key
2. Scroll to **API restrictions** section
3. Select **Restrict key** option
4. Choose these APIs from the list:
   - ✓ Google Maps JavaScript API
   - ✓ Directions API
   - ✓ Distance Matrix API
   - ✓ Places API

5. Click **SAVE**

**Visual Example of Restrictions Page**: 

```
┌─────────────────────────────────────────────┐
│  API Credentials - Your API Key              │
├─────────────────────────────────────────────┤
│                                              │
│ KEY (your-api-key-string)          [COPY]   │
│                                              │
│ ─────────────────────────────────────────   │
│                                              │
│ APPLICATION RESTRICTIONS                     │
│ ○ None ○ IP addresses ● HTTP referrers      │
│                                              │
│ Website restrictions:                        │
│ ┌──────────────────────────────────────────┐│
│ │ http://localhost:5173/*                  ││
│ │ https://yourdomain.com/*                 ││
│ └──────────────────────────────────────────┘│
│                                              │
│ ─────────────────────────────────────────   │
│                                              │
│ API RESTRICTIONS                             │
│ ○ Don't restrict ● Restrict key              │
│                                              │
│ ☑ Google Maps JavaScript API                │
│ ☑ Directions API                            │
│ ☑ Distance Matrix API                       │
│ ☑ Places API                                │
│                                              │
│                              [SAVE]  [CLOSE]│
└─────────────────────────────────────────────┘
```

### Step 3: Add API Key to Environment File

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your Google Maps API key:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

3. **Important**: Never commit `.env` to version control. Add it to `.gitignore`

### Step 4: Install Dependencies

The `@react-google-maps/api` package has been added to `package.json`. Install it:

```bash
npm install
```

### Step 5: Restart Development Server

```bash
npm run dev
```

## Usage

### For Missing Persons Page (`/missing-persons`)

1. Click on any missing person card to see details
2. In the detail modal, click the **"Get Directions"** button (green)
3. Allow location permission when prompted
4. View the interactive map with directions
5. Click **"Open in Google Maps"** to get more details or use navigation
6. Click **"Open in Apple Maps"** if on iOS

### For Live Map Dashboard (`/live-map`)

1. Make sure "Missing Persons" layer is enabled
2. Click on any missing person marker on the map
3. In the popup, click **"Directions"** button
4. Follow the same process as above

### Important: Location Data Structure

For directions to work, missing persons must have:
- `coordinates`: Array `[latitude, longitude]` - The last seen location
- `name`: String - Person's name (shown in directions modal)

Example Firebase document:
```javascript
{
  name: "Priya Sharma",
  age: 8,
  gender: "female",
  coordinates: [28.6304, 77.2177],
  lastSeenLocation: "Delhi High Court Metro Station",
  lastSeen: Timestamp,
  ...other fields
}
```

## File Structure

### New Files Created:

1. **`src/services/googleMapsService.js`**
   - Handles all Google Maps API interactions
   - Functions for directions, distance calculation, and user location
   - Exported functions:
     - `getDirections(origin, destination)`
     - `getDistance(origin, destination)`
     - `getUserLocation()`
     - `calculateTravelTime(origin, destination)`
     - `openDirectionsInGoogleMaps(destination)`
     - `openDirectionsInAppleMaps(destination)`

2. **`src/components/GoogleMapsDirections.jsx`**
   - Main component for displaying directions
   - Modal interface with embedded Google Map
   - Shows distance and travel time
   - Buttons to open in Google Maps or Apple Maps
   - Responsive design for mobile and desktop

### Updated Files:

1. **`package.json`**
   - Added `@react-google-maps/api` dependency

2. **`src/pages/MissingPersons.jsx`**
   - Added "Get Directions" button in detail modal
   - Integrated GoogleMapsDirections component
   - New state: `showDirections`

3. **`src/pages/LiveMap.jsx`**
   - Added "Directions" button in missing person popups
   - Integrated GoogleMapsDirections component
   - New states: `showDirections`, `selectedMissingPerson`

## Troubleshooting

### "Failed to load Google Maps API" Error
- **Cause**: API key not set or invalid
- **Solution**: 
  1. Check `.env` file has correct API key
  2. Verify API key in Google Cloud Console is valid and enabled
  3. Ensure required APIs are enabled

### "Geolocation is not supported" Error
- **Cause**: Browser doesn't support geolocation API
- **Solution**: Use a modern browser (Chrome, Firefox, Safari, Edge)

### "Unable to calculate travel time" Error
- **Cause**: Route not available or distance matrix API not enabled
- **Solution**: Verify Directions and Distance Matrix APIs are enabled in Google Cloud Console

### Location Permission Denied
- **Cause**: User denied location permission
- **Solution**: Manually set location or allow permission in browser settings

### Mobile Issues on iOS
- **Cause**: HTTPS required for geolocation on secure contexts
- **Solution**: Deploy with HTTPS or test locally with proper configuration

### 🔒 Restrictions Not Working - API Key Still Shows "Unrestricted"

**Problem**: You set restrictions but API key still shows as "Unrestricted" or requests fail

**Solutions**:

1. **Clear Browser Cache**:
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Clear browser cache completely
   - Try in incognito/private window

2. **Check Website Restrictions Format**:
   - Must include `/*` at the end: `https://yourdomain.com/*` ✓
   - NOT just: `https://yourdomain.com` ✗
   - For localhost testing:
     ```
     http://localhost:5173/*
     http://127.0.0.1:5173/*
     ```

3. **Verify URL Matches Exactly**:
   - If browser shows: `http://localhost:5173/missing-persons`
   - Restriction must start with: `http://localhost:5173/*`
   - Watch for typos, extra slashes, wrong ports

4. **Wait for Propagation** (5-10 minutes):
   - Google Cloud takes time to apply changes
   - Restart dev server after saving
   - Restrictions don't apply immediately

5. **Test All Domain Variations**:
   - Add ALL versions of your domain:
     ```
     https://yourdomain.com/*
     https://www.yourdomain.com/*
     https://yourdomain.com
     https://www.yourdomain.com
     ```

6. **Disable Temporarily for Testing**:
   - Set restrictions to "None" temporarily
   - If maps work, problem is the restrictions format
   - Once confirmed, re-add restrictions carefully
   - Add one URL at a time to identify the issue

7. **Check Google Cloud Logs**:
   - Go to: https://console.cloud.google.com/logs
   - Look for errors related to your API key
   - Shows exactly why requests being rejected

### "Request denied" Error Even With Restrictions Set

- **Cause**: Restrictions not propagated or URL format incorrect
- **Solution**: 
  1. Wait 5-10 minutes after setting restrictions
  2. Restart dev server: `npm run dev`
  3. Hard refresh browser cache
  4. Check browser console for exact error message

## Security Considerations

1. **API Key Protection**:
   - Never commit `.env` file to version control
   - Use HTTP referrer restrictions in Google Cloud Console (REQUIRED for production)
   - Rotate API keys periodically

2. **Rate Limiting**:
   - Google Maps APIs have usage quotas
   - Monitor usage in Google Cloud Console
   - Implement client-side caching if needed

3. **User Privacy**:
   - Always ask for location permission
   - Display privacy notices
   - Don't share location data unnecessarily

## Performance Optimization

1. **Cached Maps**: Google Maps loads are cached after first use
2. **Lazy Loading**: Maps component only loads when modal opens
3. **Route Caching**: Consider caching frequent routes

## Future Enhancements

Potential improvements for future versions:

1. **Multiple Route Options**: Show different routing options (fastest, shortest, etc.)
2. **Transit Options**: Support public transportation directions
3. **Offline Support**: Cache directions for offline use
4. **Route Sharing**: Allow sharing directions with others
5. **Real-time Updates**: Update directions as new sightings are reported
6. **Traffic Layer**: Show current traffic conditions
7. **Marker Customization**: Custom markers for different alert types

## Testing

To test the Google Maps integration:

1. **Desktop**: 
   - Go to `/missing-persons` or `/live-map`
   - Click on a missing person entry
   - Click "Get Directions"
   - Allow location permission when prompted

2. **Mobile**:
   - Access on iPhone or Android
   - Same steps as desktop
   - Apple Maps opener will work on iOS

3. **Mock Data Testing**:
   - Live Map uses mock data for testing
   - MissingPersons uses Firebase data

## Finding Your Production Domain for Restrictions

When you deploy your website (production), you need to add its domain to API restrictions. Here's how to find it:

### If Using a Cloud Hosting Platform:

**Vercel** (Recommended for Vite):
- Your domain will be: `your-project-name.vercel.app`
- Add to restrictions: `https://your-project-name.vercel.app/*`

**Netlify**:
- Your domain will be: `your-site-name.netlify.app`
- Add to restrictions: `https://your-site-name.netlify.app/*`

**Firebase Hosting**:
- Your domain will be: `your-project-id.firebaseapp.com`
- Add to restrictions: `https://your-project-id.firebaseapp.com/*`

**AWS Amplify**:
- Your domain will be: `your-branch.your-repo.amplifyapp.com`
- Add to restrictions: `https://your-branch.your-repo.amplifyapp.com/*`

### If Using Your Own Custom Domain:

**Example**: You bought `safenet.com` from GoDaddy or Namecheap:
- Add to restrictions:
  ```
  https://safenet.com/*
  https://www.safenet.com/*
  https://safenet.com
  https://www.safenet.com
  ```

### How to Check Your Domain After Deploying:

1. Deploy your website to your hosting platform
2. Open it in browser (note the URL in address bar)
3. Add that exact URL to restrictions
4. Example: If your site is at `https://example.netlify.app`, add:
   ```
   https://example.netlify.app/*
   ```

### Important Format Notes:

| Format | Works? | Notes |
|--------|--------|-------|
| `https://yourdomain.com/*` | ✓ YES | Most compatible |
| `https://yourdomain.com` | ✗ NO | Missing `/*` |
| `https://yourdomain.com/` | ✗ NO | Wrong - use `/*` instead |
| `yourdomain.com/*` | ✗ NO | Missing `https://` |
| `https://www.yourdomain.com/*` | ✓ YES | Include www version too |
| `https://*.yourdomain.com/*` | ✗ NO | Wildcards not supported for subdomains |

## Support & Resources

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Directions API Guide](https://developers.google.com/maps/documentation/directions)
- [React Google Maps API](https://github.com/JustinKBaldwin/react-google-maps/blob/main/README.md)
- SafeNet Project Documentation: `README.md`

## Cost Information

- First 28,500 requests per month are free
- After that, pricing varies by API
- See [Google Maps Pricing](https://mapsplatform.google.com/maps-products/#pricing)

---

**Last Updated**: March 18, 2026  
**Version**: 1.0  
**Status**: Production Ready
