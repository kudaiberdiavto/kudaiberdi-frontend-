import { useState } from 'react'
import { Keyboard, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Redirect, router } from 'expo-router'
import { Button } from '@/components/ui'
import { fontFamily, useColors } from '@/theme'
import { COUNTRY_CODE, formatLocalPhone, isValidLocalPhone, toE164 } from '@/lib/phone'
import { ApiError } from '@/lib/api'
import { useSendOtp } from '@/api/auth'
import { homeHref, useSession } from '@/store/useSession'

const LANGS = [
	{ value: 'ru', label: 'RU' },
	{ value: 'ky', label: 'KG' },
] as const

export default function PhoneScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const signedIn = useSession((s) => s.status === 'authed')
	const role = useSession((s) => s.role)
	const onboarded = useSession((s) => s.onboarded)
	const hasShop = useSession((s) => s.hasShop)
	const hasMaster = useSession((s) => s.hasMaster)
	const lang = useSession((s) => s.lang)
	const setLang = useSession((s) => s.setLang)
	const [phone, setPhone] = useState('')
	const sendOtp = useSendOtp()

	if (signedIn) return <Redirect href={homeHref({ role, onboarded, hasShop, hasMaster })} />

	const submit = () => {
		Keyboard.dismiss()
		const e164 = toE164(phone)
		const openCode = (resendIn: number, debugCode?: string | null) =>
			router.push({
				pathname: '/code',
				params: { phone: e164, resendIn: String(resendIn), debugCode: debugCode ?? undefined },
			})

		sendOtp.mutate(e164, {
			onSuccess: (response) => openCode(response.resendIn, response.debugCode),
			// The code was sent a moment ago — just continue to screen 02 with the remaining cooldown.
			onError: (error) => {
				if (error instanceof ApiError && error.code === 'OTP_COOLDOWN') openCode(error.retryAfter ?? 0)
			},
		})
	}

	const error = sendOtp.error instanceof ApiError && sendOtp.error.code !== 'OTP_COOLDOWN' ? sendOtp.error : null

	return (
		<Pressable
			accessible={false}
			// Tap outside the field hides the keyboard (native only — on web it would steal the input's focus).
			onPress={Platform.OS === 'web' ? undefined : Keyboard.dismiss}
			style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}
		>
			<View style={{ height: 44, paddingHorizontal: 22, alignItems: 'flex-end' }}>
				<View
					style={{
						marginTop: 24,
						flexDirection: 'row',
						gap: 3,
						padding: 3,
						borderRadius: 10,
						backgroundColor: c.card,
					}}
				>
					{LANGS.map(({ value, label }) => {
						const active = lang === value
						return (
							<Pressable
								key={value}
								onPress={() => setLang(value)}
								style={{
									height: 30,
									paddingHorizontal: 10,
									borderRadius: 8,
									alignItems: 'center',
									justifyContent: 'center',
									backgroundColor: active ? c.brand : 'transparent',
								}}
							>
								<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: active ? '#FFFFFF' : c.muted }}>
									{label}
								</Text>
							</Pressable>
						)
					})}
				</View>
			</View>

			<View style={{ flex: 1, paddingTop: 80, paddingHorizontal: 24, paddingBottom: 24, gap: 28 }}>
				<View
					style={{
						width: 64,
						height: 64,
						borderRadius: 18,
						backgroundColor: c.brand,
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<Text style={{ fontSize: 34, fontFamily: fontFamily(700), color: '#FFFFFF' }}>К</Text>
				</View>

				<View style={{ gap: 8 }}>
					<Text
						style={{
							fontSize: 32,
							lineHeight: 35.2,
							fontFamily: fontFamily(700),
							letterSpacing: -0.64,
							color: c.ink,
						}}
					>
						Кудайберген
					</Text>
					<Text style={{ fontSize: 17, lineHeight: 24.65, fontFamily: fontFamily(400), color: c.muted }}>
						Спросите деталь — ответят те, у кого она есть
					</Text>
				</View>

				<View style={{ gap: 8 }}>
					<Text style={{ fontSize: 14, fontFamily: fontFamily(600), color: c.muted }}>Номер телефона</Text>
					<View
						style={{
							height: 64,
							borderRadius: 14,
							borderWidth: 2,
							borderColor: error ? c.danger : c.brand,
							backgroundColor: c.card,
							paddingHorizontal: 16,
							flexDirection: 'row',
							alignItems: 'center',
						}}
					>
						<Text style={{ fontSize: 20, fontFamily: fontFamily(700), color: c.muted }}>{COUNTRY_CODE}</Text>
						<View style={{ width: 2, height: 26, backgroundColor: c.border, marginHorizontal: 12 }} />
						<TextInput
							value={phone}
							onChangeText={(text) => {
								const next = formatLocalPhone(text)
								setPhone(next)
								sendOtp.reset()
								// All 9 digits typed — hide the keyboard so «Получить код» is visible.
								if (isValidLocalPhone(next)) Keyboard.dismiss()
							}}
							keyboardType="phone-pad"
							placeholder="555 12 34 56"
							placeholderTextColor={c.muted}
							style={{
								flex: 1,
								fontSize: 20,
								fontFamily: fontFamily(700),
								letterSpacing: 0.8,
								color: c.ink,
								padding: 0,
							}}
						/>
					</View>
					{error && (
						<Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger }}>{error.message}</Text>
					)}
				</View>

				<View style={{ flex: 1 }} />

				<Button
					label="Получить код"
					disabled={!isValidLocalPhone(phone)}
					loading={sendOtp.isPending}
					onPress={submit}
				/>
			</View>
		</Pressable>
	)
}
