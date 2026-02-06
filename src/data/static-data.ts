/**
 * Static Data Module
 *
 * Contains static dropdown options and filter data used across the application.
 * This data is not fetched from the database and remains constant.
 */

export const cities = [
  { value: 'ha-noi', label: 'Hà Nội' },
  { value: 'ho-chi-minh', label: 'TP. Hồ Chí Minh' },
  { value: 'da-nang', label: 'Đà Nẵng' },
  { value: 'hai-phong', label: 'Hải Phòng' },
  { value: 'can-tho', label: 'Cần Thơ' },
  { value: 'binh-duong', label: 'Bình Dương' },
  { value: 'dong-nai', label: 'Đồng Nai' },
  { value: 'quang-ninh', label: 'Quảng Ninh' },
  { value: 'thanh-hoa', label: 'Thanh Hóa' },
  { value: 'nghe-an', label: 'Nghệ An' },
];

export const propertyTypes = [
  { value: 'can-ho', label: 'Căn hộ chung cư' },
  { value: 'nha-rieng', label: 'Nhà riêng' },
  { value: 'biet-thu', label: 'Nhà biệt thự, liền kề' },
  { value: 'nha-mat-pho', label: 'Nhà mặt phố' },
  { value: 'shophouse', label: 'Shophouse, nhà phố thương mại' },
  { value: 'dat-nen', label: 'Đất nền dự án' },
  { value: 'dat', label: 'Đất' },
  { value: 'trang-trai', label: 'Trang trại, khu nghỉ dưỡng' },
  { value: 'kho-xuong', label: 'Kho, nhà xưởng, đất' },
];

export const priceRanges = [
  { value: '', label: 'Tất cả mức giá' },
  { value: '0-500', label: 'Dưới 500 triệu' },
  { value: '500-1000', label: '500 triệu - 1 tỷ' },
  { value: '1000-2000', label: '1 - 2 tỷ' },
  { value: '2000-3000', label: '2 - 3 tỷ' },
  { value: '3000-5000', label: '3 - 5 tỷ' },
  { value: '5000-10000', label: '5 - 10 tỷ' },
  { value: '10000-20000', label: '10 - 20 tỷ' },
  { value: '20000-50000', label: '20 - 50 tỷ' },
  { value: '50000+', label: 'Trên 50 tỷ' },
];

export const areaRanges = [
  { value: '', label: 'Tất cả diện tích' },
  { value: '0-30', label: 'Dưới 30 m²' },
  { value: '30-50', label: '30 - 50 m²' },
  { value: '50-80', label: '50 - 80 m²' },
  { value: '80-100', label: '80 - 100 m²' },
  { value: '100-150', label: '100 - 150 m²' },
  { value: '150-200', label: '150 - 200 m²' },
  { value: '200-300', label: '200 - 300 m²' },
  { value: '300-500', label: '300 - 500 m²' },
  { value: '500+', label: 'Trên 500 m²' },
];
