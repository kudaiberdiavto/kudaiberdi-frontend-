import { useState } from 'react'
import { Alert } from 'react-native'
import { usePreventRemove } from 'expo-router'
import { t } from '@/i18n'

/**
 * Asks before a form with unsaved input is closed — by «←», the iOS swipe or Android's back button.
 * `saveDraft` adds «Сохранить черновик»; it resolves when saved and throws to stay on the screen.
 * Returns `leave(go)`: navigate away on purpose (after a successful save) without the question.
 */
export function useConfirmLeave(dirty: boolean, saveDraft?: () => Promise<unknown>) {
	const [leaving, setLeaving] = useState(false)
	const disable = usePreventRemove(dirty && !leaving, ({ repeat }) => {
		const discard = () => {
			setLeaving(true)
			repeat()
		}
		Alert.alert(t('Выйти без сохранения?'), t('Введённое пропадёт.'), [
			{ text: t('Остаться'), style: 'cancel' },
			...(saveDraft ? [{ text: t('Сохранить черновик'), onPress: () => void saveDraft().then(discard, () => {}) }] : []),
			{ text: t('Выйти'), style: 'destructive' as const, onPress: discard },
		])
	})

	return (go: () => void) => {
		setLeaving(true)
		disable()
		go()
	}
}
