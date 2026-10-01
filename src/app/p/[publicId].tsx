import { Redirect, useLocalSearchParams } from 'expo-router'

/** Share link https://kudaibergen.kg/p/{publicId} → part card [29] (GET /parts/public/{publicId}). */
export default function PartLink() {
	const { publicId } = useLocalSearchParams<{ publicId: string }>()
	return <Redirect href={{ pathname: '/part', params: { publicId } }} />
}
