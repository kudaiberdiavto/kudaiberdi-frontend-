import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Button } from '@/components/ui'
import { fontFamily, useColors } from '@/theme'
import { COUNTRY_CODE, formatLocalPhone, isValidLocalPhone } from '@/lib/phone'

export default function PhoneScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const [lang, setLang] = useState<'ru' | 'kg'>('ru')
	const [phone, setPhone] = useState('555 12 34 56')

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<View style={{ height: 44, paddingHorizontal: 22, alignItems: 'flex-end' }}>
				<View
					style={{
						marginTop: 24,
						flexDirection: 'row',
						gap: 3,
						padding: 3,
						borderRadius: 10,
						backgroundColor: c.card,
					}}
				>
					{(['ru', 'kg'] as const).map((code) => {
						const active = lang === code
						return (
							<Pressable
								key={code}
								onPress={() => setLang(code)}
								style={{
									height: 30,
									paddingHorizontal: 10,
									borderRadius: 8,
									alignItems: 'center',
									justifyContent: 'center',
									backgroundColor: active ? c.brand : 'transparent',
								}}
							>
								<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: active ? '#FFFFFF' : c.muted }}>
									{code.toUpperCase()}
								</Text>
							</Pressable>
						)
					})}
				</View>
			</View>

			<View style={{ flex: 1, paddingTop: 80, paddingHorizontal: 24, paddingBottom: 24, gap: 28 }}>
				<View
					style={{
						width: 64,
						height: 64,
						borderRadius: 18,
						backgroundColor: c.brand,
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<Text style={{ fontSize: 34, fontFamily: fontFamily(700), color: '#FFFFFF' }}>К</Text>
				</View>

				<View style={{ gap: 8 }}>
					<Text
						style={{
							fontSize: 32,
							lineHeight: 35.2,
							fontFamily: fontFamily(700),
							letterSpacing: -0.64,
							color: c.ink,
						}}
					>
						Кудайберген
					</Text>
					<Text style={{ fontSize: 17, lineHeight: 24.65, fontFamily: fontFamily(400), color: c.muted }}>
						Спросите деталь — ответят те, у кого она есть
					</Text>
				</View>

				<View style={{ gap: 8 }}>
					<Text style={{ fontSize: 14, fontFamily: fontFamily(600), color: c.muted }}>Номер телефона</Text>
					<View
						style={{
							height: 64,
							borderRadius: 14,
							borderWidth: 2,
							borderColor: c.brand,
							backgroundColor: c.card,
							paddingHorizontal: 16,
							flexDirection: 'row',
							alignItems: 'center',
						}}
					>
						<Text style={{ fontSize: 20, fontFamily: fontFamily(700), color: c.muted }}>{COUNTRY_CODE}</Text>
						<View style={{ width: 2, height: 26, backgroundColor: c.border, marginHorizontal: 12 }} />
						<TextInput
							value={phone}
							onChangeText={(text) => setPhone(formatLocalPhone(text))}
							keyboardType="phone-pad"
							placeholder="555 12 34 56"
							placeholderTextColor={c.muted}
							style={{
								flex: 1,
								fontSize: 20,
								fontFamily: fontFamily(700),
								letterSpacing: 0.8,
								color: c.ink,
								padding: 0,
							}}
						/>
					</View>
				</View>

				<View style={{ flex: 1 }} />

				<Button
					label="Получить код"
					disabled={!isValidLocalPhone(phone)}
					onPress={() => router.push({ pathname: '/code', params: { phone: `${COUNTRY_CODE} ${phone}` } })}
				/>
			</View>
		</View>
	)
}
