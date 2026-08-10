# Kế hoạch xây dựng phần mềm cho thuê nhà (giống Thuê Tốt / Chợ Tốt)
### Phiên bản đã chốt — sẵn sàng triển khai, không còn phương án A/B

**Giả định:** 1 người làm full-time (~30-35h/tuần). Nếu part-time, nhân đôi thời gian ước tính.

---

## 1. STACK CÔNG NGHỆ (đã chốt, không đổi giữa chừng)

| Thành phần | Lựa chọn | Lý do chốt |
|---|---|---|
| Backend | Node.js + Express | Đơn giản, hệ sinh thái lớn, đủ cho quy mô này |
| Database | SQLite (file `.db`) | Không cần server DB riêng, đủ cho quy mô cá nhân/khởi đầu; **không chuyển Postgres** trừ khi traffic thực sự vượt quá khả năng SQLite (xem mục Giai đoạn 2) |
| ORM | **Drizzle ORM + better-sqlite3** | Nhẹ, không có query-engine binary nặng như Prisma → phù hợp deploy VPS/Fly.io giá rẻ ngay từ đầu. Không dùng Prisma để tránh phải viết lại data layer giữa chừng |
| Auth | JWT (`jsonwebtoken`) lưu trong **httpOnly cookie** + `bcrypt` hash mật khẩu | An toàn hơn localStorage (JS không đọc được token → chống XSS lấy token). Vì dùng cookie, bắt buộc có CSRF protection đi kèm |
| CSRF | `csrf-csrf` (double-submit cookie pattern) | Bắt buộc vì auth dùng cookie — không có bước này thì cookie-auth có lỗ hổng |
| Upload ảnh | `multer` (nhận file) + `sharp` (resize còn max 1280px, nén quality ~80) | Giảm dung lượng trang, tránh ảnh gốc quá nặng |
| Validate upload | Whitelist MIME type (`image/jpeg`, `image/png`, `image/webp`), giới hạn 5MB/ảnh, tối đa 7 ảnh/tin | Chặn file giả dạng ảnh, chặn spam dung lượng |
| Lưu ảnh | Local `/uploads` (giai đoạn đầu) | Đơn giản, đủ dùng khi có volume persistent |
| Validate dữ liệu | `zod` — dùng chung 1 bộ schema cho cả client và server (đặt trong 1 file, import cả 2 phía nếu dùng monorepo, hoặc duplicate có ghi chú rõ) | Tránh lệch rule giữa frontend/backend |
| Frontend | React + Vite | Tốc độ dev nhanh, hệ sinh thái quen thuộc |
| State server data | React Query (TanStack Query) | Cache, loading/error state tự động cho search/listing |
| State UI | Zustand hoặc Context API | Đơn giản, không cần Redux ở quy mô này |
| Bản đồ | Leaflet + react-leaflet + tile OpenStreetMap | Miễn phí, không cần API key |
| Đa ngôn ngữ | i18next + react-i18next | 2 ngôn ngữ vi/en |
| CSS | Tailwind CSS | Tốc độ làm UI nhanh |
| Logging | `pino` + `pino-http` | Log có cấu trúc, cần khi debug production |
| Bảo mật cơ bản | `helmet`, `express-rate-limit` (giới hạn `/auth/login` 5 lần/15 phút) | Chặn brute-force, header bảo mật cơ bản |
| CI | GitHub Actions (lint + build khi push) | Bắt lỗi trước khi deploy, dù chỉ 1 người code |
| Deploy | Kiến trúc **monolith**: Express serve luôn file build của React, 1 container/VM duy nhất trên **Fly.io** (khuyến nghị) hoặc VPS giá rẻ | Giảm RAM, giảm chi phí, giảm độ phức tạp vận hành |
| Backup | Script cron copy file `.db` ra nơi lưu khác (hoặc `litestream` replicate sang S3/B2) | SQLite là dữ liệu sống còn duy nhất — bắt buộc có backup định kỳ |

---

## 2. NGUYÊN TẮC THIẾT KẾ (áp dụng xuyên suốt, không đợi "sau tính")

Đây là những điểm rút ra sau khi rà lại kế hoạch gốc — nếu không cài từ đầu sẽ phải sửa lại giữa chừng, tốn thời gian hơn:

1. **Phân trang bắt buộc** — mọi API trả danh sách (`GET /listings`) phải có `page`/`pageSize` (mặc định 20, tối đa 50) ngay từ tuần 1-2, không đợi data lớn mới thêm.
2. **Dọn file mồ côi** — khi xóa/sửa listing, phải xóa cả file ảnh vật lý trong `/uploads`, không chỉ xóa record DB (cascade DB không tự xóa file trên disk).
3. **Auth quyết định 1 lần** — cookie httpOnly + CSRF, không đổi sang localStorage giữa chừng.
4. **Seed data sớm** — có script bơm dữ liệu mẫu ngay tuần 1-2 để test bản đồ/tìm kiếm mà không cần đợi trang admin xong (tuần 6).
5. **WAL mode + foreign_keys bật thủ công** — SQLite mặc định tắt 2 thứ này, phải bật ngay lúc khởi tạo kết nối DB, nếu không cascade delete và concurrent read sẽ không hoạt động đúng.
6. **Error handler tập trung** — 1 middleware xử lý lỗi duy nhất ở Express, không rải try/catch trả response tùy tiện ở từng route.
7. **Backup từ ngày đầu deploy thật** — không đợi "khi nào cần mới làm".

---

## 3. TUẦN 1 — NỀN TẢNG BACKEND

- Setup project: Node.js + Express, ESLint + Prettier, dotenv cho config, cấu trúc thư mục `src/{db,middleware,routes,utils}` (xem file scaffold đã tạo ở lượt trước).
- Schema Drizzle (`src/db/schema.js`):
  - `admin_users` (id, email, passwordHash, createdAt)
  - `listings` (id, titleVi, titleEn, descVi, descEn, price, area, bedrooms, type enum, lat, lng, address, amenities JSON, isPublished, createdAt, updatedAt)
  - `listing_images` (id, listingId FK cascade, url, sortOrder, createdAt)
- Kết nối DB: bật `journal_mode = WAL` và `foreign_keys = ON` ngay khi khởi tạo `better-sqlite3`.
- Migration: `drizzle-kit generate` + `drizzle-kit migrate` (hoặc script `migrate.js` tự viết).
- Script seed: bơm ~30 tin mẫu (tọa độ quanh khu vực mục tiêu) để có dữ liệu test ngay.
- API CRUD cơ bản (REST):
  - `GET /listings` (có `page`, `pageSize`, filter cơ bản)
  - `GET /listings/:id`
  - `POST /listings`, `PUT /listings/:id`, `DELETE /listings/:id` — yêu cầu `verifyToken` + `doubleCsrfProtection`
- Auth: JWT ký bằng `jsonwebtoken`, secret trong `.env`; `POST /auth/login` set cookie httpOnly + trả CSRF token; `POST /auth/logout`; middleware `verifyToken` đọc cookie.
- Upload ảnh: `multer.diskStorage` lưu tạm → validate MIME whitelist → `sharp.resize(1280)` + nén quality ~80 → lưu file đã tối ưu vào `/uploads`; giới hạn 5MB/ảnh, tối đa 7 ảnh.
- Khi xóa/sửa listing: xóa file ảnh vật lý tương ứng trong `/uploads` trước/song song với xóa record DB.
- Error handler tập trung + logging bằng `pino-http`.
- **Kết quả cuối tuần 1:** API CRUD listing chạy đầy đủ, có auth + CSRF + upload ảnh thật, test được bằng Postman/`.http` file, có data mẫu.

---

## 4. TUẦN 2 — BACKEND TÌM KIẾM & LỌC

- Tìm kiếm từ khóa: `LIKE` trên `titleVi`/`titleEn`/`address` (nâng cấp FTS5 sau nếu data lớn, không cần ngay).
- Lọc giá/diện tích/phòng ngủ/loại hình: query params + điều kiện Drizzle `where` động (`gte`, `lte`, `eq`).
- Lọc theo bounding box: nhận `minLat`, `maxLat`, `minLng`, `maxLng` từ `map.getBounds()` (Leaflet), query `between()`.
- Haversine: hàm JS thuần (đã viết ở `src/utils/haversine.js`) tính khoảng cách km; áp dụng ở tầng service **sau khi** đã lọc bounding box thô ở DB, không cần PostGIS ở quy mô này.
- Đảm bảo **mọi endpoint danh sách đều có phân trang** — kiểm tra lại `GET /listings` đã áp dụng đúng từ tuần 1.
- Test API: Postman collection hoặc REST Client (VSCode), export file `.http` để làm tài liệu nhanh.
- Tài liệu API: 1 file `README.md` liệt kê endpoint (không cần Swagger ở quy mô này, tốn thời gian không cần thiết).
- Thêm CI: GitHub Actions chạy `npm run lint` + thử `npm run db:migrate` trên mỗi push.

---

## 5. TUẦN 3 — FRONTEND KHUNG SƯỜN

- Setup React + Vite (`npm create vite@latest -- --template react`), cấu hình Tailwind.
- Routing: `react-router-dom` (v6+) — `/`, `/listing/:id`, `/admin`, `/admin/login`, `/admin/listings/new`.
- Layout: Header + Container, Tailwind grid/flex.
- Bộ Zod schema dùng chung: đặt validate rule listing (title, price, area...) ở 1 nơi, import cả ở form frontend lẫn route backend để tránh lệch rule.
- Trang tìm kiếm (UI trước, chưa nối API thật): React Hook Form quản lý input từ khóa + select/range giá, diện tích, phòng ngủ, loại hình.
- `ListingCard`: component thuần, nhận props, `React.memo` nếu list dài.
- Grid danh sách: CSS Grid responsive (`repeat(auto-fill, minmax(...))`).
- i18next: `/locales/vi/translation.json`, `/locales/en/translation.json`, hook `useTranslation()`, lưu ngôn ngữ đã chọn vào `localStorage`.

---

## 6. TUẦN 4 — BẢN ĐỒ & TÍCH HỢP TÌM KIẾM

- Leaflet + OpenStreetMap: `<MapContainer>`, `<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png">`, `<Marker>` cho từng tin đăng.
- Đồng bộ hover danh sách ↔ bản đồ: state chung `hoveredListingId` ở component cha, truyền xuống cả `ListingCard` và `Marker`.
- Nối API thật: React Query (`useQuery`) gọi API tìm kiếm/lọc, tự cache + loading/error state; debounce input từ khóa bằng `use-debounce` để tránh gọi API liên tục khi gõ.
- Nút "Gần tôi": `navigator.geolocation.getCurrentPosition()`, xử lý trường hợp từ chối quyền (thông báo rõ ràng cho người dùng), gọi lại API kèm `nearLat/nearLng/radiusKm`, hiển thị khoảng cách (km) trên `ListingCard` từ kết quả Haversine backend trả về.
- **Lưu ý thời gian:** đây là phần dễ trễ tiến độ nhất trong 8 tuần — nếu tuần 4 kéo dài hơn dự kiến, cắt bớt polish (animation hover, transition mượt) chứ không cắt phần lọc/đồng bộ cốt lõi.

---

## 7. TUẦN 5 — TRANG CHI TIẾT TIN

- Layout: 1 ảnh lớn + grid 4 ảnh nhỏ, nút "xem tất cả ảnh".
- Lightbox: `yet-another-react-lightbox` hoặc `react-image-gallery`.
- Thông tin liên hệ: nút gọi (`<a href="tel:...">`), nhắn tin (`mailto:` hoặc form liên hệ nội bộ), Zalo (`https://zalo.me/<so_dien_thoai>`).
- Responsive: Tailwind breakpoints (`sm/md/lg`), test Chrome DevTools device toolbar.

---

## 8. TUẦN 6 — TRANG QUẢN TRỊ (ĐĂNG TIN)

- Đăng nhập admin: form gọi `POST /auth/login`, cookie httpOnly được set tự động bởi backend (frontend không tự tay lưu token); lưu CSRF token trả về vào state để đính kèm header ở các request ghi tiếp theo; `PrivateRoute` component chặn truy cập khi chưa đăng nhập (gọi `GET /auth/me` để check).
- Form đăng tin: React Hook Form + Zod (dùng chung schema với backend, xem mục tuần 3).
- Chọn vị trí trên bản đồ: Leaflet map, sự kiện `onClick` → `setLat/setLng`, Marker kéo-thả (`draggable`) để chỉnh vị trí chính xác hơn.
- Upload nhiều ảnh: `input type="file" multiple`, preview bằng `URL.createObjectURL`, gửi `FormData` qua `multer` ở backend; hiển thị rõ giới hạn 7 ảnh/5MB mỗi ảnh cho người dùng biết trước khi chọn file.
- Sửa/xóa tin: reuse form đăng tin (mode edit), gọi `PUT`/`DELETE` (nhớ đính kèm CSRF token), hiện confirm dialog trước khi xóa; backend xóa file ảnh vật lý kèm theo (đã cài ở tuần 1, kiểm tra lại hoạt động đúng).
- **Lưu ý thời gian:** phần này cùng tuần 4 là hai chỗ dễ trễ tiến độ nhất — ưu tiên làm đúng luồng CRUD trước, polish UI sau nếu còn thời gian.

---

## 9. TUẦN 7 — HOÀN THIỆN & KIỂM THỬ

- Rà lại luồng end-to-end: viết vài kịch bản test thủ công (checklist) — đăng tin → xuất hiện trên bản đồ/tìm kiếm → sửa → xóa → ảnh bị xóa khỏi disk.
- Loading/error/empty state: dùng `isLoading/isError/data` từ React Query để render skeleton loading, thông báo lỗi, và "không tìm thấy kết quả".
- Kiểm thử responsive: Chrome DevTools + test trên điện thoại thật nếu có.
- Kiểm thử đa ngôn ngữ: kiểm tra không còn key i18n bị thiếu (i18next log warning key missing ở dev mode).
- Kiểm thử bảo mật cơ bản: thử gọi route ghi không kèm CSRF token (phải bị chặn), thử đăng nhập sai quá 5 lần (phải bị rate limit).
- Sửa lỗi: React DevTools + console log có kiểm soát, xóa hết `console.log` trước khi deploy.

---

## 10. TUẦN 8 — CHUẨN BỊ & TRIỂN KHAI THẬT

- Giữ SQLite, không chuyển Postgres — chỉ cần đảm bảo volume/disk của nền tảng deploy là persistent (Fly.io volume hoặc VPS).
- **Backup:** cấu hình cron job copy file `.db` ra nơi lưu khác định kỳ (vd hàng ngày), hoặc dùng `litestream` để replicate liên tục sang object storage (S3/Backblaze B2 free tier). Đây là bước bắt buộc, không phải "tùy chọn nếu có thời gian".
- Bảo mật: đổi `JWT_SECRET` và `CSRF_SECRET` production, đổi mật khẩu admin mặc định, xác nhận `express-rate-limit` đang hoạt động trên `/auth/login`, `helmet` đã bật.
- Build production: `vite build` → copy `/dist` vào thư mục backend serve tĩnh (Express `express.static` + fallback route SPA), hoặc Docker multi-stage build (base image `node:20-alpine`, stage 1 build React, stage 2 chỉ copy code backend + `/dist` + `node_modules` production).
- Deploy: `fly deploy` (Fly.io) hoặc push code + `pm2 restart` trên VPS.
- Test production: kiểm tra upload ảnh (ghi được vào volume không), tìm kiếm/lọc, backup chạy đúng lịch, gắn domain tùy chỉnh (Cloudflare miễn phí cho DNS + HTTPS nếu VPS, hoặc Fly.io tự cấp SSL).
- CI/CD: đảm bảo GitHub Actions pass trước khi deploy lần cuối.

---

## 11. SAU KHI RA MẮT (GIAI ĐOẠN 2, TÙY NHU CẦU)

- **Tuần 9-10:** Tài khoản người thuê — thêm bảng `users` riêng (khác `admin_users`), đăng ký/đăng nhập bằng JWT tương tự (cookie + CSRF), bảng `favorites` (`userId`, `listingId`) để lưu tin yêu thích.
- **Tuần 11+:** Nhắn tin trong app (Socket.io cho real-time hoặc polling đơn giản trước), tin nổi bật/thanh toán (VNPay/Momo nếu cần), tối ưu tìm kiếm khi dữ liệu lớn (PostgreSQL full-text search hoặc Elasticsearch/Meilisearch nếu quy mô rất lớn — **chỉ chuyển khỏi SQLite khi có bằng chứng thực tế cần**, không chuyển "phòng khi").

---

## 12. GHI CHÚ CHUNG

- Dữ liệu tin đăng: hoàn toàn tự nhập qua form quản trị, không lấy từ nguồn nào khác.
- Bản đồ: Leaflet + OpenStreetMap (miễn phí, không cần API key).
- Công thức tính khoảng cách: Haversine (hàm JS thuần, không cần thư viện riêng).
- Đây là ước tính cho 1 người làm liên tục, có thể rút ngắn nếu bỏ bớt phần polish (tuần 7) và làm song song với việc khác — nhưng **không được bỏ** các mục ở phần "Nguyên tắc thiết kế" (mục 2) dù có rút ngắn thời gian, vì đó là những chỗ rẻ để làm đúng từ đầu và đắt để sửa sau.
- Các thư viện đề xuất đều có free tier / miễn phí hoàn toàn, phù hợp cho dự án cá nhân/quy mô nhỏ ban đầu.
- File scaffold code (schema Drizzle, cấu trúc thư mục, middleware auth/CSRF/error-handler đã viết sẵn) đi kèm trong `thuenha-project-tuan1.zip` — dùng làm điểm bắt đầu cho tuần 1, không cần dựng lại từ đầu.
