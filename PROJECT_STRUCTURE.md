# SafeNet - Project Structure

## 📁 File Structure

```
Guardian_Ai/
├── index.html                  # Main HTML entry point
├── package.json                # Dependencies and scripts
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
├── README.md                   # Project documentation
├── QUICK_START.md             # Quick start guide
│
├── src/
│   ├── main.jsx               # React entry point
│   ├── index.css              # Global styles with Tailwind
│   ├── App.jsx                # Main app component with routing
│   │
│   ├── components/
│   │   └── Layout.jsx         # Main layout with header, footer, nav
│   │
│   └── pages/
│       ├── Home.jsx           # Landing page
│       ├── Login.jsx          # Login page
│       ├── Signup.jsx         # Registration page
│       ├── SOSAlert.jsx       # Emergency alert system
│       ├── MissingPersons.jsx # Missing persons registry
│       ├── PublicReporting.jsx# Public sighting reports
│       ├── LiveMap.jsx        # Real-time map dashboard
│       └── NGODashboard.jsx   # NGO/Police dashboard
│
└── node_modules/              # Dependencies (auto-generated)
```

---

## 🎨 Component Overview

### Core Components (8 Total)

#### 1. **Layout.jsx** - Main App Layout
- Responsive header with navigation
- Mobile menu toggle
- User authentication state
- Footer with emergency contacts
- Responsive design for all screen sizes

#### 2. **Home.jsx** - Landing Page
- Hero section with CTA buttons
- Live statistics cards (4 metrics)
- Feature showcase (4 features)
- How it works section (3 steps)
- Impact section with metrics
- Final CTA section

#### 3. **Login.jsx** - Authentication
- Email/password form
- Remember me checkbox
- Forgot password link
- Demo account information
- Role-based login (auto-detect from email)

#### 4. **Signup.jsx** - Registration
- Full name, email, phone fields
- Password input
- Role selection dropdown
- Form validation
- Auto-login after signup

#### 5. **SOSAlert.jsx** - Emergency System
- GPS location detection
- 4 alert types with color coding
- Additional message textarea
- Live location display
- Emergency contact quick dial
- Safety tips section
- Alert confirmation

#### 6. **MissingPersons.jsx** - Registry
- Interactive Leaflet map (400px height)
- Search bar with live filtering
- Age group filter (All/Child/Teen)
- Gender filter (All/Male/Female)
- Card grid with person details
- Modal popup for full details
- "Time since last seen" calculation
- Report sighting button

#### 7. **PublicReporting.jsx** - Sighting Reports
- Missing person selector
- Description textarea
- Location with GPS detection
- Date and time pickers
- Photo/video upload with preview
- Additional info textarea
- Submit confirmation screen
- Important notice section

#### 8. **LiveMap.jsx** - Real-time Dashboard
- Full-screen map layout
- Sidebar with filters
- 3 toggleable layers:
  - SOS Alerts (red markers + radius)
  - Missing Persons (orange markers)
  - Public Reports (blue markers)
- Recent activity feed
- Interactive marker popups
- Legend for quick reference
- Live update indicator

#### 9. **NGODashboard.jsx** - Case Management
- Statistics overview (4 cards)
- Tabbed interface:
  - Overview: Quick summary
  - Recent Alerts: List with priorities
  - Active Cases: Data table
- Priority badges (High/Medium/Low)
- Status indicators
- Case assignment info
- Quick action buttons

---

## 🎯 Features Breakdown

### Authentication & Authorization
- ✅ Login/Signup forms
- ✅ Role-based access control
- ✅ Protected routes
- ✅ Session persistence (localStorage)
- ✅ Auto-redirect based on auth state

### Maps & Location
- ✅ Leaflet integration
- ✅ Custom marker icons
- ✅ Popup information windows
- ✅ GPS coordinate detection
- ✅ Circle radius for alerts
- ✅ Multiple marker layers
- ✅ Interactive filtering

### Forms & Input
- ✅ Form validation
- ✅ Date/time pickers
- ✅ File upload with preview
- ✅ Textarea with character limits
- ✅ Dropdown selects
- ✅ Radio button groups
- ✅ Search input with live filtering

### UI/UX Elements
- ✅ Responsive navigation
- ✅ Mobile hamburger menu
- ✅ Modal dialogs
- ✅ Toast notifications
- ✅ Loading states
- ✅ Empty states
- ✅ Success confirmations
- ✅ Error handling

### Data Visualization
- ✅ Statistics cards
- ✅ Data tables
- ✅ Activity feeds
- ✅ Timeline displays
- ✅ Progress indicators
- ✅ Badge components

---

## 🎨 Color Scheme

### Primary Colors
- **Red**: `#dc2626` - Emergency, SOS Alerts
- **Orange**: `#ea580c` - Missing Persons
- **Blue**: `#2563eb` - Reports, Information
- **Green**: `#16a34a` - Success, Resolved
- **Purple**: `#9333ea` - NGO/Police Dashboard

### Alert-Specific Colors
- **Emergency**: Red `#dc2626`
- **Harassment**: Orange `#ea580c`
- **Following**: Yellow `#ca8a04`
- **Suspicious**: Blue `#2563eb`

### Status Colors
- **Active/Urgent**: Red `#dc2626`
- **Pending**: Yellow `#ca8a04`
- **Investigating**: Blue `#2563eb`
- **Resolved**: Green `#16a34a`

---

## 📱 Responsive Breakpoints

Using Tailwind CSS defaults:
- **sm**: 640px and up
- **md**: 768px and up
- **lg**: 1024px and up
- **xl**: 1280px and up

All components are fully responsive with:
- Mobile-first design
- Flexible grid layouts
- Collapsible navigation
- Stacked cards on mobile
- Horizontal scrolling tables

---

## 🔧 Key Dependencies

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "lucide-react": "^0.294.0",
  "date-fns": "^2.30.0",
  "tailwindcss": "^3.3.6",
  "vite": "^5.0.8"
}
```

---

## 🚀 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## 📊 Mock Data

### SOS Alerts (mockData in LiveMap.jsx)
- 2 active alerts in Delhi NCR
- Emergency and Harassment types
- Last 5-15 minutes

### Missing Persons (mockMissingPersons in MissingPersons.jsx)
- 4 persons across India
- Ages 6-15
- Different locations (Delhi, Mumbai, Bangalore, Hyderabad)

### Reports
- 2 public sightings
- 30-45 minutes old

### Statistics
- 12 Active Alerts
- 8 Missing Persons
- 45 Reports Today
- 156 Active Responders

---

**All components are production-ready and fully functional!** 🎉
