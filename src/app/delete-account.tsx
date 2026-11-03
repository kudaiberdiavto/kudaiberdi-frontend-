import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMutation } from '@tanstack/react-query'

import { Button, ScreenHeader } from '@/components/ui'
import { fontFamily, fs, useColors } from '@/theme'
import { apiFetch } from '@/lib/api'
import { formatDay } from '@/lib/format'
import { useSession } from '@/store/useSession'
import type { components } from '@/api/schema'
import { t } from '@/i18n'

type SendOtp = components['schemas']['SendOtpResponse']
type Deletion = components['schemas']['DeletionResponse']

/**
 * «Удалить аккаунт» (App Store 5.1.1(v), Google Play): SMS-код на свой номер → подтверждение. Сессии закрываются
 * сразу, данные стираются через 30 дней; вход до этого срока отменяет удаление.
 */
export default function DeleteAccountScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const [code, setCode] = useState('')
	const send = useMutation({ mutationFn: () => apiFetch<SendOtp>('/me/deletion/otp', { method: 'POST' }) })
	const confirm = useMutation({
		mutationFn: () => apiFetch<Deletion>('/me/deletion', { method: 'POST', body: { code } }),
	})
	const error = send.error ?? confirm.error

	if (confirm.data) {
		return (
			<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
				<View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 14 }}>
					<Text style={{ fontSize: fs.h2, fontFamily: fontFamily(800), color: c.ink }}>{t('Аккаунт удалён')}</Text>
					<Text style={{ fontSize: fs.lg, lineHeight: 24, fontFamily: fontFamily(400), color: c.inkSecondary }}>
						{t('Данные сотрём {0}. Если передумаете — просто войдите по номеру до этой даты.', formatDay(confirm.data.purgeAt))}
					</Text>
				</View>
				<View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 12 }}>
					<Button label={t('Готово')} onPress={() => useSession.getState().signOut()} />
				</View>
			</View>
		)
	}

	return (
		<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<ScreenHeader title={t('Удалить аккаунт')} />
			<ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
				<View style={{ borderRadius: 16, backgroundColor: c.card, padding: 16, gap: 8 }}>
					<Text style={{ fontSize: fs.lg, fontFamily: fontFamily(700), color: c.ink }}>{t('Что удалится')}</Text>
					<Text style={{ fontSize: fs.base, lineHeight: 23, fontFamily: fontFamily(400), color: c.inkSecondary }}>{t('Профиль, номер телефона, машины, избранное, запросы и заявки. Магазин и профиль мастера пропадут из поиска, сообщения в чатах будут скрыты. Через 30 дней данные сотрутся навсегда.')}</Text>
				</View>

				{send.data ? (
					<>
						<Text style={{ fontSize: fs.md, fontFamily: fontFamily(600), color: c.muted }}>{t('Код из SMS')}</Text>
						<TextInput
							value={code}
							onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 4))}
							keyboardType="number-pad"
							autoFocus
							placeholder="••••"
							placeholderTextColor={c.fillInk}
							style={{
								height: 64,
								borderRadius: 14,
								borderWidth: 2,
								borderColor: c.border,
								backgroundColor: c.card,
								textAlign: 'center',
								fontSize: fs.display,
								letterSpacing: 12,
								fontFamily: fontFamily(700),
								color: c.ink,
							}}
						/>
					</>
				) : null}

				{error ? <Text style={{ fontSize: fs.md, fontFamily: fontFamily(500), color: c.danger }}>{error.message}</Text> : null}
			</ScrollView>

			<View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 12 }}>
				{send.data ? (
					<Button label={t('Удалить аккаунт')} disabled={code.length < 4} loading={confirm.isPending} onPress={() => confirm.mutate()} style={{ backgroundColor: c.danger }} />
				) : (
					<Button label={t('Получить код')} variant="secondary" loading={send.isPending} onPress={() => send.mutate()} />
				)}
			</View>
		</KeyboardAvoidingView>
	)
}
