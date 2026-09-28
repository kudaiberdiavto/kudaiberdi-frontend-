import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { PhotoPlaceholder, Segmented, Stepper } from '@/components/ui'
import { ChevronLeftIcon, CloseIcon, PlusIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { newPartForm } from '@/mocks'

export default function NewPartScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const [name, setName] = useState(newPartForm.name)
	const [fits, setFits] = useState(newPartForm.fits)
	const [category] = useState(newPartForm.category)
	const [condition, setCondition] = useState(newPartForm.condition)
	const [price, setPrice] = useState(newPartForm.price)
	const [qty, setQty] = useState(newPartForm.qty)

	return (
		<View style={{ flex: 1, backgroundColor: c.surface }}>
			<View
				style={{
					paddingTop: insets.top + 12,
					paddingHorizontal: 16,
					paddingBottom: 8,
					flexDirection: 'row',
					alignItems: 'center',
					gap: 10,
				}}
			>
				<Pressable onPress={() => router.back()}>
					<ChevronLeftIcon size={24} color={c.ink} />
				</Pressable>
				<Text style={{ flex: 1, fontSize: 20, fontFamily: fontFamily(700), letterSpacing: -0.2, color: c.ink }}>
					{newPartForm.title}
				</Text>
				<Text style={{ fontSize: 15, fontFamily: fontFamily(600), color: c.muted }}>{newPartForm.draftLabel}</Text>
			</View>

			<ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 14, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
				<View style={{ flexDirection: 'row', gap: 8 }}>
					<View>
						<PhotoPlaceholder width={80} height={80} radius={12} />
						<View
							style={{
								position: 'absolute',
								left: 6,
								bottom: 6,
								height: 20,
								paddingHorizontal: 6,
								borderRadius: 6,
								backgroundColor: 'rgba(32,31,29,0.72)',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<Text style={{ fontSize: 11, fontFamily: fontFamily(700), color: '#FFFFFF' }}>Главное</Text>
						</View>
					</View>
					<PhotoPlaceholder width={80} height={80} radius={12} />
					<PhotoPlaceholder width={80} height={80} radius={12} />
					<Pressable
						onPress={() => router.push('/camera')}
						style={{
							width: 84,
							height: 84,
							borderRadius: 12,
							backgroundColor: c.card,
							borderWidth: 2,
							borderStyle: 'dashed',
							borderColor: raw.mapRowBorder,
							alignItems: 'center',
							justifyContent: 'center',
							gap: 4,
						}}
					>
						<PlusIcon size={24} color={c.brandStrong} />
						<Text style={{ fontSize: 12, fontFamily: fontFamily(700), color: c.brandStrong }}>Ещё фото</Text>
					</Pressable>
				</View>

				<View style={{ gap: 6 }}>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>{newPartForm.nameLabel}</Text>
					<View
						style={{
							height: 52,
							borderRadius: 12,
							borderWidth: 2,
							borderColor: c.border,
							backgroundColor: c.card,
							paddingHorizontal: 14,
							justifyContent: 'center',
						}}
					>
						<TextInput value={name} onChangeText={setName} style={{ fontSize: 16, fontFamily: fontFamily(400), color: c.ink, padding: 0 }} />
					</View>
				</View>

				<View style={{ gap: 8 }}>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>{newPartForm.fitLabel}</Text>
					<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
						{fits.map((label) => (
							<View
								key={label}
								style={{
									height: 44,
									borderRadius: 20,
									backgroundColor: c.brandTint,
									borderWidth: 2,
									borderColor: c.brand,
									paddingLeft: 14,
									paddingRight: 8,
									flexDirection: 'row',
									alignItems: 'center',
									gap: 8,
								}}
							>
								<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>{label}</Text>
								<Pressable
									onPress={() => setFits((prev) => prev.filter((f) => f !== label))}
									style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}
								>
									<CloseIcon size={14} color={c.brandStrong} strokeWidth={2.4} />
								</Pressable>
							</View>
						))}
						<Pressable
							style={{
								height: 44,
								borderRadius: 20,
								borderWidth: 2,
								borderStyle: 'dashed',
								borderColor: raw.mapRowBorder,
								paddingHorizontal: 14,
								flexDirection: 'row',
								alignItems: 'center',
								gap: 6,
							}}
						>
							<PlusIcon size={16} color={c.brandStrong} />
							<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>{newPartForm.addCar}</Text>
						</Pressable>
					</View>
				</View>

				<View style={{ gap: 6 }}>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>{newPartForm.categoryLabel}</Text>
					<Pressable
						style={{
							height: 52,
							borderRadius: 12,
							borderWidth: 2,
							borderColor: c.border,
							backgroundColor: c.card,
							paddingHorizontal: 14,
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
						}}
					>
						<Text style={{ fontSize: 16, fontFamily: fontFamily(400), color: c.ink }}>{category}</Text>
						<Text style={{ fontSize: 16, color: c.muted }}>›</Text>
					</Pressable>
				</View>

				<View style={{ gap: 6 }}>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>{newPartForm.conditionLabel}</Text>
					<Segmented items={newPartForm.conditions} value={condition} onChange={setCondition} height={44} itemHeight={34} borderColor={c.border} />
				</View>

				<View style={{ flexDirection: 'row', gap: 16 }}>
					<View style={{ flex: 1.4, gap: 6 }}>
						<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>{newPartForm.priceLabel}</Text>
						<View
							style={{
								height: 52,
								borderRadius: 12,
								borderWidth: 2,
								borderColor: c.border,
								backgroundColor: c.card,
								paddingHorizontal: 14,
								flexDirection: 'row',
								alignItems: 'center',
								gap: 8,
							}}
						>
							<TextInput
								value={price}
								onChangeText={setPrice}
								keyboardType="numeric"
								style={{ flex: 1, fontSize: 16, fontFamily: fontFamily(700), color: c.ink, padding: 0 }}
							/>
							<Text style={{ fontSize: 16, fontFamily: fontFamily(400), color: c.muted }}>{newPartForm.priceSuffix}</Text>
						</View>
					</View>
					<View style={{ flex: 1, gap: 6 }}>
						<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>{newPartForm.qtyLabel}</Text>
						<View
							style={{
								height: 52,
								borderRadius: 12,
								borderWidth: 2,
								borderColor: c.border,
								backgroundColor: c.card,
								paddingHorizontal: 6,
								justifyContent: 'center',
							}}
						>
							<Stepper value={qty} onChange={setQty} min={1} />
						</View>
					</View>
				</View>
			</ScrollView>

			<View
				style={{
					paddingHorizontal: 16,
					paddingTop: 12,
					paddingBottom: insets.bottom + 12,
					borderTopWidth: 1,
					borderTopColor: c.hairline,
					backgroundColor: c.card,
				}}
			>
				<Pressable
					onPress={() => router.back()}
					style={{ height: 56, borderRadius: 14, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}
				>
					<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{newPartForm.submitLabel}</Text>
				</Pressable>
			</View>
		</View>
	)
}
