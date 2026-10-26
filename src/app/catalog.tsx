import { router } from 'expo-router'
import { CatalogScreen } from '@/components/catalog-screen'

/** Parts for sale [27] for the buyer — opened from «Карта рынка» («Запчасти Toyota в продаже»). */
export default function CatalogStackScreen() {
	return <CatalogScreen onBack={() => router.back()} />
}
