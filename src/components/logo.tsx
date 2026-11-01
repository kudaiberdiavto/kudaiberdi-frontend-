import { useEffect, useState } from 'react'
import { Animated, Easing, View } from 'react-native'

/** Bottom → top, like a watch: plate, brass wheels, the steel gear, the medallion, «К», the crystal. */
const LAYERS = [
	{ source: require('../../assets/images/layer-plate.png'), spin: 0 },
	{ source: require('../../assets/images/layer-gears.png'), spin: -1 },
	{ source: require('../../assets/images/layer-gear.png'), spin: 1 },
	{ source: require('../../assets/images/layer-medal.png'), spin: 0 },
	{ source: require('../../assets/images/layer-k.png'), spin: 0 },
	{ source: require('../../assets/images/layer-glass.png'), spin: 0 },
]

/**
 * The logo taking itself apart like a watch in an exploded view: it tilts into 3D, the layers float apart
 * while the gears keep turning, then it closes back up — and rests assembled for a while.
 */
export function ExplodedLogo({ size }: { size: number }) {
	const [tilt] = useState(() => new Animated.Value(0))
	const [spread] = useState(() => new Animated.Value(0))
	const [turn] = useState(() => new Animated.Value(0))

	useEffect(() => {
		const ease = Easing.inOut(Easing.cubic)
		const step = (value: Animated.Value, toValue: number, duration: number) =>
			Animated.timing(value, { toValue, duration, easing: ease, useNativeDriver: true })
		const show = Animated.loop(
			Animated.sequence([
				Animated.delay(1200),
				step(tilt, 1, 700),
				step(spread, 1, 900),
				Animated.delay(1600),
				step(spread, 0, 800),
				step(tilt, 0, 600),
				Animated.delay(2400),
			])
		)
		const spin = Animated.loop(Animated.timing(turn, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true }))
		show.start()
		spin.start()
		return () => (show.stop(), spin.stop())
	}, [tilt, spread, turn])

	const gap = size * 0.17
	const middle = (LAYERS.length - 1) / 2
	const rotateX = tilt.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '58deg'] })
	const rotateZ = tilt.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-32deg'] })
	const forward = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
	const backward = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-540deg'] })

	return (
		<View style={{ width: size, height: size }}>
			{LAYERS.map((layer, i) => (
				<Animated.Image
					key={i}
					source={layer.source}
					style={{
						position: 'absolute',
						width: size,
						height: size,
						transform: [
							{ perspective: size * 6 },
							{ translateY: spread.interpolate({ inputRange: [0, 1], outputRange: [0, -(i - middle) * gap] }) },
							{ rotateX },
							{ rotateZ },
							{ rotate: layer.spin > 0 ? forward : layer.spin < 0 ? backward : '0deg' },
						],
					}}
				/>
			))}
		</View>
	)
}
