import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { Button, Segmented } from '@/components/ui'
import { CameraIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'

export default function SellerAnswerScreen() {
	const c = useColors()
	const [condition, setCondition] = useState(0)
	const [message, setMessage] = useState('Есть KYB и оригинал, подходите посмотреть')
	const [price, setPrice] = useState('')

	return (
		<View style={{ flex: 1, backgroundColor: raw.sheetBackdrop, justifyContent: 'flex-end' }}>
			<View
				style={{
					backgroundColor: c.card,
					borderTopLeftRadius: 24,
					borderTopRightRadius: 24,
					paddingTop: 12,
					paddingHorizontal: 16,
					paddingBottom: 24,
					gap: 16,
				}}
			>
				<View style={{ width: 44, height: 4, borderRadius: 2, backgroundColor: raw.dashed, alignSelf: 'center' }} />

				<View style={{ gap: 4 }}>
					<Text style={{ fontSize: 22, fontFamily: fontFamily(700), color: c.ink }}>Стойки передние</Text>
					<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>Camry 50 · 2012 · Бакыт</Text>
				</View>

				<Segmented
					items={['Новое', 'Б/У', 'Под заказ']}
					value={condition}
					onChange={setCondition}
					background={c.surface}
					borderColor={c.border}
				/>

				<View style={{ gap: 6 }}>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>Сообщение покупателю</Text>
					<TextInput
						value={message}
						onChangeText={setMessage}
						multiline
						style={{
							minHeight: 72,
							borderRadius: 12,
							borderWidth: 2,
							borderColor: c.brand,
							backgroundColor: c.surface,
							paddingVertical: 12,
							paddingHorizontal: 14,
							fontSize: 16,
							lineHeight: 22.4,
							fontFamily: fontFamily(400),
							color: c.ink,
						}}
					/>
				</View>

				<View style={{ flexDirection: 'row', gap: 10 }}>
					<View style={{ flex: 1, gap: 6 }}>
						<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>Цена · по желанию</Text>
						<TextInput
							value={price}
							onChangeText={setPrice}
							keyboardType="number-pad"
							placeholder="сом"
							placeholderTextColor={raw.fillInk}
							style={{
								height: 56,
								borderRadius: 12,
								borderWidth: 2,
								borderColor: c.border,
								backgroundColor: c.surface,
								paddingHorizontal: 14,
								fontSize: 16,
								fontFamily: fontFamily(400),
								color: c.ink,
							}}
						/>
					</View>
					<View style={{ width: 52, gap: 6 }}>
						<Text style={{ fontSize: 13 }} />
						<Pressable
							style={{
								height: 56,
								borderRadius: 12,
								borderWidth: 2,
								borderStyle: 'dashed',
								borderColor: raw.dashed,
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<CameraIcon size={22} color={c.inkSecondary} />
						</Pressable>
					</View>
				</View>

				<Button label="Отправить «Есть»" height={60} fontSize={18} onPress={() => router.replace('/seller/chats')} />
			</View>
		</View>
	)
}
