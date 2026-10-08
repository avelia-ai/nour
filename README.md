# NOUR — mobile app foundation

V1 visual foundation built with Expo + Expo Router. The product direction is premium, contemporary and oriental: ivory, emerald, champagne gold, subtle geometric details and Arabic typography elements.

## Run

```bash
npm install
npx expo start
```

Web:

```bash
npm run web
```

## Production builds

```bash
npm install -g eas-cli
eas login
eas build --platform all --profile production
```

The bundle identifiers are placeholders and should be replaced with the final registered identifiers before store submission.

## V1 screens currently in the app

- Accueil
- Coran
- Prière
- Mosquées
- Profil
- Clair / sombre

The next implementation layer is real data: authentication, prayer calculation/location, Qibla sensor, Quran API/audio/progression, mosque map/places, notifications, and persistent gamification.
