# Release v1.1.0

## What's New

### 🚀 Features

* **Auto Update:** Added built-in auto-update functionality (`0f2a0b6`).
* **GUI Improvements:** Enhanced scrollbar aesthetics across the interface (`eae4bfd`).

### 🐛 Bug Fixes

* **Workload Lists:** Added scrolling and pagination for large workload lists to prevent off-screen rendering (#3, fixes #1) (`779ea9f`).
* **Theme Switching:** Automatically sync dark/light mode with OS-level theme changes (`939bc1c`).
* **Theme Selection:** Disabled the active/selected theme mode toggle (`cbadbaace`).
* **Intercept Dialog:** Prevented dialog re-renders during background watch operations (`447f8ac`).
* **UI Cleanups:**
* Updated email action button title (`cd11b08`).
* Removed obsolete `App.css` import (`738ce4f`).



### ⚙️ CI / Build Improvements

* Added release artifact compression (`08b50a8`).
* Added zip archive support for Windows build pipelines (`2dd2164`, `77a1056`).
* Cleaned up redundant installer configs (`a8515fa`).