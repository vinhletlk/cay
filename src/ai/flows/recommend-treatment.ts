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
  diseaseName: z.string().describe('Tên của bệnh cây trồng được chẩn đoán.'),
  symptoms: z.string().describe('Mô tả các triệu chứng quan sát được trên cây.'),
});
export type RecommendTreatmentInput = z.infer<typeof RecommendTreatmentInputSchema>;

const RecommendTreatmentOutputSchema = z.object({
  treatmentRecommendation: z
    .string()
    .describe('Một khuyến nghị chi tiết để điều trị bệnh cây trồng.'),
  suggestedMedicines: z
    .string()
    .describe('Danh sách các loại thuốc hoặc phương pháp điều trị được đề xuất cho bệnh.'),
});
export type RecommendTreatmentOutput = z.infer<typeof RecommendTreatmentOutputSchema>;

export async function recommendTreatment(input: RecommendTreatmentInput): Promise<RecommendTreatmentOutput> {
  return recommendTreatmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendTreatmentPrompt',
  input: {schema: RecommendTreatmentInputSchema},
  output: {schema: RecommendTreatmentOutputSchema},
  prompt: `Bạn là một chuyên gia về bệnh học thực vật, cung cấp các khuyến nghị điều trị cho các bệnh của cây trồng.

  Dựa trên bệnh và triệu chứng đã xác định, hãy cung cấp một kế hoạch điều trị toàn diện.

  Bệnh: {{{diseaseName}}}
  Triệu chứng: {{{symptoms}}}

  Xem xét các phương pháp điều trị hữu cơ và hóa học, và đưa ra các khuyến nghị sản phẩm cụ thể nếu có thể.

  Đảm bảo lời khuyên thiết thực và dễ thực hiện cho những người không phải là chuyên gia.

  Tất cả các phản hồi phải bằng tiếng Việt.
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
