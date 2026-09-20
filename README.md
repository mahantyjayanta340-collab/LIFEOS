# LIFEOS — Personal Life Operating System (PWA)

A fast, zero-dependency, offline-first Progressive Web Application (PWA) that converts long-term ambitions into daily execution through sustainable gamification and behavioral telemetry.

Designed to be hosted directly on **GitHub Pages** with zero build steps or server dependencies.

---

## ⚡ Key Highlights
- **Lightning Fast & Lightweight:** Pure modern HTML5, CSS3, and ES6 JavaScript. Zero heavy node modules or bundlers required to run.
- **100% Offline-First PWA:** Bundles a complete Service Worker (`sw.js`) and Web App Manifest (`manifest.json`) for instant offline caching, standalone mobile installation, and desktop app support.
- **Zero Data Leakage:** All state is persisted directly in client-side `localStorage` with full JSON Export/Import backup controls.
- **Core Loop:**
  - **Today Command Center:** Dynamic daily progress percentage, focus task queue, daily habits, and routine sequencer.
  - **Quests Lineage Tree:** Visual hierarchy from Life Goals &rarr; Milestones &rarr; Projects &rarr; Tasks.
  - **Deep Work Engine:** Integrated focus block stopwatch/timer with energy state tracking.
  - **8-Axis Character Attributes & Radar Chart:** Dynamic HTML5 Canvas radar chart tracking Knowledge, Technical, Fitness, Discipline, etc.
  - **Non-Punitive Momentum Vector:** Mathematical momentum decay and recovery quests instead of streak guilt.
  - **User-Defined Reward Store:** Internal Coin economy to redeem real-world treats.
  - **Weekly System Review:** Sunday review wizard with friction attribution and capacity calibration.

---

## 🚀 How to Deploy to GitHub Pages in 2 Minutes

### Option A: Using the GitHub Web Interface (No Git CLI Needed)
1. Go to [GitHub](https://github.com) and click **New Repository**.
2. Name the repository `lifeos` (or your preferred name) and ensure it is set to **Public**.
3. In the repository page, click **Upload files**.
4. Drag and drop all the files from this directory:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `manifest.json`
   - `sw.js`
   - The `icons/` folder (`icon-192.png`, `icon-512.png`, `favicon.png`)
5. Click **Commit changes**.
6. Go to **Settings** &rarr; **Pages** (in the left sidebar).
7. Under **Branch**, select `main` (or `master`) and the `/ (root)` folder, then click **Save**.
8. Within 60 seconds, your site will be live at:
   `https://<your-username>.github.io/lifeos/`

---

### Option B: Using Git Command Line
```bash
# Initialize git repository
git init -b main

# Add all files
git add .
git commit -m "feat: initial LIFEOS PWA release"

# Link to your remote GitHub repository
git remote add origin https://github.com/<your-username>/lifeos.git
git push -u origin main
```
Then navigate to **Settings &rarr; Pages &rarr; Source &rarr; Deploy from branch (`main` / root)**.

---

## 📱 How to Install as a Native App (PWA)

### On Android (Chrome / Brave / Edge)
1. Open the deployed GitHub Pages URL in your mobile browser.
2. Tap the browser menu (`⋮`) or the banner prompt **"Add LIFEOS to Home screen"** / **"Install App"**.
3. LIFEOS will install as a standalone app with its own icon, full-screen viewport, and instant offline access.

### On iOS (Safari)
1. Open the URL in Safari.
2. Tap the **Share** icon (the square with an arrow pointing up).
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add**. It will launch without browser URL bars or navigation clutter.

### On Desktop (Chrome / Brave / Edge)
1. In the browser address bar, click the **Install LIFEOS** icon on the right side.
2. LIFEOS will run in an isolated desktop window with native OS window controls.

---

## 🛠️ Data Management
- **Backup:** In the **Settings** tab, click **Export Data (JSON Backup)** at any time.
- **Restore:** Click **Import Data** to restore previous backups on any browser or device.
- **Reset:** Click **Reset to Demo Seeds** to reset the data model to initial defaults.
