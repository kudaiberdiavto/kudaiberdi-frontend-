import type { ReactNode } from 'react'
import { ScrollView, View, useWindowDimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { SlideInDown, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { scheduleOnRN } from 'react-native-worklets'
import { useColors } from '@/theme'

interface BottomSheetProps {
	/** Swipe down on the handle / header closes the sheet. */
	onClose: () => void
	/** Pinned under the handle; also the drag zone. */
	header?: ReactNode
	/** Pinned to the bottom — the primary action never scrolls away. */
	footer?: ReactNode
	children: ReactNode
	/** Share of the screen height the sheet may take. */
	maxHeight?: number
}

/**
 * Bottom sheet over a screen: capped height, scrolling body, pinned footer, swipe down to close.
 * Lives in the screen's column (not absolute), so the list above shrinks instead of hiding behind it.
 */
export function BottomSheet({ onClose, header, footer, children, maxHeight = 0.72 }: BottomSheetProps) {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const { height } = useWindowDimensions()
	const y = useSharedValue(0)

	const drag = Gesture.Pan()
		.activeOffsetY(8)
		.onUpdate((e) => {
			y.value = Math.max(0, e.translationY)
		})
		.onEnd((e) => {
			if (e.translationY > 90 || e.velocityY > 900) {
				y.value = withTiming(height, { duration: 200 }, () => scheduleOnRN(onClose))
			} else {
				y.value = withSpring(0, { damping: 20, stiffness: 220 })
			}
		})

	const slide = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }))

	return (
		<Animated.View
			entering={SlideInDown.duration(220)}
			style={[
				{
					maxHeight: height * maxHeight,
					borderTopLeftRadius: 24,
					borderTopRightRadius: 24,
					backgroundColor: c.card,
					shadowColor: '#201F1D',
					shadowOpacity: 0.14,
					shadowOffset: { width: 0, height: -6 },
					shadowRadius: 20,
					elevation: 10,
				},
				slide,
			]}
		>
			<GestureDetector gesture={drag}>
				<View style={{ paddingTop: 10, paddingHorizontal: 16, paddingBottom: header ? 4 : 0, gap: 14 }}>
					<View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: c.border, alignSelf: 'center' }} />
					{header}
				</View>
			</GestureDetector>

			<ScrollView
				style={{ flexGrow: 0, flexShrink: 1 }}
				contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: footer ? 4 : insets.bottom + 12, gap: 14 }}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				{children}
			</ScrollView>

			{footer ? <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 12, gap: 14 }}>{footer}</View> : null}
		</Animated.View>
	)
}
