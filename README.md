# Little Learner PH

A simple iPad-friendly Progressive Web App for kindergarten learning.

## Included
- English reading mini-games
- Filipino reading / pantig activities
- Basic Math
- Reading comprehension stories
- Thinking and pattern games
- Text-to-speech instructions
- Parent dashboard
- Local progress saving
- Offline-ready service worker
- No paid backend required

## Run locally
For testing on a computer, use a simple local web server:

Python:
    python -m http.server 8000

Then open:
    http://localhost:8000

## iPad installation
For the PWA install/offline feature, host the folder on an HTTPS website (GitHub Pages, Netlify, Cloudflare Pages, etc.).
Open it in Safari on the iPad, tap Share, then "Add to Home Screen".

Note: Opening index.html directly from Files may show the app, but service-worker/offline installation requires HTTPS (or localhost during development).
