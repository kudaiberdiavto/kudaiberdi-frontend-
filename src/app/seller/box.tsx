import { useState } from 'react'
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { BottomSheet, Button, LanguageSwitch, QueryErrorBanner, Screen, SettingsRow, Toggle } from '@/components/ui'
import { BrandPill, Label } from '@/components/seller-v23'
import { AccountStatusBanner } from '@/components/account-status-banner'
import { fontFamily, raw, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { formatDay } from '@/lib/format'
import { COUNTRY_CODE, formatE164, formatLocalPhone, isValidLocalPhone, toE164 } from '@/lib/phone'
import { useSetRole, useSettings, useUpdateMe, useUpdateSettings } from '@/api/me'
import { useMyShop, useUpdateShop } from '@/api/shop'
import { useShopStats } from '@/api/stats'
import { toLang, useSession } from '@/store/useSession'
import type { MyShop } from '@/api/types'

/** 15 «Мой бокс»: name and phone, row and container, honesty of answers for 30 days, my brands. */
export default function SellerBoxScreen() {
	const c = useColors()
	const shop = useMyShop()
	const stats = useShopStats('MONTH')
	const settings = useSettings()
	const updateSettings = useUpdateSettings()
	const updateMe = useUpdateMe()
	const setRole = useSetRole()
	const lang = useSession((s) => s.lang)
	const signOut = useSession((s) => s.signOut)
	const [editing, setEditing] = useState(false)

	const data = shop.data
	const s = stats.data
	const pausedUntil = s?.requestsPausedUntil

	const changeLang = (next: 'ru' | 'kg') => {
		const apiLang = next === 'kg' ? 'ky' : 'ru'
		useSession.getState().setLang(apiLang)
		updateMe.mutate({ lang: toLang(apiLang) })
	}

	return (
		<Screen padding={0}>
			<View style={{ height: 52, paddingHorizontal: 16, justifyContent: 'center' }}>
				<Text style={{ fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.26, color: c.ink }}>Мой бокс</Text>
			</View>

			<ScrollView contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 16, paddingBottom: 16, gap: 10 }} showsVerticalScrollIndicator={false}>
				<QueryErrorBanner error={shop.error ?? stats.error ?? setRole.error} onRetry={() => shop.refetch()} />
				<AccountStatusBanner
					status={data?.status}
					reason={data?.blockReason}
					kind="shop"
					action={{ label: 'Выбрать другой контейнер', onPress: () => router.push('/box-select') }}
				/>

				<LinearGradient
					colors={['#2D63F0', '#1D46BF']}
					start={{ x: 0.2, y: 0 }}
					end={{ x: 0.8, y: 1 }}
					style={{ borderRadius: 20, padding: 16, gap: 12 }}
				>
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
						<View
							style={{
								width: 48,
								height: 48,
								borderRadius: 24,
								borderWidth: 2,
								borderColor: '#FFFFFF',
								overflow: 'hidden',
								backgroundColor: '#EEEEEE',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							{data?.avatarUrl ? (
								<Image source={{ uri: resolveUrl(data.avatarUrl) }} style={{ width: '100%', height: '100%' }} />
							) : (
								<Text style={{ fontSize: 20, fontFamily: fontFamily(700), color: c.brandStrong }}>
									{data?.name.charAt(0).toUpperCase() ?? ' '}
								</Text>
							)}
						</View>
						<View style={{ flex: 1, gap: 2 }}>
							<Text style={{ fontSize: 20, lineHeight: 25.5, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{data?.name ?? ' '}</Text>
							<Text style={{ fontSize: 15.5, lineHeight: 20, fontFamily: fontFamily(500), color: 'rgba(255,255,255,0.8)' }}>
								{data?.phone ? formatE164(data.phone) : 'Телефон не указан'}
							</Text>
						</View>
						<Pressable
							onPress={() => data && setEditing(true)}
							style={{ height: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center' }}
						>
							<Text style={{ fontSize: 14.5, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Изменить</Text>
						</Pressable>
					</View>
					<View style={{ flexDirection: 'row', gap: 10 }}>
						{data && !data.location ? (
							<Place label="АДРЕС" value={data.address ?? ' '} />
						) : (
							<>
								<Place label="РЯД" value={data?.location?.rowCode ?? ' '} />
								<Place label="КОНТЕЙНЕР" value={data?.location ? String(data.location.number) : ' '} />
							</>
						)}
					</View>
				</LinearGradient>

				<Label>За 30 дней</Label>
				<View style={{ flexDirection: 'row', gap: 8 }}>
					<Stat value={s?.answeredPercent !== null && s?.answeredPercent !== undefined ? `${s.answeredPercent}%` : '—'} label="ответили" color={c.success} />
					<Stat value={s?.avgReplyMinutes ? `${s.avgReplyMinutes} мин` : '—'} label="ср. ответ" />
					<Stat value={s ? String(s.falseHave) : '—'} label="«не было»" color={s && s.falseHave > 0 ? c.danger : undefined} />
				</View>

				{/* Only while paused — the rule itself is not explained up front. */}
				{pausedUntil ? (
					<View style={{ borderRadius: 14, backgroundColor: '#FFF7E6', paddingVertical: 10, paddingHorizontal: 14 }}>
						<Text style={{ fontSize: 15, lineHeight: 21, fontFamily: fontFamily(400), color: '#7A4B00' }}>
							Запросы не приходят до {formatDay(pausedUntil)}: 3 покупателя отметили «сказали есть, а не было».
						</Text>
					</View>
				) : null}

				<View style={{ borderRadius: 18, backgroundColor: c.card, padding: 14, gap: 10 }}>
					<Label
						right={
							<Text onPress={() => router.push('/seller-brands')} style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: c.brandStrong }}>
								Изменить
							</Text>
						}
					>
						Мои марки
					</Label>
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
						{(data?.brands ?? []).map((brand) => (
							<BrandPill key={brand.id} brand={brand} />
						))}
					</View>
				</View>

				<View style={{ borderRadius: 16, backgroundColor: c.card, overflow: 'hidden', marginTop: 6 }}>
					<SettingsRow label="Язык" height={60} right={<LanguageSwitch value={lang === 'ky' ? 'kg' : 'ru'} onChange={changeLang} />} />
					<SettingsRow
						label="Звук нового запроса"
						right={<Toggle value={settings.data?.newRequestSound ?? true} onChange={(value) => updateSettings.mutate({ newRequestSound: value })} />}
					/>
					<SettingsRow
						label="Перейти в режим покупателя"
						value="›"
						valueColor={c.brandStrong}
						valueWeight={700}
						onPress={() => setRole.mutate('BUYER', { onSuccess: () => router.replace('/buyer') })}
					/>
					<SettingsRow
						label="Я мастер / СТО"
						value="›"
						valueColor={c.brandStrong}
						valueWeight={700}
						onPress={() =>
							setRole.mutate('MASTER', {
								onSuccess: (me) => router.replace(me.hasMaster ? '/master' : { pathname: '/master-profile', params: { first: '1' } }),
							})
						}
					/>
					<SettingsRow label="Выйти" labelColor={c.danger} divider={false} onPress={() => signOut()} />
				</View>
			</ScrollView>

			{editing && data ? <EditSheet shop={data} onClose={() => setEditing(false)} /> : null}
		</Screen>
	)
}

function Place({ label, value }: { label: string; value: string }) {
	return (
		<View style={{ flex: 1, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', paddingVertical: 8, paddingHorizontal: 12 }}>
			<Text style={{ fontSize: 12, fontFamily: fontFamily(700), letterSpacing: 1.1, color: 'rgba(255,255,255,0.8)' }}>{label}</Text>
			<Text style={{ fontSize: 34, lineHeight: 35.7, fontFamily: fontFamily(800), color: '#FFFFFF' }}>{value}</Text>
		</View>
	)
}

function Stat({ value, label, color }: { value: string; label: string; color?: string }) {
	const c = useColors()
	return (
		<View style={{ flex: 1, borderRadius: 16, backgroundColor: c.card, padding: 12, gap: 2 }}>
			<Text style={{ fontSize: 24, lineHeight: 31.2, fontFamily: fontFamily(800), letterSpacing: -0.24, color: color ?? c.ink }}>{value}</Text>
			<Text style={{ fontSize: 14.5, lineHeight: 18.5, fontFamily: fontFamily(500), color: c.muted }}>{label}</Text>
		</View>
	)
}

/** «Изменить»: name of the box and the phone buyers call. */
function EditSheet({ shop, onClose }: { shop: MyShop; onClose: () => void }) {
	const c = useColors()
	const update = useUpdateShop()
	const [name, setName] = useState(shop.name)
	const [phone, setPhone] = useState(shop.phone?.startsWith(COUNTRY_CODE) ? formatLocalPhone(shop.phone.slice(COUNTRY_CODE.length)) : '')
	const phoneOk = phone === '' || isValidLocalPhone(phone)

	const save = () =>
		update.mutate(
			{ name: name.trim(), phone: phone ? toE164(phone) : '', phoneVisible: Boolean(phone) },
			{ onSuccess: onClose }
		)

	const field = {
		height: 56,
		borderRadius: 14,
		borderWidth: 2,
		borderColor: c.border,
		backgroundColor: c.card,
		paddingHorizontal: 16,
		fontSize: 18.5,
		fontFamily: fontFamily(600),
		color: c.ink,
	} as const

	return (
		<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
			<BottomSheet
				onClose={onClose}
				header={<Text style={{ fontSize: 22, fontFamily: fontFamily(800), color: c.ink }}>Мой бокс</Text>}
				footer={<Button label="Сохранить" disabled={name.trim().length < 2 || !phoneOk} loading={update.isPending} onPress={save} />}
			>
				<Label>Название</Label>
				<TextInput value={name} onChangeText={setName} maxLength={60} placeholder="Автодеталь Азамат" placeholderTextColor={raw.fillInk} style={field} />
				<Label>Телефон для покупателей</Label>
				<View style={{ ...field, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
					<Text style={{ fontSize: 18.5, fontFamily: fontFamily(700), color: c.muted }}>{COUNTRY_CODE}</Text>
					<TextInput
						value={phone}
						onChangeText={(text) => setPhone(formatLocalPhone(text))}
						keyboardType="phone-pad"
						placeholder="700 11 22 33"
						placeholderTextColor={raw.fillInk}
						style={{ flex: 1, fontSize: 18.5, fontFamily: fontFamily(600), color: c.ink, padding: 0 }}
					/>
				</View>
				{update.error ? <Text style={{ fontSize: 15.5, fontFamily: fontFamily(500), color: c.danger }}>{update.error.message}</Text> : null}
			</BottomSheet>
		</KeyboardAvoidingView>
	)
}
