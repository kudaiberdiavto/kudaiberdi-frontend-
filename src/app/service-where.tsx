import { useState } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as Location from 'expo-location'
import { Button, Chip, SectionLabel } from '@/components/ui'
import { ChevronLeftIcon, LocateIcon, MapPinIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { useServiceTypes } from '@/api/services'
import { WHERE_OPTIONS, useServiceDraft } from '@/store/useServiceDraft'

const RADII = [3, 5, 10, 20]

/**
 * «Где» for 36 — no mockup, built from the 36 styles. The point comes from the device location.
 * TODO(design): a city map to drop the pin — the app has only the market scheme, no city basemap.
 */
export default function ServiceWhereScreen() {
	const c = useColors()
	const insets = useSafeAreaInsets()
	const draft = useServiceDraft()
	const needsLocation = useServiceTypes().data.find((t) => t.code === draft.service)?.needsLocation ?? false
	const [locating, setLocating] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const options = needsLocation ? WHERE_OPTIONS.filter((o) => o.value !== 'I_COME') : WHERE_OPTIONS
	const pointRequired = needsLocation || draft.where !== 'I_COME'

	const locate = async () => {
		setError(null)
		setLocating(true)
		try {
			const permission = await Location.requestForegroundPermissionsAsync()
			if (!permission.granted) {
				setError('Разрешите доступ к геолокации или впишите адрес')
				return
			}
			const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
			let address = draft.address
			try {
				const [place] = await Location.reverseGeocodeAsync(coords)
				if (place) address = [place.street, place.streetNumber].filter(Boolean).join(' ') || place.name || address
			} catch {}
			draft.set({ lat: coords.latitude, lng: coords.longitude, address, located: true })
		} catch {
			setError('Не удалось определить место. Впишите адрес')
		} finally {
			setLocating(false)
		}
	}

	return (
		<View style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}>
			<View style={{ height: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
				<Pressable onPress={() => router.back()}>
					<ChevronLeftIcon size={24} color={c.ink} />
				</Pressable>
				<Text style={{ flex: 1, fontSize: 20, fontFamily: fontFamily(700), letterSpacing: -0.2, color: c.ink }}>Где</Text>
			</View>

			<View style={{ flex: 1, paddingTop: 8, paddingHorizontal: 16, gap: 12 }}>
				{options.map((option) => {
					const active = option.value === draft.where
					return (
						<Pressable
							key={option.value}
							onPress={() => draft.set({ where: option.value })}
							style={{
								borderRadius: 14,
								borderWidth: 2,
								borderColor: active ? c.brand : c.border,
								backgroundColor: active ? c.brandTint : c.card,
								paddingVertical: 12,
								paddingHorizontal: 14,
								gap: 2,
							}}
						>
							<Text style={{ fontSize: 16, fontFamily: fontFamily(700), color: active ? c.brandStrong : c.ink }}>{option.label}</Text>
							<Text style={{ fontSize: 13, fontFamily: fontFamily(400), color: c.muted }}>{option.hint}</Text>
						</Pressable>
					)
				})}

				<SectionLabel>{pointRequired ? 'Точка' : 'Откуда вы'}</SectionLabel>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, borderRadius: 12, backgroundColor: c.card, borderWidth: 2, borderColor: c.border, paddingHorizontal: 14 }}>
					<MapPinIcon size={20} color={c.brandStrong} />
					<TextInput
						value={draft.address ?? ''}
						onChangeText={(address) => draft.set({ address })}
						placeholder={pointRequired ? 'Ориентир для мастера' : 'Адрес или ориентир'}
						placeholderTextColor={raw.fillInk}
						style={{ flex: 1, fontSize: 15, fontFamily: fontFamily(400), color: c.ink }}
					/>
				</View>
				<Pressable onPress={locate} disabled={locating} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 40 }}>
					{locating ? <ActivityIndicator color={c.brandStrong} /> : <LocateIcon size={18} color={c.brandStrong} />}
					<Text style={{ fontSize: 15, fontFamily: fontFamily(700), color: c.brandStrong }}>
						{draft.located ? 'Место определено · обновить' : 'Определить моё место'}
					</Text>
				</Pressable>
				{error ? <Text style={{ fontSize: 14, fontFamily: fontFamily(500), color: c.danger }}>{error}</Text> : null}

				<SectionLabel>Радиус поиска</SectionLabel>
				<View style={{ flexDirection: 'row', gap: 8 }}>
					{RADII.map((km) => (
						<Chip key={km} label={`до ${km} км`} radius={12} color={c.ink} selected={km === draft.radiusKm} onPress={() => draft.set({ radiusKm: km })} />
					))}
				</View>
			</View>

			<View style={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 28 + insets.bottom, backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.hairline }}>
				<Button label="Готово" height={56} disabled={pointRequired && !draft.located} onPress={() => router.back()} />
			</View>
		</View>
	)
}
