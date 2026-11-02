import { Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import { Image } from '@/components/ui/image'
import { PhotoPlaceholder } from '@/components/ui'
import { fontFamily, fs, sectionTitle, useColors } from '@/theme'
import { resolveUrl } from '@/lib/api'
import { formatPrice } from '@/lib/format'
import { useRecentlyViewed } from '@/store/useRecentlyViewed'
import { t } from '@/i18n'

const TILE = 124

/** «Недавно смотрели» — a strip of the last opened parts; nothing until the first one is opened. */
export function RecentlyViewed() {
	const c = useColors()
	const { items, clear } = useRecentlyViewed()
	if (!items.length) return null
	return (
		<View style={{ gap: 10, paddingTop: 2 }}>
			<View style={{ flexDirection: 'row', alignItems: 'center' }}>
				<Text style={{ flex: 1, ...sectionTitle, color: c.inkSecondary }}>
					{t('Недавно смотрели')}
				</Text>
				<Pressable onPress={clear} hitSlop={12} accessibilityRole="button">
					<Text style={{ fontSize: fs.md, fontFamily: fontFamily(600), color: c.brandStrong }}>{t('Очистить')}</Text>
				</Pressable>
			</View>
			<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16 }} style={{ marginHorizontal: -16 }}>
				{items.map((part) => (
					<Pressable
						key={part.id}
						onPress={() => router.push({ pathname: '/part', params: { id: String(part.id) } })}
						accessibilityRole="button"
						accessibilityLabel={[part.title, formatPrice(part.price)].filter(Boolean).join(', ')}
						style={{ width: TILE, gap: 6 }}
					>
						<View style={{ width: TILE, height: TILE, borderRadius: 14, overflow: 'hidden', backgroundColor: c.card }}>
							{part.thumbUrl ? (
								<Image source={{ uri: resolveUrl(part.thumbUrl) }} style={{ width: TILE, height: TILE }} />
							) : (
								<PhotoPlaceholder width={TILE} height={TILE} radius={0} />
							)}
						</View>
						<Text numberOfLines={1} style={{ fontSize: fs.md, fontFamily: fontFamily(800), color: c.ink }}>
							{formatPrice(part.price) || '—'}
						</Text>
						<Text numberOfLines={1} style={{ fontSize: fs.sm, fontFamily: fontFamily(400), color: c.inkSecondary }}>
							{part.title || part.shopName}
						</Text>
					</Pressable>
				))}
			</ScrollView>
		</View>
	)
}
