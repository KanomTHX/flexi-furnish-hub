// ===================================================================
// ทดสอบการสร้าง UUID
// ===================================================================

/**
 * สร้าง UUID ที่ใช้ได้ในทุกเบราว์เซอร์
 */
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback สำหรับเบราว์เซอร์ที่ไม่รองรับ crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ทดสอบการสร้าง UUID
console.log('🧪 ทดสอบการสร้าง UUID...\n');

console.log('🔍 ตรวจสอบ crypto.randomUUID support:');
console.log('typeof crypto:', typeof crypto);
console.log('crypto.randomUUID available:', typeof crypto !== 'undefined' && !!crypto.randomUUID);

console.log('\n📝 สร้าง UUID ทดสอบ:');
for (let i = 1; i <= 5; i++) {
  const uuid = generateUUID();
  console.log(`${i}. ${uuid}`);
  
  // ตรวจสอบรูปแบบ UUID
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isValid = uuidPattern.test(uuid);
  console.log(`   ✅ Valid UUID format: ${isValid}`);
}

console.log('\n🎉 การทดสอบเสร็จสิ้น!');

// Export สำหรับใช้ในไฟล์อื่น
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateUUID };
}