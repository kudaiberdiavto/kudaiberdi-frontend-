import { useEffect } from 'react'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated'
import { create } from 'zustand'
import { CheckIcon } from '@/components/icons'
import { haptic } from '@/lib/haptics'
import { fontFamily } from '@/theme'

/**
 * A short «Опубликовано ✓» on top of whatever screen comes next — the form closes, the confirmation stays.
 * `toast(text)` from anywhere (no hook); one at a time, gone after 2.2 s.
 */

interface ToastState {
	text: string | null
	key: number
}

const useToast = create<ToastState>(() => ({ text: null, key: 0 }))

export function toast(text: string) {
	haptic.success()
	useToast.setState((s) => ({ text, key: s.key + 1 }))
}

/** Mounted once in the root layout, above the navigator. */
export function ToastHost() {
	const insets = useSafeAreaInsets()
	const { text, key } = useToast()

	useEffect(() => {
		if (!text) return
		const timer = setTimeout(() => useToast.setState({ text: null }), 2200)
		return () => clearTimeout(timer)
	}, [text, key])

	if (!text) return null
	return (
		<View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, alignItems: 'center' }}>
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
					backgroundColor: '#201F1D',
					flexDirection: 'row',
					alignItems: 'center',
					gap: 10,
					shadowColor: '#000',
					shadowOpacity: 0.2,
					shadowOffset: { width: 0, height: 6 },
					shadowRadius: 14,
					elevation: 8,
				}}
			>
				<View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center' }}>
					<CheckIcon size={14} color="#FFFFFF" strokeWidth={3} />
				</View>
				<Text style={{ fontSize: 16, fontFamily: fontFamily(600), color: '#FFFFFF' }}>{text}</Text>
			</Animated.View>
		</View>
	)
}
