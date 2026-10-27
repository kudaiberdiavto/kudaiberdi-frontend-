import { Linking } from 'react-native'
import { router } from 'expo-router'
import { formatPlace } from '@/lib/format'

/** A shop's place: a box on the Кудайберген market, or a shop / centre with its own address. */
interface ShopPlace {
	name: string
	location: { containerId: number; rowCode: string; rowLabel: string; number: number } | null
	address?: string | null
	lat?: number | null
	lng?: number | null
	phone?: string | null
}

/** «Ряд 14 · Бокс 12» on the market, the address off it. */
export function shopPlace(shop: ShopPlace) {
	return shop.location ? formatPlace(shop.location) : (shop.address ?? '')
}

/**
 * «Маршрут»: on the market — the route between the rows (/route); a shop off the market — a route in 2GIS to its
 * point (opens the 2GIS app if it's installed).
 */
export function openShopRoute(shop: ShopPlace, extra: { chatId?: number | null } = {}) {
	if (shop.location) {
		router.push({
			pathname: '/route',
			params: {
				containerId: String(shop.location.containerId),
				shopName: shop.name,
				chatId: extra.chatId ? String(extra.chatId) : undefined,
				phone: shop.phone ?? undefined,
			},
		})
	} else if (shop.lat != null && shop.lng != null) {
		Linking.openURL(`https://2gis.kg/bishkek/directions/points/%7C${shop.lng}%2C${shop.lat}`)
	} else if (shop.address) {
		Linking.openURL(`https://2gis.kg/bishkek/search/${encodeURIComponent(shop.address)}`)
	}
}

/** The same for a card in the grid (ShopBriefDto: row / container, or the address). */
export function briefPlace(shop: { onMarket: boolean; address?: string | null; rowLabel?: string | null; row?: string | null; container?: number | null }) {
	return shop.onMarket ? formatPlace(shop) : (shop.address ?? '')
}
