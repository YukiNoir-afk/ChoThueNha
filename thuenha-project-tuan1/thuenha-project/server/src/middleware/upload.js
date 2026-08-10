import multer from 'multer';
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

// ---------------------------------------------------------------------------
// Upload pipeline: multer (nhận file) → validate MIME → sharp (resize + nén)
//
// Quyết định đã chốt trong kế hoạch:
// - Whitelist: image/jpeg, image/png, image/webp
// - Giới hạn: 5MB/ảnh, tối đa 7 ảnh/tin
// - Output: webp, max 1280px, quality 80
// - Lưu tạm trước, sharp xử lý xong mới move vào uploads/
// ---------------------------------------------------------------------------

const UPLOADS_DIR = path.resolve('uploads');
const TMP_DIR = path.resolve('uploads', 'tmp');

// Đảm bảo thư mục tồn tại
await fs.mkdir(UPLOADS_DIR, { recursive: true });
await fs.mkdir(TMP_DIR, { recursive: true });

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 7;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TMP_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const ext = path.extname(file.originalname) || '.tmp';
    cb(null, `${unique}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIMES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      Object.assign(
        new Error(`Định dạng ${file.mimetype} không được hỗ trợ. Chỉ chấp nhận: JPEG, PNG, WebP`),
        { statusCode: 400 },
      ),
    );
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
});

/**
 * Xử lý ảnh sau khi multer đã nhận: resize + nén → lưu file chính thức.
 * @param {Express.Multer.File[]} files - mảng file từ req.files
 * @returns {Promise<Array<{ url: string, sortOrder: number }>>}
 */
export async function processUploadedImages(files) {
  if (!files || files.length === 0) return [];

  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const outputName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.webp`;
    const outputPath = path.join(UPLOADS_DIR, outputName);

    await sharp(file.path)
      .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    // Xóa file tạm — sharp đã xong, không cần nữa
    await fs.unlink(file.path).catch(() => {});

    results.push({
      url: `/uploads/${outputName}`,
      sortOrder: i,
    });
  }

  return results;
}

/**
 * Xóa file ảnh vật lý khỏi disk.
 * Gọi khi xóa/sửa listing để tránh file mồ côi (DB cascade chỉ xóa record,
 * KHÔNG xóa file trên disk — đây là chỗ hay bị quên).
 * @param {string} imageUrl - path tương đối VD: /uploads/xxx.webp
 */
export async function deleteImageFile(imageUrl) {
  if (!imageUrl) return;
  // imageUrl dạng /uploads/xxx.webp → resolve ra absolute path
  const filename = path.basename(imageUrl);
  const filePath = path.join(UPLOADS_DIR, filename);
  try {
    await fs.unlink(filePath);
  } catch (err) {
    // File có thể đã bị xóa trước đó — không cần throw, chỉ log warning
    if (err.code !== 'ENOENT') {
      console.warn(`Không xóa được file ảnh ${filePath}:`, err.message);
    }
  }
}
