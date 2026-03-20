# Guardian AI - Project Context & Feature Roadmap

This document outlines the core requirements and feature status for the Guardian AI platform.

## 🛡️ Core Mission
Guardian AI is a specialized intelligence platform designed to help NGOs and law enforcement locate missing persons through advanced AI, facial recognition, and spatial analytics.

## 🚀 Feature Checklist (Non-Negotiable)

### 1. Missing Person Management
- [x] **Report Missing Person**: Add photo, name, crucial details, last seen location.
- [x] **Browse Nearby Cases**: Map radius view.
- [x] **Report Sighting**: Civilian reports with photos/locations.

### 2. Intelligence & AI Scanner
- [x] **Multi-File Scanning**: Support for batch uploading images/simulated CCTV videos.
- [x] **AI Detection**: TensorFlow.js-powered matching.
- [x] **Location Plotting**: Discovered sightings on a tracking map.
- [x] **Search Radius Prediction**: AI-driven radius prediction once identity is confirmed.
- [ ] **Persistent Results**: Scan history must be saved and retrievable by NGOs/Police.

### 3. Emergency & SOS Response
- [x] **SOS Trigger**: Mobile/Web SOS alert system.
- [x] **Instant Notifications**: NGO/Police dashboards receive immediate popup alerts.
- [x] **Deep Linking**: "Get Directions" button redirects directly to Google Maps.
- [ ] **Hardware Hook (Mobile)**: Simulation for SOS trigger via volume buttons.

### 4. Branding & UX
- [x] **Professional Branding**: Name changed to "Guardian AI" throughout.
- [ ] **Aesthetic UI**: Professional top menu bar arrangement and high-quality logo integration.
- [x] **Dynamic Animations**: Seamless transitions.

### 5. Integration & Sync
- [x] **Flawless Sync**: Real-time coordination between Mobile and Web.
- [x] **Persistent Storage**: All sightings, reports, and scans saved in Firestore.
