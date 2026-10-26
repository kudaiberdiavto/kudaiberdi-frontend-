import { forwardRef, type ComponentType, type Ref } from 'react'
import { Pressable, Text, View, type PressableProps, type View as RNView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fontFamily, useColors } from '@/theme'
import type { IconProps } from '@/components/icons'

/**
 * Нижнее меню из макета: контент 72px + верхняя граница 2px + отступ 8px сверху.
 * Активная вкладка — капсула 56×30 на brand-tint, иконка и подпись brand-strong weight 700.
 * `dark` — под лентой видео («Рынок»): чёрный фон, активная вкладка белая.
 */
export function TabBarContainer({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
	const c = useColors()
	const insets = useSafeAreaInsets()
	return (
		<View
			style={{
				height: 72,
				paddingTop: 8,
				paddingHorizontal: 4,
				paddingBottom: insets.bottom,
				borderTopWidth: 2,
				borderTopColor: dark ? '#000000' : c.hairline,
				backgroundColor: dark ? '#000000' : c.card,
				flexDirection: 'row',
			}}
		>
			{children}
		</View>
	)
}

interface TabButtonProps extends PressableProps {
	isFocused?: boolean
	icon: ComponentType<IconProps>
	label: string
	badge?: number
	dark?: boolean
}

export const TabButton = forwardRef(function TabButton(
	{ isFocused, icon: Icon, label, badge, dark, ...props }: TabButtonProps,
	ref: Ref<RNView>,
) {
	const c = useColors()
	const color = dark ? (isFocused ? '#FFFFFF' : 'rgba(255,255,255,0.6)') : isFocused ? c.brandStrong : c.muted

	return (
		<Pressable ref={ref} {...props} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
			<View
				style={{
					width: 56,
					height: 30,
					borderRadius: 15,
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: isFocused ? (dark ? 'rgba(255,255,255,0.12)' : c.brandTint) : 'transparent',
				}}
			>
				<Icon size={24} color={color} strokeWidth={isFocused ? 2.2 : 1.9} />
				{badge ? (
					<View
						style={{
							position: 'absolute',
							top: -3,
							right: 6,
							minWidth: 18,
							height: 18,
							paddingHorizontal: 5,
							borderRadius: 9,
							backgroundColor: c.danger,
							borderWidth: 2,
							borderColor: dark ? '#000000' : c.card,
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Text style={{ fontSize: 11, fontFamily: fontFamily(700), color: '#FFFFFF' }}>{badge}</Text>
					</View>
				) : null}
			</View>
			<Text
				style={{
					fontSize: 12,
					fontFamily: fontFamily(isFocused ? 700 : 600),
					color,
				}}
			>
				{label}
			</Text>
		</Pressable>
	)
})
