import { Redirect, useLocalSearchParams } from 'expo-router'

/** Share link https://kudaibergen.kg/m/{publicId} → master profile (GET /masters/public/{publicId}). */
export default function MasterLink() {
	const { publicId } = useLocalSearchParams<{ publicId: string }>()
	return <Redirect href={{ pathname: '/master-card', params: { publicId } }} />
}
