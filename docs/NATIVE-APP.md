# The iPhone and Android apps

Started 12 October 2026, at the owner's request. `native/` is a **Capacitor 8.5.3**
shell around the web app, one project for both stores. It carries the app's
files inside it rather than loading the website: Apple rejects an app that only
shows a remote site (guideline 4.2), and files on the phone are what keep the app
working offline.

## What is in the repository

| Path | What it is |
|---|---|
| `native/package.json` | Capacitor, pinned to 8.5.3, and the scripts below |
| `native/capacitor.config.json` | the app's id and name, the dark background, `www` as the web folder |
| `native/ios/` | the Xcode project (Swift Package Manager, so no CocoaPods) |
| `native/android/` | the Android Studio project |
| `native/assets/` | the icon and splash sources, drawn by `node tools/build-icons.js --native` from the same definition as every other icon |
| `tools/build-native.js` | makes `native/www/` from the built bundle |
| `@revenuecat/purchases-capacitor` 13.7.3 | the one native plugin, pinned in `native/package.json`: Codex Luminary through the stores (`docs/REVENUECAT-SETUP.md`) |

`native/www/` is generated and not committed. So are the copies each platform
keeps of it.

**How `www` differs from the website** (`tools/build-native.js`): the app is
`index.html`, because Capacitor opens `index.html` and the store app should open
on the app; the cover is `cover.html`, reached when a signed out reader needs to
sign in; every link back to the app says `./index.html`; and the service worker,
`_redirects`, `_headers` and `robots.txt` are left out, because there is no host.

**How the app behaves inside the shell** (`nativeApp()` in the app, which asks
Capacitor): the Oracle shows one line naming Moonshot AI at the foot of the page
(Apple 5.1.2(i)); Codex Luminary is sold through the App Store or Google Play
by RevenueCat, never through Stripe, and while its keys are empty the gate says
it is not available in the app yet; and no service worker is registered. On the
website none of that changes.

The plugin is called without a bundler: the app asks Capacitor's bridge for the
`Purchases` plugin by name (`rcCall()`), which is what the plugin's own
JavaScript does underneath. After changing the plugin's version, check its
method names in `node_modules/@revenuecat/purchases-capacitor/ios/Sources/`.

## Building it

You need a Mac with **Xcode** for the iPhone app and **Android Studio** (any
computer) for the Android one, and Node 22 or newer.

```
node tools/build-bundle.js        # from the repository root, as for any deploy
cd native
npm install                       # once
npm run ios                       # builds www, copies it in, opens Xcode
npm run android                   # the same for Android Studio
```

In Xcode choose a simulator and press Run; in Android Studio choose an emulator
and press Run. After any change to the app: `node tools/build-bundle.js`, then
`npm run sync` in `native/` (it refuses a bundle older than the app source).

To redraw the icons and splash after the mark changes:
`node tools/build-icons.js --native`, then in `native/`:
`npx capacitor-assets generate --ios --android --iconBackgroundColor '#0b0910' --iconBackgroundColorDark '#0b0910' --splashBackgroundColor '#05060a' --splashBackgroundColorDark '#05060a'`.

## Before the first store upload

1. **The app id is a placeholder: `com.incommon.app`.** It becomes permanent the
   moment a build is uploaded to either store, and it should be a reversed
   domain you own (for example `app.yourdomain.incommon`). Change it in
   `native/capacitor.config.json`, then in Xcode (target, Signing & Capabilities,
   Bundle Identifier) and in `native/android/app/build.gradle` (`applicationId`
   and `namespace`), and move the Android `MainActivity.java` folder to match.
   It costs minutes now and is impossible later.
2. **Signing.** Xcode signs with your Apple Developer account (target, Signing &
   Capabilities, Team). Android needs an upload key made once in Android Studio
   (Build, Generate Signed Bundle) and kept safe: Google Play App Signing holds
   the real key.
3. **Version numbers.** Each upload needs a higher build number: Xcode's Version
   and Build, and `versionCode` and `versionName` in
   `native/android/app/build.gradle`.
4. **Sign in inside the app.** Test these on a real phone before submitting:
   - **Supabase:** add `capacitor://localhost` and `https://localhost` to
     Authentication, URL Configuration, Redirect URLs.
   - **Cloudflare Turnstile:** add `localhost` to the widget's hostnames. The
     iPhone app's pages come from `capacitor://localhost`, and whether
     Turnstile's check runs on that scheme has to be seen on a device; if it
     does not, the fix is to have the app sign in through the website instead,
     and that is a change to make once it is known.
   - **The emailed links** (confirming an address, choosing a new password)
     open in the phone's browser and finish on the website; the reader then
     signs in with their password in the app.
5. **Luminary in the apps** is the stores' own billing, through RevenueCat:
   `docs/REVENUECAT-SETUP.md`, which includes adding the **In-App Purchase**
   capability in Xcode and testing with sandbox and licence tester accounts.
   Readers who subscribed on the website read in-depth readings in the app too,
   which Apple allows because the same subscription is also sold in the app.
6. **The store listing**, privacy forms and age rating: `docs/APP-STORE-SETUP.md`.

## Not built yet

- Opening the app from a link (universal links on iPhone, app links on
  Android). Not needed to ship; useful later so an emailed link can open the
  app instead of the browser.
- Anything that needs a native plugin: there is no push notification in this
  app by design, and nothing else needs one yet.
