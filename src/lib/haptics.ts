import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'

// Light taps on the moments that matter. No-ops on web; a device without a taptic engine just ignores them.
const run = (fn: () => Promise<void>) => {
	if (Platform.OS !== 'web') fn().catch(() => {})
}

export const haptic = {
	/** A choice: a switch flipped, an option picked. */
	select: () => run(() => Haptics.selectionAsync()),
	/** A tap that does something: send, record. */
	tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
	/** Done: published, saved, sent. */
	success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
	error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
}
