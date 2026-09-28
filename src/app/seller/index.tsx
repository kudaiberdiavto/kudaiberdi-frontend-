import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Card, Screen, Toggle } from '@/components/ui'
import { fontFamily, useColors } from '@/theme'
import { incomingRequests } from '@/mocks'

export default function SellerRequestsScreen() {
	const c = useColors()
	const [open, setOpen] = useState(true)

	return (
		<Screen padding={0}>
			<View
				style={{
					paddingTop: 4,
					paddingHorizontal: 16,
					paddingBottom: 14,
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<Text style={{ fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.52, color: c.ink }}>Запросы</Text>
				<View
					style={{
						height: 40,
						paddingLeft: 12,
						paddingRight: 6,
						borderRadius: 20,
						backgroundColor: open ? c.successTint : c.hairline,
						flexDirection: 'row',
						alignItems: 'center',
						gap: 10,
					}}
				>
					<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: open ? c.success : c.muted }}>
						{open ? 'Бокс открыт' : 'Бокс закрыт'}
					</Text>
					<Toggle value={open} onChange={setOpen} />
				</View>
			</View>

			<View style={{ flex: 1, paddingHorizontal: 16, gap: 12 }}>
				{incomingRequests.map((request) =>
					request.answered ? (
						<View
							key={request.id}
							style={{
								borderRadius: 16,
								borderWidth: 2,
								borderColor: c.hairline,
								paddingVertical: 14,
								paddingHorizontal: 16,
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
							}}
						>
							<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>{request.title}</Text>
							<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: c.success }}>
								Вы ответили «есть»
							</Text>
						</View>
					) : (
						<Card key={request.id} style={{ gap: 10 }}>
							<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
								<Text style={{ fontSize: 19, fontFamily: fontFamily(700), color: c.ink }}>{request.title}</Text>
								<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>{request.ago}</Text>
							</View>
							<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.inkSecondary }}>{request.meta}</Text>
							<View style={{ flexDirection: 'row', gap: 10, paddingTop: 4 }}>
								<Pressable
									onPress={() => router.push('/seller-answer')}
									style={{
										flex: 2,
										height: 52,
										borderRadius: 12,
										backgroundColor: c.brand,
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Есть</Text>
								</Pressable>
								<Pressable
									style={{
										flex: 1,
										height: 52,
										borderRadius: 12,
										borderWidth: 2,
										borderColor: c.border,
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.inkSecondary }}>Нет</Text>
								</Pressable>
							</View>
						</Card>
					),
				)}
			</View>
		</Screen>
	)
}
