import { useState } from 'react'
import { TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { ServiceGrid } from '@/components/ui'
import { ServiceWizard } from '@/components/service-wizard'
import { SearchIcon } from '@/components/icons'
import { fontFamily, raw, useColors } from '@/theme'
import { useServiceTypes } from '@/api/services'
import { useServiceDraft } from '@/store/useServiceDraft'

/** Words people type → the service they mean («стучит подвеска» → СТО). */
const KEYWORDS: Record<string, string[]> = {
	CAR_REPAIR: ['подвес', 'стук', 'ремонт', 'двигат', 'мотор', 'тормоз', 'ходов', 'стойк'],
	TIRE_SERVICE: ['шин', 'колес', 'прокол', 'баланс'],
	LPG: ['газ', 'гбо', 'пропан', 'метан'],
	TOW_TRUCK: ['эвакуат', 'не завод', 'дтп', 'авари'],
	CAR_WASH: ['мойк', 'помыт', 'чистк', 'химчист'],
	AUTO_ELECTRIC: ['электр', 'аккумул', 'стартер', 'генерат', 'провод', 'свет', 'фар'],
	BODY_PAINT: ['кузов', 'покрас', 'вмятин', 'царап', 'рихтов'],
	DIAGNOSTICS: ['диагност', 'чек', 'check', 'ошибк', 'компьют'],
	OIL_CHANGE: ['масл', 'фильтр', 'то '],
	WHEEL_ALIGNMENT: ['развал', 'тянет', 'руль'],
	TINTING: ['тонир', 'стекл', 'плёнк', 'пленк'],
	MOBILE_MASTER: ['выезд', 'на месте', 'приехать'],
}

/** 33 «Заявка на услугу», шаг 1: pick the service. */
export default function ServiceNewScreen() {
	const c = useColors()
	const types = useServiceTypes().data
	const service = useServiceDraft((s) => s.service)
	const setService = useServiceDraft((s) => s.setService)
	const [query, setQuery] = useState('')

	const q = query.trim().toLowerCase()
	const shown = q
		? types.filter((t) => t.name.toLowerCase().includes(q) || (KEYWORDS[t.code] ?? []).some((word) => q.includes(word) || word.startsWith(q)))
		: types

	return (
		<ServiceWizard step={1} label="Услуга" disabled={!service} onNext={() => router.push('/service-car')}>
			<View style={{ height: 44, borderRadius: 12, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 }}>
				<SearchIcon size={20} color={c.muted} />
				<TextInput
					value={query}
					onChangeText={setQuery}
					placeholder="Например: стучит подвеска"
					placeholderTextColor={raw.fillInk}
					style={{ flex: 1, fontSize: 15, fontFamily: fontFamily(400), color: c.ink }}
				/>
			</View>
			<ServiceGrid types={shown} isSelected={(code) => code === service} onPress={setService} />
		</ServiceWizard>
	)
}
