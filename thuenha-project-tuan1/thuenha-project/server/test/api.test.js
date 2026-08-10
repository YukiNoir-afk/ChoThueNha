import { test, before, after } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const TEST_DB_PATH = path.resolve('data', 'test.db');
if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH);
if (fs.existsSync(`${TEST_DB_PATH}-wal`)) fs.unlinkSync(`${TEST_DB_PATH}-wal`);
if (fs.existsSync(`${TEST_DB_PATH}-shm`)) fs.unlinkSync(`${TEST_DB_PATH}-shm`);

// QUAN TRỌNG: Cài đặt biến môi trường cho test DB trước khi import
process.env.DATABASE_PATH = TEST_DB_PATH;
process.env.JWT_SECRET = 'test-secret';
process.env.CSRF_SECRET = 'test-csrf';
process.env.NODE_ENV = 'test';

// Import sau khi set env
const { createApp } = await import('../src/app.js');
const { rawSqlite } = await import('../src/db/index.js');

let testServer;
const BASE_URL = 'http://localhost:4001/api';
let cookieHeader = '';
let csrfToken = '';

before(() => {
  // Migrate & seed
  execSync('npm run db:migrate', { stdio: 'ignore' });
  execSync('npm run seed:admin', { stdio: 'ignore' });
  execSync('npm run seed', { stdio: 'ignore' });

  // Khởi động server
  const app = createApp();
  testServer = app.listen(4001);
});

after(() => {
  // Kill server & db
  if (testServer) testServer.close();
  if (rawSqlite) rawSqlite.close();
});

test('GET /api/listings/:id hợp lệ -> 200, có images mảng', async () => {
  const res = await fetch(`${BASE_URL}/listings/1`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.id, 1);
  assert.ok(Array.isArray(data.images));
});

test('GET /api/listings?type=giá_trị_sai -> 400', async () => {
  const res = await fetch(`${BASE_URL}/listings?type=khong_ton_tai`);
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.ok(data.error.message.includes('Dữ liệu không hợp lệ'));
});

test('GET /api/listings?minPrice=20000000&maxPrice=5000000 -> 400 (.refine mới)', async () => {
  const res = await fetch(`${BASE_URL}/listings?minPrice=20000000&maxPrice=5000000`);
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.ok(data.error.message.includes('Dữ liệu không hợp lệ'));
  assert.ok(JSON.stringify(data.error.details).includes('Giá tối thiểu không được lớn hơn giá tối đa'));
});

test('GET /api/listings?q=50%25 -> không match giá 50000000 (test escape)', async () => {
  const res = await fetch(`${BASE_URL}/listings?q=50%25`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  // Querry "50%" sẽ không match bất kỳ listings nào đang có trong DB seed trừ khi có literal "50%"
  // Đảm bảo escape đúng -> data.data mảng rỗng (vì db seed không có title nào chứa 50% literal)
  assert.strictEqual(data.data.length, 0);
});

test('POST /api/auth/login -> 200, lấy CSRF', async () => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@thuenha.vn', password: 'admin12345' })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.csrfToken);
  
  csrfToken = data.csrfToken;
  cookieHeader = res.headers.getSetCookie ? res.headers.getSetCookie().join('; ') : res.headers.get('set-cookie');
});

test('POST /api/listings -> 201 (multipart không ảnh)', async () => {
  const formData = new FormData();
  formData.append('titleVi', 'Nhà test');
  formData.append('titleEn', 'Test House');
  formData.append('descVi', 'Mô tả chi tiết nhà test để đủ 10 ký tự');
  formData.append('descEn', 'Description test house length');
  formData.append('price', '15000000');
  formData.append('area', '50');
  formData.append('bedrooms', '2');
  formData.append('type', 'house');
  formData.append('lat', '10.7721');
  formData.append('lng', '106.6981');
  formData.append('address', '123 Test');
  formData.append('amenities', JSON.stringify(['wifi']));

  const res = await fetch(`${BASE_URL}/listings`, {
    method: 'POST',
    headers: {
      'x-csrf-token': csrfToken,
      'cookie': cookieHeader
    },
    body: formData
  });
  
  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.ok(data.id);
  assert.deepStrictEqual(data.images, []);
});
