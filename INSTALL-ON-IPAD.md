# Install Little Learner PH on an iPad

Little Learner PH is packaged as a Progressive Web App (PWA). Once hosted on an HTTPS site, it can be installed from Safari and opened from the iPad Home Screen like a normal app.

## Recommended free hosting
Use one of these free options:
- GitHub Pages
- Netlify
- Cloudflare Pages

Upload the contents of this folder to the host.

## Install on iPad
1. Open the hosted Little Learner PH link in Safari.
2. Tap the Share button (square with an up arrow).
3. Scroll and tap **Add to Home Screen**.
4. Keep the name **Little Learner PH** and tap **Add**.
5. An app icon will appear on the Home Screen.
6. Open it from the icon. It will launch in standalone/full-screen mode.

## Offline
After the first successful online load, the app caches its core files for offline use.

## Progress
Progress is stored locally on that iPad using browser storage. No paid backend is required.

## Native App Store version
A true .ipa/App Store app requires Xcode/macOS code signing and normally an Apple Developer account. The PWA version avoids those requirements while still behaving like an installed iPad app.
