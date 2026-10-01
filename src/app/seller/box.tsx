import { Image, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Avatar, LanguageSwitch, QueryErrorBanner, Screen, SectionLabel, SettingsRow, Toggle } from '@/components/ui'
import { fontFamily, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { formatHours, formatPlace } from '@/lib/format'
import { useSetRole, useSettings, useUpdateMe, useUpdateSettings } from '@/api/me'
import { useMyShop, useSetShopOpen } from '@/api/shop'
import { toLang, useSession } from '@/store/useSession'
import { AccountStatusBanner } from '@/components/account-status-banner'

/** 21 — seller's profile tab «Мой бокс». */
export default function SellerBoxProfileScreen() {
	const c = useColors()
	const shop = useMyShop()
	const setOpen = useSetShopOpen()
	const settings = useSettings()
	const updateSettings = useUpdateSettings()
	const updateMe = useUpdateMe()
	const setRole = useSetRole()
	const lang = useSession((s) => s.lang)
	const signOut = useSession((s) => s.signOut)

	const data = shop.data
	const open = data?.isOpen ?? true
	const rating = data?.reviewsCount ? ` · ★ ${data.rating.toFixed(1)} · ${data.reviewsCount} отзывов` : ''

	const changeLang = (next: 'ru' | 'kg') => {
		const apiLang = next === 'kg' ? 'ky' : 'ru'
		useSession.getState().setLang(apiLang)
		updateMe.mutate({ lang: toLang(apiLang) })
	}

	return (
		<Screen>
			<View style={{ paddingTop: 8, gap: 14, flex: 1 }}>
				<QueryErrorBanner error={shop.error ?? setOpen.error ?? updateSettings.error ?? setRole.error} onRetry={() => shop.refetch()} />
				<AccountStatusBanner
					status={shop.data?.status}
					reason={shop.data?.blockReason}
					kind="shop"
					action={{ label: 'Выбрать другой контейнер', onPress: () => router.push('/box-select') }}
				/>

				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
					{data?.avatarUrl ? (
						<Image source={{ uri: resolveUrl(data.avatarUrl) }} style={{ width: 60, height: 60, borderRadius: 18 }} />
					) : (
						<Avatar letter={data?.name.charAt(0).toUpperCase() ?? ' '} size={60} radius={18} fontSize={24} />
					)}
					<View style={{ flex: 1, gap: 3 }}>
						<Text style={{ fontSize: 20, fontFamily: fontFamily(700), color: c.ink }}>{data?.name ?? ' '}</Text>
						<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>{data ? `${formatPlace(data.location)}${rating}` : ' '}</Text>
					</View>
				</View>

				<View
					style={{
						borderRadius: 16,
						backgroundColor: c.card,
						borderWidth: 2,
						borderColor: c.border,
						paddingVertical: 14,
						paddingHorizontal: 16,
						flexDirection: 'row',
						alignItems: 'center',
						gap: 12,
					}}
				>
					<View style={{ flex: 1, gap: 3 }}>
						<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>{open ? 'Бокс открыт' : 'Бокс закрыт'}</Text>
						<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>
							{open ? 'Запросы приходят' : `Запросы не приходят. Откроется в ${formatHours(data?.open.openFrom) || '08:00'}`}
						</Text>
					</View>
					<Toggle value={open} onChange={(value) => data && setOpen.mutate(value)} />
				</View>

				{/* Only when the server requires a place check (off for now). */}
				{data?.verification.required ? (
					<View style={{ borderRadius: 16, backgroundColor: c.card, overflow: 'hidden' }}>
						<SettingsRow label="Подтвердить место по QR" labelColor={c.danger} value="›" divider={false} onPress={() => router.push('/verify-box')} />
					</View>
				) : null}

				<View style={{ borderRadius: 16, backgroundColor: c.card, overflow: 'hidden' }}>
					<SettingsRow label="Мой бокс, марки, часы" value="›" onPress={() => router.push('/box-photos')} />
					<SettingsRow label="Отзывы" value={`${data?.reviewsCount ?? 0} ›`} />
					{/* staffCount counts STAFF only — plus the owner. */}
					<SettingsRow label="Продавцы в боксе" value={`${(data?.staffCount ?? 0) + 1} ›`} divider={false} />
				</View>

				<SectionLabel style={{ paddingTop: 4 }}>Настройки</SectionLabel>

				<View style={{ borderRadius: 16, backgroundColor: c.card, overflow: 'hidden' }}>
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
						divider={false}
						onPress={() =>
							setRole.mutate('MASTER', {
								onSuccess: (me) => router.replace(me.hasMaster ? '/master' : { pathname: '/master-profile', params: { first: '1' } }),
							})
						}
					/>
				</View>

				<View style={{ borderRadius: 16, backgroundColor: c.card, overflow: 'hidden' }}>
					<SettingsRow label="Поддержка" />
					<SettingsRow label="Выйти" labelColor={c.danger} divider={false} onPress={() => signOut()} />
				</View>
			</View>
		</Screen>
	)
}
