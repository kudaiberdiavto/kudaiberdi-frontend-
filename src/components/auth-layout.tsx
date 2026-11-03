import type { ReactNode } from 'react'
import { Keyboard, Platform, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fontFamily, fs, useColors } from '@/theme'

/** Height of the phone field and the code cells — the same on 01 and 02. */
export const AUTH_FIELD_HEIGHT = 64

/** Header block of a fixed height, content at its bottom: whatever the header holds, the field starts at the same y. */
const HEADER_HEIGHT = 196

/**
 * Shared frame of the sign-in screens — 01 «Номер телефона» and 02 «Код из SMS». The top bar, the header block, the
 * label and the field sit at the same place on both, so moving from the phone to the code the field doesn't jump.
 */
export function AuthLayout({
	topBar,
	header,
	label,
	field,
	below,
	footer,
}: {
	topBar: ReactNode
	header: ReactNode
	label: string
	field: ReactNode
	below?: ReactNode
	footer?: ReactNode
}) {
	const c = useColors()
	const insets = useSafeAreaInsets()
	return (
		<Pressable
			accessible={false}
			// Tap outside the field hides the keyboard (native only — on web it would steal the input's focus).
			onPress={Platform.OS === 'web' ? undefined : Keyboard.dismiss}
			style={{ flex: 1, backgroundColor: c.surface, paddingTop: insets.top }}
		>
			<View style={{ height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>{topBar}</View>

			<View style={{ flex: 1, paddingTop: 8, paddingHorizontal: 24 }}>
				<View style={{ height: HEADER_HEIGHT, justifyContent: 'flex-end', gap: 12 }}>{header}</View>
				<Text style={{ marginTop: 28, marginBottom: 10, fontSize: fs.md, lineHeight: 20, fontFamily: fontFamily(600), color: c.muted }}>
					{label}
				</Text>
				{field}
				{below ? <View style={{ marginTop: 12, gap: 12 }}>{below}</View> : null}
			</View>

			{footer ? <View style={{ paddingTop: 12, paddingHorizontal: 24, paddingBottom: Math.max(insets.bottom, 34) }}>{footer}</View> : null}
		</Pressable>
	)
}
