import { Product } from '@/types/pos';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'เก้าอี้สำนักงานผู้บริหาร',
    sku: 'OC-001',
    price: 12500,
    category: 'เฟอร์นิเจอร์สำนักงาน',
    stock: 15,
    description: 'เก้าอี้สำนักงานผู้บริหารแบบเออร์โกโนมิกส์ พร้อมพนักพิงหลัง',
    barcode: '1234567890123'
  },
  {
    id: '2',
    name: 'ชุดโต๊ะอาหาร (4 เก้าอี้)',
    sku: 'DT-205',
    price: 25900,
    category: 'ห้องอาหาร',
    stock: 8,
    description: 'โต๊ะอาหารไม้แท้ พร้อมเก้าอี้ 4 ตัวแบบเข้าชุด',
    barcode: '1234567890124'
  },
  {
    id: '3',
    name: 'ชั้นหนังสือพรีเมียม 5 ชั้น',
    sku: 'BS-108',
    price: 8900,
    category: 'ที่เก็บของ',
    stock: 12,
    description: 'ชั้นหนังสือไม้คุณภาพสูง 5 ชั้น ปรับระดับได้',
    barcode: '1234567890125'
  },
  {
    id: '4',
    name: 'โซฟา 3 ที่นั่ง ผ้า',
    sku: 'SF-301',
    price: 35000,
    category: 'ห้องนั่งเล่น',
    stock: 5,
    description: 'โซฟาผ้า 3 ที่นั่ง นั่งสบาย ดีไザน์โมเดิร์น',
    barcode: '1234567890126'
  },
  {
    id: '5',
    name: 'โต๊ะกาแฟหน้ากระจก',
    sku: 'CT-150',
    price: 15500,
    category: 'ห้องนั่งเล่น',
    stock: 10,
    description: 'โต๊ะกาแฟหน้ากระจกโมเดิร์น โครงเหล็ก',
    barcode: '1234567890127'
  },
  {
    id: '6',
    name: 'ตู้เสื้อผ้า 3 บาน',
    sku: 'WD-400',
    price: 28000,
    category: 'ห้องนอน',
    stock: 6,
    description: 'ตู้เสื้อผ้า 3 บาน กว้างขวาง มีกระจกและลิ้นชัก',
    barcode: '1234567890128'
  },
  {
    id: '7',
    name: 'โคมไฟตั้งโต๊ะ LED',
    sku: 'DL-050',
    price: 2500,
    category: 'โคมไฟ',
    stock: 25,
    description: 'โคมไฟ LED ตั้งโต๊ะ ปรับได้ ควบคุมด้วยการสัมผัส',
    barcode: '1234567890129'
  },
  {
    id: '8',
    name: 'ชุดเก้าอี้บาร์ (2 ตัว)',
    sku: 'BS-220',
    price: 6800,
    category: 'เฟอร์นิเจอร์บาร์',
    stock: 18,
    description: 'เก้าอี้บาร์โมเดิร์น ปรับความสูงได้',
    barcode: '1234567890130'
  },
  {
    id: '9',
    name: 'ชั้นวางทีวี 55 นิ้ว',
    sku: 'TV-155',
    price: 12000,
    category: 'ความบันเทิง',
    stock: 9,
    description: 'ชั้นวางทีวีสำหรับทีวี 55 นิ้ว มีที่เก็บของ',
    barcode: '1234567890131'
  },
  {
    id: '10',
    name: 'โต๊ะเรียนมีลิ้นชัก',
    sku: 'ST-120',
    price: 9500,
    category: 'เฟอร์นิเจอร์สำนักงาน',
    stock: 14,
    description: 'โต๊ะเรียนขนาดกะทัดรัด มีลิ้นชักในตัว',
    barcode: '1234567890132'
  }
];

export const categories = [
  'หมวดหมู่ทั้งหมด',
  'เฟอร์นิเจอร์สำนักงาน',
  'ห้องอาหาร',
  'ห้องนั่งเล่น',
  'ห้องนอน',
  'ที่เก็บของ',
  'โคมไฟ',
  'เฟอร์นิเจอร์บาร์',
  'ความบันเทิง'
];

// Payment methods for POS (cash transactions only)
export const paymentMethods = [
  { id: 'cash', name: 'เงินสด', type: 'cash' as const, icon: '💵' },
  { id: 'card', name: 'บัตรเครดิต/เดบิต', type: 'card' as const, icon: '💳' },
  { id: 'transfer', name: 'โอนเงินผ่านธนาคาร', type: 'transfer' as const, icon: '🏦' }
];

// All payment methods including installment (for reference)
export const allPaymentMethods = [
  { id: 'cash', name: 'เงินสด', type: 'cash' as const, icon: '💵' },
  { id: 'card', name: 'บัตรเครดิต/เดบิต', type: 'card' as const, icon: '💳' },
  { id: 'transfer', name: 'โอนเงินผ่านธนาคาร', type: 'transfer' as const, icon: '🏦' },
  { id: 'installment', name: 'ผ่อนชำระ', type: 'installment' as const, icon: '📅' }
];