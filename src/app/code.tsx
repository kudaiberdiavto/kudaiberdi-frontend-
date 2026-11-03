import { useEffect, useRef, useState } from 'react'
import { Keyboard, Pressable, Text, TextInput, View, type TextInputInstance } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { ChevronLeftIcon } from '@/components/icons'
import { AUTH_FIELD_HEIGHT, AuthLayout } from '@/components/auth-layout'
import { fontFamily, fs, useColors } from '@/theme'
import { ApiError } from '@/lib/api'
import { formatE164 } from '@/lib/phone'
import { useSendOtp, useVerifyOtp } from '@/api/auth'
import { homeHref } from '@/store/useSession'
import { t } from '@/i18n'

const CODE_LENGTH = 4

function formatCountdown(seconds: number) {
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export default function CodeScreen() {
	const c = useColors()
	const params = useLocalSearchParams<{ phone: string; resendIn?: string; debugCode?: string }>()
	const phone = params.phone
	// Dev backend returns the code in `debugCode` — prefill it instead of waiting for an SMS.
	const [code, setCode] = useState(__DEV__ ? (params.debugCode ?? '') : '')
	const [secondsLeft, setSecondsLeft] = useState(Number(params.resendIn) || 0)
	const inputRef = useRef<TextInputInstance>(null)
	const verify = useVerifyOtp()
	const resend = useSendOtp()
	const error = (verify.error ?? resend.error) as ApiError | Error | null

	useEffect(() => {
		if (secondsLeft <= 0) return
		const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
		return () => clearInterval(id)
	}, [secondsLeft])

	useEffect(() => {
		if (code.length < CODE_LENGTH) return
		Keyboard.dismiss()
		verify.mutate(
			{ phone, code },
			{
				onSuccess: ({ user }) => router.replace(homeHref(user)),
				onError: () => setCode(''),
			}
		)
		// eslint-disable-next-line react-hooks/exhaustive-deps -- submit once per completed code
	}, [code])

	const sendAgain = () => {
		verify.reset()
		setCode('')
		resend.mutate(phone, {
			onSuccess: (response) => {
				setSecondsLeft(response.resendIn)
				if (__DEV__ && response.debugCode) setCode(response.debugCode)
			},
			onError: (e) => {
				if (e instanceof ApiError && e.retryAfter) setSecondsLeft(e.retryAfter)
			},
		})
	}

	const errorText =
		error instanceof ApiError && error.code === 'OTP_INVALID' && typeof error.extra.attemptsLeft === 'number'
			? t('{0}. Осталось попыток: {1}', error.message, error.extra.attemptsLeft)
			: error?.message

	return (
		<AuthLayout
			topBar={
				<Pressable accessibilityRole="button" accessibilityLabel={t('Назад')}
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
			}
			header={
				<Text style={{ fontSize: fs.hero, lineHeight: 40, fontFamily: fontFamily(800), letterSpacing: -0.64, color: c.ink }}>{t('Код из SMS')}</Text>
			}
			label={t('Отправили на {0}', formatE164(phone))}
			field={
				<>
					<Pressable onPress={() => inputRef.current?.focus()} style={{ flexDirection: 'row', gap: 12 }}>
						{Array.from({ length: CODE_LENGTH }).map((_, index) => {
							const digit = code[index]
							const isActive = index === code.length
							return (
								<View
									key={index}
									style={{
										flex: 1,
										height: AUTH_FIELD_HEIGHT,
										borderRadius: 14,
										borderWidth: 2,
										borderColor: error ? c.danger : isActive ? c.brand : c.border,
										backgroundColor: c.card,
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									{digit ? (
										<Text style={{ fontSize: fs.display, fontFamily: fontFamily(700), color: c.ink }}>{digit}</Text>
									) : isActive ? (
										<View style={{ width: 2, height: 28, backgroundColor: c.brand }} />
									) : null}
								</View>
							)
						})}
					</Pressable>
					<TextInput
						ref={inputRef}
						value={code}
						onChangeText={(text) => {
							if (verify.isPending) return
							verify.reset()
							setCode(text.replace(/\D/g, '').slice(0, CODE_LENGTH))
						}}
						keyboardType="number-pad"
						// iOS offers the code from the SMS above the keyboard, Android fills it from the SMS.
						textContentType="oneTimeCode"
						autoComplete="sms-otp"
						maxLength={CODE_LENGTH}
						style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
					/>
				</>
			}
			below={
				<>
					{errorText ? <Text style={{ fontSize: fs.md, fontFamily: fontFamily(500), color: c.danger }}>{errorText}</Text> : null}
					<Text style={{ fontSize: fs.md, fontFamily: fontFamily(400), color: c.muted }}>
						{secondsLeft > 0 ? (
							<>
								{t('Отправить снова через')}{' '}
								<Text style={{ fontFamily: fontFamily(700), color: c.ink }}>{formatCountdown(secondsLeft)}</Text>
							</>
						) : (
							<Text onPress={resend.isPending ? undefined : sendAgain} style={{ fontFamily: fontFamily(700), color: c.brandStrong }}>{t('Отправить код снова')}</Text>
						)}
					</Text>
				</>
			}
		/>
	)
}
