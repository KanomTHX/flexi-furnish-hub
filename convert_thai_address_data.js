import { readFileSync, writeFileSync } from 'fs';

// อ่านข้อมูลจากไฟล์ JSON
const rawData = JSON.parse(readFileSync('thai_address_complete.json', 'utf8'));

console.log('🔄 กำลังแปลงข้อมูลที่อยู่ไทย...');
console.log(`📊 พบจังหวัด: ${rawData.length} จังหวัด`);

// แปลงข้อมูลเป็นรูปแบบที่ใช้งานได้
const provinces = [];
const districts = {};
const subdistricts = {};

rawData.forEach(province => {
  // เพิ่มจังหวัด
  provinces.push({
    id: province.id.toString(),
    name: province.name_th,
    name_en: province.name_en
  });

  // เพิ่มอำเภอ
  if (province.amphure && province.amphure.length > 0) {
    districts[province.id.toString()] = province.amphure.map(amphure => {
      // รวบรวมรหัสไปรษณีย์ที่ไม่ซ้ำ
      const zipCodes = [...new Set(
        amphure.tambon?.map(tambon => tambon.zip_code.toString()) || []
      )].sort();

      return {
        id: amphure.id.toString(),
        name: amphure.name_th,
        name_en: amphure.name_en,
        zipCodes: zipCodes
      };
    });

    // เพิ่มตำบล
    province.amphure.forEach(amphure => {
      if (amphure.tambon && amphure.tambon.length > 0) {
        subdistricts[amphure.id.toString()] = amphure.tambon.map(tambon => ({
          id: tambon.id.toString(),
          name: tambon.name_th,
          name_en: tambon.name_en,
          zipCode: tambon.zip_code.toString()
        }));
      }
    });
  }
});

// สร้างไฟล์ TypeScript
const tsContent = `// ===================================================================
// COMPLETE THAI ADDRESS DATA
// ข้อมูลที่อยู่ไทยครบถ้วน - สร้างจาก API อย่างเป็นทางการ
// Source: https://github.com/kongvut/thai-province-data
// ===================================================================

export interface Province {
  id: string;
  name: string;
  name_en: string;
}

export interface District {
  id: string;
  name: string;
  name_en: string;
  zipCodes: string[];
}

export interface Subdistrict {
  id: string;
  name: string;
  name_en: string;
  zipCode: string;
}

// จังหวัดทั้งหมด ${provinces.length} จังหวัด
export const PROVINCES: Province[] = ${JSON.stringify(provinces, null, 2)};

// อำเภอจำแนกตามจังหวัด
export const DISTRICTS: Record<string, District[]> = ${JSON.stringify(districts, null, 2)};

// ตำบลจำแนกตามอำเภอ
export const SUBDISTRICTS: Record<string, Subdistrict[]> = ${JSON.stringify(subdistricts, null, 2)};

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

/**
 * ค้นหาจังหวัดจาก ID
 */
export function getProvinceById(id: string): Province | undefined {
  return PROVINCES.find(p => p.id === id);
}

/**
 * ดึงอำเภอทั้งหมดในจังหวัด
 */
export function getDistrictsByProvinceId(provinceId: string): District[] {
  return DISTRICTS[provinceId] || [];
}

/**
 * ค้นหาอำเภอจาก ID
 */
export function getDistrictById(provinceId: string, districtId: string): District | undefined {
  const districts = getDistrictsByProvinceId(provinceId);
  return districts.find(d => d.id === districtId);
}

/**
 * ดึงตำบลทั้งหมดในอำเภอ
 */
export function getSubdistrictsByDistrictId(districtId: string): Subdistrict[] {
  return SUBDISTRICTS[districtId] || [];
}

/**
 * ค้นหาตำบลจาก ID
 */
export function getSubdistrictById(districtId: string, subdistrictId: string): Subdistrict | undefined {
  const subdistricts = getSubdistrictsByDistrictId(districtId);
  return subdistricts.find(s => s.id === subdistrictId);
}

/**
 * สร้างที่อยู่เต็มจากข้อมูลที่แยกส่วน
 */
export function formatFullAddress(
  houseNumber: string,
  subdistrictId: string,
  districtId: string,
  provinceId: string,
  zipCode: string
): string {
  const province = getProvinceById(provinceId);
  const district = getDistrictById(provinceId, districtId);
  const subdistrict = getSubdistrictById(districtId, subdistrictId);

  const parts = [
    houseNumber,
    subdistrict && \`ตำบล\${subdistrict.name}\`,
    district && \`อำเภอ\${district.name}\`,
    province && \`จังหวัด\${province.name}\`,
    zipCode
  ].filter(Boolean);

  return parts.join(' ');
}

/**
 * ค้นหาจังหวัดจากชื่อ
 */
export function searchProvinces(query: string): Province[] {
  const searchTerm = query.toLowerCase();
  return PROVINCES.filter(p => 
    p.name.toLowerCase().includes(searchTerm) ||
    p.name_en.toLowerCase().includes(searchTerm)
  );
}

/**
 * ค้นหาอำเภอจากชื่อ
 */
export function searchDistricts(provinceId: string, query: string): District[] {
  const districts = getDistrictsByProvinceId(provinceId);
  const searchTerm = query.toLowerCase();
  return districts.filter(d => 
    d.name.toLowerCase().includes(searchTerm) ||
    d.name_en.toLowerCase().includes(searchTerm)
  );
}

/**
 * ค้นหาตำบลจากชื่อ
 */
export function searchSubdistricts(districtId: string, query: string): Subdistrict[] {
  const subdistricts = getSubdistrictsByDistrictId(districtId);
  const searchTerm = query.toLowerCase();
  return subdistricts.filter(s => 
    s.name.toLowerCase().includes(searchTerm) ||
    s.name_en.toLowerCase().includes(searchTerm)
  );
}

/**
 * ดึงรหัสไปรษณีย์ทั้งหมดในอำเภอ
 */
export function getZipCodesByDistrictId(provinceId: string, districtId: string): string[] {
  const district = getDistrictById(provinceId, districtId);
  return district?.zipCodes || [];
}

/**
 * ตรวจสอบความถูกต้องของรหัสไปรษณีย์
 */
export function validateZipCode(provinceId: string, districtId: string, zipCode: string): boolean {
  const validZipCodes = getZipCodesByDistrictId(provinceId, districtId);
  return validZipCodes.includes(zipCode);
}

// สถิติข้อมูล
export const DATA_STATS = {
  totalProvinces: ${provinces.length},
  totalDistricts: ${Object.values(districts).reduce((sum, arr) => sum + arr.length, 0)},
  totalSubdistricts: ${Object.values(subdistricts).reduce((sum, arr) => sum + arr.length, 0)},
  lastUpdated: '${new Date().toISOString()}'
};
`;

// เขียนไฟล์
writeFileSync('src/data/thai-address-complete.ts', tsContent, 'utf8');

console.log('✅ แปลงข้อมูลเสร็จสิ้น!');
console.log(`📊 สถิติข้อมูล:`);
console.log(`   - จังหวัด: ${provinces.length} จังหวัด`);
console.log(`   - อำเภอ: ${Object.values(districts).reduce((sum, arr) => sum + arr.length, 0)} อำเภอ`);
console.log(`   - ตำบล: ${Object.values(subdistricts).reduce((sum, arr) => sum + arr.length, 0)} ตำบล`);
console.log(`📁 ไฟล์ที่สร้าง: src/data/thai-address-complete.ts`);

// สร้างไฟล์เปรียบเทียบ
const comparison = {
  original: {
    provinces: rawData.length,
    districts: rawData.reduce((sum, p) => sum + (p.amphure?.length || 0), 0),
    subdistricts: rawData.reduce((sum, p) => 
      sum + (p.amphure?.reduce((subSum, a) => subSum + (a.tambon?.length || 0), 0) || 0), 0
    )
  },
  converted: {
    provinces: provinces.length,
    districts: Object.values(districts).reduce((sum, arr) => sum + arr.length, 0),
    subdistricts: Object.values(subdistricts).reduce((sum, arr) => sum + arr.length, 0)
  }
};

console.log('\n📋 เปรียบเทียบข้อมูล:');
console.log('Original vs Converted');
console.log(`จังหวัด: ${comparison.original.provinces} -> ${comparison.converted.provinces}`);
console.log(`อำเภอ: ${comparison.original.districts} -> ${comparison.converted.districts}`);
console.log(`ตำบล: ${comparison.original.subdistricts} -> ${comparison.converted.subdistricts}`);

if (comparison.original.provinces === comparison.converted.provinces &&
    comparison.original.districts === comparison.converted.districts &&
    comparison.original.subdistricts === comparison.converted.subdistricts) {
  console.log('✅ ข้อมูลครบถ้วน 100%');
} else {
  console.log('⚠️  มีข้อมูลที่ไม่ตรงกัน');
}