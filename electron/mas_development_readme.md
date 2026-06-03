# MAS Development Build

This document covers the local Mac App Store development build for Presenton. It is for testing the sandboxed MAS version on a registered macOS development machine before creating an App Store distribution build.

## App Identity

- App name: Presenton
- Platform: macOS
- Team ID / App ID Prefix: `S6W5C54KL6`
- Bundle ID: `com.presenton.presenton`
- Application group: `S6W5C54KL6.com.presenton.presenton`

## What Is Configured

The Electron builder config lives in `electron/build.js`.

The MAS development build uses:

- `appId`: `com.presenton.presenton`
- `productName`: `Presenton`
- `mac.target`: `mas-dev` when `PRESENTON_MAC_TARGET=mas-dev`
- `masDev.type`: `development`
- `masDev.provisioningProfile`: `build/AppleDevelopment.provisionprofile`
- `masDev.entitlements`: `build/entitlements.mas.plist`
- `masDev.entitlementsInherit`: `build/entitlements.mas.inherit.plist`
- `ElectronTeamID`: `S6W5C54KL6`

The icon config has intentionally not been changed. Icon folders/assets can be updated later when the final macOS icon set is ready.

Placeholder files are included so the expected local structure is visible:

- `electron/build/AppleDevelopment.provisionprofile.replace_me`
- `electron/build/MacAppStore.provisionprofile.replace_me`
- `electron/build/icon.icns.replace_me`
- `electron/build/icon.iconset/`

The `.replace_me` files are documentation markers. Do not rename them unless you are replacing them with the real Apple or icon artifacts.

Expected structure:

```text
electron/
  build/
    AppleDevelopment.provisionprofile.replace_me
    AppleDevelopment.provisionprofile        # local only, ignored by git
    MacAppStore.provisionprofile.replace_me  # future distribution marker
    icon.icns.replace_me
    icon.icns                                # generated later from icon.iconset
    entitlements.mas.plist
    entitlements.mas.inherit.plist
    icon.iconset/
      README.replace_me.md
      icon_16x16.png
      icon_16x16@2x.png
      icon_32x32.png
      icon_32x32@2x.png
      icon_128x128.png
      icon_128x128@2x.png
      icon_256x256.png
      icon_256x256@2x.png
      icon_512x512.png
      icon_512x512@2x.png
```

## Required Local Apple Setup

This repo assumes the Apple Developer setup already exists on the Mac:

- Apple Development certificate installed in Keychain.
- Mac registered in Apple Developer Devices.
- Explicit App ID exists for `com.presenton.presenton`.
- macOS App Development provisioning profile exists for that App ID and Mac.

Place the development provisioning profile here:

```text
electron/build/AppleDevelopment.provisionprofile
```

Provisioning profiles are ignored by git and should stay local.

The checked-in marker file is:

```text
electron/build/AppleDevelopment.provisionprofile.replace_me
```

The real local file must be:

```text
electron/build/AppleDevelopment.provisionprofile
```

The real file is ignored by git.

## Icon Placeholder Structure

A dummy macOS icon set exists at:

```text
electron/build/icon.iconset/
```

It contains placeholder PNGs using the standard Apple iconset filenames and sizes. Replace those PNGs with the final app icon assets when ready.

On macOS, generate the final `.icns` file with:

```bash
cd electron/build
iconutil -c icns icon.iconset -o icon.icns
```

The checked-in marker for the future generated icon is:

```text
electron/build/icon.icns.replace_me
```

## Entitlements

The MAS development build is sandboxed, as required for Mac App Store builds.

Main app entitlements are in:

```text
electron/build/entitlements.mas.plist
```

Current main app entitlements:

- `com.apple.security.app-sandbox`
- `com.apple.security.application-groups`
- `com.apple.security.cs.allow-jit`
- `com.apple.security.network.client`
- `com.apple.security.network.server`
- `com.apple.security.files.user-selected.read-write`
- `com.apple.security.files.downloads.read-write`

Helper process entitlements are in:

```text
electron/build/entitlements.mas.inherit.plist
```

Current helper entitlements:

- `com.apple.security.app-sandbox`
- `com.apple.security.inherit`

Do not add broad entitlements unless the app actually needs them. Any entitlement used in the app should also be supported by the provisioning profile and App ID capabilities.

## Build Commands

Run commands from the `electron` directory.

Full local MAS development build:

```bash
npm run build:all:mas-dev
```

Package only, assuming `resources`, `app_dist`, and dependencies are already built:

```bash
npm run dist:mac:mas-dev
```

Electron package step only, including TypeScript checks and generated version/export runtime:

```bash
npm run build:electron:mas-dev
```

## Expected Output

The MAS development app is written under:

```text
electron/dist/mas-dev/
```

This build is signed with the Apple Development certificate and embedded development provisioning profile. It should run only on Macs included in that provisioning profile.

## Local Verification

After building on macOS, inspect the app signature:

```bash
codesign --display --verbose=2 "dist/mas-dev/Presenton.app"
```

Check entitlements embedded in the signed app:

```bash
codesign --display --entitlements :- "dist/mas-dev/Presenton.app"
```

Confirm the provisioning profile was embedded:

```bash
ls "dist/mas-dev/Presenton.app/Contents/embedded.provisionprofile"
```

Decode the local development provisioning profile if needed:

```bash
security cms -D -i build/AppleDevelopment.provisionprofile
```

## Notes

- `mas-dev` is for local sandbox testing only.
- App Store submission uses the `mas` target, an Apple Distribution certificate, and a Mac App Store provisioning profile. That distribution setup is intentionally not added here.
- MAS builds do not use hardened runtime notarization in the same way direct-distribution DMG builds do.
- The standard Electron darwin build cannot be used to test MAS sandbox behavior; MAS testing requires the MAS build target.

## References

- Electron Mac App Store Submission Guide: https://www.electronjs.org/docs/latest/tutorial/mac-app-store-submission-guide/
- electron-builder MAS docs: https://www.electron.build/docs/mas/
- electron-builder macOS docs: https://www.electron.build/docs/mac/
- Apple App Sandbox Entitlement Keys: https://developer.apple.com/library/archive/documentation/Miscellaneous/Reference/EntitlementKeyReference/Chapters/EnablingAppSandbox.html
