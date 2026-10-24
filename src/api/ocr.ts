// «Фото техпаспорта» [04]: photo → POST /ocr/tech-passport → brand, model, year, VIN, engine.
import { useMutation } from '@tanstack/react-query'
import { compressPhoto, imageFormData, apiFetch } from '@/lib/api'
import type { TechPassport } from './types'

/** Reads the KG registration certificate. 503 `OCR_UNAVAILABLE` — recognition isn't set up; pick the model by hand. */
export function useReadTechPassport() {
	return useMutation({
		mutationFn: async (uri: string) =>
			apiFetch<TechPassport>('/ocr/tech-passport', { method: 'POST', body: await imageFormData(await compressPhoto(uri)) }),
	})
}
