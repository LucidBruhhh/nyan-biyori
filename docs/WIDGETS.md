# Home-screen widgets

Both widgets show the cat's mood portrait, name and the four needs. While the app is closed they project the needs forward on their own, using the same rules as the game: needs fall at their hourly rate but never below 20 while you're away. The game sends a fresh snapshot about once a minute and whenever the app goes to the background (`pushWidget` in `js/game.js` → `NB.Native.widget` → the `WidgetBridge` plugin).

## Android (ready in the project)

Everything is already in `android/`: `CatWidget.java` (the widget), `WidgetBridgePlugin.java` (receives data from the game), `res/layout/cat_widget.xml`, `res/xml/cat_widget_info.xml` and the receiver in `AndroidManifest.xml`. Build with `npm run android`, then long-press the home screen → Widgets → Nyan Biyori.

## iOS (one-time setup in Xcode on the Mac)

The plugin is already in `ios/App/App/AppDelegate.swift`. The widget itself is an extension target, which has to be created in Xcode:

1. `npm run ios` to open the project in Xcode.
2. File › New › Target… › **Widget Extension**. Name it `NyanWidget`, untick "Include Configuration App Intent" and "Include Live Activity", and click Activate when asked.
3. Replace the generated `NyanWidget.swift` with `ios/NyanWidget/NyanWidget.swift` from this repo, and delete the other generated Swift files in that folder (the bundle file).
4. Select the **App** target › Signing & Capabilities › + Capability › **App Groups**, add `group.com.lucidbruhhh.nyanbiyori`.
5. Do the same for the **NyanWidgetExtension** target with the same group.
6. Run on your iPhone, open the game once, then long-press the home screen › + › Nyan Biyori.

If the app ID changes from `com.lucidbruhhh.nyanbiyori`, update the group name in `AppDelegate.swift`, `NyanWidget.swift` and both targets' App Groups.
