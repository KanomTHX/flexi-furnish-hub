import { Product } from '@/types/pos';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Office Chair Executive',
    sku: 'OC-001',
    price: 12500,
    category: 'Office Furniture',
    stock: 15,
    description: 'Ergonomic executive office chair with lumbar support',
    barcode: '1234567890123'
  },
  {
    id: '2',
    name: 'Dining Table Set (4 Chairs)',
    sku: 'DT-205',
    price: 25900,
    category: 'Dining Room',
    stock: 8,
    description: 'Solid wood dining table with 4 matching chairs',
    barcode: '1234567890124'
  },
  {
    id: '3',
    name: 'Bookshelf Premium 5-Tier',
    sku: 'BS-108',
    price: 8900,
    category: 'Storage',
    stock: 12,
    description: 'Premium wooden bookshelf with 5 adjustable shelves',
    barcode: '1234567890125'
  },
  {
    id: '4',
    name: 'Sofa 3-Seater Fabric',
    sku: 'SF-301',
    price: 35000,
    category: 'Living Room',
    stock: 5,
    description: 'Comfortable 3-seater fabric sofa in modern design',
    barcode: '1234567890126'
  },
  {
    id: '5',
    name: 'Coffee Table Glass Top',
    sku: 'CT-150',
    price: 15500,
    category: 'Living Room',
    stock: 10,
    description: 'Modern glass top coffee table with metal frame',
    barcode: '1234567890127'
  },
  {
    id: '6',
    name: 'Wardrobe 3-Door',
    sku: 'WD-400',
    price: 28000,
    category: 'Bedroom',
    stock: 6,
    description: 'Spacious 3-door wardrobe with mirror and drawers',
    barcode: '1234567890128'
  },
  {
    id: '7',
    name: 'Desk Lamp LED',
    sku: 'DL-050',
    price: 2500,
    category: 'Lighting',
    stock: 25,
    description: 'Adjustable LED desk lamp with touch control',
    barcode: '1234567890129'
  },
  {
    id: '8',
    name: 'Bar Stool Set (2 pieces)',
    sku: 'BS-220',
    price: 6800,
    category: 'Bar Furniture',
    stock: 18,
    description: 'Modern bar stools with adjustable height',
    barcode: '1234567890130'
  },
  {
    id: '9',
    name: 'TV Stand 55 inch',
    sku: 'TV-155',
    price: 12000,
    category: 'Entertainment',
    stock: 9,
    description: 'TV stand suitable for 55-inch TVs with storage',
    barcode: '1234567890131'
  },
  {
    id: '10',
    name: 'Study Table with Drawer',
    sku: 'ST-120',
    price: 9500,
    category: 'Office Furniture',
    stock: 14,
    description: 'Compact study table with built-in drawer',
    barcode: '1234567890132'
  }
];

export const categories = [
  'All Categories',
  'Office Furniture',
  'Dining Room',
  'Living Room',
  'Bedroom',
  'Storage',
  'Lighting',
  'Bar Furniture',
  'Entertainment'
];

// Payment methods for POS (cash transactions only)
export const paymentMethods = [
  { id: 'cash', name: 'Cash', type: 'cash' as const, icon: '💵' },
  { id: 'card', name: 'Credit/Debit Card', type: 'card' as const, icon: '💳' },
  { id: 'transfer', name: 'Bank Transfer', type: 'transfer' as const, icon: '🏦' }
];

// All payment methods including installment (for reference)
export const allPaymentMethods = [
  { id: 'cash', name: 'Cash', type: 'cash' as const, icon: '💵' },
  { id: 'card', name: 'Credit/Debit Card', type: 'card' as const, icon: '💳' },
  { id: 'transfer', name: 'Bank Transfer', type: 'transfer' as const, icon: '🏦' },
  { id: 'installment', name: 'Installment', type: 'installment' as const, icon: '📅' }
];