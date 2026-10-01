import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Button, WizardStepper } from '@/components/ui'
import { ChevronLeftIcon } from '@/components/icons'
import { fontFamily, useColors } from '@/theme'

/** Frame of the 33–36 wizard: «Заявка на услугу», the stepper, content, the bottom button. */
export function ServiceWizard({
	step,
	label,
	children,
	button = 'Дальше',
	disabled,
	loading,
	onNext,
	footer,
}: {
	step: number
	label: string
	children: ReactNode
	button?: string
	disabled?: boolean
	loading?: boolean
	onNext: () => void
	/** Above the button — an error line. */
	footer?: ReactNode
}) {
	const c = useColors()
	const insets = useSafeAreaInsets()
	return (
		<KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.surface }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
			<View style={{ paddingTop: insets.top }}>
				<View style={{ height: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
					<Pressable onPress={() => router.back()}>
						<ChevronLeftIcon size={24} color={c.ink} />
					</Pressable>
					<Text style={{ flex: 1, fontSize: 20, fontFamily: fontFamily(700), letterSpacing: -0.2, color: c.ink }}>Заявка на услугу</Text>
				</View>
			</View>
			<ScrollView
				contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<WizardStepper step={step} label={label} />
				{children}
			</ScrollView>
			<View style={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 28 + insets.bottom, backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.hairline, gap: 10 }}>
				{footer}
				<Button label={button} height={56} disabled={disabled} loading={loading} onPress={onNext} />
			</View>
		</KeyboardAvoidingView>
	)
}
