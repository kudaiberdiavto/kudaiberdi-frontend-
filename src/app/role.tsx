import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Button, ServiceIcon } from '@/components/ui'
import { SearchIcon, StoreIcon, type IconProps } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'
import { useSetRole } from '@/api/me'
import type { UserRole } from '@/api/types'

const WrenchIcon = ({ size, color }: IconProps) => <ServiceIcon code="CAR_REPAIR" size={size} color={color} strokeWidth={1.9} />

export default function RoleScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const [role, setRole] = useState<UserRole>('BUYER')
	const saveRole = useSetRole()

	const roles = [
		{
			value: 'BUYER' as const,
			title: 'Ищу запчасть',
			description: 'Отправлю запрос, продавцы ответят, у кого есть',
			icon: SearchIcon,
		},
		{
			value: 'SELLER' as const,
			title: 'У меня бокс на рынке',
			description: 'Буду получать запросы по своим маркам',
			icon: StoreIcon,
		},
		{
			value: 'MASTER' as const,
			title: 'Я мастер / СТО',
			description: 'Буду получать заявки на ремонт и услуги рядом',
			icon: WrenchIcon,
		},
	]

	return (
		<View
			style={{
				flex: 1,
				backgroundColor: c.surface,
				paddingTop: insets.top + 32,
				paddingHorizontal: 16,
				paddingBottom: 24,
				gap: 16,
			}}
		>
			<Text
				style={{
					fontSize: 28,
					fontFamily: fontFamily(700),
					letterSpacing: -0.56,
					color: c.ink,
					paddingHorizontal: 8,
					paddingBottom: 12,
				}}
			>
				Кто вы?
			</Text>

			{roles.map(({ value, title, description, icon: Icon }) => {
				const selected = role === value
				return (
					<Pressable
						key={value}
						onPress={() => setRole(value)}
						style={{
							borderRadius: 18,
							borderWidth: 2,
							borderColor: selected ? c.brand : c.border,
							backgroundColor: selected ? 'rgba(255,176,32,0.08)' : c.card,
							padding: 18,
							gap: 8,
						}}
					>
						<Icon size={36} color={selected ? c.brand : c.inkSecondary} />
						<Text style={{ fontSize: 22, fontFamily: fontFamily(700), color: c.ink }}>{title}</Text>
						<Text
							style={{
								fontSize: 15,
								lineHeight: 21.75,
								fontFamily: fontFamily(400),
								color: selected ? c.inkSecondary : c.muted,
							}}
						>
							{description}
						</Text>
					</Pressable>
				)
			})}

			<View style={{ flex: 1 }} />

			{saveRole.error && (
				<Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger, paddingHorizontal: 8 }}>
					{saveRole.error.message}
				</Text>
			)}

			<Button
				label="Продолжить"
				loading={saveRole.isPending}
				onPress={() =>
					saveRole.mutate(role, {
						// Buyer starts with the garage [04]; seller registers the box [10а]; master fills «Мои услуги» [38].
						onSuccess: (me) => {
							if (role === 'MASTER') router.replace(me.hasMaster ? '/master' : { pathname: '/master-profile', params: { first: '1' } })
							else router.replace(role === 'BUYER' ? '/garage' : me.hasShop ? '/seller' : '/box-select')
						},
					})
				}
			/>
		</View>
	)
}
