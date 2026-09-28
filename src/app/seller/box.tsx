import { useState } from 'react'
import { Text, View } from 'react-native'
import { router } from 'expo-router'
import { Avatar, LanguageSwitch, Screen, SectionLabel, SettingsRow, Toggle } from '@/components/ui'
import { fontFamily, useColors } from '@/theme'
import { sellerBox, sellerProfileMenu } from '@/mocks'

export default function SellerBoxProfileScreen() {
	const c = useColors()
	const [lang, setLang] = useState<'ru' | 'kg'>('kg')
	const [sound, setSound] = useState(true)
	const [open, setOpen] = useState(sellerBox.isOpen)

	return (
		<Screen>
			<View style={{ paddingTop: 8, gap: 14, flex: 1 }}>
				<View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
					<Avatar letter="А" size={60} radius={18} fontSize={24} />
					<View style={{ gap: 3 }}>
						<Text style={{ fontSize: 20, fontFamily: fontFamily(700), color: c.ink }}>{sellerBox.name}</Text>
						<Text style={{ fontSize: 15, fontFamily: fontFamily(400), color: c.muted }}>
							{sellerBox.placeShort} · {sellerBox.rating} · {sellerBox.reviews} отзывов
						</Text>
					</View>
				</View>

				<View
					style={{
						borderRadius: 16,
						backgroundColor: c.card,
						borderWidth: 2,
						borderColor: c.border,
						paddingVertical: 14,
						paddingHorizontal: 16,
						flexDirection: 'row',
						alignItems: 'center',
						gap: 12,
					}}
				>
					<View style={{ flex: 1, gap: 3 }}>
						<Text style={{ fontSize: 17, fontFamily: fontFamily(700), color: c.ink }}>
							{open ? 'Бокс открыт' : 'Бокс закрыт'}
						</Text>
						<Text style={{ fontSize: 14, fontFamily: fontFamily(400), color: c.muted }}>
							{open ? sellerBox.openHint : sellerBox.closedHint}
						</Text>
					</View>
					<Toggle value={open} onChange={setOpen} />
				</View>

				<View style={{ borderRadius: 16, backgroundColor: c.card, overflow: 'hidden' }}>
					<SettingsRow label="Мой бокс, марки, часы" value={sellerProfileMenu.box} onPress={() => router.push('/box-photos')} />
					<SettingsRow label="Отзывы" value={sellerProfileMenu.reviews} />
					<SettingsRow label="Продавцы в боксе" value={sellerProfileMenu.sellers} divider={false} />
				</View>

				<SectionLabel style={{ paddingTop: 4 }}>Настройки</SectionLabel>

				<View style={{ borderRadius: 16, backgroundColor: c.card, overflow: 'hidden' }}>
					<SettingsRow label="Язык" height={60} right={<LanguageSwitch value={lang} onChange={setLang} />} />
					<SettingsRow label="Звук нового запроса" right={<Toggle value={sound} onChange={setSound} />} />
					<SettingsRow
						label="Перейти в режим покупателя"
						value="›"
						valueColor={c.brandStrong}
						valueWeight={700}
						divider={false}
						onPress={() => router.replace('/buyer')}
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
