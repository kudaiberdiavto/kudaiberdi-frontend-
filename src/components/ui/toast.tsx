import { useEffect } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated'
import { create } from 'zustand'
import { CheckIcon } from '@/components/icons'
import { haptic } from '@/lib/haptics'
import { fixed, fontFamily, fs, useColors } from '@/theme'
import { t } from '@/i18n'

/**
 * A short «Опубликовано ✓» on top of whatever screen comes next — the form closes, the confirmation stays.
 * `toast(text)` from anywhere (no hook); one at a time, gone after 2.2 s.
 * `undoToast` — «Машина удалена · Вернуть»: the deletion waits until the toast is gone, «Вернуть» cancels it.
 */

interface ToastState {
	text: string | null
	key: number
	action: { label: string; onPress: () => void } | null
	duration: number
}

const useToast = create<ToastState>(() => ({ text: null, key: 0, action: null, duration: 2200 }))

export function toast(text: string) {
	haptic.success()
	useToast.setState((s) => ({ text, key: s.key + 1, action: null, duration: 2200 }))
}

const UNDO_MS = 4000

/**
 * Instead of «Удалить?»: the item is already hidden (`hide` ran), the server call `commit` runs in 4 s unless
 * «Вернуть» is tapped — then `restore`. A newer toast doesn't cancel the pending commit.
 */
export function undoToast({ text, commit, restore }: { text: string; commit: () => void; restore: () => void }) {
	haptic.tap()
	let undone = false
	const timer = setTimeout(() => {
		if (!undone) commit()
	}, UNDO_MS)
	useToast.setState((s) => ({
		text,
		key: s.key + 1,
		duration: UNDO_MS,
		action: {
			label: t('Вернуть'),
			onPress: () => {
				undone = true
				clearTimeout(timer)
				restore()
				useToast.setState({ text: null, action: null })
			},
		},
	}))
}

/** Mounted once in the root layout, above the navigator. */
export function ToastHost() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const { text, key, action, duration } = useToast()

	useEffect(() => {
		if (!text) return
		const timer = setTimeout(() => useToast.setState({ text: null, action: null }), duration)
		return () => clearTimeout(timer)
	}, [text, key, duration])

	if (!text) return null
	return (
		// Touches pass through to the screen, except on the «Вернуть» button.
		<View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, alignItems: 'center' }}>
			<Animated.View
				key={key}
				entering={FadeInUp.duration(220)}
				exiting={FadeOutUp.duration(180)}
				accessibilityLiveRegion="polite"
				accessibilityRole="alert"
				style={{
					minHeight: 48,
					paddingHorizontal: 18,
					paddingVertical: 12,
					borderRadius: 24,
					backgroundColor: c.inverse,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 10,
					shadowColor: fixed.black,
					shadowOpacity: 0.2,
					shadowOffset: { width: 0, height: 6 },
					shadowRadius: 14,
					elevation: 8,
				}}
			>
				{action ? null : (
					<View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: fixed.live, alignItems: 'center', justifyContent: 'center' }}>
						<CheckIcon size={14} color={fixed.white} strokeWidth={3} />
					</View>
				)}
				<Text style={{ flexShrink: 1, fontSize: fs.base, fontFamily: fontFamily(600), color: fixed.white }}>{text}</Text>
				{action ? (
					<Pressable onPress={action.onPress} hitSlop={12} accessibilityRole="button" style={{ paddingLeft: 6 }}>
						<Text style={{ fontSize: fs.base, fontFamily: fontFamily(700), color: fixed.linkOnDark }}>{action.label}</Text>
					</Pressable>
				) : null}
			</Animated.View>
		</View>
	)
}
