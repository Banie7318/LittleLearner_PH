# Native Filipino + English Voice Update

The app now automatically changes speech language based on the learning area.

## Filipino Reading
The app searches the iPad/Safari speech voices in this order:

1. `fil-PH`
2. `tl-PH`
3. `fil`
4. `tl`

If one is available, it is assigned to the speech utterance.

## English and other English-led lessons
The app prefers:

1. `en-US`
2. `en-GB`
3. `en-AU`
4. another English voice

## Important iPad note
The exact voice quality and voice names are controlled by iPadOS/Safari.
The web app can request and select an available Filipino or English voice, but
it cannot manufacture an Apple system voice that is not installed/exposed by
the device.

The app therefore:
- prefers a native Filipino/Tagalog system voice when available,
- prefers an English system voice for English lessons,
- falls back gracefully if a preferred voice is unavailable.

Filipino lesson feedback is also spoken in Filipino:
- "Magaling! Tama ang sagot mo!"
- "Magandang subok!"

English lessons continue using English feedback.
