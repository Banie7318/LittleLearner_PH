# ⭐ EDIT ME FIRST — Little Learner PH

This version was simplified for easier editing.

## The file you will edit most often

`public/app.js`

At the VERY TOP of `app.js` is the section:

    ⭐ EDIT HERE FIRST ⭐

It already contains your Firebase configuration:

- Project ID: `little-learner-ph`
- Auth domain: `little-learner-ph.firebaseapp.com`
- Storage bucket: `little-learner-ph.firebasestorage.app`

It also contains the main learner defaults.

Further down in the SAME `app.js` file are:
- Firebase anonymous login
- Firestore cloud backup
- English lessons
- Filipino lessons
- Math lessons
- Story lessons
- Thinking games
- Review lessons
- Stars and progress logic
- Text-to-speech
- Parent dashboard logic

## Other files

`public/index.html`
- Screen layout and buttons.

`public/styles.css`
- Colors, spacing, sizes and appearance.

`public/manifest.json`
- iPad/PWA app information.

`public/sw.js`
- Offline cache behavior.

`firestore.rules`
- Cloud database security.

`firebase.json`
- Firebase Hosting deployment configuration.

`.firebaserc`
- Already points to Firebase project `little-learner-ph`.

## Firebase Console requirements

Before cloud backup works:

1. Firebase Console → Authentication → Sign-in method.
2. Enable **Anonymous**.
3. Firebase Console → Firestore Database.
4. Create the Firestore database.

## Deploy

Install Firebase CLI once:

    npm install -g firebase-tools

Sign in:

    firebase login

From this project folder:

    firebase deploy

Your hosting URL should use your Firebase project, typically:

    https://little-learner-ph.web.app

## Install on iPad

1. Open the Firebase Hosting URL in Safari.
2. Tap Share.
3. Tap **Add to Home Screen**.
4. Tap Add.

## GitHub

Upload this entire folder to one GitHub repository.

For automatic GitHub → Firebase deployment, run from the repository folder:

    firebase init hosting:github

Important:
Never commit a Firebase Admin SDK service-account JSON file.
