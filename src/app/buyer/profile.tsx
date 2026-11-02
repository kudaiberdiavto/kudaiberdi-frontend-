import { useState, type ReactNode } from 'react'
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { Image } from '@/components/ui/image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { API_URL } from '@/lib/env'
import { BottomSheet, QueryErrorBanner, SettingsRow, Toggle } from '@/components/ui'
import { BrandLogo } from '@/components/ui/brand'
import { BellIcon, Caps, ChevronIcon, GlobeIcon, HelpIcon, PlusThinIcon, TopBar } from '@/components/buyer-v23'
import { fontFamily, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { formatE164 } from '@/lib/phone'
import { useMe, useSettings, useUpdateMe, useUpdateSettings } from '@/api/me'
import { useCars, useDeleteCar } from '@/api/garage'
import { toLang, useSession } from '@/store/useSession'
import { openSupport } from '@/lib/support'
import { t } from '@/i18n'

/** «Помощь в WhatsApp» — the support number from the build config (digits, e.g. 996555000000). */

/** 10 «Профиль»: name and phone, cars, language, notifications, help. */
export default function BuyerProfileScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const me = useMe()
	const cars = useCars()
	const deleteCar = useDeleteCar()
	const askDelete = (id: number, title: string) =>
		Alert.alert('Удалить машину?', title, [
			{ text: t('Отмена'), style: 'cancel' },
			{ text: t('Удалить'), style: 'destructive', onPress: () => deleteCar.mutate(id) },
		])
	const updateMe = useUpdateMe()
	const lang = useSession((s) => s.lang)
	const [notifications, setNotifications] = useState(false)

	const user = me.data
	const letter = (user?.name ?? '').charAt(0).toUpperCase() || '•'

	const changeLang = (next: 'ru' | 'ky') => {
		useSession.getState().setLang(next)
		updateMe.mutate({ lang: toLang(next) })
	}

	// Switch to the seller mode: role on the server, then the box (or its registration [11]).

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<TopBar title={t('Профиль')} big onBack={false} />
			<ScrollView contentContainerStyle={{ paddingTop: 4, paddingHorizontal: 16, paddingBottom: 16, gap: 10 }} showsVerticalScrollIndicator={false}>
				<QueryErrorBanner error={me.error ?? deleteCar.error} onRetry={() => me.refetch()} />

				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 4, paddingBottom: 8 }}>
					{user?.avatarUrl ? (
						<Image source={{ uri: resolveUrl(user.avatarUrl) }} style={{ width: 56, height: 56, borderRadius: 28 }} />
					) : (
						<View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
							<Text style={{ fontSize: 22, fontFamily: fontFamily(800), color: c.brandStrong }}>{letter}</Text>
						</View>
					)}
					<View style={{ flex: 1, gap: 2 }}>
						<Text style={{ fontSize: 20, fontFamily: fontFamily(700), color: c.ink }}>{user ? (user.name ?? t('Без имени')) : ' '}</Text>
						<Text style={{ fontSize: 16.5, fontFamily: fontFamily(400), color: c.muted }}>{user ? formatE164(user.phone) : ' '}</Text>
					</View>
				</View>

				<Caps>{t('Мои машины')}</Caps>
				{(cars.data ?? []).map((car) => (
					<Pressable
						key={car.id}
						// Tap — «Удалить машину?»; no main car to pick.
						onPress={() => askDelete(car.id, `${car.title} · ${car.year}`)}
						disabled={deleteCar.isPending}
						style={{ borderRadius: 18, backgroundColor: c.card, padding: 14, gap: 10 }}
					>
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
							<BrandLogo brand={car.brand} size={44} />
							<View style={{ flex: 1, gap: 2 }}>
								<Text style={{ fontSize: 18.5, fontFamily: fontFamily(700), color: c.ink }}>{car.title}</Text>
								<Text style={{ fontSize: 15.5, fontFamily: fontFamily(400), color: c.muted }}>{car.subtitle}</Text>
							</View>

						</View>
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
					<Text style={{ fontSize: 16.5, fontFamily: fontFamily(700), color: c.brandStrong }}>{t('Добавить машину')}</Text>
				</Pressable>

				<View style={{ height: 4 }} />
				<View style={{ borderRadius: 18, backgroundColor: c.card, padding: 6 }}>
					<MenuRow icon={<GlobeIcon size={22} color={c.ink} />} label={t('Язык')}>
						<View style={{ height: 34, borderRadius: 17, backgroundColor: c.card, borderWidth: 1.5, borderColor: c.border, flexDirection: 'row', padding: 2 }}>
							{(['ru', 'ky'] as const).map((value) => {
								const active = lang === value
								return (
									<Pressable
										key={value}
										onPress={() => changeLang(value)}
										style={{ width: 40, borderRadius: 15, backgroundColor: active ? c.brand : 'transparent', alignItems: 'center', justifyContent: 'center' }}
									>
										<Text style={{ fontSize: 14.5, fontFamily: fontFamily(700), color: active ? '#FFFFFF' : c.muted }}>{value === 'ru' ? 'RU' : 'KG'}</Text>
									</Pressable>
								)
							})}
						</View>
					</MenuRow>
					<MenuRow icon={<BellIcon size={22} color={c.ink} />} label={t('Уведомления')} onPress={() => setNotifications(true)} />
					<MenuRow
						icon={<HelpIcon size={22} color={c.ink} />}
						label={t('Помощь в WhatsApp')}
						onPress={openSupport}
					/>
				</View>
				{/* Not in the mockup, but without it there is no way out of the account. */}
				<Text
					onPress={() => useSession.getState().signOut()}
					style={{ marginTop: 20, textAlign: 'center', fontSize: 16.5, fontFamily: fontFamily(600), color: c.muted }}
				>{t('Выйти')}</Text>
				<Text
					onPress={() => router.push('/delete-account')}
					style={{ marginTop: 14, textAlign: 'center', fontSize: 15, fontFamily: fontFamily(500), color: c.danger }}
				>{t('Удалить аккаунт')}</Text>
				<Text style={{ marginTop: 14, textAlign: 'center', fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>
					<Text onPress={() => Linking.openURL(`${API_URL}/terms`)}>{t('Правила')}</Text>
					{'  ·  '}
					<Text onPress={() => Linking.openURL(`${API_URL}/privacy`)}>{t('Политика конфиденциальности')}</Text>
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
			<Text style={{ flex: 1, fontSize: 17.5, fontFamily: fontFamily(600), color: c.ink }}>{label}</Text>
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
		<BottomSheet onClose={onClose} header={<Text style={{ fontSize: 22, fontFamily: fontFamily(800), color: c.ink }}>{t('Уведомления')}</Text>}>
			<View style={{ borderRadius: 16, backgroundColor: c.card, overflow: 'hidden' }}>
				<SettingsRow
					label={t('Ответы продавцов и мастеров')}
					right={<Toggle value={settings.data?.notifyReplies ?? true} onChange={(value) => update.mutate({ notifyReplies: value })} />}
				/>
				<SettingsRow
					label={t('Сообщения в чатах')}
					divider={false}
					right={<Toggle value={settings.data?.notifyChat ?? true} onChange={(value) => update.mutate({ notifyChat: value })} />}
				/>
			</View>
		</BottomSheet>
	)
}
