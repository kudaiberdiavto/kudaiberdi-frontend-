import { Image, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Avatar, QueryErrorBanner, Screen, SettingsRow, Toggle } from '@/components/ui'
import { fontFamily, useColors } from '@/theme'
import { formatE164 } from '@/lib/phone'
import { resolveUrl } from '@/lib/api'
import { plural } from '@/lib/format'
import { useMe, useSetRole } from '@/api/me'
import { serviceName, useMyMaster, useServiceTypes, useSetAccepting } from '@/api/services'
import { useSession } from '@/store/useSession'

/** Master profile tab — no mockup; built like the buyer profile [19]. */
export default function MasterProfileTab() {
	const c = useColors()
	const me = useMe()
	const types = useServiceTypes().data
	const profile = useMyMaster()
	const accepting = useSetAccepting()
	const setRole = useSetRole()
	const signOut = useSession((s) => s.signOut)
	const user = me.data
	const master = profile.data
	const services = master?.services.map((t) => t.code) ?? []

	return (
		<Screen>
			<View style={{ paddingTop: 8, gap: 14, flex: 1 }}>
				<QueryErrorBanner error={me.error ?? profile.error ?? accepting.error ?? setRole.error} onRetry={() => me.refetch()} />

				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
					{user?.avatarUrl ? (
						<Image source={{ uri: resolveUrl(user.avatarUrl) }} style={{ width: 60, height: 60, borderRadius: 18 }} />
					) : (
						<Avatar letter={(master?.name ?? user?.name ?? ' ').charAt(0).toUpperCase()} size={60} radius={18} fontSize={24} />
					)}
					<View style={{ gap: 3, flex: 1 }}>
						<Text numberOfLines={1} style={{ fontSize: 22, fontFamily: fontFamily(700), color: c.ink }}>
							{master?.name ?? user?.name ?? ' '}
						</Text>
						<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>{user ? formatE164(user.phone) : ' '}</Text>
					</View>
				</View>

				<View style={{ borderRadius: 16, backgroundColor: c.card, overflow: 'hidden' }}>
					<SettingsRow
						label="Мои услуги"
						value={services.length ? `${services.length === 1 ? serviceName(types, services[0], true) : `${services.length} ${plural(services.length, ['услуга', 'услуги', 'услуг'])}`} ›` : '›'}
						onPress={() => router.push('/master-profile')}
					/>
					<SettingsRow
						label="Принимаю заявки"
						divider={false}
						right={<Toggle value={master?.accepting ?? true} onChange={(value) => accepting.mutate(value)} />}
					/>
				</View>

				<View style={{ borderRadius: 16, backgroundColor: c.card, overflow: 'hidden' }}>
					<SettingsRow
						label="Перейти в режим покупателя"
						value="›"
						valueColor={c.brandStrong}
						valueWeight={700}
						divider={Boolean(user?.hasShop)}
						onPress={() => setRole.mutate('BUYER', { onSuccess: () => router.replace('/buyer') })}
					/>
					{user?.hasShop ? (
						<SettingsRow
							label="Перейти в режим продавца"
							value="›"
							valueColor={c.brandStrong}
							valueWeight={700}
							divider={false}
							onPress={() => setRole.mutate('SELLER', { onSuccess: () => router.replace('/seller') })}
						/>
					) : null}
				</View>

				<View style={{ borderRadius: 16, backgroundColor: c.card, overflow: 'hidden' }}>
					<SettingsRow label="Поддержка" />
					<SettingsRow label="Выйти" labelColor={c.danger} divider={false} onPress={() => signOut()} />
				</View>
			</View>
		</Screen>
	)
}
