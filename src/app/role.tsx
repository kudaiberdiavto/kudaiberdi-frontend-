import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { Image } from '@/components/ui/image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Button } from '@/components/ui'
import { BoxOutlineIcon, LoupeIcon, TickIcon, WrenchIcon } from '@/components/buyer-v23'
import { fontFamily, useColors } from '@/theme'
import { useSetRole } from '@/api/me'
import type { UserRole } from '@/api/types'
import { t } from '@/i18n'

const ROLES = [
	{ value: 'BUYER' as const, who: t('покупатель'), title: t('Ищу запчасти'), description: t('Для своей машины — продавцы рынка ответят с ценой, найду и мастера'), icon: LoupeIcon },
	{ value: 'SELLER' as const, who: t('продавец'), title: t('Продаю запчасти'), description: t('Контейнер на Кудайбергене или магазин в городе — получаю запросы покупателей'), icon: BoxOutlineIcon },
	{ value: 'MASTER' as const, who: t('мастер'), title: t('Я мастер или СТО'), description: t('Ремонт, шиномонтаж, эвакуатор — получаю заявки от водителей рядом'), icon: WrenchIcon },
]

/** 02 «Кто вы?» — buyer, seller or master; chosen once, the app is built around it. */
export default function RoleScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const [role, setRole] = useState<UserRole>('BUYER')
	const saveRole = useSetRole()
	const chosen = ROLES.find((item) => item.value === role) ?? ROLES[0]

	return (
		<View style={{ flex: 1, backgroundColor: c.surface }}>
			<LinearGradient
				colors={['#2355E8', '#142F8C']}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={{ paddingTop: insets.top + 20, paddingBottom: 26, paddingHorizontal: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, gap: 6 }}
			>
				<Image source={require('../../assets/images/logo-mark.png')} style={{ width: 56, height: 56, marginBottom: 8 }} />
				<Text style={{ fontSize: 28, lineHeight: 34, fontFamily: fontFamily(800), letterSpacing: -0.3, color: '#FFFFFF' }}>{t('Кто вы?')}</Text>
				<Text style={{ fontSize: 16.5, lineHeight: 22, fontFamily: fontFamily(500), color: 'rgba(255,255,255,0.88)' }}>{t('Приложение подстроится под вас')}</Text>
			</LinearGradient>

			<ScrollView contentContainerStyle={{ padding: 20, gap: 12 }} showsVerticalScrollIndicator={false}>
				{ROLES.map(({ value, title, description, icon: Icon }) => {
					const selected = role === value
					return (
						<Pressable
							key={value}
							onPress={() => setRole(value)}
							style={{
								borderRadius: 20,
								borderWidth: 2,
								borderColor: selected ? c.brand : c.card,
								backgroundColor: c.card,
								padding: 16,
								flexDirection: 'row',
								alignItems: 'center',
								gap: 14,
								shadowColor: '#142F8C',
								shadowOpacity: selected ? 0.14 : 0,
								shadowOffset: { width: 0, height: 8 },
								shadowRadius: 14,
								elevation: selected ? 4 : 0,
							}}
						>
							<View style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: selected ? c.brand : c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
								<Icon size={24} color={selected ? '#FFFFFF' : c.brandStrong} />
							</View>
							<View style={{ flex: 1, gap: 3 }}>
								<Text style={{ fontSize: 19, lineHeight: 25, fontFamily: fontFamily(800), color: c.ink }}>{title}</Text>
								<Text style={{ fontSize: 15, lineHeight: 20, fontFamily: fontFamily(400), color: c.muted }}>{description}</Text>
							</View>
							<View
								style={{
									width: 26,
									height: 26,
									borderRadius: 13,
									borderWidth: 2,
									borderColor: selected ? c.brand : c.border,
									backgroundColor: selected ? c.brand : c.card,
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								{selected ? <TickIcon size={14} color="#FFFFFF" /> : null}
							</View>
						</Pressable>
					)
				})}
				{saveRole.error ? (
					<Text style={{ fontSize: 15.5, fontFamily: fontFamily(500), color: c.danger }}>{saveRole.error.message}</Text>
				) : null}
			</ScrollView>

			<View style={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 34) }}>
				<Button
					label={t('Продолжить как {0}', chosen.who)}
					loading={saveRole.isPending}
					onPress={() =>
						saveRole.mutate(role, {
							// Buyer goes home [03] (the car comes from the tech passport [04]); seller registers the box [11];
							// master fills «Мой сервис» [20].
							onSuccess: (me) => {
								if (role === 'MASTER') router.replace(me.hasMaster ? '/master' : { pathname: '/master-profile', params: { first: '1' } })
								else router.replace(role === 'BUYER' ? '/buyer' : me.hasShop ? '/seller' : '/box-select')
							},
						})
					}
				/>
			</View>
		</View>
	)
}
