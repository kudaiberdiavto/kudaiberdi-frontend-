import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Button } from '@/components/ui'
import { SearchIcon } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'

export default function EmptyAnswersScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<View
				style={{
					marginTop: 4,
					marginHorizontal: 16,
					borderRadius: 12,
					backgroundColor: c.dangerTint,
					paddingVertical: 12,
					paddingHorizontal: 14,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 10,
				}}
			>
				<View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.danger }} />
				<Text style={{ flex: 1, fontSize: 14, fontFamily: fontFamily(600), color: c.ink }}>
					Нет сети. Покажем ответы, когда появится
				</Text>
			</View>

			<View style={{ paddingTop: 14, paddingHorizontal: 16, gap: 2 }}>
				<Text style={{ fontSize: 18, fontFamily: fontFamily(700), color: c.ink }}>Балка задняя</Text>
				<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>Honda Fit · 2009</Text>
			</View>

			<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 }}>
				<View
					style={{
						width: 92,
						height: 92,
						borderRadius: 46,
						borderWidth: 2,
						borderColor: c.border,
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<SearchIcon size={40} color="#9B9797" strokeWidth={1.8} />
				</View>
				<Text style={{ fontSize: 22, fontFamily: fontFamily(700), color: c.ink, textAlign: 'center' }}>
					Пока никто не ответил
				</Text>
				<Text
					style={{
						fontSize: 16,
						lineHeight: 24,
						fontFamily: fontFamily(400),
						color: c.muted,
						textAlign: 'center',
					}}
				>
					Запрос видели 12 продавцов ряда 28. Отправьте всему рынку — деталь редкая.
				</Text>
			</View>

			<View style={{ paddingHorizontal: 16, paddingBottom: 24 + insets.bottom, gap: 10 }}>
				<Button label="Отправить всему рынку" />
				<Button label="Закрыть запрос" variant="outline" height={52} fontSize={16} onPress={() => router.back()} />
			</View>
		</View>
	)
}
