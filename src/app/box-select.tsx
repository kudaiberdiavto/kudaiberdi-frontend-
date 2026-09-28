import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Button, SectionLabel } from '@/components/ui'
import { fontFamily, raw, useColors } from '@/theme'
import { boxSelection } from '@/mocks'

export default function BoxSelectScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const [row, setRow] = useState(boxSelection.selectedRow)
	const [box, setBox] = useState(boxSelection.selectedBox)

	return (
		<View
			style={{
				flex: 1,
				backgroundColor: c.surface,
				paddingTop: insets.top + 8,
				paddingHorizontal: 16,
				paddingBottom: 16,
				gap: 14,
			}}
		>
			<Text style={{ fontSize: 13, fontFamily: fontFamily(700), color: c.muted }}>{boxSelection.step}</Text>
			<Text
				style={{ fontSize: 26, lineHeight: 29.9, fontFamily: fontFamily(700), letterSpacing: -0.52, color: c.ink }}
			>
				{boxSelection.title}
			</Text>

			<SectionLabel>Ряд</SectionLabel>

			<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
				{boxSelection.rows.map((label) => {
					const active = row === label
					return (
						<Pressable
							key={label}
							onPress={() => setRow(label)}
							style={{
								width: 55,
								height: 44,
								borderRadius: 10,
								borderWidth: 2,
								borderColor: active ? c.brand : c.border,
								backgroundColor: active ? c.brandTint : c.card,
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<Text
								style={{ fontSize: 15, fontFamily: fontFamily(700), color: active ? c.brandStrong : c.ink }}
							>
								{label}
							</Text>
						</Pressable>
					)
				})}
				<Pressable
					style={{
						width: 55,
						height: 44,
						borderRadius: 10,
						borderWidth: 2,
						borderStyle: 'dashed',
						borderColor: raw.dashed,
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>{boxSelection.mapLabel}</Text>
				</Pressable>
			</View>

			<SectionLabel style={{ paddingTop: 6 }}>{`Ваш контейнер в ряду ${row}`}</SectionLabel>

			<View style={{ borderRadius: 14, backgroundColor: c.card, padding: 10 }}>
				{boxSelection.sides.map((side, index) => (
					<View key={side.id}>
						{index > 0 ? (
							<View style={{ height: 20, justifyContent: 'center', marginVertical: 4 }}>
								<View style={{ borderTopWidth: 2, borderStyle: 'dashed', borderColor: c.border }} />
							</View>
						) : null}

						<Text style={{ fontSize: 12, fontFamily: fontFamily(400), color: c.muted, paddingBottom: 6 }}>
							{side.label}
						</Text>
						<View style={{ flexDirection: 'row', gap: 5 }}>
							{side.boxes.map((number) => {
								const selectable = side.id === 'north'
								const active = selectable && box === number
								const taken = selectable && boxSelection.takenBoxes.includes(number)
								return (
									<Pressable
										key={`${side.id}-${number}`}
										disabled={taken || !selectable}
										onPress={() => setBox(number)}
										style={{
											width: 40,
											height: 44,
											borderRadius: 8,
											backgroundColor: active ? c.brand : raw.fill,
											alignItems: 'center',
											justifyContent: 'center',
										}}
									>
										<Text
											style={{
												fontSize: 14,
												fontFamily: fontFamily(700),
												color: active ? '#FFFFFF' : taken ? raw.fillInk : c.inkSecondary,
											}}
										>
											{number}
										</Text>
									</Pressable>
								)
							})}
						</View>
					</View>
				))}
			</View>

			<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>{boxSelection.hint}</Text>

			<View style={{ flex: 1 }} />

			<Button label={`Ряд ${row} · Бокс ${box} — далее`} onPress={() => router.push('/my-box')} />
		</View>
	)
}
