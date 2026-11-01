import { useEffect, useState } from 'react'
import { Animated, Easing, Image, View } from 'react-native'

/** The «К» in a gear — the gear turns slowly, the letter stays put (sign-in screen). */
export function SpinningLogo({ size }: { size: number }) {
	const [turn] = useState(() => new Animated.Value(0))
	useEffect(() => {
		const loop = Animated.loop(Animated.timing(turn, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true }))
		loop.start()
		return () => loop.stop()
	}, [turn])
	const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
	return (
		<View style={{ width: size, height: size }}>
			<Animated.Image source={require('../../assets/images/logo-gear.png')} style={{ position: 'absolute', width: size, height: size, transform: [{ rotate }] }} />
			<Image source={require('../../assets/images/logo-k.png')} style={{ position: 'absolute', width: size, height: size }} />
		</View>
	)
}
