import { Pressable, Text, View } from 'react-native'
import { Image } from './image'
import { logos, type LogoSource } from '@/data/brands'
import { resolveUrl } from '@/lib/api'
import { fixed, fontFamily, fs, useColors } from '@/theme'

/** Local demo brand (`logo`) or the server's BrandDto (`logoUrl`). */
interface BrandLike {
	slug: string
	name: string
	placeholder: string
	color: string
	logo?: LogoSource | null
	logoUrl?: string | null
}

/** Кружок логотипа марки — картинка из assets/brands, с сервера, или буква-заглушка. */
export function BrandLogo({ brand: input, size = 36 }: { brand: BrandLike; size?: number }) {
	const c = useColors()
	const url = resolveUrl(input.logoUrl)
	const brand = { ...input, logo: input.logo ?? logos[input.slug] ?? (url ? { uri: url } : null) }
	return (
		<View
			style={{
				width: size,
				height: size,
				borderRadius: size / 2,
				backgroundColor: fixed.white,
				borderWidth: brand.logo ? 1 : 1,
				borderColor: brand.logo ? c.border : brand.color,
				alignItems: 'center',
				justifyContent: 'center',
				shadowColor: fixed.shadow,
				shadowOpacity: 0.1,
				shadowOffset: { width: 0, height: 1 },
				shadowRadius: 2,
				elevation: 1,
			}}
		>
			{brand.logo ? (
				<Image source={brand.logo} contentFit="contain" style={{ width: size * 0.7, height: size * 0.7 }} />
			) : (
				<Text
					style={{
						fontSize: size * 0.4,
						fontFamily: fontFamily(800),
						color: brand.color,
						letterSpacing: -0.3,
					}}
				>
					{brand.placeholder}
				</Text>
			)}
		</View>
	)
}

/** Пилюля марки с логотипом слева — экраны 10, 23, 26, 28, 30. */
export function BrandChip({
	brand,
	label,
	selected,
	onPress,
	height = 44,
}: {
	brand: BrandLike
	label?: string
	selected?: boolean
	onPress?: () => void
	height?: number
}) {
	const c = useColors()
	return (
		<Pressable
			onPress={onPress}
			style={{
				height,
				borderRadius: 20,
				paddingLeft: 6,
				paddingRight: 14,
				borderWidth: 2,
				borderColor: selected ? c.brand : c.border,
				backgroundColor: selected ? c.brandTint : c.card,
				flexDirection: 'row',
				alignItems: 'center',
				gap: 8,
			}}
		>
			<BrandLogo brand={brand} size={height - 16} />
			<Text style={{ fontSize: fs.md, fontFamily: fontFamily(selected ? 700 : 600), color: selected ? c.brandStrong : c.inkSecondary }}>
				{label ?? brand.name}
			</Text>
		</Pressable>
	)
}
