import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { API_URL } from '@/lib/env'
import { BrandLogo, LanguageSwitch, QueryErrorBanner, Screen, ServiceIcon, SettingsRow } from '@/components/ui'
import { MapPinIcon, PhoneIcon } from '@/components/icons'
import { MobileTruck, Switch } from '@/components/master-v23'
import { fontFamily, useColors } from '@/theme'
import { formatE164 } from '@/lib/phone'
import { plural } from '@/lib/format'
import { open2gis } from '@/lib/shop-place'
import { resolveUrl } from '@/lib/api'
import { useMe, useUpdateMe } from '@/api/me'
import { useMyMaster, useSaveMaster } from '@/api/services'
import { toLang, useSession } from '@/store/useSession'
import { openSupport } from '@/lib/support'
import { t } from '@/i18n'

const STAR = '#F5A623'

/** 20 «Мой сервис» — the master's card, services, brands, address, «Выезжаю к клиенту». */
export default function MasterProfileTab() {
	const c = useColors()
	const me = useMe()
	const profile = useMyMaster()
	const save = useSaveMaster(true)
	const signOut = useSession((s) => s.signOut)
	const lang = useSession((s) => s.lang)
	const updateMe = useUpdateMe()
	const changeLang = (next: 'ru' | 'kg') => {
		const apiLang = next === 'kg' ? 'ky' : 'ru'
		useSession.getState().setLang(apiLang)
		updateMe.mutate({ lang: toLang(apiLang) })
	}
	const user = me.data
	const master = profile.data
	const name = master?.name ?? user?.name ?? ' '
	const phone = master?.phone ?? user?.phone
	const edit = (section?: 'brands' | 'place') => router.push({ pathname: '/master-profile', params: section ? { section } : {} })

	const card = { borderRadius: 18, backgroundColor: c.card, padding: 14, gap: 12 } as const
	const header = (text: string, action?: () => void) => (
		<View style={{ flexDirection: 'row', alignItems: 'center' }}>
			<Text style={{ flex: 1, fontSize: 17.5, fontFamily: fontFamily(700), color: c.ink }}>{text}</Text>
			{action ? (
				<Text onPress={action} style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: c.brandStrong }}>{t('Изменить')}</Text>
			) : null}
		</View>
	)

	return (
		<Screen>
			<View style={{ height: 52, justifyContent: 'center' }}>
				<Text style={{ fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.26, color: c.ink }}>{t('Мой сервис')}</Text>
			</View>
			<ScrollView contentContainerStyle={{ paddingTop: 4, paddingBottom: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
				<QueryErrorBanner error={me.error ?? profile.error ?? save.error} onRetry={() => (me.refetch(), profile.refetch())} />

				<LinearGradient colors={['#2355E8', '#142F8C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 22, padding: 16 }}>
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
						{master?.avatarUrl ? (
							<Image source={{ uri: resolveUrl(master.avatarUrl) }} style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#FFFFFF' }} />
						) : (
							<View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
								<Text style={{ fontSize: 26, fontFamily: fontFamily(800), color: '#1C44B8' }}>
									{name.replace(/^(СТО|Мастер)\s*«?/, '').charAt(0).toUpperCase()}
								</Text>
							</View>
						)}
						<View style={{ flex: 1, gap: 4 }}>
							<Text numberOfLines={2} style={{ fontSize: 21, lineHeight: 26, fontFamily: fontFamily(800), color: '#FFFFFF' }}>
								{name}
							</Text>
							<Text style={{ fontSize: 15, fontFamily: fontFamily(600), color: 'rgba(255,255,255,0.85)' }}>
								{master?.reviewsCount ? (
									<>
										<Text style={{ color: STAR }}>★ </Text>
										{master.rating.toFixed(1)} · {master.reviewsCount} {plural(master.reviewsCount, [t('отзыв'), t('отзыва'), t('отзывов')])}
									</>
								) : (
									t('Пока без отзывов')
								)}
							</Text>
						</View>
					</View>
				</LinearGradient>

				<View style={{ ...card, flexDirection: 'row', alignItems: 'center' }}>
					<View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
						<MobileTruck size={24} color={c.brandStrong} />
					</View>
					<View style={{ flex: 1, gap: 1 }}>
						<Text style={{ fontSize: 17.5, lineHeight: 23, fontFamily: fontFamily(700), color: c.ink }}>{t('Выезжаю к клиенту')}</Text>
						<Text style={{ fontSize: 15, lineHeight: 19, fontFamily: fontFamily(400), color: c.muted }}>
							{master?.mobile ? t('в радиусе {0} км', master.radiusKm) : t('клиенты приезжают ко мне')}
						</Text>
					</View>
					<Switch value={master?.mobile ?? false} disabled={!master || save.isPending} onChange={(mobile) => save.mutate({ mobile })} />
				</View>

				<View style={card}>
					{header(t('Услуги'), () => edit())}
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
						{(master?.services ?? []).map((service) => (
							<View
								key={service.code}
								style={{ height: 38, paddingLeft: 10, paddingRight: 13, borderRadius: 19, backgroundColor: c.brandTint, flexDirection: 'row', alignItems: 'center', gap: 6 }}
							>
								<ServiceIcon code={service.code} size={18} color={c.brandStrong} />
								<Text style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: c.brandStrong }}>{service.name}</Text>
							</View>
						))}
					</View>
				</View>

				<View style={card}>
					{header(t('Марки'), () => edit('brands'))}
					{master?.allBrands ? (
						<Text style={{ fontSize: 16, fontFamily: fontFamily(600), color: c.inkSecondary }}>{t('Работаю со всеми марками')}</Text>
					) : (
						<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
							{(master?.brands ?? []).map((brand) => (
								<View
									key={brand.id}
									style={{ height: 40, paddingLeft: 6, paddingRight: 14, borderRadius: 20, borderWidth: 1.5, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 8 }}
								>
									<BrandLogo brand={brand} size={28} />
									<Text style={{ fontSize: 15.5, fontFamily: fontFamily(600), color: c.inkSecondary }}>{brand.shortName}</Text>
								</View>
							))}
						</View>
					)}
				</View>

				<View style={{ ...card, gap: 0, paddingBottom: 4 }}>
					{header(t('Где работаю'), () => edit('place'))}
					<Pressable
						disabled={!master}
						onPress={() => master && open2gis(master)}
						style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}
					>
						<MapPinIcon size={22} color={c.brandStrong} />
						<Text style={{ flex: 1, fontSize: 16, lineHeight: 21, fontFamily: fontFamily(600), color: c.ink }}>{master?.address || t('Адрес не указан')}</Text>
						<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: c.brandStrong }}>{t('2ГИС')}</Text>
					</Pressable>
					{phone ? (
						<>
							<View style={{ height: 1, backgroundColor: c.border, marginLeft: 34 }} />
							<Pressable onPress={() => Linking.openURL(`tel:${phone}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
								<PhoneIcon size={22} color={c.brandStrong} />
								<Text style={{ flex: 1, fontSize: 16, fontFamily: fontFamily(600), color: c.ink }}>{formatE164(phone)}</Text>
							</Pressable>
						</>
					) : null}
				</View>

				<View style={{ borderRadius: 18, backgroundColor: c.card, overflow: 'hidden', marginTop: 4 }}>
					<SettingsRow label={t('Язык')} height={60} right={<LanguageSwitch value={lang === 'ky' ? 'kg' : 'ru'} onChange={changeLang} />} />
					<SettingsRow label={t('Помощь в WhatsApp')} value="›" onPress={openSupport} />
					<SettingsRow label={t('Политика конфиденциальности')} value="›" onPress={() => Linking.openURL(`${API_URL}/privacy`)} />
					<SettingsRow label={t('Выйти')} labelColor={c.danger} onPress={() => signOut()} />
					<SettingsRow label={t('Удалить аккаунт')} labelColor={c.muted} divider={false} onPress={() => router.push('/delete-account')} />
				</View>
			</ScrollView>
		</Screen>
	)
}
