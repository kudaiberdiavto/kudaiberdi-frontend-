import { Image, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Avatar, LanguageSwitch, QueryErrorBanner, Screen, SectionLabel, SettingsRow, Toggle } from '@/components/ui'
import { fontFamily, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { plural } from '@/lib/format'
import { formatE164 } from '@/lib/phone'
import { useMe, useSetRole, useSettings, useUpdateMe, useUpdateSettings } from '@/api/me'
import { useCars } from '@/api/garage'
import type { Settings } from '@/api/types'
import { toLang, useSession } from '@/store/useSession'

const THEMES: { value: Settings['theme']; label: string }[] = [
	{ value: 'SYSTEM', label: 'Как в системе' },
	{ value: 'LIGHT', label: 'Светлая' },
	{ value: 'DARK', label: 'Тёмная' },
]

/** 19 — buyer's profile and settings. */
export default function BuyerProfileScreen() {
	const c = useColors()
	const me = useMe()
	const cars = useCars()
	const settings = useSettings()
	const updateSettings = useUpdateSettings()
	const updateMe = useUpdateMe()
	const setRole = useSetRole()
	const lang = useSession((s) => s.lang)
	const signOut = useSession((s) => s.signOut)

	const user = me.data
	const carCount = cars.data?.length ?? 0
	const theme = THEMES.find((t) => t.value === settings.data?.theme) ?? THEMES[0]
	const nextTheme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]

	const changeLang = (next: 'ru' | 'kg') => {
		const apiLang = next === 'kg' ? 'ky' : 'ru'
		useSession.getState().setLang(apiLang)
		updateMe.mutate({ lang: toLang(apiLang) })
	}

	// Switch to the seller mode: role on the server, then the box (or its registration).
	const becomeSeller = () =>
		setRole.mutate('SELLER', { onSuccess: (next) => router.replace(next.hasShop ? '/seller' : '/box-select') })

	return (
		<Screen>
			<View style={{ paddingTop: 8, gap: 14, flex: 1 }}>
				<QueryErrorBanner error={me.error ?? setRole.error ?? updateSettings.error} onRetry={() => me.refetch()} />

				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
					{user?.avatarUrl ? (
						<Image source={{ uri: resolveUrl(user.avatarUrl) }} style={{ width: 60, height: 60, borderRadius: 18 }} />
					) : (
						<Avatar letter={(user?.name ?? user?.phone.slice(-2) ?? ' ').charAt(0).toUpperCase()} size={60} radius={18} fontSize={24} />
					)}
					<View style={{ gap: 3 }}>
						<Text style={{ fontSize: 22, fontFamily: fontFamily(700), color: c.ink }}>{user ? (user.name ?? 'Без имени') : ' '}</Text>
						<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>{user ? formatE164(user.phone) : ' '}</Text>
					</View>
				</View>

				<View style={{ borderRadius: 16, backgroundColor: c.card, overflow: 'hidden' }}>
					<SettingsRow
						label="Мой гараж"
						value={carCount ? `${carCount} ${plural(carCount, ['машина', 'машины', 'машин'])} ›` : '›'}
						onPress={() => router.push('/garage')}
					/>
					<SettingsRow label="История запросов" value="›" onPress={() => router.push('/buyer')} />
					<SettingsRow label="Избранные магазины" value="›" divider={false} />
				</View>

				<SectionLabel style={{ paddingTop: 4 }}>Настройки</SectionLabel>

				<View style={{ borderRadius: 16, backgroundColor: c.card, overflow: 'hidden' }}>
					<SettingsRow
						label="Язык"
						height={60}
						right={<LanguageSwitch value={lang === 'ky' ? 'kg' : 'ru'} onChange={changeLang} />}
					/>
					<SettingsRow
						label="Уведомления об ответах"
						right={
							<Toggle
								value={settings.data?.notifyReplies ?? true}
								onChange={(value) => updateSettings.mutate({ notifyReplies: value })}
							/>
						}
					/>
					<SettingsRow
						label="Тема"
						value={`${theme.label} ›`}
						onPress={() => updateSettings.mutate({ theme: nextTheme.value })}
					/>
					<SettingsRow
						label={user?.hasShop ? 'Перейти в режим продавца' : 'Я продавец — открыть бокс'}
						value="›"
						valueColor={c.brandStrong}
						valueWeight={700}
						onPress={becomeSeller}
					/>
					<SettingsRow
						label={user?.hasMaster ? 'Перейти в режим мастера' : 'Я мастер / СТО'}
						value="›"
						valueColor={c.brandStrong}
						valueWeight={700}
						divider={false}
						onPress={() => setRole.mutate('MASTER', { onSuccess: (me) => router.replace(me.hasMaster ? '/master' : { pathname: '/master-profile', params: { first: '1' } }) })}
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
