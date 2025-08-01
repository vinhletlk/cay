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

const MedicineSchema = z.object({
  name: z.string().describe('Tên của thuốc.'),
  hazardLevel: z.enum(['Ít nguy hiểm', 'Nguy hiểm trung bình', 'Rất nguy hiểm'])
    .describe('Mức độ nguy hại của thuốc.'),
});

const RecommendTreatmentOutputSchema = z.object({
  chemicalTreatment: z
    .string()
    .describe('Một khuyến nghị chi tiết cho phương pháp điều trị hóa học.'),
  biologicalTreatment: z
    .string()
    .describe('Một khuyến nghị chi tiết cho phương pháp điều trị sinh học.'),
  chemicalMedicines: z
    .array(MedicineSchema)
    .describe('Danh sách các loại thuốc hóa học được đề xuất, bao gồm tên và mức độ nguy hại.'),
  biologicalMedicines: z
    .array(MedicineSchema)
    .describe('Danh sách các loại thuốc sinh học được đề xuất, bao gồm tên và mức độ nguy hại.'),
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

  Cung cấp các đề xuất riêng biệt cho phương pháp điều trị hóa học và sinh học trong các trường tương ứng.
  Đối với mỗi phương pháp, hãy liệt kê các loại thuốc cụ thể và cần thiết nhất trong các trường 'chemicalMedicines' và 'biologicalMedicines'. Với mỗi loại thuốc, hãy cung cấp tên và mức độ nguy hại ('Ít nguy hiểm', 'Nguy hiểm trung bình', 'Rất nguy hiểm').

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
