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
