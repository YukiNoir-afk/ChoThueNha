import 'dotenv/config';
import { db, rawSqlite } from './index.js';
import { listings } from './schema.js';
import { count } from 'drizzle-orm';

// Chạy: npm run seed — bơm vài chục tin mẫu quanh khu vực TP.HCM để test
// bản đồ, tìm kiếm, filter ngay từ tuần 2, không cần đợi có trang admin.
// Idempotent: kiểm tra nếu đã có data thì bỏ qua.

const [{ total }] = db.select({ total: count() }).from(listings).all();

if (total > 0) {
  console.log(`Đã có ${total} tin trong DB, bỏ qua seed.`);
  rawSqlite.close();
  process.exit(0);
}

const HCMC_CENTER = { lat: 10.7769, lng: 106.7009 };

function randomAround(center, spreadKm = 8) {
  const spreadDeg = spreadKm / 111; // ~111km / độ vĩ
  return {
    lat: center.lat + (Math.random() - 0.5) * spreadDeg,
    lng: center.lng + (Math.random() - 0.5) * spreadDeg,
  };
}

const types = ['room', 'apartment', 'house', 'studio'];
const districts = [
  'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6',
  'Quận 7', 'Quận 8', 'Quận 10', 'Quận 11', 'Quận 12',
  'Bình Thạnh', 'Phú Nhuận', 'Tân Bình', 'Gò Vấp', 'Thủ Đức',
];
const streets = [
  'Nguyễn Huệ', 'Lê Lợi', 'Trần Hưng Đạo', 'Cách Mạng Tháng 8',
  'Điện Biên Phủ', 'Võ Văn Tần', 'Hai Bà Trưng', 'Phan Đình Phùng',
  'Lý Tự Trọng', 'Nguyễn Thị Minh Khai', 'Pasteur', 'Nam Kỳ Khởi Nghĩa',
];
const amenityPool = ['wifi', 'parking', 'ac', 'washing_machine', 'fridge', 'elevator', 'security', 'pool', 'gym', 'balcony'];

const titleTemplates = {
  room: { vi: 'Phòng trọ cho thuê', en: 'Room for rent' },
  apartment: { vi: 'Căn hộ cho thuê', en: 'Apartment for rent' },
  house: { vi: 'Nhà nguyên căn cho thuê', en: 'House for rent' },
  studio: { vi: 'Studio cho thuê', en: 'Studio for rent' },
};

const sampleData = Array.from({ length: 30 }).map((_, i) => {
  const { lat, lng } = randomAround(HCMC_CENTER);
  const type = types[i % 4];
  const district = districts[i % districts.length];
  const street = streets[i % streets.length];
  const numAmenities = 2 + Math.floor(Math.random() * 4);
  const shuffled = [...amenityPool].sort(() => Math.random() - 0.5);
  const amenities = shuffled.slice(0, numAmenities);

  return {
    titleVi: `${titleTemplates[type].vi} ${street}, ${district}`,
    titleEn: `${titleTemplates[type].en} at ${street}, ${district}`,
    descVi: `Cho thuê ${type === 'room' ? 'phòng trọ' : type === 'apartment' ? 'căn hộ' : type === 'house' ? 'nhà nguyên căn' : 'studio'} tại ${street}, ${district}, TP.HCM. Đầy đủ nội thất, an ninh tốt, gần chợ và trường học. Liên hệ để xem phòng.`,
    descEn: `${titleTemplates[type].en} at ${street}, ${district}, HCMC. Fully furnished, secure area, near market and schools. Contact for viewing.`,
    price: 3_000_000 + Math.floor(Math.random() * 15) * 1_000_000,
    area: 20 + Math.floor(Math.random() * 60),
    bedrooms: type === 'room' || type === 'studio' ? 1 : 1 + (i % 3),
    type,
    lat,
    lng,
    address: `${10 + i * 3} ${street}, ${district}, TP.HCM`,
    amenities,
  };
});

db.insert(listings).values(sampleData).run();
console.log(`✅ Đã seed ${sampleData.length} tin mẫu quanh TP.HCM.`);
rawSqlite.close();
