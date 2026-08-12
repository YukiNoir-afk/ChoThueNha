import { Router } from 'express';
import { eq, or, and, gte, lte, between, count, sql, desc } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../db/index.js';
import { listings, listingImages, listingTypeValues } from '../db/schema.js';
import { verifyToken } from '../middleware/auth.js';
import { doubleCsrfProtection } from '../middleware/csrf.js';
import { upload, processUploadedImages, deleteImageFile } from '../middleware/upload.js';
import { haversineKm } from '../utils/haversine.js';
import { listingCreateSchema, listingUpdateSchema, deleteImageIdsSchema } from '../utils/validation.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

const searchQuerySchema = z.object({
  q: z.string().trim().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minArea: z.coerce.number().optional(),
  maxArea: z.coerce.number().optional(),
  bedrooms: z.coerce.number().int().optional(),
  type: z.enum(listingTypeValues).optional(),
  // bounding box từ map.getBounds() ở frontend
  minLat: z.coerce.number().optional(),
  maxLat: z.coerce.number().optional(),
  minLng: z.coerce.number().optional(),
  maxLng: z.coerce.number().optional(),
  // "gần tôi": lat/lng người dùng + bán kính km, dùng để tính + sort haversine
  nearLat: z.coerce.number().optional(),
  nearLng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
}).refine(data => data.minPrice === undefined || data.maxPrice === undefined || data.minPrice <= data.maxPrice, { 
  message: 'Giá tối thiểu không được lớn hơn giá tối đa' 
}).refine(data => data.minArea === undefined || data.maxArea === undefined || data.minArea <= data.maxArea, { 
  message: 'Diện tích tối thiểu không được lớn hơn diện tích tối đa' 
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/listings — luôn phân trang, KHÔNG bao giờ trả toàn bộ bảng
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const q = searchQuerySchema.parse(req.query);

    // Kiểm tra nhanh token từ cookie để xem có phải admin không
    let isAdmin = false;
    const token = req.cookies?.token;
    if (token) {
      try {
        const jwt = await import('jsonwebtoken');
        jwt.verify(token, process.env.JWT_SECRET);
        isAdmin = true;
      } catch (e) {
        // Token không hợp lệ thì thôi, coi như guest
      }
    }

    const conditions = [];
    if (!isAdmin) {
      conditions.push(eq(listings.isPublished, true));
    }
    if (q.q) {
      const escaped = q.q.replace(/[%_\\]/g, (c) => '\\' + c);
      conditions.push(
        or(
          sql`${listings.titleVi} LIKE ${'%' + escaped + '%'} ESCAPE '\\'`,
          sql`${listings.titleEn} LIKE ${'%' + escaped + '%'} ESCAPE '\\'`,
          sql`${listings.address} LIKE ${'%' + escaped + '%'} ESCAPE '\\'`,
        ),
      );
    }
    if (q.minPrice !== undefined) conditions.push(gte(listings.price, q.minPrice));
    if (q.maxPrice !== undefined) conditions.push(lte(listings.price, q.maxPrice));
    if (q.minArea !== undefined) conditions.push(gte(listings.area, q.minArea));
    if (q.maxArea !== undefined) conditions.push(lte(listings.area, q.maxArea));
    if (q.bedrooms !== undefined) conditions.push(gte(listings.bedrooms, q.bedrooms));
    if (q.type) conditions.push(eq(listings.type, q.type));
    if (q.minLat !== undefined && q.maxLat !== undefined) {
      conditions.push(between(listings.lat, q.minLat, q.maxLat));
    }
    if (q.minLng !== undefined && q.maxLng !== undefined) {
      conditions.push(between(listings.lng, q.minLng, q.maxLng));
    }

    const whereClause = and(...conditions);

    // Đếm tổng số kết quả (cho phân trang frontend)
    const [{ total }] = db
      .select({ total: count() })
      .from(listings)
      .where(whereClause)
      .all();

    let rows = db
      .select()
      .from(listings)
      .where(whereClause)
      .orderBy(desc(listings.createdAt))
      .limit(q.pageSize)
      .offset((q.page - 1) * q.pageSize)
      .all();

    // "Gần tôi": tính khoảng cách ở tầng service sau khi đã lọc bounding box
    // thô ở DB (không cần PostGIS cho quy mô này — xem ghi chú kế hoạch gốc)
    if (q.nearLat !== undefined && q.nearLng !== undefined) {
      rows = rows
        .map((r) => ({ ...r, distanceKm: haversineKm(q.nearLat, q.nearLng, r.lat, r.lng) }))
        .filter((r) => (q.radiusKm ? r.distanceKm <= q.radiusKm : true))
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }

    // Lấy thumbnail (ảnh đầu tiên theo sortOrder) cho mỗi listing
    const listingIds = rows.map((r) => r.id);
    let imagesMap = {};
    if (listingIds.length > 0) {
      const allImages = db
        .select()
        .from(listingImages)
        .where(
          sql`${listingImages.listingId} IN (${sql.join(
            listingIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        )
        .all();

      // Group by listingId, pick first by sortOrder
      for (const img of allImages) {
        if (!imagesMap[img.listingId]) {
          imagesMap[img.listingId] = img;
        } else if (img.sortOrder < imagesMap[img.listingId].sortOrder) {
          imagesMap[img.listingId] = img;
        }
      }
    }

    const data = rows.map((r) => ({
      ...r,
      thumbnail: imagesMap[r.id]?.url || null,
    }));

    res.json({
      data,
      page: q.page,
      pageSize: q.pageSize,
      totalCount: total,
      totalPages: Math.ceil(total / q.pageSize),
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/listings/:id — chi tiết 1 tin kèm tất cả ảnh
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, Number(req.params.id)),
      with: { images: true },
    });
    if (!listing) return res.status(404).json({ error: { message: 'Không tìm thấy tin' } });
    res.json(listing);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/listings — tạo tin mới (kèm upload ảnh)
// Auth + CSRF bắt buộc. Multer nhận multipart form-data.
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/',
  verifyToken,
  doubleCsrfProtection,
  upload.array('images', 7),
  async (req, res, next) => {
    try {
      // Validate body — Zod schema có preprocess nên chấp nhận cả form-data string fields
      const validated = listingCreateSchema.parse(req.body);

      // Insert listing
      const result = db
        .insert(listings)
        .values({
          titleVi: validated.titleVi,
          titleEn: validated.titleEn,
          descVi: validated.descVi,
          descEn: validated.descEn,
          price: validated.price,
          area: validated.area,
          bedrooms: validated.bedrooms,
          type: validated.type,
          lat: validated.lat,
          lng: validated.lng,
          address: validated.address,
          amenities: validated.amenities,
          isPublished: validated.isPublished,
        })
        .run();

      const listingId = Number(result.lastInsertRowid);

      // Xử lý ảnh: resize + nén → lưu file chính thức
      const images = await processUploadedImages(req.files);

      // Insert image records
      if (images.length > 0) {
        db.insert(listingImages)
          .values(
            images.map((img) => ({
              listingId,
              url: img.url,
              sortOrder: img.sortOrder,
            })),
          )
          .run();
      }

      // Trả listing + images
      const created = await db.query.listings.findFirst({
        where: eq(listings.id, listingId),
        with: { images: true },
      });

      res.status(201).json(created);
    } catch (err) {
      // Nếu lỗi xảy ra sau khi multer đã nhận file → dọn file tạm
      if (req.files) {
        for (const f of req.files) {
          const { unlink } = await import('node:fs/promises');
          await unlink(f.path).catch(() => {});
        }
      }
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/listings/:id — sửa tin (có thể kèm ảnh mới, xóa ảnh cũ)
// Body fields đều optional (partial update). Gửi deleteImageIds để xóa ảnh cụ thể.
// ─────────────────────────────────────────────────────────────────────────────
router.put(
  '/:id',
  verifyToken,
  doubleCsrfProtection,
  upload.array('images', 7),
  async (req, res, next) => {
    try {
      const listingId = Number(req.params.id);

      // Kiểm tra listing tồn tại
      const existing = db
        .select()
        .from(listings)
        .where(eq(listings.id, listingId))
        .get();
      if (!existing) throw new AppError('Không tìm thấy tin', 404);

      // Validate body (partial — tất cả field optional)
      const validated = listingUpdateSchema.parse(req.body);

      // Xóa ảnh theo danh sách ID nếu có
      if (req.body.deleteImageIds) {
        const idsToDelete = deleteImageIdsSchema.parse(req.body.deleteImageIds);
        if (idsToDelete.length > 0) {
          // Lấy URL các ảnh cần xóa để dọn file vật lý
          const imagesToDelete = db
            .select()
            .from(listingImages)
            .where(
              and(
                eq(listingImages.listingId, listingId),
                sql`${listingImages.id} IN (${sql.join(
                  idsToDelete.map((id) => sql`${id}`),
                  sql`, `,
                )})`,
              ),
            )
            .all();

          // Xóa file vật lý trên disk
          for (const img of imagesToDelete) {
            await deleteImageFile(img.url);
          }

          // Xóa records trong DB
          for (const img of imagesToDelete) {
            db.delete(listingImages).where(eq(listingImages.id, img.id)).run();
          }
        }
      }

      // Upload ảnh mới nếu có
      if (req.files && req.files.length > 0) {
        // Tính sortOrder tiếp theo
        const existingImages = db
          .select()
          .from(listingImages)
          .where(eq(listingImages.listingId, listingId))
          .all();
        const maxSort = existingImages.reduce((max, img) => Math.max(max, img.sortOrder), -1);

        const newImages = await processUploadedImages(req.files);
        if (newImages.length > 0) {
          db.insert(listingImages)
            .values(
              newImages.map((img, i) => ({
                listingId,
                url: img.url,
                sortOrder: maxSort + 1 + i,
              })),
            )
            .run();
        }
      }

      // Update listing fields (chỉ update những field được gửi)
      const updateData = { ...validated };
      if (Object.keys(updateData).length > 0) {
        updateData.updatedAt = new Date();
        db.update(listings)
          .set(updateData)
          .where(eq(listings.id, listingId))
          .run();
      }

      // Trả listing + images mới
      const updated = await db.query.listings.findFirst({
        where: eq(listings.id, listingId),
        with: { images: true },
      });

      res.json(updated);
    } catch (err) {
      // Cleanup temp files on error
      if (req.files) {
        for (const f of req.files) {
          const { unlink } = await import('node:fs/promises');
          await unlink(f.path).catch(() => {});
        }
      }
      next(err);
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/listings/:id — xóa tin + xóa file ảnh vật lý
// DB cascade sẽ tự xóa rows listing_images, nhưng file trên disk phải tự xóa
// (đây là nguyên tắc thiết kế #2 trong kế hoạch gốc — dọn file mồ côi)
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', verifyToken, doubleCsrfProtection, async (req, res, next) => {
  try {
    const listingId = Number(req.params.id);

    // Kiểm tra listing tồn tại
    const existing = db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId))
      .get();
    if (!existing) throw new AppError('Không tìm thấy tin', 404);

    // Lấy tất cả ảnh của tin này TRƯỚC khi xóa (sau khi cascade thì không query được nữa)
    const images = db
      .select()
      .from(listingImages)
      .where(eq(listingImages.listingId, listingId))
      .all();

    // Xóa file ảnh vật lý trên disk
    for (const img of images) {
      await deleteImageFile(img.url);
    }

    // Xóa listing (cascade sẽ tự xóa listing_images rows)
    db.delete(listings).where(eq(listings.id, listingId)).run();

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
