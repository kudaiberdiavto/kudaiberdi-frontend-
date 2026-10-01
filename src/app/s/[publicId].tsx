import { Redirect, useLocalSearchParams } from 'expo-router'

/** Share link https://kudaibergen.kg/s/{publicId} → shop profile [30] (GET /shops/public/{publicId}). */
export default function ShopLink() {
	const { publicId } = useLocalSearchParams<{ publicId: string }>()
	return <Redirect href={{ pathname: '/seller-profile', params: { publicId } }} />
}
