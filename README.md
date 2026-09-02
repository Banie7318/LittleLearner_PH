# Little Learner PH — Easy Edit Edition

A single-project version of the iPad kindergarten learning PWA.

## Simplification
Firebase configuration, Firebase sync, learner settings, and lesson logic are
together in `public/app.js`.

## Data strategy
- Local storage first
- Firestore cloud backup second
- Anonymous Firebase Authentication
- Firestore persistent local cache
- Service-worker app shell cache

## Privacy choice
The Firebase `measurementId` is retained in the config, but Firebase Analytics
is not initialized in this child-focused build.


## Language-aware speech

Filipino Reading automatically requests Filipino/Tagalog speech (`fil-PH` /
`tl-PH`) when available on the device. English-led lessons request English
speech. The final voice quality depends on the voices exposed by iPadOS/Safari.
