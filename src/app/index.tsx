import { useEffect, useState } from 'react'
import { Image, Keyboard, Linking, Pressable, Text, TextInput, View } from 'react-native'
import { Redirect, router } from 'expo-router'
import { useVideoPlayer, VideoView } from 'expo-video'
import { Button } from '@/components/ui'
import { AUTH_FIELD_HEIGHT, AuthLayout } from '@/components/auth-layout'
import { fontFamily, useColors } from '@/theme'
import { COUNTRY_CODE, formatLocalPhone, isValidLocalPhone, toE164 } from '@/lib/phone'
import { ApiError } from '@/lib/api'
import { API_URL } from '@/lib/env'
import { useSendOtp } from '@/api/auth'
import { homeHref, useSession } from '@/store/useSession'
import { t } from '@/i18n'

const LANGS = [
	{ value: 'ru', label: 'RU' },
	{ value: 'ky', label: 'KG' },
] as const

export default function PhoneScreen() {
	const c = useColors()
	// silent, endless — it is part of the screen, not a video to watch
	const logoLoop = useVideoPlayer(require('../../assets/video/login-loop.mp4'), (p) => {
		p.loop = true
		p.muted = true
		p.play()
	})
	// on the web the first play() comes before the file is loaded — start again once it is ready
	useEffect(() => {
		const sub = logoLoop.addListener('statusChange', ({ status }) => status === 'readyToPlay' && logoLoop.play())
		return () => sub.remove()
	}, [logoLoop])
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
		<AuthLayout
			topBar={
				// RU / KG right away [01]
				<View
					style={{
						marginLeft: 'auto',
						height: 34,
						borderRadius: 17,
						backgroundColor: c.card,
						borderWidth: 1.5,
						borderColor: c.border,
						flexDirection: 'row',
						padding: 2,
					}}
				>
					{LANGS.map(({ value, label }) => {
						const active = lang === value
						return (
							<Pressable
								key={value}
								onPress={() => setLang(value)}
								style={{
									width: 40,
									borderRadius: 15,
									alignItems: 'center',
									justifyContent: 'center',
									backgroundColor: active ? c.brand : 'transparent',
								}}
							>
								<Text style={{ fontSize: 14.5, fontFamily: fontFamily(700), color: active ? '#FFFFFF' : c.muted }}>
									{label}
								</Text>
							</Pressable>
						)
					})}
				</View>
			}
			header={
				// The brand card: a pre-rendered 3D loop (the logo comes apart like a watch), the name over it
				<View style={{ marginTop: 12, borderRadius: 28, overflow: 'hidden', aspectRatio: 1086 / 690, backgroundColor: '#1C44B8' }}>
					<Image source={require('../../assets/video/login-poster.jpg')} style={{ position: 'absolute', width: '100%', height: '100%' }} />
					<VideoView player={logoLoop} nativeControls={false} contentFit="cover" style={{ position: 'absolute', width: '100%', height: '100%' }} />
					<View style={{ position: 'absolute', left: 0, right: 0, bottom: 16, alignItems: 'center', gap: 2 }}>
						<Text style={{ fontSize: 28, lineHeight: 34, fontFamily: fontFamily(800), letterSpacing: -0.5, color: '#FFFFFF' }}>KUDAIBERDI</Text>
						<Text style={{ fontSize: 15.5, lineHeight: 21, fontFamily: fontFamily(500), color: 'rgba(255,255,255,0.85)' }}>{t('Авторынок запчастей в Бишкеке')}</Text>
					</View>
				</View>
			}
			label={t('Номер телефона')}
			field={
				<View
					style={{
						height: AUTH_FIELD_HEIGHT,
						borderRadius: 14,
						borderWidth: 2,
						borderColor: error ? c.danger : c.brand,
						backgroundColor: c.card,
						paddingHorizontal: 16,
						flexDirection: 'row',
						alignItems: 'center',
						gap: 12,
					}}
				>
					<Text style={{ fontSize: 20, fontFamily: fontFamily(700), color: c.ink }}>{COUNTRY_CODE}</Text>
					<View style={{ width: 1.5, height: 26, backgroundColor: c.border }} />
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
						style={{ flex: 1, fontSize: 20, fontFamily: fontFamily(400), letterSpacing: 0.4, color: c.ink, padding: 0 }}
					/>
				</View>
			}
			below={
				error ? (
					<Text style={{ fontSize: 15.5, fontFamily: fontFamily(500), color: c.danger }}>{error.message}</Text>
				) : (
					<Text style={{ fontSize: 15.5, fontFamily: fontFamily(400), color: c.muted }}>{t('Отправим SMS с кодом')}</Text>
				)
			}
			footer={
				<View style={{ gap: 12 }}>
					<Button label={t('Получить код')} disabled={!isValidLocalPhone(phone)} loading={sendOtp.isPending} onPress={submit} />
					{/* Entering means accepting the rules (App Store 1.2: user content needs agreed terms). */}
					<Text style={{ fontSize: 13.5, lineHeight: 19, fontFamily: fontFamily(400), color: c.muted, textAlign: 'center' }}>
						{t('Продолжая, вы принимаете')}{' '}
						<Text onPress={() => Linking.openURL(`${API_URL}/terms`)} style={{ color: c.brandStrong }}>{t('Правила пользования')}</Text>{' '}
						{t('и')}{' '}
						<Text onPress={() => Linking.openURL(`${API_URL}/privacy`)} style={{ color: c.brandStrong }}>{t('Политику конфиденциальности')}</Text>
					</Text>
				</View>
			}
		/>
	)
}
