import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Button } from '@/components/ui'
import { SearchIcon, StoreIcon } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'

type Role = 'buyer' | 'seller'

export default function RoleScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const [role, setRole] = useState<Role>('buyer')

	const roles = [
		{
			value: 'buyer' as const,
			title: 'Ищу запчасть',
			description: 'Отправлю запрос, продавцы ответят, у кого есть',
			icon: SearchIcon,
		},
		{
			value: 'seller' as const,
			title: 'У меня бокс на рынке',
			description: 'Буду получать запросы по своим маркам',
			icon: StoreIcon,
		},
	]

	return (
		<View
			style={{
				flex: 1,
				backgroundColor: c.surface,
				paddingTop: insets.top + 48,
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
							padding: 22,
							gap: 10,
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

			<Button label="Продолжить" onPress={() => router.replace(role === 'buyer' ? '/garage' : '/box-select')} />
		</View>
	)
}
