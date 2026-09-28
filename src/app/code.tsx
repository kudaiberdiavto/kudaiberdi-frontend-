import { useEffect, useRef, useState } from 'react'
import { Keyboard, Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { ChevronLeftIcon } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'

const CODE_LENGTH = 4
const RESEND_SECONDS = 42

function formatCountdown(seconds: number) {
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export default function CodeScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const { phone } = useLocalSearchParams<{ phone?: string }>()
	const [code, setCode] = useState('')
	const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS)
	const inputRef = useRef<TextInput>(null)

	useEffect(() => {
		if (secondsLeft <= 0) return
		const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
		return () => clearInterval(id)
	}, [secondsLeft])

	useEffect(() => {
		if (code.length < CODE_LENGTH) return
		Keyboard.dismiss()
		router.push('/role')
	}, [code])

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<View style={{ paddingVertical: 8, paddingHorizontal: 16 }}>
				<Pressable
					onPress={() => router.back()}
					style={{
						width: 48,
						height: 48,
						borderRadius: 12,
						backgroundColor: c.card,
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<ChevronLeftIcon size={22} color={c.ink} strokeWidth={2.6} />
				</Pressable>
			</View>

			<View style={{ flex: 1, paddingTop: 32, paddingHorizontal: 24, paddingBottom: 24, gap: 28 }}>
				<View style={{ gap: 8 }}>
					<Text style={{ fontSize: 28, fontFamily: fontFamily(700), letterSpacing: -0.56, color: c.ink }}>
						Код из SMS
					</Text>
					<Text style={{ fontSize: 16, fontFamily: fontFamily(400), color: c.muted }}>Отправили на {phone}</Text>
				</View>

				<Pressable onPress={() => inputRef.current?.focus()} style={{ flexDirection: 'row', gap: 12 }}>
					{Array.from({ length: CODE_LENGTH }).map((_, index) => {
						const digit = code[index]
						const isActive = index === code.length
						return (
							<View
								key={index}
								style={{
									flex: 1,
									height: 76,
									borderRadius: 14,
									borderWidth: 2,
									borderColor: isActive ? c.brand : c.border,
									backgroundColor: c.card,
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								{digit ? (
									<Text style={{ fontSize: 32, fontFamily: fontFamily(700), color: c.ink }}>{digit}</Text>
								) : isActive ? (
									<View style={{ width: 2, height: 32, backgroundColor: c.brand }} />
								) : null}
							</View>
						)
					})}
				</Pressable>

				<TextInput
					ref={inputRef}
					value={code}
					onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, CODE_LENGTH))}
					keyboardType="number-pad"
					maxLength={CODE_LENGTH}
					style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
				/>

				<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>
					{secondsLeft > 0 ? (
						<>
							Отправить снова через{' '}
							<Text style={{ fontFamily: fontFamily(700), color: c.ink }}>{formatCountdown(secondsLeft)}</Text>
						</>
					) : (
						<Text
							onPress={() => {
								setSecondsLeft(RESEND_SECONDS)
								setCode('')
							}}
							style={{ fontFamily: fontFamily(700), color: c.brandStrong }}
						>
							Отправить код снова
						</Text>
					)}
				</Text>
			</View>
		</View>
	)
}
