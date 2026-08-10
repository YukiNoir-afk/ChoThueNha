import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// admin_users — chỉ admin đăng/sửa/xóa tin. Người thuê KHÔNG đăng ký ở MVP
// (bảng "users" cho người thuê thật sự để dành cho giai đoạn 2, xem cuối file)
// ---------------------------------------------------------------------------
export const adminUsers = sqliteTable('admin_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ---------------------------------------------------------------------------
// listings — bảng chính. amenities lưu dạng JSON text (mảng string), đủ cho
// quy mô này; nếu sau này cần lọc theo từng amenity hiệu quả hơn thì tách
// bảng riêng (listing_amenities) — nhưng đừng làm sớm, YAGNI.
// ---------------------------------------------------------------------------
export const listingTypeValues = ['room', 'apartment', 'house', 'studio'];

export const listings = sqliteTable('listings', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  titleVi: text('title_vi').notNull(),
  titleEn: text('title_en').notNull(),
  descVi: text('desc_vi').notNull(),
  descEn: text('desc_en').notNull(),

  price: integer('price').notNull(),        // VND/tháng, số nguyên tránh lỗi float
  area: real('area').notNull(),              // m2
  bedrooms: integer('bedrooms').notNull(),
  type: text('type', { enum: listingTypeValues }).notNull(),

  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
  address: text('address').notNull(),

  // mode: 'json' -> drizzle tự JSON.stringify/parse, lưu mảng string vd ['wifi','parking']
  amenities: text('amenities', { mode: 'json' }).notNull().default(sql`'[]'`),

  isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(true),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
}, (table) => ({
  filterIdx: index('listing_filter_idx').on(table.type, table.isPublished, table.createdAt)
}));

// ---------------------------------------------------------------------------
// listing_images — quan hệ 1-N với listings, có sortOrder để giữ thứ tự ảnh
// đã upload. onDelete cascade để KHÔNG mồ côi record khi xóa listing (file
// vật lý trên disk vẫn phải tự xóa ở tầng service — DB không làm được việc
// đó, nhớ code phần này, đây là chỗ hay bị quên).
// ---------------------------------------------------------------------------
export const listingImages = sqliteTable('listing_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  listingId: integer('listing_id')
    .notNull()
    .references(() => listings.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),         // path tương đối, vd /uploads/xxx.webp
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const listingsRelations = relations(listings, ({ many }) => ({
  images: many(listingImages),
}));

export const listingImagesRelations = relations(listingImages, ({ one }) => ({
  listing: one(listings, {
    fields: [listingImages.listingId],
    references: [listings.id],
  }),
}));

// ---------------------------------------------------------------------------
// GIAI ĐOẠN 2 (tuần 9-10, chưa làm ở tuần 1) — để comment lại đây làm note,
// đừng migrate bảng này bây giờ:
//
// export const users = sqliteTable('users', { ... });
// export const favorites = sqliteTable('favorites', {
//   userId -> users.id, listingId -> listings.id, unique(userId, listingId)
// });
// ---------------------------------------------------------------------------
