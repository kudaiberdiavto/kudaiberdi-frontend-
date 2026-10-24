import { useState, type ReactNode } from 'react'
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { BottomSheet, QueryErrorBanner, SettingsRow, Toggle } from '@/components/ui'
import { BrandLogo } from '@/components/ui/brand'
import { BellIcon, Caps, ChevronIcon, GlobeIcon, HelpIcon, PassportIcon, PlusThinIcon, SwapIcon, TopBar } from '@/components/buyer-v23'
import { fontFamily, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { formatE164 } from '@/lib/phone'
import { useMe, useSetRole, useSettings, useUpdateMe, useUpdateSettings } from '@/api/me'
import { useCars, useMakePrimaryCar } from '@/api/garage'
import { toLang, useSession } from '@/store/useSession'

/** «Помощь в WhatsApp» — the support number from the build config (digits, e.g. 996555000000). */
const SUPPORT_WHATSAPP = process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP

/** 10 «Профиль»: name and phone, cars (tech passport mark), language, notifications, help, «Я продаю на рынке». */
export default function BuyerProfileScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const me = useMe()
	const cars = useCars()
	const makePrimary = useMakePrimaryCar()
	const updateMe = useUpdateMe()
	const setRole = useSetRole()
	const lang = useSession((s) => s.lang)
	const [notifications, setNotifications] = useState(false)

	const user = me.data
	const letter = (user?.name ?? '').charAt(0).toUpperCase() || '•'

	const changeLang = (next: 'ru' | 'ky') => {
		useSession.getState().setLang(next)
		updateMe.mutate({ lang: toLang(next) })
	}

	// Switch to the seller mode: role on the server, then the box (or its registration [11]).
	const becomeSeller = () =>
		setRole.mutate('SELLER', { onSuccess: (next) => router.replace(next.hasShop ? '/seller' : '/box-select') })

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<TopBar title="Профиль" big onBack={false} />
			<ScrollView contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 16, paddingBottom: 16, gap: 10 }} showsVerticalScrollIndicator={false}>
				<QueryErrorBanner error={me.error ?? setRole.error} onRetry={() => me.refetch()} />

				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 4, paddingBottom: 8 }}>
					{user?.avatarUrl ? (
						<Image source={{ uri: resolveUrl(user.avatarUrl) }} style={{ width: 56, height: 56, borderRadius: 28 }} />
					) : (
						<View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
							<Text style={{ fontSize: 22, fontFamily: fontFamily(800), color: c.brandStrong }}>{letter}</Text>
						</View>
					)}
					<View style={{ flex: 1, gap: 2 }}>
						<Text style={{ fontSize: 20, fontFamily: fontFamily(700), color: c.ink }}>{user ? (user.name ?? 'Без имени') : ' '}</Text>
						<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>{user ? formatE164(user.phone) : ' '}</Text>
					</View>
				</View>

				<Caps>Мои машины</Caps>
				{(cars.data ?? []).map((car) => (
					<Pressable
						key={car.id}
						onPress={() => !car.isPrimary && makePrimary.mutate(car.id)}
						style={{ borderRadius: 18, backgroundColor: c.card, padding: 14, gap: 10 }}
					>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
							<BrandLogo brand={car.brand} size={44} />
							<View style={{ flex: 1, gap: 2 }}>
								<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>{car.title}</Text>
								<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>{car.subtitle}</Text>
							</View>
							{car.isPrimary ? (
								<View style={{ height: 26, paddingHorizontal: 9, borderRadius: 8, backgroundColor: c.brandTint, justifyContent: 'center' }}>
									<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.brandStrong }}>Основная</Text>
								</View>
							) : null}
						</View>
						{car.fromTechPassport ? (
							<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
								<PassportIcon size={18} color={c.success} strokeWidth={2.2} />
								<Text style={{ flex: 1, fontSize: 13.5, fontFamily: fontFamily(500), color: c.success }}>
									Техпаспорт сфотан — продавцы видят точную модель
								</Text>
							</View>
						) : null}
					</Pressable>
				))}
				<Pressable
					onPress={() => router.push('/garage-add')}
					style={{
						height: 52,
						borderRadius: 14,
						borderWidth: 2,
						borderStyle: 'dashed',
						borderColor: '#B8C3D3',
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 8,
					}}
				>
					<PlusThinIcon size={18} color={c.brandStrong} strokeWidth={2.6} />
					<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: c.brandStrong }}>Добавить машину</Text>
				</Pressable>

				<View style={{ height: 4 }} />
				<View style={{ borderRadius: 18, backgroundColor: c.card, padding: 6 }}>
					<MenuRow icon={<GlobeIcon size={22} color={c.ink} />} label="Язык">
						<View style={{ height: 34, borderRadius: 17, backgroundColor: c.card, borderWidth: 1.5, borderColor: c.border, flexDirection: 'row', padding: 2 }}>
							{(['ru', 'ky'] as const).map((value) => {
								const active = lang === value
								return (
									<Pressable
										key={value}
										onPress={() => changeLang(value)}
										style={{ width: 40, borderRadius: 15, backgroundColor: active ? c.brand : 'transparent', alignItems: 'center', justifyContent: 'center' }}
									>
										<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: active ? '#FFFFFF' : c.muted }}>{value === 'ru' ? 'RU' : 'KG'}</Text>
									</Pressable>
								)
							})}
						</View>
					</MenuRow>
					<MenuRow icon={<BellIcon size={22} color={c.ink} />} label="Уведомления" onPress={() => setNotifications(true)} />
					<MenuRow
						icon={<HelpIcon size={22} color={c.ink} />}
						label="Помощь в WhatsApp"
						onPress={() => SUPPORT_WHATSAPP && Linking.openURL(`https://wa.me/${SUPPORT_WHATSAPP}`)}
					/>
					<MenuRow icon={<SwapIcon size={22} color={c.ink} />} label="Я продаю на рынке" onPress={becomeSeller} />
				</View>
				{/* Not in the mockup, but without it there is no way out of the account. */}
				<Text
					onPress={() => useSession.getState().signOut()}
					style={{ marginTop: 20, textAlign: 'center', fontSize: 15, fontFamily: fontFamily(600), color: c.muted }}
				>
					Выйти
				</Text>
			</ScrollView>

			{notifications ? <NotificationsSheet onClose={() => setNotifications(false)} /> : null}
		</View>
	)
}

function MenuRow({ icon, label, onPress, children }: { icon: ReactNode; label: string; onPress?: () => void; children?: ReactNode }) {
	const c = useColors()
	return (
		<Pressable onPress={onPress} disabled={!onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
			<View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
			<Text style={{ flex: 1, fontSize: 16, fontFamily: fontFamily(600), color: c.ink }}>{label}</Text>
			{children ?? <ChevronIcon size={20} color="#B8B4B4" />}
		</Pressable>
	)
}

/** «Уведомления»: answers to my requests and chat messages. */
function NotificationsSheet({ onClose }: { onClose: () => void }) {
	const c = useColors()
	const settings = useSettings()
	const update = useUpdateSettings()
	return (
		<BottomSheet onClose={onClose} header={<Text style={{ fontSize: 22, fontFamily: fontFamily(800), color: c.ink }}>Уведомления</Text>}>
			<View style={{ borderRadius: 16, backgroundColor: c.card, overflow: 'hidden' }}>
				<SettingsRow
					label="Ответы продавцов и мастеров"
					right={<Toggle value={settings.data?.notifyReplies ?? true} onChange={(value) => update.mutate({ notifyReplies: value })} />}
				/>
				<SettingsRow
					label="Сообщения в чатах"
					divider={false}
					right={<Toggle value={settings.data?.notifyChat ?? true} onChange={(value) => update.mutate({ notifyChat: value })} />}
				/>
			</View>
		</BottomSheet>
	)
}
