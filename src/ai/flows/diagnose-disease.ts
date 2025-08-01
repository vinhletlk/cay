// diagnose-disease.ts
'use server';
/**
 * @fileOverview A plant disease diagnosis AI agent.
 *
 * - diagnoseDisease - A function that handles the plant disease diagnosis process.
 * - DiagnoseDiseaseInput - The input type for the diagnoseDisease function.
 * - DiagnoseDiseaseOutput - The return type for the diagnoseDisease function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DiagnoseDiseaseInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DiagnoseDiseaseInput = z.infer<typeof DiagnoseDiseaseInputSchema>;

const DiagnoseDiseaseOutputSchema = z.object({
  diseaseName: z.string().describe('The name of the identified disease, if any.'),
  confidence: z.number().describe('The confidence level of the disease identification (0-1).'),
  description: z.string().describe('A description of the disease, its causes, and potential treatments.'),
});
export type DiagnoseDiseaseOutput = z.infer<typeof DiagnoseDiseaseOutputSchema>;

export async function diagnoseDisease(input: DiagnoseDiseaseInput): Promise<DiagnoseDiseaseOutput> {
  return diagnoseDiseaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnoseDiseasePrompt',
  input: {schema: DiagnoseDiseaseInputSchema},
  output: {schema: DiagnoseDiseaseOutputSchema},
  prompt: `You are an expert plant pathologist. Analyze the provided image of a plant and identify any potential diseases.

  Provide the disease name, a confidence level (0-1), and a detailed description of the disease, its causes, and potential treatments.

  Image: {{media url=photoDataUri}}`,
});

const diagnoseDiseaseFlow = ai.defineFlow(
  {
    name: 'diagnoseDiseaseFlow',
    inputSchema: DiagnoseDiseaseInputSchema,
    outputSchema: DiagnoseDiseaseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
