'use server';

/**
 * @fileOverview Provides treatment recommendations for plant diseases.
 *
 * - recommendTreatment - A function that recommends treatments based on disease and symptoms.
 * - RecommendTreatmentInput - The input type for the recommendTreatment function.
 * - RecommendTreatmentOutput - The return type for the recommendTreatment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendTreatmentInputSchema = z.object({
  diseaseName: z.string().describe('The name of the diagnosed plant disease.'),
  symptoms: z.string().describe('A description of the symptoms observed on the plant.'),
});
export type RecommendTreatmentInput = z.infer<typeof RecommendTreatmentInputSchema>;

const RecommendTreatmentOutputSchema = z.object({
  treatmentRecommendation: z
    .string()
    .describe('A detailed recommendation for treating the plant disease.'),
  suggestedMedicines: z
    .string()
    .describe('A list of suggested medicines or treatments for the disease.'),
});
export type RecommendTreatmentOutput = z.infer<typeof RecommendTreatmentOutputSchema>;

export async function recommendTreatment(input: RecommendTreatmentInput): Promise<RecommendTreatmentOutput> {
  return recommendTreatmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendTreatmentPrompt',
  input: {schema: RecommendTreatmentInputSchema},
  output: {schema: RecommendTreatmentOutputSchema},
  prompt: `You are an expert in plant pathology, providing treatment recommendations for plant diseases.

  Based on the identified disease and symptoms, provide a comprehensive treatment plan.

  Disease: {{{diseaseName}}}
  Symptoms: {{{symptoms}}}

  Consider organic and chemical treatments, and provide specific product recommendations if possible.

  Ensure the advice is practical and easy to follow for non-experts.

  Your treatment recommendation:
  `,
});

const recommendTreatmentFlow = ai.defineFlow(
  {
    name: 'recommendTreatmentFlow',
    inputSchema: RecommendTreatmentInputSchema,
    outputSchema: RecommendTreatmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
