import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Button, Card, Screen } from '@/components/ui'
import { ChevronLeftIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { activeRequest, sellerAnswers } from '@/mocks'

export default function BuyerAnswersScreen() {
	const c = useColors()

	return (
		<Screen padding={0}>
			<View
				style={{
					paddingTop: 4,
					paddingHorizontal: 16,
					paddingBottom: 12,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 12,
				}}
			>
				<Pressable onPress={() => router.back()}>
					<ChevronLeftIcon size={24} color={c.ink} />
				</Pressable>
				<View style={{ flex: 1, gap: 2 }}>
					<Text style={{ fontSize: 18, fontFamily: fontFamily(700), color: c.ink }}>{activeRequest.title}</Text>
					<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>{activeRequest.car}</Text>
				</View>
			</View>

			<View
				style={{
					marginHorizontal: 16,
					marginBottom: 14,
					borderRadius: 14,
					backgroundColor: c.card,
					paddingVertical: 12,
					paddingHorizontal: 14,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 10,
				}}
			>
				<View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.success }} />
				<Text style={{ flex: 1, fontSize: 15, fontFamily: fontFamily(600), color: c.ink }}>
					{activeRequest.answersLabel}
				</Text>
				<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>{activeRequest.waitingLabel}</Text>
			</View>

			<View style={{ flex: 1, paddingHorizontal: 16, gap: 12 }}>
				{sellerAnswers.map((s) => (
					<Card key={s.id} style={{ gap: 10 }}>
						<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
							<Text style={{ fontSize: 18, fontFamily: fontFamily(700), color: c.ink }}>{s.name}</Text>
							<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.ink }}>{s.rating}</Text>
						</View>

						<Text style={{ fontSize: 15, fontFamily: fontFamily(600), color: c.inkSecondary }}>
							{s.place}
							<Text style={{ color: s.isOpen ? c.success : c.muted }}>{s.openLabel}</Text>
						</Text>

						{s.message ? (
							<View style={{ borderRadius: 12, backgroundColor: raw.fill, paddingVertical: 10, paddingHorizontal: 12 }}>
								<Text style={{ fontSize: 15, lineHeight: 21, fontFamily: fontFamily(400), color: c.ink }}>
									{s.message}
								</Text>
							</View>
						) : null}

						{s.message ? (
							<Button
								label="Написать"
								variant={s.primary ? 'primary' : 'secondary'}
								height={48}
								radius={12}
								fontSize={16}
								onPress={() => router.push('/chat')}
							/>
						) : null}
					</Card>
				))}
			</View>
		</Screen>
	)
}
