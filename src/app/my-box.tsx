import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Button, Chip } from '@/components/ui'
import { BrandChip } from '@/components/ui/brand'
import { CameraIcon } from '@/components/icons'
import { brandBySlug } from '@/data/brands'
import { fontFamily, raw, useColors } from '@/theme'
import { sellerBox } from '@/mocks'

export default function MyBoxScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const [name, setName] = useState(sellerBox.name)
	const [brands, setBrands] = useState(sellerBox.brands)
	const [categories, setCategories] = useState(sellerBox.categories)

	const toggle = (list: typeof brands, index: number) =>
		list.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))

	return (
		<View
			style={{
				flex: 1,
				backgroundColor: c.surface,
				paddingTop: insets.top + 16,
				paddingHorizontal: 16,
				paddingBottom: 16,
				gap: 14,
			}}
		>
			<Text style={{ fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.52, color: c.ink }}>Мой бокс</Text>

			<View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
				<View>
					<View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: raw.fill }} />
					<View
						style={{
							position: 'absolute',
							right: -2,
							bottom: -2,
							width: 30,
							height: 30,
							borderRadius: 15,
							backgroundColor: c.brand,
							borderWidth: 2,
							borderColor: c.surface,
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<CameraIcon size={14} color="#FFFFFF" strokeWidth={2.4} />
					</View>
				</View>

				<View style={{ flex: 1, gap: 6 }}>
					<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>Название</Text>
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
						<TextInput
							value={name}
							onChangeText={setName}
							style={{ fontSize: 16, fontFamily: fontFamily(400), color: c.ink, padding: 0 }}
						/>
					</View>
				</View>
			</View>

			<View style={{ gap: 6 }}>
				<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>Где стоит</Text>
				<View
					style={{
						height: 56,
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
					<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>{sellerBox.place}</Text>
					<Pressable onPress={() => router.push('/box-select')}>
						<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>Изменить</Text>
					</Pressable>
				</View>
			</View>

			<View style={{ gap: 8 }}>
				<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>
					Марки — получаю запросы по ним
				</Text>
				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
					{brands.map((brand, i) => (
						<BrandChip
							key={brand.label}
							brand={brandBySlug(brand.label.toLowerCase())}
							selected={brand.selected}
							onPress={() => setBrands(toggle(brands, i))}
						/>
					))}
				</View>
			</View>

			<View style={{ gap: 8 }}>
				<Text style={{ fontSize: 13, fontFamily: fontFamily(600), color: c.muted }}>Что продаю</Text>
				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
					{categories.map((category, i) => (
						<Chip
							key={category.label}
							label={category.label}
							selected={category.selected}
							height={44}
							onPress={() => setCategories(toggle(categories, i))}
						/>
					))}
				</View>
			</View>

			<View
				style={{
					borderRadius: 12,
					backgroundColor: c.card,
					padding: 14,
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.inkSecondary }}>Часы работы</Text>
				<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.ink }}>{sellerBox.hours}</Text>
			</View>

			<View style={{ flex: 1 }} />

			<Button label="Сохранить" onPress={() => router.replace('/seller')} />
		</View>
	)
}
