import { useEffect, useState } from 'react'
import { Animated, Easing, View } from 'react-native'

/**
 * Bottom → top, like a watch: brass wheels, the steel gear, the dial, «К», the crystal.
 * `edge` — the colour of the layer's side, so a turned layer shows its thickness; `side` — the picture for it
 * when the face has a soft shadow (tinted, the shadow would turn into a block); `thick` — fewer copies for the thin «К».
 */
interface Layer {
	source: number
	side?: number
	spin: number
	edge: string | null
	thick?: number
}

const LAYERS: Layer[] = [
	{ source: require('../../assets/images/layer-gears.png'), spin: -1, edge: '#6E5218' },
	{ source: require('../../assets/images/layer-gear.png'), spin: 1, edge: '#5A6272' },
	{ source: require('../../assets/images/layer-medal.png'), spin: 0, edge: '#1B1F27' },
	{ source: require('../../assets/images/layer-k.png'), side: require('../../assets/images/layer-k-flat.png'), spin: 0, edge: '#5B6372', thick: 2 },
	{ source: require('../../assets/images/layer-glass.png'), spin: 0, edge: null },
]

/** Copies behind each face that make up its side. */
const THICKNESS = 4

/**
 * The logo taking itself apart like a watch in an exploded view, face to the viewer: the crystal, «К» and the dial come
 * forward and grow, the gear, wheels and plate go back and shrink — while the gears keep turning, then it closes back up — and rests assembled for a while.
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

	const gap = size * 0.38
	const depth = size * 0.012
	const middle = (LAYERS.length - 1) / 2
		const forward = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
	const backward = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-540deg'] })

	return (
		<View style={{ width: size, height: size }}>
			{LAYERS.flatMap((layer, i) => {
				// z > 0 — toward the viewer: front parts come forward-left and grow, back ones go back-right and shrink
				const z = i - middle
				const x = (k: number) =>
					Animated.add(
						spread.interpolate({ inputRange: [0, 1], outputRange: [0, -z * gap] }),
						tilt.interpolate({ inputRange: [0, 1], outputRange: [0, k * depth] })
					)
				const yk = (k: number) => Animated.add(y, tilt.interpolate({ inputRange: [0, 1], outputRange: [0, k * depth] }))
				const y = spread.interpolate({ inputRange: [0, 1], outputRange: [0, z * gap * 0.18] })
				const scale = spread.interpolate({ inputRange: [0, 1], outputRange: [1, 1 + z * 0.1] })
				const rotate = layer.spin > 0 ? forward : layer.spin < 0 ? backward : '0deg'
				// the side first (farthest copy first), then the face on top
				const n = layer.thick ?? THICKNESS
				const copies = layer.edge ? Array.from({ length: n }, (_, k) => n - k) : []
				return [...copies, 0].map((k) => (
					<Animated.Image
						key={`${i}-${k}`}
						source={k && layer.side ? layer.side : layer.source}
						tintColor={k ? (layer.edge ?? undefined) : undefined}
						style={{
							position: 'absolute',
							// explicit order: the browser would otherwise sort turned layers by depth and bury «К»
							zIndex: i * 10 + (10 - k),
							width: size,
							height: size,
							transform: [{ translateX: x(k) }, { translateY: yk(k) }, { scale }, { rotate }],
						}}
					/>
				))
			})}
		</View>
	)
}
