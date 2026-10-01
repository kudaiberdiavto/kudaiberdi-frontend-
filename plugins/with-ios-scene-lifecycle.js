// iOS 27 terminates apps at launch unless they adopt the UIScene life cycle
// (`_UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`). Expo ships
// `ExpoAppSceneDelegate` for this, but the SDK 57 template does not use it yet:
// this plugin switches the generated project over, so `expo prebuild` keeps it.
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins')

const SCENE_DELEGATE = 'EXExpoAppSceneDelegate' // @objc name of Expo's ExpoAppSceneDelegate

function withSceneManifest(config) {
	return withInfoPlist(config, (mod) => {
		mod.modResults.UIApplicationSceneManifest = {
			UIApplicationSupportsMultipleScenes: false,
			UISceneConfigurations: {
				UIWindowSceneSessionRoleApplication: [
					{
						UISceneConfigurationName: 'Default Configuration',
						UISceneDelegateClassName: SCENE_DELEGATE,
					},
				],
			},
		}
		return mod
	})
}

function withSceneAppDelegate(config) {
	return withAppDelegate(config, (mod) => {
		if (mod.modResults.language !== 'swift') throw new Error('with-ios-scene-lifecycle: expected a Swift AppDelegate')
		let src = mod.modResults.contents

		// The scene delegate reads the factory and the window through this protocol.
		src = src.replace(
			/class AppDelegate: ExpoAppDelegate \{/,
			'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {'
		)

		// The scene delegate creates the window and starts React Native in it — not the app delegate.
		src = src.replace(
			/\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/,
			'\n    // React Native starts in ExpoAppSceneDelegate (UIScene life cycle, required by iOS 27).\n'
		)

		if (!src.includes('ExpoReactNativeFactoryProvider') || src.includes('UIWindow(frame: UIScreen.main.bounds)')) {
			throw new Error('with-ios-scene-lifecycle: AppDelegate.swift has an unexpected shape, update the plugin')
		}
		mod.modResults.contents = src
		return mod
	})
}

module.exports = function withIosSceneLifecycle(config) {
	return withSceneAppDelegate(withSceneManifest(config))
}
