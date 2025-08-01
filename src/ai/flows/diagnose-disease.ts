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
  diseaseName: z.string().describe('Tên của bệnh được xác định, nếu có.'),
  confidence: z.number().describe('Mức độ tin cậy của việc xác định bệnh (0-1).'),
  description: z.string().describe('Mô tả về bệnh, nguyên nhân và các phương pháp điều trị tiềm năng.'),
});
export type DiagnoseDiseaseOutput = z.infer<typeof DiagnoseDiseaseOutputSchema>;

export async function diagnoseDisease(input: DiagnoseDiseaseInput): Promise<DiagnoseDiseaseOutput> {
  return diagnoseDiseaseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnoseDiseasePrompt',
  input: {schema: DiagnoseDiseaseInputSchema},
  output: {schema: DiagnoseDiseaseOutputSchema},
  prompt: `Bạn là một chuyên gia bệnh học thực vật. Hãy phân tích hình ảnh được cung cấp về một loại cây và xác định bất kỳ bệnh tiềm ẩn nào.

  Cung cấp tên bệnh, mức độ tin cậy (0-1), và mô tả chi tiết về bệnh, nguyên nhân và các phương pháp điều trị tiềm năng.

  Tất cả các phản hồi phải bằng tiếng Việt.

  Hình ảnh: {{media url=photoDataUri}}`,
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
