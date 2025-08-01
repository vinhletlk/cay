'use server';

import { diagnoseDisease, DiagnoseDiseaseOutput } from '@/ai/flows/diagnose-disease';
import { recommendTreatment, RecommendTreatmentOutput } from '@/ai/flows/recommend-treatment';
import { z } from 'zod';

const DataURI = z.string().refine(val => val.startsWith('data:image/'), {
  message: "Invalid image data URI",
});

export async function handleDiagnose(
  photoDataUri: string
): Promise<DiagnoseDiseaseOutput | { error: string }> {
  try {
    const validatedDataUri = DataURI.parse(photoDataUri);
    const result = await diagnoseDisease({ photoDataUri: validatedDataUri });
    return result;
  } catch (e: any) {
    console.error("Diagnosis error:", e);
    if (e instanceof z.ZodError) {
      return { error: `Invalid input: ${e.errors.map(err => err.message).join(', ')}` };
    }
    return { error: e.message || 'An unknown error occurred during diagnosis.' };
  }
}

export async function handleRecommend(
  diseaseName: string,
  symptoms: string
): Promise<RecommendTreatmentOutput | { error: string }> {
   if (!diseaseName || !symptoms) {
    return { error: 'Disease name and symptoms are required.' };
  }
  try {
    const result = await recommendTreatment({ diseaseName, symptoms });
    return result;
  } catch (e: any) {
    console.error("Recommendation error:", e);
    return { error: e.message || 'An unknown error occurred while getting recommendations.' };
  }
}
