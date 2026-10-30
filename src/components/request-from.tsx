import { Text, View } from 'react-native'
import { fontFamily, useColors } from '@/theme'

/** Who asked: the initial in a circle and the name — on top of a request card for the seller and the master. */
export function RequestFrom({ name, fallback }: { name: string | null | undefined; fallback: string }) {
	const c = useColors()
	const shown = name?.trim() || fallback
	return (
		<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
			<View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
				<Text style={{ fontSize: 16.5, fontFamily: fontFamily(700), color: c.brandStrong }}>{shown.charAt(0).toUpperCase()}</Text>
			</View>
			<Text numberOfLines={1} style={{ flex: 1, fontSize: 17.5, fontFamily: fontFamily(700), color: c.ink }}>
				{shown}
			</Text>
		</View>
	)
}

/** The server's caption for a request with no words — «Голосовой запрос», «Запчасть по фото»: the voice and photos say it. */
const PLACEHOLDERS = new Set([
	'Голосовой запрос',
	'Үн менен суроо',
	'Запчасть по фото',
	'Сүрөт боюнча тетик',
	'Описание голосом',
	'Үн менен сүрөттөлгөн',
	'Проблема на фото',
	'Көйгөй сүрөттө',
])
export const isPlaceholderText = (text: string) => PLACEHOLDERS.has(text.trim())
