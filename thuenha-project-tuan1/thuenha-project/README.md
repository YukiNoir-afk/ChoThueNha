# Thuê Nhà — Khung dự án tuần 1

## Các quyết định đã chốt (không đổi giữa chừng)

| Vấn đề | Chốt | Lý do |
|---|---|---|
| ORM/DB | **Drizzle + better-sqlite3** | Nhẹ, không engine binary như Prisma, phù hợp deploy VPS/Fly.io free tier ngay từ đầu — không phải viết lại ở tuần 8 |
| Lưu JWT | **httpOnly cookie** | Monolith 1 domain, không cần CORS; an toàn hơn localStorage (chống XSS lấy token). Đổi lại bắt buộc có CSRF token cho route ghi (`csrf-csrf`) |
| Pagination | **Bắt buộc từ đầu** (`page`, `pageSize`, max 50) | `GET /listings` không bao giờ được trả toàn bộ bảng |
| Xóa ảnh | DB cascade xóa row `listing_images`, nhưng **file vật lý trên disk phải tự xóa ở tầng service** (TODO đã đánh dấu trong route DELETE) | SQLite/filesystem không tự dọn file mồ côi |

## Cấu trúc thư mục

```
thuenha-project/
├── client/                        # để trống, dựng ở tuần 3 (React + Vite)
└── server/
    ├── data/                      # file thuenha.db (gitignore, tạo khi migrate)
    ├── drizzle/                   # migration SQL do drizzle-kit sinh ra
    ├── uploads/                   # ảnh đã nén qua sharp (gitignore nội dung)
    ├── src/
    │   ├── db/
    │   │   ├── schema.js          # định nghĩa bảng: admin_users, listings, listing_images
    │   │   ├── index.js           # kết nối better-sqlite3 + drizzle, bật WAL + foreign_keys
    │   │   ├── migrate.js         # chạy migration (npm run db:migrate)
    │   │   └── seed.js            # bơm 30 tin mẫu quanh TP.HCM để test sớm
    │   ├── middleware/
    │   │   ├── auth.js            # sign/verify JWT qua cookie httpOnly
    │   │   ├── csrf.js            # bảo vệ CSRF cho route POST/PUT/DELETE
    │   │   ├── rateLimiters.js    # giới hạn 5 lần login / 15 phút
    │   │   └── errorHandler.js    # error handler tập trung, không leak stack trace
    │   ├── routes/
    │   │   ├── auth.routes.js     # POST /login, /logout, GET /me
    │   │   └── listings.routes.js # GET (có filter+pagination+haversine), CRUD khung sườn
    │   ├── utils/
    │   │   └── haversine.js       # tính km giữa 2 tọa độ, dùng cho "gần tôi"
    │   ├── app.js                 # khởi tạo Express + middleware toàn cục
    │   └── server.js              # entry point
    ├── drizzle.config.js
    ├── package.json
    ├── .env.example
    └── .gitignore
```

## Việc cần làm để chạy được (còn lại của tuần 1)

1. `cd server && npm install`
2. `cp .env.example .env` rồi đổi `JWT_SECRET`/`CSRF_SECRET` (dùng lệnh gợi ý trong file)
3. Tạo admin đầu tiên: viết 1 script nhỏ `hash password bằng bcrypt rồi insert vào admin_users` (chưa có sẵn trong khung — làm cùng lúc với việc viết `POST /listings` thật)
4. `npm run db:generate` → sinh migration từ schema.js
5. `npm run db:migrate` → tạo file `data/thuenha.db`
6. `npm run seed` → có 30 tin mẫu để test
7. `npm run dev` → server chạy ở `http://localhost:4000`
8. Điền phần TODO trong `listings.routes.js` (POST/PUT/DELETE) — đây là phần còn lại của tuần 1 theo kế hoạch gốc (multer + sharp resize ảnh, validate Zod).

## Việc KHÔNG làm ở tuần 1 (để tránh lan man)

- Chưa động vào `client/` — tuần 3.
- Chưa làm bảng `users`/`favorites` (giai đoạn 2) — đã comment sẵn vị trí trong `schema.js` để nhớ.
- Chưa cần Swagger/OpenAPI — dùng file `.http` test tay là đủ ở giai đoạn này.
