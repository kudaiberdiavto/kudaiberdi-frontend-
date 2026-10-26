import { useState } from 'react'
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { BigButton, BubbleIcon, Caps, TopBar, priceDigits } from '@/components/buyer-v23'
import { QueryErrorBanner } from '@/components/ui'
import { PlayIcon } from '@/components/voice'
import { ClockOutline, YellowChip, beforeCutoff, daysLabel, formatKgPhone, tariffLabel } from '@/components/video-v23'
import { fontFamily, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { formatPlace } from '@/lib/format'
import { usePart } from '@/api/catalog'
import { useMe } from '@/api/me'
import { useCreateDeliveryOrder, useDeliveryTariffs } from '@/api/delivery'
import type { DeliveryRegion, DeliveryRegionCode } from '@/api/types'

/**
 * «Доставка: регион и способ» — where to (8 regions, remote districts as chips), the courier brings it home: address,
 * recipient, phone. Price and days of the base tariff up to 5 kg; the courier counts the surcharge. Payment for the
 * part — in the chat with the seller.
 */
export default function DeliveryScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const partId = Number(useLocalSearchParams<{ partId: string }>().partId) || 0
	const part = usePart(partId).data
	const tariffs = useDeliveryTariffs()
	const me = useMe().data
	const create = useCreateDeliveryOrder()

	const [regionCode, setRegionCode] = useState<DeliveryRegionCode | null>(null)
	const [district, setDistrict] = useState<string | null>(null)
	const [address, setAddress] = useState('')
	const [name, setName] = useState<string | null>(null)
	const [phone, setPhone] = useState<string | null>(null)

	const regions = tariffs.data?.regions ?? []
	const region = regions.find((item) => item.code === regionCode)
	const picked = region?.districts.find((item) => item.code === district) ?? null
	const days = picked?.days ?? region?.days ?? 1
	const price = picked ? picked.price : (region?.price ?? null)
	const where = picked?.name ?? region?.inName ?? ''
	const recipient = name ?? me?.name ?? ''
	const recipientPhone = phone ?? formatKgPhone(me?.phone)
	const today = beforeCutoff(tariffs.data?.cutoff ?? '17:30')
	const remote = regions.flatMap((item) => item.districts)
	const video = part?.video
	const poster = resolveUrl(video?.posterUrl ?? part?.photos[0]?.thumbUrl ?? null)
	const ready = Boolean(region && address.trim() && recipient.trim() && recipientPhone.replace(/\D/g, '').length >= 9)

	const choose = (next: DeliveryRegion) => {
		setRegionCode(next.code)
		setDistrict(null)
	}

	const submit = () =>
		region &&
		create.mutate(
			{
				partId,
				region: region.code,
				district: district ?? undefined,
				address: address.trim(),
				recipientName: recipient.trim(),
				recipientPhone: recipientPhone.replace(/[^\d+]/g, ''),
			},
			{ onSuccess: (order) => router.replace({ pathname: '/delivery-order', params: { id: String(order.id) } }) }
		)

	const input = {
		height: 48,
		borderRadius: 12,
		borderWidth: 1.5,
		borderColor: c.border,
		backgroundColor: c.card,
		paddingHorizontal: 14,
		fontSize: 16,
		fontFamily: fontFamily(500),
		color: c.ink,
	} as const
	const label = { fontSize: 13, fontFamily: fontFamily(500), color: c.muted } as const

	return (
		<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<TopBar title="Доставка" right={<YellowChip label={tariffs.data?.courierName ?? 'Ылдам Экспресс'} height={28} />} />

			<ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
				{part ? (
					<View style={{ borderRadius: 16, backgroundColor: c.card, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
						<View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: '#1F2329', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
							{poster ? <Image source={{ uri: poster }} style={{ position: 'absolute', width: '100%', height: '100%' }} /> : null}
							{video ? <PlayIcon size={20} /> : null}
						</View>
						<View style={{ flex: 1, gap: 2 }}>
							<Text numberOfLines={2} style={{ fontSize: 16, lineHeight: 20, fontFamily: fontFamily(700), color: c.ink }}>
								{part.title}
							</Text>
							<Text numberOfLines={1} style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
								{part.shop.name} · {formatPlace(part.shop.location).replace('Бокс', 'конт.')}
							</Text>
						</View>
						{part.price != null ? (
							<Text style={{ fontSize: 17, fontFamily: fontFamily(800), color: c.ink }}>{priceDigits(part.price)} с</Text>
						) : null}
					</View>
				) : null}

				<QueryErrorBanner error={tariffs.error ?? create.error} onRetry={() => tariffs.refetch()} />

				<Caps>Куда везти</Caps>
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
								<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: active ? c.brandStrong : c.ink }}>{item.name}</Text>
								<Text style={{ fontSize: 12.5, fontFamily: fontFamily(500), color: active ? c.brand : c.muted }}>{tariffLabel(item.days, item.price)}</Text>
							</Pressable>
						)
					})}
				</View>
				{remote.length ? (
					<Text style={{ fontSize: 12.5, lineHeight: 17, fontFamily: fontFamily(400), color: c.muted }}>
						{joinNames(remote.map((item) => item.name))} — отдалённые: {tariffLabel(remote[0].days, remote[0].price).replace(' · ', ', ')}
					</Text>
				) : null}
				{region?.districts.length ? (
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
						{[{ code: null, name: `${region.name} и область` }, ...region.districts].map((item) => {
							const active = district === item.code
							return (
								<Pressable
									key={item.code ?? 'all'}
									onPress={() => setDistrict(item.code)}
									style={{
										height: 34,
										paddingHorizontal: 12,
										borderRadius: 17,
										borderWidth: 1.5,
										borderColor: active ? c.brand : c.border,
										backgroundColor: active ? c.brandTint : c.card,
										justifyContent: 'center',
									}}
								>
									<Text style={{ fontSize: 13.5, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.brandStrong : c.ink }}>{item.name}</Text>
								</Pressable>
							)
						})}
					</View>
				) : null}
				{tariffs.data?.surchargeNote ? (
					<Text style={{ fontSize: 12.5, lineHeight: 17, fontFamily: fontFamily(400), color: c.muted }}>{tariffs.data.surchargeNote}</Text>
				) : null}

				<View style={{ height: 2 }} />
				<Caps>Курьер привезёт домой</Caps>
				<View style={{ gap: 6 }}>
					<Text style={label}>{region ? `Адрес в ${picked?.name ?? region.inName}` : 'Адрес'}</Text>
					<TextInput value={address} onChangeText={setAddress} placeholder="ул. Ленина 45, кв. 12" placeholderTextColor="#8C8888" style={input} />
				</View>
				<View style={{ flexDirection: 'row', gap: 10 }}>
					<View style={{ flex: 1, gap: 6 }}>
						<Text style={label}>Получатель</Text>
						<TextInput value={recipient} onChangeText={setName} placeholder="Имя" placeholderTextColor="#8C8888" style={input} />
					</View>
					<View style={{ flex: 1.2, gap: 6 }}>
						<Text style={label}>Телефон</Text>
						<TextInput
							value={recipientPhone}
							onChangeText={setPhone}
							keyboardType="phone-pad"
							placeholder="+996 555 123 456"
							placeholderTextColor="#8C8888"
							style={input}
						/>
					</View>
				</View>
			</ScrollView>

			<View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: insets.bottom + 12, gap: 8, backgroundColor: c.surface }}>
				{region ? (
					<View style={{ flexDirection: 'row', alignItems: 'center' }}>
						<Text style={{ flex: 1, fontSize: 14, fontFamily: fontFamily(500), color: c.muted }}>
							{region.code === 'BISHKEK' ? 'Доставка по Бишкеку' : `Доставка в ${where}`} · {daysLabel(days)}
						</Text>
						<Text style={{ fontSize: 15, fontFamily: fontFamily(800), color: c.ink }}>
							{price != null ? `${priceDigits(price)} с` : 'цену назовёт курьер'}
						</Text>
					</View>
				) : (
					<Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.muted }}>Выберите, куда везти</Text>
				)}
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
					<ClockOutline size={16} color={c.success} />
					<Text style={{ flex: 1, fontSize: 13, fontFamily: fontFamily(600), color: c.success }}>
						{today
							? `Закажите до ${tariffs.data?.cutoff ?? '17:30'} — курьер заберёт посылку сегодня`
							: `После ${tariffs.data?.cutoff ?? '17:30'} — курьер заберёт посылку завтра`}
					</Text>
				</View>
				<View style={{ borderRadius: 12, backgroundColor: c.brandTint, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
					<BubbleIcon size={18} color={c.brandStrong} />
					<Text style={{ flex: 1, fontSize: 13.5, fontFamily: fontFamily(600), color: c.brandStrong }}>
						Как оплатить товар — договоритесь с продавцом в чате
					</Text>
				</View>
				<BigButton label="Заказать доставку" tone="green" onPress={submit} loading={create.isPending} disabled={!ready} />
			</View>
		</KeyboardAvoidingView>
	)
}

/** «Чон-Алай, Аксы (Кербен), Ала-Бука и Алай (Гульчо)». */
function joinNames(names: string[]) {
	return names.length < 2 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} и ${names[names.length - 1]}`
}
