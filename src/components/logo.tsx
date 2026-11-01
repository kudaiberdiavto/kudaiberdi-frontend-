import { useEffect, useState } from 'react'
import { Animated, Easing, View } from 'react-native'

/**
 * Bottom → top, like a watch: plate, brass wheels, the steel gear, the medallion, «К», the crystal.
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
	{ source: require('../../assets/images/layer-plate.png'), spin: 0, edge: '#3E4656' },
	{ source: require('../../assets/images/layer-gears.png'), spin: -1, edge: '#B48C3C' },
	{ source: require('../../assets/images/layer-gear.png'), spin: 1, edge: '#9AA2B1' },
	{ source: require('../../assets/images/layer-medal.png'), spin: 0, edge: '#2A50C8' },
	{ source: require('../../assets/images/layer-k.png'), side: require('../../assets/images/layer-k-flat.png'), spin: 0, edge: '#C9D2E3', thick: 1 },
	{ source: require('../../assets/images/layer-glass.png'), spin: 0, edge: null },
]

/** Copies behind each face that make up its side. */
const THICKNESS = 3

/**
 * The logo taking itself apart like a watch in an exploded view: it turns a third toward the viewer, the layers slide
 * apart horizontally — the crystal and «К» come forward, the plate stays at the back — while the gears keep turning, then it closes back up — and rests assembled for a while.
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

	const gap = size * 0.30
	const depth = size * 0.01
	const middle = (LAYERS.length - 1) / 2
	const rotateY = tilt.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '38deg'] })
	const rotateX = tilt.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '16deg'] })
	const forward = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
	const backward = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-540deg'] })

	return (
		<View style={{ width: size, height: size }}>
			{LAYERS.flatMap((layer, i) => {
				const x = (k: number) =>
					Animated.add(
						spread.interpolate({ inputRange: [0, 1], outputRange: [0, -(i - middle) * gap] }),
						tilt.interpolate({ inputRange: [0, 1], outputRange: [0, k * depth] })
					)
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
							width: size,
							height: size,
							transform: [{ perspective: size * 6 }, { translateX: x(k) }, { rotateY }, { rotateX }, { rotate }],
						}}
					/>
				))
			})}
		</View>
	)
}
