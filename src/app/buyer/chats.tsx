import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Avatar, Screen } from '@/components/ui'
import { fontFamily, useColors } from '@/theme'
import { chats } from '@/mocks'

export default function BuyerChatsScreen() {
	const c = useColors()

	return (
		<Screen padding={0}>
			<View style={{ paddingTop: 4, paddingHorizontal: 16, paddingBottom: 12 }}>
				<Text style={{ fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.52, color: c.ink }}>Чаты</Text>
			</View>

			<View style={{ flex: 1 }}>
				{chats.map((chat, i) => (
					<Pressable
						key={chat.id}
						onPress={() => router.push('/chat')}
						style={{
							paddingVertical: 14,
							paddingHorizontal: 16,
							flexDirection: 'row',
							gap: 12,
							alignItems: 'center',
							borderBottomWidth: 2,
							borderBottomColor: c.hairline,
							opacity: chat.dimmed ? 0.55 : 1,
						}}
					>
						<Avatar letter={chat.initial} color={i === 0 ? c.brandStrong : c.inkSecondary} />

						<View style={{ flex: 1, gap: 3 }}>
							<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
								<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>{chat.name}</Text>
								<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>{chat.time}</Text>
							</View>

							<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>{chat.meta}</Text>

							<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
								<Text
									numberOfLines={1}
									style={{
										flex: 1,
										fontSize: 15,
										fontFamily: fontFamily(400),
										color: chat.unread ? c.ink : c.muted,
									}}
								>
									{chat.last}
								</Text>
								{chat.unread ? (
									<View
										style={{
											minWidth: 22,
											height: 22,
											borderRadius: 11,
											backgroundColor: c.brand,
											alignItems: 'center',
											justifyContent: 'center',
										}}
									>
										<Text style={{ fontSize: 12, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{chat.unread}</Text>
									</View>
								) : null}
							</View>
						</View>
					</Pressable>
				))}
			</View>
		</Screen>
	)
}
