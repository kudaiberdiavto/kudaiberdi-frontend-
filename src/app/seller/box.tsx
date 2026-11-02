import { useState } from 'react'
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Linking, Platform, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native'
import { Image } from '@/components/ui/image'
import { router } from 'expo-router'
import { usePullRefresh } from '@/lib/use-pull-refresh'
import { API_URL } from '@/lib/env'
import Svg, { Path } from 'react-native-svg'
import { BottomSheet, Button, EmptyState, LanguageSwitch, PhotoPlaceholder, QueryErrorBanner, Screen, SettingsRow, Skeleton, Toggle, toast } from '@/components/ui'
import { PlusIcon, TagIcon } from '@/components/icons'
import { Label } from '@/components/seller-v23'
import { BrandLogo } from '@/components/ui/brand'
import { AccountStatusBanner } from '@/components/account-status-banner'
import { fixed, fontFamily, fs, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { formatDay } from '@/lib/format'
import { COUNTRY_CODE, formatE164, formatLocalPhone, isValidLocalPhone, toE164 } from '@/lib/phone'
import { useSettings, useUpdateMe, useUpdateSettings } from '@/api/me'
import { useMyShop, useSetShopAvatar, useUpdateShop } from '@/api/shop'
import { usePhotoUploads } from '@/api/media'
import { useMyParts, useMyPartsSummary } from '@/api/parts'
import { flattenPages } from '@/api/pagination'
import { usePartDraft } from '@/store/usePartDraft'
import { useShopStats } from '@/api/stats'
import { toLang, useSession } from '@/store/useSession'
import type { MyPartItem, MyShop } from '@/api/types'
import { openSupport } from '@/lib/support'
import { t } from '@/i18n'

/**
 * 15 «Мой бокс» — a profile like on social apps: avatar (tap — change), counters, name and place, my brands,
 * «Изменить» / «Выложить», and a grid of my posts (video ones — the poster with ▶). Settings and the 30-day numbers
 * live behind ☰.
 */
export default function SellerBoxScreen() {
	const c = useColors()
	const { width } = useWindowDimensions()
	const shop = useMyShop()
	const summary = useMyPartsSummary()
	const parts = useMyParts('ALL')
	const items = flattenPages(parts.data)
	const pull = usePullRefresh(() => [shop.refetch(), parts.refetch(), summary.refetch()])
	const setAvatar = useSetShopAvatar()
	const avatarUpload = usePhotoUploads('AVATAR', 1, (photo) => setAvatar.mutateAsync(photo.id))
	const [editing, setEditing] = useState(false)
	const [menu, setMenu] = useState(false)

	const data = shop.data
	const tile = (width - 4) / 3
	const place = data ? (data.location ? t('Ряд {0} · Контейнер {1}', data.location.rowCode, data.location.number) : (data.address ?? '')) : ''
	const avatarBusy = avatarUpload.photos.length > 0 || setAvatar.isPending

	const newPart = () => {
		usePartDraft.getState().reset()
		router.push('/new-part')
	}

	const header = (
		<View style={{ paddingHorizontal: 16, paddingBottom: 14, gap: 12 }}>
			<QueryErrorBanner error={shop.error ?? parts.error ?? setAvatar.error} onRetry={() => shop.refetch()} />
			<AccountStatusBanner
				status={data?.status}
				reason={data?.blockReason}
				kind="shop"
				action={{ label: t('Выбрать другой контейнер'), onPress: () => router.push('/box-select') }}
			/>

			<View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
				{shop.isLoading ? (
					<Skeleton width={80} height={80} radius={40} />
				) : (
				<Pressable onPress={() => avatarUpload.pick('library')} disabled={avatarBusy}>
						<View
							style={{
								width: 80,
								height: 80,
								borderRadius: 40,
								overflow: 'hidden',
								backgroundColor: c.brandTint,
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							{data?.avatarUrl ? (
								<Image source={{ uri: resolveUrl(data.avatarUrl) }} style={{ width: '100%', height: '100%' }} />
							) : (
								<Text style={{ fontSize: fs.hero, fontFamily: fontFamily(700), color: c.brandStrong }}>{data?.name.charAt(0).toUpperCase() ?? ' '}</Text>
							)}
							{avatarBusy ? (
								<View
									style={{
										position: 'absolute',
										left: 0,
										top: 0,
										right: 0,
										bottom: 0,
										backgroundColor: 'rgba(0,0,0,0.35)',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<ActivityIndicator color={fixed.white} />
								</View>
							) : null}
						</View>
	</Pressable>
				)}
				<View style={{ flex: 1, flexDirection: 'row' }}>
					<Counter value={summary.data ? String(summary.data.all) : '—'} label={t('товаров')} />
					<Counter value={data?.reviewsCount ? data.rating.toFixed(1) : '—'} label={t('рейтинг')} star={Boolean(data?.reviewsCount)} />
					<Counter value={data ? String(data.reviewsCount) : '—'} label={t('отзывов')} />
				</View>
			</View>

			{shop.isLoading ? (
				<View style={{ gap: 8 }}>
					<Skeleton width="65%" height={16} />
					<Skeleton width="40%" height={14} />
				</View>
			) : null}
			<View style={{ gap: 2 }}>
				{place ? (
					<Text numberOfLines={2} style={{ fontSize: fs.md, lineHeight: 21, fontFamily: fontFamily(500), color: c.ink }}>
						{place}
					</Text>
				) : null}
				{data?.phone ? <Text style={{ fontSize: fs.md, fontFamily: fontFamily(400), color: c.muted }}>{formatE164(data.phone)}</Text> : null}
			</View>

			{data?.brands.length ? (
				<Pressable onPress={() => router.push('/seller-brands')} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
					{data.brands.map((brand) => (
						<View
							key={brand.id}
							style={{ height: 30, paddingLeft: 4, paddingRight: 10, borderRadius: 15, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', gap: 6 }}
						>
							<BrandLogo brand={brand} size={22} />
							<Text style={{ fontSize: fs.sm, fontFamily: fontFamily(600), color: c.ink }}>{brand.name}</Text>
						</View>
					))}
				</Pressable>
			) : null}

			<View style={{ flexDirection: 'row', gap: 8 }}>
				<Button label={t('Изменить')} variant="secondary" height={40} radius={10} fontSize={15.5} style={{ flex: 1 }} onPress={() => data && setEditing(true)} />
				<Button label={t('Выложить')} variant="secondary" height={40} radius={10} fontSize={15.5} icon={PlusIcon} style={{ flex: 1 }} onPress={newPart} />
			</View>
		</View>
	)

	return (
		<Screen padding={0}>
			<View style={{ height: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
				{shop.isLoading ? (
					<View style={{ flex: 1 }}>
						<Skeleton width={180} height={22} />
					</View>
				) : (
					<Text numberOfLines={1} style={{ flex: 1, fontSize: fs.h3, fontFamily: fontFamily(700), letterSpacing: -0.22, color: c.ink }}>
						{data?.name ?? t('Мой контейнер')}
					</Text>
				)}
				<Pressable accessibilityRole="button" accessibilityLabel={t('Меню')} onPress={() => setMenu(true)} hitSlop={10} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
					<Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={c.ink} strokeWidth={2.2} strokeLinecap="round">
						<Path d="M4 7h16M4 12h16M4 17h16" />
					</Svg>
				</Pressable>
			</View>

			<FlatList
				data={items}
				keyExtractor={(item) => String(item.id)}
				numColumns={3}
				columnWrapperStyle={{ gap: 2 }}
				contentContainerStyle={{ gap: 2, paddingBottom: 24 }}
				showsVerticalScrollIndicator={false}
				ListHeaderComponent={header}
				onEndReached={() => parts.hasNextPage && !parts.isFetchingNextPage && parts.fetchNextPage()}
				onRefresh={pull.onRefresh}
				refreshing={pull.refreshing}
				ListEmptyComponent={
					parts.isLoading ? (
						<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
							{Array.from({ length: 9 }, (_, i) => (
								<Skeleton key={i} width={tile} height={tile} radius={0} />
							))}
						</View>
					) : (
						<View style={{ paddingTop: 40 }}>
							<EmptyState title={t('Публикаций нет')} icon={TagIcon} />
						</View>
					)
				}
				renderItem={({ item }) => <PostTile part={item} size={tile} />}
			/>

			{editing && data ? <EditSheet shop={data} onClose={() => setEditing(false)} /> : null}
			{menu ? <MenuSheet onClose={() => setMenu(false)} /> : null}
		</Screen>
	)
}

function Counter({ value, label, star }: { value: string; label: string; star?: boolean }) {
	const c = useColors()
	return (
		<View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
			<Text numberOfLines={1} style={{ fontSize: fs.xl, fontFamily: fontFamily(700), color: c.ink }}>
				{star ? <Text style={{ color: fixed.star }}>★ </Text> : null}
				{value}
			</Text>
			<Text numberOfLines={1} style={{ fontSize: fs.sm, fontFamily: fontFamily(400), color: c.muted }}>
				{label}
			</Text>
		</View>
	)
}

/** A square of the grid: the photo (or the video's poster with ▶); drafts, the archive and «нет» — faded. Tap — edit. */
function PostTile({ part, size }: { part: MyPartItem; size: number }) {
	const c = useColors()
	const photo = resolveUrl(part.videoPosterUrl ?? part.mainPhoto?.thumbUrl ?? part.mainPhoto?.url)
	const off = part.status !== 'ACTIVE' || part.stockStatus !== 'IN_STOCK'
	return (
		<Pressable
			onPress={() => router.push({ pathname: '/new-part', params: { id: String(part.id) } })}
			style={{ width: size, height: size, backgroundColor: c.card }}
		>
			{photo ? (
				<Image source={{ uri: photo }} style={{ width: '100%', height: '100%', opacity: off ? 0.5 : 1 }} />
			) : (
				<PhotoPlaceholder width={size} height={size} radius={0} />
			)}
			{part.videoPosterUrl ? (
				<View style={{ position: 'absolute', right: 6, top: 6 }}>
					<Svg width={18} height={18} viewBox="0 0 24 24" fill={fixed.white}>
						<Path d="M8 5.5v13l10-6.5z" />
					</Svg>
				</View>
			) : null}
			{part.status === 'DRAFT' ? (
				<View
					style={{
						position: 'absolute',
						left: 6,
						bottom: 6,
						height: 22,
						paddingHorizontal: 7,
						borderRadius: 6,
						backgroundColor: 'rgba(0,0,0,0.6)',
						justifyContent: 'center',
					}}
				>
					<Text style={{ fontSize: fs.xs, fontFamily: fontFamily(700), color: fixed.white }}>{t('Черновик')}</Text>
				</View>
			) : null}
		</Pressable>
	)
}

/** ☰: the 30-day numbers, my brands, language, sound, switching the role, sign out. */
function MenuSheet({ onClose }: { onClose: () => void }) {
	const c = useColors()
	const stats = useShopStats('MONTH')
	const settings = useSettings()
	const updateSettings = useUpdateSettings()
	const updateMe = useUpdateMe()
	const lang = useSession((st) => st.lang)
	const signOut = useSession((st) => st.signOut)
	const s = stats.data
	const pausedUntil = s?.requestsPausedUntil

	const changeLang = (next: 'ru' | 'kg') => {
		const apiLang = next === 'kg' ? 'ky' : 'ru'
		useSession.getState().setLang(apiLang)
		updateMe.mutate({ lang: toLang(apiLang) })
	}

	const openBrands = () => {
		onClose()
		router.push('/seller-brands')
	}

	return (
		<BottomSheet onClose={onClose} maxHeight={0.85} header={<Text style={{ fontSize: fs.h3, fontFamily: fontFamily(800), color: c.ink }}>{t('Настройки')}</Text>}>
			<QueryErrorBanner error={stats.error} />
			<Label>{t('За 30 дней')}</Label>
			<View style={{ flexDirection: 'row', gap: 8 }}>
				<Stat value={s?.answeredPercent !== null && s?.answeredPercent !== undefined ? `${s.answeredPercent}%` : '—'} label={t('ответили')} color={c.success} />
				<Stat value={s?.avgReplyMinutes ? t('{0} мин', s.avgReplyMinutes) : '—'} label={t('ср. ответ')} />
				<Stat value={s ? String(s.falseHave) : '—'} label={t('«не было»')} color={s && s.falseHave > 0 ? c.danger : undefined} />
			</View>
			{/* Only while paused — the rule itself is not explained up front. */}
			{pausedUntil ? (
				<View style={{ borderRadius: 14, backgroundColor: c.warningTint, paddingVertical: 10, paddingHorizontal: 14 }}>
					<Text style={{ fontSize: fs.md, lineHeight: 21, fontFamily: fontFamily(400), color: c.warningInk }}>
						{t('Запросы не приходят до {0}: 3 покупателя отметили «сказали есть, а не было».', formatDay(pausedUntil))}
					</Text>
				</View>
			) : null}

			<View style={{ borderRadius: 16, backgroundColor: c.surface, overflow: 'hidden', marginTop: 6 }}>
				<SettingsRow label={t('Мои марки')} value="›" valueColor={c.brandStrong} valueWeight={700} onPress={openBrands} />
				<SettingsRow label={t('Язык')} height={60} right={<LanguageSwitch value={lang === 'ky' ? 'kg' : 'ru'} onChange={changeLang} />} />
				<SettingsRow
					label={t('Звук нового запроса')}
					right={<Toggle value={settings.data?.newRequestSound ?? true} onChange={(value) => updateSettings.mutate({ newRequestSound: value })} />}
				/>
				<SettingsRow label={t('Помощь в WhatsApp')} value="›" onPress={openSupport} />
				<SettingsRow label={t('Политика конфиденциальности')} value="›" onPress={() => Linking.openURL(`${API_URL}/privacy`)} />
					<SettingsRow label={t('Выйти')} labelColor={c.danger} onPress={() => signOut()} />
					<SettingsRow label={t('Удалить аккаунт')} labelColor={c.muted} divider={false} onPress={() => {
						onClose()
						router.push('/delete-account')
					}}
				/>
			</View>
		</BottomSheet>
	)
}

function Stat({ value, label, color }: { value: string; label: string; color?: string }) {
	const c = useColors()
	return (
		<View style={{ flex: 1, borderRadius: 16, backgroundColor: c.card, padding: 12, gap: 2 }}>
			<Text style={{ fontSize: fs.h2, lineHeight: 31.2, fontFamily: fontFamily(800), letterSpacing: -0.24, color: color ?? c.ink }}>{value}</Text>
			<Text style={{ fontSize: fs.sm, lineHeight: 18.5, fontFamily: fontFamily(500), color: c.muted }}>{label}</Text>
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
			{ onSuccess: () => (toast(t('Сохранено')), onClose()) }
		)

	const field = {
		height: 56,
		borderRadius: 14,
		borderWidth: 2,
		borderColor: c.border,
		backgroundColor: c.card,
		paddingHorizontal: 16,
		fontSize: fs.xl,
		fontFamily: fontFamily(600),
		color: c.ink,
	} as const

	return (
		<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
			<BottomSheet
				onClose={onClose}
				header={<Text style={{ fontSize: fs.h3, fontFamily: fontFamily(800), color: c.ink }}>{t('Мой контейнер')}</Text>}
				footer={<Button label={t('Сохранить')} disabled={name.trim().length < 2 || !phoneOk} loading={update.isPending} onPress={save} />}
			>
				<Label>{t('Название')}</Label>
				<TextInput value={name} onChangeText={setName} maxLength={60} placeholder={t('Автодеталь Азамат')} placeholderTextColor={c.fillInk} style={field} />
				<Label>{t('Телефон для покупателей')}</Label>
				<View style={{ ...field, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
					<Text style={{ fontSize: fs.xl, fontFamily: fontFamily(700), color: c.muted }}>{COUNTRY_CODE}</Text>
					<TextInput
						value={phone}
						onChangeText={(text) => setPhone(formatLocalPhone(text))}
						keyboardType="phone-pad"
						placeholder="700 11 22 33"
						placeholderTextColor={c.fillInk}
						style={{ flex: 1, fontSize: fs.xl, fontFamily: fontFamily(600), color: c.ink, padding: 0 }}
					/>
				</View>
				{update.error ? <Text style={{ fontSize: fs.md, fontFamily: fontFamily(500), color: c.danger }}>{update.error.message}</Text> : null}
			</BottomSheet>
		</KeyboardAvoidingView>
	)
}
