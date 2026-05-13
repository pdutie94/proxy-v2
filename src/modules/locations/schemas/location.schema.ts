import { z } from 'zod';

export const locationSchema = z.object({
  name: z.string().min(2, 'Tên vị trí phải có ít nhất 2 ký tự'),
  countryCode: z.string().length(2, 'Mã quốc gia phải có đúng 2 ký tự (ví dụ: VN, US)'),
});

export type LocationInput = z.infer<typeof locationSchema>;
