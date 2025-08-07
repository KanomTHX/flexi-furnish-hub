// ข้อมูลที่อยู่ไทย - ตัวอย่างข้อมูลหลัก
// ในการใช้งานจริงควรดึงจาก API หรือไฟล์ JSON ที่สมบูรณ์

export interface Province {
  id: string;
  name: string;
}

export interface District {
  id: string;
  name: string;
  zipCodes: string[];
}

export interface Subdistrict {
  id: string;
  name: string;
}

export const PROVINCES: Province[] = [
  { id: '10', name: 'กรุงเทพมหานคร' },
  { id: '11', name: 'สมุทรปราการ' },
  { id: '12', name: 'นนทบุรี' },
  { id: '13', name: 'ปทุมธานี' },
  { id: '14', name: 'พระนครศรีอยุธยา' },
  { id: '15', name: 'อ่างทอง' },
  { id: '16', name: 'ลพบุรี' },
  { id: '17', name: 'สิงห์บุรี' },
  { id: '18', name: 'ชัยนาท' },
  { id: '19', name: 'สระบุรี' },
  { id: '20', name: 'ชลบุรี' },
  { id: '21', name: 'ระยอง' },
  { id: '22', name: 'จันทบุรี' },
  { id: '23', name: 'ตราด' },
  { id: '24', name: 'ฉะเชิงเทรา' },
  { id: '25', name: 'ปราจีนบุรี' },
  { id: '26', name: 'นครนายก' },
  { id: '27', name: 'สระแก้ว' },
  { id: '30', name: 'นครราชสีมา' },
  { id: '31', name: 'บุรีรัมย์' },
  { id: '32', name: 'สุรินทร์' },
  { id: '33', name: 'ศรีสะเกษ' },
  { id: '34', name: 'อุบลราชธานี' },
  { id: '35', name: 'ยโสธร' },
  { id: '36', name: 'ชัยภูมิ' },
  { id: '37', name: 'อำนาจเจริญ' },
  { id: '38', name: 'บึงกาฬ' },
  { id: '39', name: 'หนองบัวลำภู' },
  { id: '40', name: 'ขอนแก่น' },
  { id: '41', name: 'อุดรธานี' },
  { id: '42', name: 'เลย' },
  { id: '43', name: 'หนองคาย' },
  { id: '44', name: 'มหาสารคาม' },
  { id: '45', name: 'ร้อยเอ็ด' },
  { id: '46', name: 'กาฬสินธุ์' },
  { id: '47', name: 'สกลนคร' },
  { id: '48', name: 'นครพนม' },
  { id: '49', name: 'มุกดาหาร' },
  { id: '50', name: 'เชียงใหม่' },
  { id: '51', name: 'ลำพูน' },
  { id: '52', name: 'ลำปาง' },
  { id: '53', name: 'อุตรดิตถ์' },
  { id: '54', name: 'แพร่' },
  { id: '55', name: 'น่าน' },
  { id: '56', name: 'พะเยา' },
  { id: '57', name: 'เชียงราย' },
  { id: '58', name: 'แม่ฮ่องสอน' },
  { id: '60', name: 'นครสวรรค์' },
  { id: '61', name: 'อุทัยธานี' },
  { id: '62', name: 'กำแพงเพชร' },
  { id: '63', name: 'ตาก' },
  { id: '64', name: 'สุโขทัย' },
  { id: '65', name: 'พิษณุโลก' },
  { id: '66', name: 'พิจิตร' },
  { id: '67', name: 'เพชรบูรณ์' },
  { id: '70', name: 'ราชบุรี' },
  { id: '71', name: 'กาญจนบุรี' },
  { id: '72', name: 'สุพรรณบุรี' },
  { id: '73', name: 'นครปฐม' },
  { id: '74', name: 'สมุทรสาคร' },
  { id: '75', name: 'สมุทรสงคราม' },
  { id: '76', name: 'เพชรบุรี' },
  { id: '77', name: 'ประจวบคีรีขันธ์' },
  { id: '80', name: 'นครศรีธรรมราช' },
  { id: '81', name: 'กระบี่' },
  { id: '82', name: 'พังงา' },
  { id: '83', name: 'ภูเก็ต' },
  { id: '84', name: 'สุราษฎร์ธานี' },
  { id: '85', name: 'ระนอง' },
  { id: '86', name: 'ชุมพร' },
  { id: '90', name: 'สงขลา' },
  { id: '91', name: 'สตูล' },
  { id: '92', name: 'ตรัง' },
  { id: '93', name: 'พัทลุง' },
  { id: '94', name: 'ปัตตานี' },
  { id: '95', name: 'ยะลา' },
  { id: '96', name: 'นราธิวาส' }
];

export const DISTRICTS: Record<string, District[]> = {
  '10': [
    { id: '1001', name: 'เขตพระนคร', zipCodes: ['10200'] },
    { id: '1002', name: 'เขตดุสิต', zipCodes: ['10300'] },
    { id: '1003', name: 'เขตหนองจอก', zipCodes: ['10240'] },
    { id: '1004', name: 'เขตบางรัก', zipCodes: ['10500'] },
    { id: '1005', name: 'เขตบางเขน', zipCodes: ['10220'] },
    { id: '1006', name: 'เขตบางกะปิ', zipCodes: ['10240'] },
    { id: '1007', name: 'เขตปทุมวัน', zipCodes: ['10330'] },
    { id: '1008', name: 'เขตป้อมปราบศัตรูพ่าย', zipCodes: ['10100'] },
    { id: '1009', name: 'เขตพระโขนง', zipCodes: ['10110'] },
    { id: '1010', name: 'เขตมีนบุรี', zipCodes: ['10510'] },
    { id: '1011', name: 'เขตลาดกระบัง', zipCodes: ['10520'] },
    { id: '1012', name: 'เขตยานนาวา', zipCodes: ['10120'] },
    { id: '1013', name: 'เขตสัมพันธวงศ์', zipCodes: ['10100'] },
    { id: '1014', name: 'เขตพญาไท', zipCodes: ['10400'] },
    { id: '1015', name: 'เขตธนบุรี', zipCodes: ['10600'] },
    { id: '1016', name: 'เขตบางกอกใหญ่', zipCodes: ['10600'] },
    { id: '1017', name: 'เขตห้วยขวาง', zipCodes: ['10310'] },
    { id: '1018', name: 'เขตคลองเตย', zipCodes: ['10110'] },
    { id: '1019', name: 'เขตสาทร', zipCodes: ['10120'] },
    { id: '1020', name: 'เขตบางนา', zipCodes: ['10260'] }
  ],
  '20': [
    { id: '2001', name: 'เมืองชลบุรี', zipCodes: ['20000'] },
    { id: '2002', name: 'บางละมุง', zipCodes: ['20150'] },
    { id: '2003', name: 'ศรีราชา', zipCodes: ['20110'] },
    { id: '2004', name: 'พานทอง', zipCodes: ['20160'] },
    { id: '2005', name: 'พนัสนิคม', zipCodes: ['20140'] },
    { id: '2006', name: 'บ่อทอง', zipCodes: ['20270'] },
    { id: '2007', name: 'บ้านบึง', zipCodes: ['20170'] },
    { id: '2008', name: 'หนองใหญ่', zipCodes: ['20190'] },
    { id: '2009', name: 'สัตหีบ', zipCodes: ['20180'] },
    { id: '2010', name: 'เกาะสีชัง', zipCodes: ['20120'] }
  ],
  '50': [
    { id: '5001', name: 'เมืองเชียงใหม่', zipCodes: ['50000'] },
    { id: '5002', name: 'ดอยสะเก็ด', zipCodes: ['50220'] },
    { id: '5003', name: 'แม่ริม', zipCodes: ['50180'] },
    { id: '5004', name: 'สันทราย', zipCodes: ['50210'] },
    { id: '5005', name: 'สันกำแพง', zipCodes: ['50130'] },
    { id: '5006', name: 'สันป่าตอง', zipCodes: ['50120'] },
    { id: '5007', name: 'หางดง', zipCodes: ['50230'] },
    { id: '5008', name: 'ฮอด', zipCodes: ['50240'] },
    { id: '5009', name: 'ดอยเต่า', zipCodes: ['50260'] },
    { id: '5010', name: 'อมก๋อย', zipCodes: ['50310'] }
  ]
};

export const SUBDISTRICTS: Record<string, Subdistrict[]> = {
  '1001': [
    { id: '100101', name: 'พระบรมมหาราชวัง' },
    { id: '100102', name: 'วัดราชบพิธ' },
    { id: '100103', name: 'สำราญราต' },
    { id: '100104', name: 'ศาลเจ้าพ่อเสือ' },
    { id: '100105', name: 'เสาชิงช้า' },
    { id: '100106', name: 'บวรนิเวศ' },
    { id: '100107', name: 'ตลาดยอด' },
    { id: '100108', name: 'ชนะสงคราม' },
    { id: '100109', name: 'บางยี่ขัน' },
    { id: '100110', name: 'วัดโบสถ์' }
  ],
  '1002': [
    { id: '100201', name: 'ดุสิต' },
    { id: '100202', name: 'วชิรพยาบาล' },
    { id: '100203', name: 'สวนจิตรลดา' },
    { id: '100204', name: 'สี่แยกมหานาค' },
    { id: '100205', name: 'ถนนนครไชยศรี' },
    { id: '100206', name: 'บางขุนพรหม' }
  ],
  '2001': [
    { id: '200101', name: 'เสม็ด' },
    { id: '200102', name: 'เชิงเนิน' },
    { id: '200103', name: 'มะขาม' },
    { id: '200104', name: 'บ้านสวน' },
    { id: '200105', name: 'นาป่า' },
    { id: '200106', name: 'บางปลาสร้อย' },
    { id: '200107', name: 'ห้วยกะปิ' },
    { id: '200108', name: 'เสม็ด' },
    { id: '200109', name: 'บ่อวิน' },
    { id: '200110', name: 'ดอนหัวฬ่อ' }
  ],
  '5001': [
    { id: '500101', name: 'ศรีภูมิ' },
    { id: '500102', name: 'พระสิงห์' },
    { id: '500103', name: 'หายยา' },
    { id: '500104', name: 'ช่างม่อย' },
    { id: '500105', name: 'วัดเกต' },
    { id: '500106', name: 'ช่างเผือก' },
    { id: '500107', name: 'สุเทพ' },
    { id: '500108', name: 'ป่าแดด' },
    { id: '500109', name: 'หนองหอย' },
    { id: '500110', name: 'ท่าศาลา' }
  ]
};

// ฟังก์ชันช่วยเหลือ
export function getProvinceById(id: string): Province | undefined {
  return PROVINCES.find(p => p.id === id);
}

export function getDistrictsByProvinceId(provinceId: string): District[] {
  return DISTRICTS[provinceId] || [];
}

export function getDistrictById(provinceId: string, districtId: string): District | undefined {
  const districts = getDistrictsByProvinceId(provinceId);
  return districts.find(d => d.id === districtId);
}

export function getSubdistrictsByDistrictId(districtId: string): Subdistrict[] {
  return SUBDISTRICTS[districtId] || [];
}

export function getSubdistrictById(districtId: string, subdistrictId: string): Subdistrict | undefined {
  const subdistricts = getSubdistrictsByDistrictId(districtId);
  return subdistricts.find(s => s.id === subdistrictId);
}

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
    subdistrict && `ตำบล${subdistrict.name}`,
    district && `อำเภอ${district.name}`,
    province && `จังหวัด${province.name}`,
    zipCode
  ].filter(Boolean);

  return parts.join(' ');
}