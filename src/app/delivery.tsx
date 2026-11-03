import { useState, useRef } from 'react'
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, TextInput, View, type TextInputInstance } from 'react-native'
import { Image } from '@/components/ui/image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { BigButton, Caps, priceDigits } from '@/components/buyer-v23'
import { QueryErrorBanner, ScreenHeader } from '@/components/ui'
import { PlayIcon } from '@/components/voice'
import { YellowChip, formatKgPhone } from '@/components/video-v23'
import { fixed, fontFamily, fs, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { usePart } from '@/api/catalog'
import { useMe } from '@/api/me'
import { useCreateDeliveryOrder, useDeliveryTariffs } from '@/api/delivery'
import type { DeliveryRegion, DeliveryRegionCode } from '@/api/types'
import { shopPlace } from '@/lib/shop-place'
import { t } from '@/i18n'

/**
 * «Доставка» — where to (8 regions), the courier brings it home: address, recipient, phone. No delivery prices in
 * the app: the cost is agreed with Ылдам Экспресс directly.
 */
export default function DeliveryScreen() {
	const c = useColors()
	// «Далее» on the keyboard walks the address → name → phone.
	const nameRef = useRef<TextInputInstance>(null)
	const phoneRef = useRef<TextInputInstance>(null)
	const insets = useSafeAreaInsets()
	const partId = Number(useLocalSearchParams<{ partId: string }>().partId) || 0
	const part = usePart(partId).data
	const tariffs = useDeliveryTariffs()
	const me = useMe().data
	const create = useCreateDeliveryOrder()

	const [regionCode, setRegionCode] = useState<DeliveryRegionCode | null>(null)
	const [address, setAddress] = useState('')
	const [name, setName] = useState<string | null>(null)
	const [phone, setPhone] = useState<string | null>(null)

	const regions = tariffs.data?.regions ?? []
	const region = regions.find((item) => item.code === regionCode)
	const recipient = name ?? me?.name ?? ''
	const recipientPhone = phone ?? formatKgPhone(me?.phone)
	const video = part?.video
	const poster = resolveUrl(video?.posterUrl ?? part?.photos[0]?.thumbUrl ?? null)
	const ready = Boolean(region && address.trim() && recipient.trim() && recipientPhone.replace(/\D/g, '').length >= 9)

	const choose = (next: DeliveryRegion) => setRegionCode(next.code)

	const submit = () =>
		region &&
		create.mutate(
			{
				partId,
				region: region.code,
				address: address.trim(),
				recipientName: recipient.trim(),
				recipientPhone: recipientPhone.replace(/[^\d+]/g, ''),
			},
			{
				onSuccess: (order) => {
					router.replace({ pathname: '/delivery-order', params: { id: String(order.id) } })
					// The buyer arranges it with Ылдам: WhatsApp opens with the form filled — from whom, from where, to whom.
					Linking.openURL(order.courierWhatsappUrl)
				},
			}
		)

	const input = {
		height: 48,
		borderRadius: 12,
		borderWidth: 1.5,
		borderColor: c.border,
		backgroundColor: c.card,
		paddingHorizontal: 14,
		fontSize: fs.lg,
		fontFamily: fontFamily(500),
		color: c.ink,
	} as const
	const label = { fontSize: fs.sm, fontFamily: fontFamily(500), color: c.muted } as const

	return (
		<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<ScreenHeader title={t('Доставка')} right={<YellowChip label={tariffs.data?.courierName ?? t('Ылдам Экспресс')} height={28} />} />

			<ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
				{part ? (
					<View style={{ borderRadius: 16, backgroundColor: c.card, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
						<View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: fixed.media, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
							{poster ? <Image source={{ uri: poster }} style={{ position: 'absolute', width: '100%', height: '100%' }} /> : null}
							{video ? <PlayIcon size={20} /> : null}
						</View>
						<View style={{ flex: 1, gap: 2 }}>
							<Text numberOfLines={2} style={{ fontSize: fs.lg, lineHeight: 22, fontFamily: fontFamily(700), color: c.ink }}>
								{part.title}
							</Text>
							<Text numberOfLines={1} style={{ fontSize: fs.sm, fontFamily: fontFamily(400), color: c.muted }}>
								{part.shop.name} · {shopPlace(part.shop).replace(t('Контейнер'), t('конт.'))}
							</Text>
						</View>
						{part.price != null ? (
							<Text style={{ fontSize: fs.xl, fontFamily: fontFamily(800), color: c.ink }}>{t('{0} с', priceDigits(part.price))}</Text>
						) : null}
					</View>
				) : null}

				<QueryErrorBanner error={tariffs.error ?? create.error} onRetry={() => tariffs.refetch()} />

				<Caps>{t('Куда везти')}</Caps>
				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
					{regions.map((item) => {
						const active = item.code === region?.code
						return (
							<Pressable
								key={item.code}
								onPress={() => choose(item)}
								style={{
									flexGrow: 1,
									flexBasis: '45%',
									minHeight: 52,
									borderRadius: 12,
									borderWidth: 2,
									borderColor: active ? c.brand : c.card,
									backgroundColor: active ? c.brandTint : c.card,
									paddingVertical: 7,
									paddingHorizontal: 12,
									justifyContent: 'center',
								}}
							>
								<Text style={{ fontSize: fs.lg, fontFamily: fontFamily(700), color: active ? c.brandStrong : c.ink }}>{item.name}</Text>
							</Pressable>
						)
					})}
				</View>
				<View style={{ height: 2 }} />
				<Caps>{t('Курьер привезёт домой')}</Caps>
				<View style={{ gap: 6 }}>
					<Text style={label}>{region ? t('Адрес в {0}', region.inName) : t('Адрес')}</Text>
					<TextInput value={address} onChangeText={setAddress} placeholder={t('ул. Ленина 45, кв. 12')} placeholderTextColor={c.fillInk} style={input} textContentType="fullStreetAddress" autoComplete="street-address" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => nameRef.current?.focus()} />
				</View>
				<View style={{ flexDirection: 'row', gap: 10 }}>
					<View style={{ flex: 1, gap: 6 }}>
						<Text style={label}>{t('Получатель')}</Text>
						<TextInput ref={nameRef} value={recipient} onChangeText={setName} placeholder={t('Имя')} placeholderTextColor={c.fillInk} style={input} textContentType="name" autoComplete="name" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => phoneRef.current?.focus()} />
					</View>
					<View style={{ flex: 1.2, gap: 6 }}>
						<Text style={label}>{t('Телефон')}</Text>
						<TextInput
							ref={phoneRef}
							value={recipientPhone}
							onChangeText={setPhone}
							keyboardType="phone-pad"
							textContentType="telephoneNumber"
							autoComplete="tel"
							returnKeyType="done"
							placeholder="+996 555 123 456"
							placeholderTextColor={c.fillInk}
							style={input}
						/>
					</View>
				</View>
			</ScrollView>

			<View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 12, gap: 8, backgroundColor: c.surface }}>
				{/* Prices and days are agreed with the courier service itself. */}
				<View style={{ borderRadius: 14, backgroundColor: c.warningTint, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
					<View style={{ flex: 1, gap: 2 }}>
						<Text style={{ fontSize: fs.base, fontFamily: fontFamily(700), color: c.ink }}>{t('Стоимость — у {0}', tariffs.data?.courierName ?? t('Ылдам Экспресс'))}</Text>
						<Text style={{ fontSize: fs.md, lineHeight: 21, fontFamily: fontFamily(400), color: c.inkSecondary }}>{t('Цену доставки обговорите с ними')}</Text>
					</View>
				</View>
				<BigButton label={t('Заказать доставку')} onPress={submit} loading={create.isPending} disabled={!ready} />
			</View>
		</KeyboardAvoidingView>
	)
}
