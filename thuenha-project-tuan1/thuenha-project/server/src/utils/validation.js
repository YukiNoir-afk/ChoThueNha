import { z } from 'zod';
import { listingTypeValues } from '../db/schema.js';

// ---------------------------------------------------------------------------
// Shared Zod schemas — dùng chung cho cả backend route validate và sau này
// frontend form (tuần 3). Nếu monorepo thì import thẳng, nếu tách thì
// duplicate có ghi chú rõ nguồn gốc.
// ---------------------------------------------------------------------------

const amenitiesSchema = z
  .array(z.string().trim().min(1).max(50))
  .max(20)
  .default([]);

/** Schema đầy đủ khi tạo mới listing (POST) */
export const listingCreateSchema = z.object({
  titleVi: z
    .string()
    .trim()
    .min(5, 'Tiêu đề tiếng Việt tối thiểu 5 ký tự')
    .max(200),
  titleEn: z
    .string()
    .trim()
    .min(5, 'English title must be at least 5 characters')
    .max(200),
  descVi: z
    .string()
    .trim()
    .min(10, 'Mô tả tiếng Việt tối thiểu 10 ký tự')
    .max(5000),
  descEn: z
    .string()
    .trim()
    .min(10, 'English description must be at least 10 characters')
    .max(5000),
  price: z.coerce
    .number()
    .int('Giá phải là số nguyên (VND)')
    .min(100_000, 'Giá tối thiểu 100.000₫')
    .max(500_000_000, 'Giá tối đa 500 triệu'),
  area: z.coerce
    .number()
    .min(5, 'Diện tích tối thiểu 5 m²')
    .max(10_000, 'Diện tích tối đa 10.000 m²'),
  bedrooms: z.coerce
    .number()
    .int()
    .min(0)
    .max(50),
  type: z.enum(listingTypeValues, {
    errorMap: () => ({ message: `Loại hình phải là: ${listingTypeValues.join(', ')}` }),
  }),
  lat: z.coerce
    .number()
    .min(-90)
    .max(90),
  lng: z.coerce
    .number()
    .min(-180)
    .max(180),
  address: z
    .string()
    .trim()
    .min(5, 'Địa chỉ tối thiểu 5 ký tự')
    .max(500),
  amenities: z.preprocess(
    // Hỗ trợ nhận cả string JSON lẫn array thật
    (val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return val.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }
      return val;
    },
    amenitiesSchema,
  ),
  isPublished: z.preprocess(
    (val) => {
      if (typeof val === 'string') return val === 'true' || val === '1';
      return val;
    },
    z.boolean().default(true),
  ),
});

/** Schema cho update (PUT) — tất cả field đều optional */
export const listingUpdateSchema = listingCreateSchema.partial();

/**
 * Danh sách ID ảnh cần xóa khi PUT (gửi kèm body)
 * VD: deleteImageIds = "1,3,5" hoặc [1, 3, 5]
 */
export const deleteImageIdsSchema = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      return val.split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
    }
    if (Array.isArray(val)) return val.map(Number);
    return [];
  },
  z.array(z.number().int().positive()).default([]),
);
