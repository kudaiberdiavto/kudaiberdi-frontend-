import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { ProductCard } from '@/components/ui'
import { SearchIcon } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'
import { cars, catalogScreen } from '@/mocks'

export default function CatalogScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const [carId, setCarId] = useState<string | null>(cars[0]?.id ?? null)
	const [category, setCategory] = useState(catalogScreen.activeCategory)

	return (
		<View style={{ flex: 1, backgroundColor: c.surface }}>
			<ScrollView
				contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 90, gap: 14 }}
				showsVerticalScrollIndicator={false}
			>
				<Text style={{ fontSize: 26, fontFamily: fontFamily(700), letterSpacing: -0.26, color: c.ink }}>{catalogScreen.title}</Text>

				<View
					style={{
						height: 52,
						borderRadius: 14,
						backgroundColor: c.card,
						borderWidth: 2,
						borderColor: c.brand,
						flexDirection: 'row',
						alignItems: 'center',
						gap: 10,
						paddingHorizontal: 12,
					}}
				>
					<SearchIcon size={20} color={c.muted} strokeWidth={2.4} />
					<TextInput
						defaultValue={catalogScreen.searchValue}
						style={{ flex: 1, fontSize: 16, fontFamily: fontFamily(400), color: c.ink, padding: 0 }}
					/>
					<SearchIcon size={20} color={c.muted} strokeWidth={2.4} />
				</View>

				<Text style={{ fontSize: 13, fontFamily: fontFamily(700), letterSpacing: 1.04, color: c.muted }}>
					{catalogScreen.carsLabel}
				</Text>

				<View style={{ flexDirection: 'row', gap: 8 }}>
					{cars.map((car) => {
						const active = carId === car.id
						return (
							<Pressable
								key={car.id}
								onPress={() => setCarId(car.id)}
								style={{
									height: 44,
									borderRadius: 20,
									paddingLeft: 6,
									paddingRight: 14,
									flexDirection: 'row',
									alignItems: 'center',
									gap: 8,
									backgroundColor: active ? c.brandTint : c.card,
									borderWidth: 2,
									borderColor: active ? c.brand : c.border,
								}}
							>
								<View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: c.border }} />
								<Text style={{ fontSize: 14, fontFamily: fontFamily(active ? 700 : 600), color: active ? c.brandStrong : c.inkSecondary }}>
									{car.short}
								</Text>
							</Pressable>
						)
					})}
					<Pressable
						onPress={() => {
							setCarId(null)
							router.push('/pick-brand')
						}}
						style={{
							height: 44,
							borderRadius: 20,
							paddingHorizontal: 14,
							backgroundColor: c.card,
							borderWidth: 2,
							borderColor: c.border,
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Text style={{ fontSize: 14, fontFamily: fontFamily(600), color: c.ink }}>Любая марка ›</Text>
					</Pressable>
				</View>

				<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
					{catalogScreen.categories.map((label, i) => {
						const active = category === i
						return (
							<Pressable
								key={label}
								onPress={() => setCategory(i)}
								style={{
									height: 38,
									paddingHorizontal: 14,
									borderRadius: 18,
									backgroundColor: active ? c.brand : c.card,
									borderWidth: active ? 0 : 1,
									borderColor: c.border,
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<Text style={{ fontSize: 14, fontFamily: fontFamily(600), color: active ? '#FFFFFF' : c.ink }}>{label}</Text>
							</Pressable>
						)
					})}
				</ScrollView>

				<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
					<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>
						<Text style={{ fontFamily: fontFamily(700), color: c.ink }}>{catalogScreen.resultsCount}</Text> {catalogScreen.forCar}
					</Text>
					<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: c.brandStrong }}>{catalogScreen.sort}</Text>
				</View>

				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
					{catalogScreen.items.map((item) => (
						<ProductCard
							key={item.id}
							price={item.price}
							title={item.title}
							fits={item.fits}
							location={item.location}
							onPress={() => router.push('/part')}
						/>
					))}
				</View>
			</ScrollView>

			<Pressable
				onPress={() => router.push('/search-part')}
				style={{
					position: 'absolute',
					left: 16,
					right: 16,
					bottom: insets.bottom + 12,
					height: 52,
					borderRadius: 14,
					backgroundColor: c.ink,
					paddingHorizontal: 16,
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
					shadowColor: '#201F1D',
					shadowOpacity: 0.25,
					shadowOffset: { width: 0, height: 8 },
					shadowRadius: 20,
					elevation: 8,
				}}
			>
				<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: '#FFFFFF' }}>{catalogScreen.notFoundText}</Text>
				<Text style={{ fontSize: 14, fontFamily: fontFamily(700), color: '#8FB0FF' }}>{catalogScreen.notFoundAction}</Text>
			</Pressable>
		</View>
	)
}
