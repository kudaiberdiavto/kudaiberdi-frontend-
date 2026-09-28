import { Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { ChevronLeftIcon, MicIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { sellerChat } from '@/mocks'

export default function SellerChatScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<View
				style={{
					paddingTop: 4,
					paddingHorizontal: 16,
					paddingBottom: 12,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 12,
					borderBottomWidth: 2,
					borderBottomColor: c.hairline,
				}}
			>
				<Pressable onPress={() => router.back()}>
					<ChevronLeftIcon size={24} color={c.ink} />
				</Pressable>
				<View style={{ flex: 1, gap: 2 }}>
					<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>{sellerChat.buyerName}</Text>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
						{sellerChat.requestTitle}
					</Text>
				</View>
			</View>

			<View style={{ flex: 1, padding: 16, gap: 10, justifyContent: 'flex-end' }}>
				{sellerChat.messages.map((message) => {
					const mine = message.from === 'me'
					return (
						<View
							key={message.id}
							style={{
								alignSelf: mine ? 'flex-end' : 'flex-start',
								maxWidth: '78%',
								borderRadius: 16,
								borderBottomLeftRadius: mine ? 16 : 4,
								borderBottomRightRadius: mine ? 4 : 16,
								backgroundColor: mine ? c.brand : c.card,
								paddingVertical: 10,
								paddingHorizontal: 14,
							}}
						>
							<Text
								style={{
									fontSize: 15,
									lineHeight: 21,
									fontFamily: fontFamily(400),
									color: mine ? '#FFFFFF' : c.ink,
								}}
							>
								{message.text}
							</Text>
						</View>
					)
				})}
			</View>

			<View style={{ paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
				{sellerChat.quickReplies.map((label) => (
					<Pressable
						key={label}
						style={{
							height: 44,
							paddingHorizontal: 12,
							borderRadius: 20,
							borderWidth: 2,
							borderColor: c.border,
							backgroundColor: c.card,
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Text style={{ fontSize: 14, fontFamily: fontFamily(600), color: c.ink }}>{label}</Text>
					</Pressable>
				))}
				<Pressable
					style={{
						height: 44,
						paddingHorizontal: 12,
						borderRadius: 20,
						borderWidth: 2,
						borderColor: c.success,
						backgroundColor: c.successTint,
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.success }}>Продано</Text>
				</Pressable>
			</View>

			<View
				style={{
					paddingTop: 10,
					paddingHorizontal: 16,
					paddingBottom: 18 + insets.bottom,
					borderTopWidth: 2,
					borderTopColor: c.hairline,
					flexDirection: 'row',
					gap: 10,
				}}
			>
				<TextInput
					placeholder="Сообщение"
					placeholderTextColor={raw.fillInk}
					style={{
						flex: 1,
						height: 48,
						borderRadius: 24,
						backgroundColor: c.card,
						paddingHorizontal: 16,
						fontSize: 15,
						fontFamily: fontFamily(400),
						color: c.ink,
					}}
				/>
				<Pressable
					style={{
						width: 48,
						height: 48,
						borderRadius: 24,
						backgroundColor: raw.fill,
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<MicIcon size={20} color={c.ink} />
				</Pressable>
			</View>
		</View>
	)
}
