import { useState } from 'react'
import { Text, View } from 'react-native'
import { router } from 'expo-router'
import { Avatar, LanguageSwitch, Screen, SectionLabel, SettingsRow, Toggle } from '@/components/ui'
import { fontFamily, useColors } from '@/theme'
import { buyerProfileMenu, currentUser } from '@/mocks'

export default function BuyerProfileScreen() {
	const c = useColors()
	const [lang, setLang] = useState<'ru' | 'kg'>('ru')
	const [notify, setNotify] = useState(true)

	return (
		<Screen>
			<View style={{ paddingTop: 8, gap: 14, flex: 1 }}>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
					<Avatar letter={currentUser.initial} size={60} radius={18} fontSize={24} />
					<View style={{ gap: 3 }}>
						<Text style={{ fontSize: 22, fontFamily: fontFamily(700), color: c.ink }}>{currentUser.name}</Text>
						<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>{currentUser.phone}</Text>
					</View>
				</View>

				<View style={{ borderRadius: 16, backgroundColor: c.card, overflow: 'hidden' }}>
					<SettingsRow label="Мой гараж" value={buyerProfileMenu.garage} onPress={() => router.push('/garage')} />
					<SettingsRow label="История запросов" value={buyerProfileMenu.history} />
					<SettingsRow label="Избранные магазины" value={buyerProfileMenu.favorites} divider={false} />
				</View>

				<SectionLabel style={{ paddingTop: 4 }}>Настройки</SectionLabel>

				<View style={{ borderRadius: 16, backgroundColor: c.card, overflow: 'hidden' }}>
					<SettingsRow label="Язык" height={60} right={<LanguageSwitch value={lang} onChange={setLang} />} />
					<SettingsRow label="Уведомления об ответах" right={<Toggle value={notify} onChange={setNotify} />} />
					<SettingsRow label="Тема" value={buyerProfileMenu.theme} />
					<SettingsRow
						label="Я продавец — открыть бокс"
						value="›"
						valueColor={c.brandStrong}
						valueWeight={700}
						divider={false}
						onPress={() => router.push('/box-select')}
					/>
				</View>

				<View style={{ borderRadius: 16, backgroundColor: c.card, overflow: 'hidden' }}>
					<SettingsRow label="Поддержка" />
					<SettingsRow label="Выйти" labelColor={c.danger} divider={false} />
				</View>
			</View>
		</Screen>
	)
}
