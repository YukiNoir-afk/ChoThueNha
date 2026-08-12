import { z } from 'zod';

export const listingTypeValues = ['room', 'apartment', 'house', 'studio'];

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
    .number({ invalid_type_error: 'Vui lòng nhập giá' })
    .int('Giá phải là số nguyên (VND)')
    .min(100_000, 'Giá tối thiểu 100.000₫')
    .max(500_000_000, 'Giá tối đa 500 triệu'),
  area: z.coerce
    .number({ invalid_type_error: 'Vui lòng nhập diện tích' })
    .min(5, 'Diện tích tối thiểu 5 m²')
    .max(10_000, 'Diện tích tối đa 10.000 m²'),
  bedrooms: z.coerce
    .number()
    .int()
    .min(0, 'Số phòng ngủ không được âm')
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
