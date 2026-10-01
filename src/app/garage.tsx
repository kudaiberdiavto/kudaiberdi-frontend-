import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Badge, Button, QueryErrorBanner } from '@/components/ui'
import { CameraIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { useCars, useDeleteCar, useMakePrimaryCar } from '@/api/garage'
import type { Car } from '@/api/types'

export default function GarageScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const cars = useCars()
	const makePrimary = useMakePrimaryCar()
	const remove = useDeleteCar()
	const error = cars.error ?? makePrimary.error ?? remove.error

	const confirmDelete = (car: Car) =>
		Alert.alert(`Удалить ${car.title}?`, undefined, [
			{ text: 'Отмена', style: 'cancel' },
			{ text: 'Удалить', style: 'destructive', onPress: () => remove.mutate(car.id) },
		])

	return (
		<View
			style={{
				flex: 1,
				backgroundColor: c.surface,
				paddingTop: insets.top + 24,
				paddingHorizontal: 16,
				paddingBottom: 24,
			}}
		>
			<ScrollView contentContainerStyle={{ gap: 12 }} showsVerticalScrollIndicator={false}>
				<Text style={{ fontSize: 28, fontFamily: fontFamily(700), letterSpacing: -0.56, color: c.ink }}>Мой гараж</Text>
				<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted, paddingBottom: 8 }}>
					Выберете машину одним тапом при запросе
				</Text>

				<QueryErrorBanner error={error} onRetry={() => cars.refetch()} />

				{(cars.data ?? []).map((car) => (
					<Pressable
						key={car.id}
						onPress={() => !car.isPrimary && makePrimary.mutate(car.id)}
						onLongPress={() => confirmDelete(car)}
						style={{
							borderRadius: 16,
							borderWidth: 2,
							borderColor: car.isPrimary ? c.brand : c.border,
							backgroundColor: c.card,
							padding: 16,
							flexDirection: 'row',
							alignItems: 'center',
							gap: 14,
						}}
					>
						<View style={{ flex: 1, gap: 3 }}>
							<Text style={{ fontSize: 18, fontFamily: fontFamily(700), color: c.ink }}>{car.title}</Text>
							<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>{car.subtitle}</Text>
						</View>
						{car.isPrimary ? <Badge label="Основная" tone="brand" /> : null}
					</Pressable>
				))}

				<Pressable
					onPress={() => router.push('/garage-add')}
					style={{
						height: 64,
						borderRadius: 16,
						borderWidth: 2,
						borderStyle: 'dashed',
						borderColor: raw.dashed,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 8,
					}}
				>
					<Text style={{ fontSize: 22, fontFamily: fontFamily(700), color: c.brandStrong }}>+</Text>
					<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: c.inkSecondary }}>Добавить машину</Text>
				</Pressable>

				<Pressable
					// TODO(backend): no tech passport recognition endpoint (BACKEND_QUESTIONS.md) — manual entry for now.
					onPress={() => router.push('/garage-add')}
					style={{
						height: 52,
						borderRadius: 14,
						backgroundColor: raw.fill,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 10,
					}}
				>
					<CameraIcon size={20} color={c.ink} />
					<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: c.ink }}>Сфотографировать техпаспорт</Text>
				</Pressable>
			</ScrollView>

			<Button label="Готово" onPress={() => (router.canGoBack() ? router.back() : router.replace('/buyer'))} />
		</View>
	)
}
