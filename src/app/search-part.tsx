import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Button, SectionLabel, Segmented } from '@/components/ui'
import { CameraIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { cars, searchForm } from '@/mocks'

export default function SearchPartScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const [car, setCar] = useState(0)
	const [part, setPart] = useState('Стойки передние, пара')
	const [audience, setAudience] = useState(0)

	return (
		<View
			style={{
				flex: 1,
				backgroundColor: c.surface,
				paddingTop: insets.top + 8,
				paddingHorizontal: 16,
				paddingBottom: 16,
				gap: 16,
			}}
		>
			<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
				<Text style={{ fontSize: 24, fontFamily: fontFamily(700), letterSpacing: -0.48, color: c.ink }}>
					Найти запчасть
				</Text>
				<Pressable onPress={() => router.back()}>
					<Text style={{ fontSize: 15, fontFamily: fontFamily(600), color: c.muted }}>Отмена</Text>
				</Pressable>
			</View>

			<View style={{ gap: 8 }}>
				<SectionLabel>Машина</SectionLabel>
				<View style={{ flexDirection: 'row', gap: 8 }}>
					{cars.map((item, i) => {
						const active = car === i
						return (
							<Pressable
								key={item.id}
								onPress={() => setCar(i)}
								style={{
									height: 48,
									paddingHorizontal: 14,
									borderRadius: 22,
									borderWidth: 2,
									borderColor: active ? c.brand : c.border,
									backgroundColor: active ? c.brandTint : c.card,
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<Text
									style={{
										fontSize: 15,
										fontFamily: fontFamily(active ? 700 : 600),
										color: active ? c.brandStrong : c.inkSecondary,
									}}
								>
									{item.short}
								</Text>
							</Pressable>
						)
					})}
					<Pressable
						style={{
							width: 48,
							height: 48,
							borderRadius: 22,
							borderWidth: 2,
							borderColor: c.border,
							backgroundColor: c.card,
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Text style={{ fontSize: 20, fontFamily: fontFamily(400), color: c.brandStrong }}>+</Text>
					</Pressable>
				</View>
			</View>

			<View style={{ gap: 8 }}>
				<SectionLabel>Что нужно</SectionLabel>
				<View
					style={{
						height: 60,
						borderRadius: 14,
						borderWidth: 2,
						borderColor: c.brand,
						backgroundColor: c.card,
						paddingHorizontal: 16,
						justifyContent: 'center',
					}}
				>
					<TextInput
						value={part}
						onChangeText={setPart}
						style={{ fontSize: 17, fontFamily: fontFamily(400), color: c.ink, padding: 0 }}
					/>
				</View>
				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
					{searchForm.suggestions.map((label: string) => (
						<Pressable
							key={label}
							onPress={() => setPart(label.replace('+ ', ''))}
							style={{
								height: 40,
								paddingHorizontal: 12,
								borderRadius: 18,
								borderWidth: 2,
								borderColor: c.border,
								backgroundColor: c.card,
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<Text style={{ fontSize: 14, fontFamily: fontFamily(600), color: c.inkSecondary }}>{label}</Text>
						</Pressable>
					))}
				</View>
			</View>

			<Pressable
				style={{
					height: 68,
					borderRadius: 14,
					borderWidth: 2,
					borderStyle: 'dashed',
					borderColor: raw.dashed,
					paddingHorizontal: 16,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 12,
				}}
			>
				<CameraIcon size={24} color={c.inkSecondary} />
				<View style={{ gap: 2 }}>
					<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: c.ink }}>Фото детали</Text>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>
						Необязательно, но так быстрее поймут
					</Text>
				</View>
			</Pressable>

			<View style={{ gap: 8 }}>
				<SectionLabel>Кому отправить</SectionLabel>
				<Segmented
					items={['Всему рынку', 'Ряду', 'Боксу']}
					value={audience}
					onChange={setAudience}
					borderColor={c.border}
				/>
				<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>
					Запрос получат <Text style={{ fontFamily: fontFamily(700), color: c.ink }}>43 продавца</Text> по Toyota
				</Text>
			</View>

			<View style={{ flex: 1 }} />

			<Button
				label="Отправить запрос"
				height={60}
				fontSize={18}
				onPress={() => router.replace('/buyer/requests')}
			/>
		</View>
	)
}
