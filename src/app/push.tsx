import { Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { fontFamily, raw, useColors } from '@/theme'
import { pushNotifications, pushScreen } from '@/mocks'

export default function PushPreviewScreen() {
	const c = useColors()

	return (
		<LinearGradient
			colors={['#E6EBF3', '#CFD8E6']}
			style={{ flex: 1, alignItems: 'center', paddingTop: 90, paddingHorizontal: 12, gap: 10 }}
		>
			<Text style={{ fontSize: 76, fontFamily: 'Inter_300Light', letterSpacing: -1.52, color: c.ink }}>
				{pushScreen.time}
			</Text>
			<Text style={{ fontSize: 17, fontFamily: fontFamily(400), color: c.inkSecondary, paddingBottom: 28 }}>
				{pushScreen.date}
			</Text>

			{pushNotifications.map((push) => (
				<View
					key={push.id}
					style={{
						alignSelf: 'stretch',
						borderRadius: 18,
						backgroundColor: 'rgba(255,255,255,0.94)',
						padding: 14,
						gap: push.actions ? 10 : 6,
						shadowColor: '#201F1D',
						shadowOpacity: 0.1,
						shadowOffset: { width: 0, height: 4 },
						shadowRadius: 7,
						elevation: 4,
					}}
				>
					<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
						<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: c.brandStrong }}>{push.source}</Text>
						<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>{push.time}</Text>
					</View>

					<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>{push.title}</Text>
					<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.inkSecondary }}>{push.body}</Text>

					{push.actions ? (
						<View style={{ flexDirection: 'row', gap: 8 }}>
							{push.actions.map((action, i) => (
								<View
									key={action}
									style={{
										flex: i === 0 ? 2 : 1,
										height: 44,
										borderRadius: 10,
										backgroundColor: i === 0 ? c.brand : raw.toggleOff,
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<Text
										style={{ fontSize: 15, fontFamily: fontFamily(700), color: i === 0 ? '#FFFFFF' : c.ink }}
									>
										{action}
									</Text>
								</View>
							))}
						</View>
					) : null}
				</View>
			))}
		</LinearGradient>
	)
}
