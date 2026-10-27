import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Button } from '@/components/ui'
import { BoxOutlineIcon, LoupeIcon, TickIcon, TopBar, WrenchIcon } from '@/components/buyer-v23'
import { fontFamily, useColors } from '@/theme'
import { useSetRole } from '@/api/me'
import type { UserRole } from '@/api/types'

const ROLES = [
	{ value: 'BUYER' as const, title: 'Найти запчасть или мастера', description: 'Для своей машины', icon: LoupeIcon },
	{ value: 'SELLER' as const, title: 'Продаю на рынке', description: 'У меня контейнер на Кудайбергене', icon: BoxOutlineIcon },
	{ value: 'MASTER' as const, title: 'Я мастер / СТО', description: 'Ремонт, шиномонтаж, эвакуатор, мойка…', icon: WrenchIcon },
]

/** 02 «Что вы хотите?»: buyer, seller or master. */
export default function RoleScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const [role, setRole] = useState<UserRole>('BUYER')
	const saveRole = useSetRole()

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<TopBar onBack={router.canGoBack() ? undefined : false} />
			<View style={{ flex: 1, paddingTop: 4, paddingHorizontal: 20, paddingBottom: 16, gap: 12 }}>
				<Text style={{ fontSize: 28, lineHeight: 36.4, fontFamily: fontFamily(800), letterSpacing: -0.28, color: c.ink }}>
					Что вы хотите?
				</Text>
				<Text style={{ fontSize: 16.5, fontFamily: fontFamily(400), color: c.muted }}>Можно поменять потом в профиле</Text>
				<View style={{ height: 6 }} />
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
								backgroundColor: selected ? c.brandTint : c.card,
								padding: 18,
								flexDirection: 'row',
								alignItems: 'center',
								gap: 16,
							}}
						>
							<View
								style={{
									width: 56,
									height: 56,
									borderRadius: 14,
									backgroundColor: selected ? c.brand : c.brandTint,
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<Icon size={22} color={selected ? '#FFFFFF' : c.brandStrong} />
							</View>
							<View style={{ flex: 1, gap: 4 }}>
								<Text style={{ fontSize: 19, lineHeight: 27, fontFamily: fontFamily(700), color: c.ink }}>{title}</Text>
								<Text style={{ fontSize: 16, lineHeight: 20.5, fontFamily: fontFamily(400), color: c.muted }}>{description}</Text>
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
			</View>
			<View style={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 34) }}>
				<Button
					label="Дальше"
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
