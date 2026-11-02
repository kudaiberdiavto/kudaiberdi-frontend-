import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { Image } from '@/components/ui/image'
import { t } from '@/i18n'

const MAX = 4
const DOUBLE_TAP = 2.5
/** Pulled down this far (at 1×) — the viewer closes. */
const CLOSE_AT = 120

/**
 * A photo in the full-screen viewer: pinch up to 4×, double tap to zoom into the point and back, drag while zoomed,
 * swipe down at 1× to close. At 1× a horizontal swipe is left to the pager, so paging between photos still works.
 */
export function ZoomableImage({
	uri,
	width,
	height,
	onZoomChange,
	onClose,
}: {
	uri: string
	width: number
	height: number
	/** Zoomed in or back at 1× — the pager stops paging while zoomed. */
	onZoomChange: (zoomed: boolean) => void
	onClose: () => void
}) {
	const scale = useSharedValue(1)
	const saved = useSharedValue(1)
	const x = useSharedValue(0)
	const y = useSharedValue(0)
	const savedX = useSharedValue(0)
	const savedY = useSharedValue(0)
	const dismiss = useSharedValue(0)
	const startX = useSharedValue(0)
	const startY = useSharedValue(0)

	// Keep the picture over the screen: at scale s it may move (s − 1) / 2 of its size each way.
	const clampX = (value: number, s: number) => {
		'worklet'
		const max = ((s - 1) * width) / 2
		return Math.min(max, Math.max(-max, value))
	}
	const clampY = (value: number, s: number) => {
		'worklet'
		const max = ((s - 1) * height) / 2
		return Math.min(max, Math.max(-max, value))
	}
	const reset = () => {
		'worklet'
		scale.value = withTiming(1)
		saved.value = 1
		x.value = withTiming(0)
		y.value = withTiming(0)
		savedX.value = 0
		savedY.value = 0
		runOnJS(onZoomChange)(false)
	}

	const pinch = Gesture.Pinch()
		.onUpdate((e) => {
			scale.value = Math.min(MAX, Math.max(0.8, saved.value * e.scale))
		})
		.onEnd(() => {
			if (scale.value <= 1.05) return reset()
			saved.value = scale.value
			x.value = withTiming(clampX(x.value, scale.value))
			y.value = withTiming(clampY(y.value, scale.value))
			savedX.value = clampX(x.value, scale.value)
			savedY.value = clampY(y.value, scale.value)
			runOnJS(onZoomChange)(true)
		})

	const doubleTap = Gesture.Tap()
		.numberOfTaps(2)
		.onEnd((e) => {
			if (saved.value > 1) return reset()
			// Zoom into the tapped point: move it to the centre.
			const tx = clampX((width / 2 - e.x) * DOUBLE_TAP, DOUBLE_TAP)
			const ty = clampY((height / 2 - e.y) * DOUBLE_TAP, DOUBLE_TAP)
			scale.value = withTiming(DOUBLE_TAP)
			saved.value = DOUBLE_TAP
			x.value = withTiming(tx)
			y.value = withTiming(ty)
			savedX.value = tx
			savedY.value = ty
			runOnJS(onZoomChange)(true)
		})

	// Zoomed: drag the picture. At 1×: only a downward drag (to close) — a sideways one goes to the pager.
	const pan = Gesture.Pan()
		.manualActivation(true)
		.onTouchesDown((e) => {
			startX.value = e.allTouches[0].absoluteX
			startY.value = e.allTouches[0].absoluteY
		})
		.onTouchesMove((e, state) => {
			if (e.numberOfTouches > 1) return state.fail()
			if (saved.value > 1) return state.activate()
			const dx = e.allTouches[0].absoluteX - startX.value
			const dy = e.allTouches[0].absoluteY - startY.value
			if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) return state.fail()
			if (dy > 10 && dy > Math.abs(dx)) state.activate()
		})
		.onUpdate((e) => {
			if (saved.value > 1) {
				x.value = clampX(savedX.value + e.translationX, saved.value)
				y.value = clampY(savedY.value + e.translationY, saved.value)
			} else {
				dismiss.value = Math.max(0, e.translationY)
			}
		})
		.onEnd(() => {
			if (saved.value > 1) {
				savedX.value = x.value
				savedY.value = y.value
				return
			}
			if (dismiss.value > CLOSE_AT) runOnJS(onClose)()
			dismiss.value = withTiming(0)
		})

	const style = useAnimatedStyle(() => ({
		opacity: 1 - Math.min(0.5, dismiss.value / 400),
		transform: [{ translateX: x.value }, { translateY: y.value + dismiss.value }, { scale: scale.value * (1 - Math.min(0.15, dismiss.value / 1500)) }],
	}))

	return (
		<GestureDetector gesture={Gesture.Simultaneous(pinch, pan, doubleTap)}>
			<Animated.View style={[{ width, height }, style]} accessibilityHint={t('Двойное касание — увеличить')}>
				<Image source={{ uri }} contentFit="contain" style={{ width, height }} />
			</Animated.View>
		</GestureDetector>
	)
}
