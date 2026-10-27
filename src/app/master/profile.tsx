import { Image, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native'
import { router } from 'expo-router'
import { Avatar, BrandLogo, QueryErrorBanner, Screen, ServiceIcon, SettingsRow } from '@/components/ui'
import { MarketSchemeView } from '@/components/market-scheme-view'
import { MobileTruck, Switch } from '@/components/master-v23'
import { fontFamily, useColors } from '@/theme'
import { formatE164 } from '@/lib/phone'
import { resolveUrl } from '@/lib/api'
import { useMe, useSetRole } from '@/api/me'
import { serviceName, useMyMaster, useSaveMaster, useServiceTypes } from '@/api/services'
import { useSession } from '@/store/useSession'

/** The six chips of the mockup; the master's other services are added after them. */
const MAIN_SERVICES = ['CAR_REPAIR', 'DIAGNOSTICS', 'WHEEL_ALIGNMENT', 'TIRE_SERVICE', 'TOW_TRUCK', 'AUTO_ELECTRIC']

/** 20 «Мой сервис» — services, brands, where the master is, «Выезжаю к клиенту». */
export default function MasterProfileTab() {
	const c = useColors()
	const { width } = useWindowDimensions()
	const me = useMe()
	const types = useServiceTypes().data
	const profile = useMyMaster()
	const save = useSaveMaster(true)
	const setRole = useSetRole()
	const signOut = useSession((s) => s.signOut)
	const user = me.data
	const master = profile.data
	const mine = master?.services.map((t) => t.code) ?? []
	const chips = [...MAIN_SERVICES, ...mine.filter((code) => !MAIN_SERVICES.includes(code))]
	const name = master?.name ?? user?.name ?? ' '
	const contacts = [master?.address, master?.phone ? formatE164(master.phone) : user ? formatE164(user.phone) : null].filter(Boolean).join(' · ')

	const toggleService = (code: string) => {
		if (!master) return
		const next = mine.includes(code) ? mine.filter((item) => item !== code) : [...mine, code]
		if (next.length) save.mutate({ services: next })
	}

	const label = (text: string, action?: () => void) => (
		<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
			<Text style={{ fontSize: 14.5, fontFamily: fontFamily(700), letterSpacing: 1.04, textTransform: 'uppercase', color: c.muted }}>{text}</Text>
			<View style={{ flex: 1 }} />
			{action ? (
				<Text onPress={action} style={{ fontSize: 15.5, fontFamily: fontFamily(700), color: c.brandStrong }}>
					Изменить
				</Text>
			) : null}
		</View>
	)

	return (
		<Screen>
			<View style={{ height: 52, justifyContent: 'center' }}>
				<Text style={{ fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.26, color: c.ink }}>Мой сервис</Text>
			</View>
			<ScrollView contentContainerStyle={{ paddingTop: 4, paddingBottom: 16, gap: 10 }} showsVerticalScrollIndicator={false}>
				<QueryErrorBanner error={me.error ?? profile.error ?? save.error ?? setRole.error} onRetry={() => (me.refetch(), profile.refetch())} />

				<Pressable onPress={() => router.push('/master-profile')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
					{master?.avatarUrl ? (
						<Image source={{ uri: resolveUrl(master.avatarUrl) }} style={{ width: 56, height: 56, borderRadius: 28 }} />
					) : (
						<Avatar letter={name.replace(/^(СТО|Мастер)\s*«?/, '').charAt(0).toUpperCase()} size={56} radius={28} fontSize={22} />
					)}
					<View style={{ flex: 1, gap: 2 }}>
						<Text numberOfLines={1} style={{ fontSize: 20, lineHeight: 28.5, fontFamily: fontFamily(700), color: c.ink }}>
							{name}
						</Text>
						<Text numberOfLines={1} style={{ fontSize: 15, lineHeight: 19, fontFamily: fontFamily(400), color: c.muted }}>
							{contacts || ' '}
						</Text>
					</View>
				</Pressable>

				{label('Мои услуги', () => router.push('/master-profile'))}
				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
					{chips.map((code) => {
						const selected = mine.includes(code)
						return (
							<Pressable
								key={code}
								disabled={!master || save.isPending}
								onPress={() => toggleService(code)}
								style={{
									height: 38,
									paddingLeft: 8,
									paddingRight: 12,
									borderRadius: 19,
									backgroundColor: selected ? c.brandTint : c.card,
									borderWidth: 2,
									borderColor: selected ? c.brand : c.border,
									flexDirection: 'row',
									alignItems: 'center',
									gap: 6,
								}}
							>
								<ServiceIcon code={code} size={18} color={selected ? c.brandStrong : c.muted} />
								<Text style={{ fontSize: 15.5, fontFamily: fontFamily(selected ? 700 : 600), color: selected ? c.brandStrong : c.ink }}>
									{serviceName(types, code)}
								</Text>
							</Pressable>
						)
					})}
				</View>

				{label('Марки')}
				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
					{master?.allBrands ? (
						<View style={{ height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: c.card, borderWidth: 2, borderColor: c.border, justifyContent: 'center' }}>
							<Text style={{ fontSize: 15.5, fontFamily: fontFamily(600), color: c.inkSecondary }}>Все марки</Text>
						</View>
					) : (
						(master?.brands ?? []).map((brand) => (
							<View
								key={brand.id}
								style={{
									height: 40,
									paddingLeft: 6,
									paddingRight: 14,
									borderRadius: 20,
									backgroundColor: c.card,
									borderWidth: 2,
									borderColor: c.border,
									flexDirection: 'row',
									alignItems: 'center',
									gap: 8,
								}}
							>
								<BrandLogo brand={brand} size={28} />
								<Text style={{ fontSize: 15.5, fontFamily: fontFamily(600), color: c.inkSecondary }}>{brand.shortName}</Text>
							</View>
						))
					)}
				</View>

				{label('Где находимся')}
				<Pressable onPress={() => router.push('/master-profile')} style={{ height: 120, borderRadius: 16, overflow: 'hidden', backgroundColor: '#E6E9EE' }}>
					<View pointerEvents="none">
						<MarketSchemeView width={width - 32} height={120} scale={0.4} />
					</View>
					<View
						pointerEvents="none"
						style={{
							position: 'absolute',
							left: (width - 32) / 2 - 20,
							top: 36,
							width: 40,
							height: 40,
							borderRadius: 20,
							backgroundColor: c.brand,
							borderWidth: 3,
							borderColor: '#FFFFFF',
							alignItems: 'center',
							justifyContent: 'center',
							shadowColor: '#000000',
							shadowOpacity: 0.2,
							shadowOffset: { width: 0, height: 4 },
							shadowRadius: 10,
							elevation: 4,
						}}
					>
						<ServiceIcon code="CAR_REPAIR" size={20} color="#FFFFFF" strokeWidth={2.2} />
					</View>
				</Pressable>

				<View style={{ borderRadius: 16, backgroundColor: c.card, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
					<View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
						<MobileTruck size={22} color={c.brandStrong} />
					</View>
					<View style={{ flex: 1, gap: 1 }}>
						<Text style={{ fontSize: 17.5, lineHeight: 23, fontFamily: fontFamily(700), color: c.ink }}>Выезжаю к клиенту</Text>
						<Text style={{ fontSize: 15, lineHeight: 19, fontFamily: fontFamily(400), color: c.muted }}>в радиусе {master?.radiusKm ?? 5} км</Text>
					</View>
					<Switch value={master?.mobile ?? false} disabled={!master || save.isPending} onChange={(mobile) => save.mutate({ mobile })} />
				</View>

				{/* Not on the mockup: switching mode and signing out live under the fold. */}
				<View style={{ borderRadius: 16, backgroundColor: c.card, overflow: 'hidden', marginTop: 6 }}>
					<SettingsRow
						label="Перейти в режим покупателя"
						value="›"
						valueColor={c.brandStrong}
						valueWeight={700}
						onPress={() => setRole.mutate('BUYER', { onSuccess: () => router.replace('/buyer') })}
					/>
					{user?.hasShop ? (
						<SettingsRow
							label="Перейти в режим продавца"
							value="›"
							valueColor={c.brandStrong}
							valueWeight={700}
							onPress={() => setRole.mutate('SELLER', { onSuccess: () => router.replace('/seller') })}
						/>
					) : null}
					<SettingsRow label="Выйти" labelColor={c.danger} divider={false} onPress={() => signOut()} />
				</View>
			</ScrollView>
		</Screen>
	)
}
