import { Image, Pressable, Text, View } from 'react-native'
import type { Brand } from '@/data/brands'
import { fontFamily, useColors } from '@/theme'

/** Кружок логотипа марки — картинка из assets/brands или буква-заглушка, если файла нет. */
export function BrandLogo({ brand, size = 36 }: { brand: Brand; size?: number }) {
	const c = useColors()
	return (
		<View
			style={{
				width: size,
				height: size,
				borderRadius: size / 2,
				backgroundColor: '#FFFFFF',
				borderWidth: brand.logo ? 1 : 1,
				borderColor: brand.logo ? c.border : brand.color,
				alignItems: 'center',
				justifyContent: 'center',
				shadowColor: '#201F1D',
				shadowOpacity: 0.1,
				shadowOffset: { width: 0, height: 1 },
				shadowRadius: 2,
				elevation: 1,
			}}
		>
			{brand.logo ? (
				<Image source={brand.logo} resizeMode="contain" style={{ width: size * 0.7, height: size * 0.7 }} />
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
	brand: Brand
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
			<Text style={{ fontSize: 14, fontFamily: fontFamily(selected ? 700 : 600), color: selected ? c.brandStrong : c.inkSecondary }}>
				{label ?? brand.name}
			</Text>
		</Pressable>
	)
}
