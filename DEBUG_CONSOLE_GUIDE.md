# 🛠️ Debug Console Guide

## 📋 เครื่องมือตรวจสอบ Error ใน Browser

ระบบได้เพิ่มเครื่องมือตรวจสอบ error และ console logs ที่ครอบคลุมเพื่อช่วยในการ debug

### 🎯 ฟีเจอร์หลัก

#### 1. **Browser Error Monitoring**
- ✅ JavaScript errors
- ✅ Network errors  
- ✅ Resource loading errors
- ✅ Unhandled promise rejections
- ✅ Real-time error tracking

#### 2. **Console Log Monitoring**
- ✅ Capture all console.log, warn, error, info, debug
- ✅ Timestamp tracking
- ✅ Stack trace for errors
- ✅ Export functionality

#### 3. **Visual Debug Console**
- ✅ Floating debug panel (development only)
- ✅ Error categorization with badges
- ✅ Real-time updates
- ✅ Detailed error inspection

#### 4. **System Diagnostics**
- ✅ Environment checks
- ✅ Database connectivity
- ✅ Authentication status
- ✅ Network connectivity
- ✅ Browser compatibility
- ✅ Performance metrics

## 🚀 การใช้งาน

### Visual Debug Console

ใน development mode จะมีปุ่ม "Debug" ที่มุมล่างขวา:

```
🔍 Debug Console
- คลิกเพื่อเปิด/ปิด debug panel
- แสดงจำนวน errors ปัจจุบัน
- แบ่งเป็น 2 tabs: Errors และ Console
```

**Errors Tab:**
- แสดง errors แยกตามประเภท
- คลิกที่ error เพื่อดูรายละเอียด
- ปุ่ม Clear และ Export

**Console Tab:**
- แสดง console logs ทั้งหมด
- แยกสีตาม log level
- ปุ่ม Clear และ Export

### Console Commands

เปิด Browser DevTools (F12) และใช้คำสั่งเหล่านี้:

#### 📊 ดูข้อมูลสรุป
```javascript
window.__DEBUG_ERRORS__.help()
```

#### 🚨 ดู Errors
```javascript
// ดู errors ทั้งหมด
window.__DEBUG_ERRORS__.showErrors()

// ดูสรุป errors
window.__DEBUG_ERRORS__.getErrorSummary()
```

#### 📝 ดู Console Logs
```javascript
// ดู logs ทั้งหมด
window.__DEBUG_ERRORS__.showLogs()

// ดู logs เฉพาะ level
window.__DEBUG_ERRORS__.showLogs('error')
window.__DEBUG_ERRORS__.showLogs('warn')
```

#### 🔍 รัน Diagnostics
```javascript
// รันการตรวจสอบระบบทั้งหมด
await window.__DEBUG_ERRORS__.runDiagnostics()
```

#### 🗄️ ทดสอบ Database
```javascript
// ทดสอบการเชื่อมต่อ database
await window.__DEBUG_ERRORS__.testDatabase()

// ทดสอบ authentication
await window.__DEBUG_ERRORS__.testAuth()
```

#### 🧹 จัดการข้อมูล
```javascript
// ลบ errors และ logs ทั้งหมด
window.__DEBUG_ERRORS__.clearAll()

// Export ข้อมูล debug
window.__DEBUG_ERRORS__.exportAll()
```

## 🔍 การตรวจสอบ Common Errors

### 1. **Database Connection Errors**

**อาการ:**
```
❌ Connection failed: relation "public.table_name" does not exist
❌ Network error: Failed to fetch
```

**วิธีตรวจสอบ:**
```javascript
await window.__DEBUG_ERRORS__.testDatabase()
await window.__DEBUG_ERRORS__.runDiagnostics()
```

**การแก้ไข:**
- ตรวจสอบ VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY
- ตรวจสอบการเชื่อมต่อ internet
- ตรวจสอบว่า Supabase service ทำงานปกติ

### 2. **Authentication Errors**

**อาการ:**
```
❌ JWT expired
❌ Unauthorized access
❌ RLS policy violation
```

**วิธีตรวจสอบ:**
```javascript
await window.__DEBUG_ERRORS__.testAuth()
```

**การแก้ไข:**
- Refresh หน้าเว็บ
- ตรวจสอบ RLS policies
- ตรวจสอบ user permissions

### 3. **Network Errors**

**อาการ:**
```
❌ Failed to fetch
❌ CORS error
❌ Timeout error
```

**วิธีตรวจสอบ:**
```javascript
// ตรวจสอบ network status
navigator.onLine

// รัน network diagnostics
await window.__DEBUG_ERRORS__.runDiagnostics()
```

### 4. **JavaScript Errors**

**อาการ:**
```
❌ TypeError: Cannot read property 'x' of undefined
❌ ReferenceError: variable is not defined
```

**วิธีตรวจสอบ:**
```javascript
// ดู JavaScript errors
window.__DEBUG_ERRORS__.showErrors()

// ดู error details
window.__DEBUG_ERRORS__.getErrors().filter(e => e.type === 'javascript')
```

## 📊 Diagnostic Categories

### Environment
- ✅ Environment variables
- ✅ Development/Production mode
- ✅ Build configuration

### Database  
- ✅ Connection status
- ✅ Response time
- ✅ Table accessibility
- ✅ RLS policies

### Authentication
- ✅ Session status
- ✅ User information
- ✅ Token validity

### Network
- ✅ Online status
- ✅ API accessibility
- ✅ CORS configuration

### Browser Compatibility
- ✅ Required APIs
- ✅ Feature support
- ✅ User agent info

### Performance
- ✅ Memory usage
- ✅ Connection speed
- ✅ Service worker support

## 🎯 Best Practices

### 1. **Regular Monitoring**
```javascript
// ตั้ง interval เพื่อตรวจสอบ errors
setInterval(() => {
  const summary = window.__DEBUG_ERRORS__.getErrorSummary();
  if (summary.total > 0) {
    console.warn(`Found ${summary.total} errors`);
  }
}, 30000); // ทุก 30 วินาที
```

### 2. **Error Reporting**
```javascript
// Export errors เมื่อเจอปัญหา
const debugData = window.__DEBUG_ERRORS__.exportAll();
// ส่งข้อมูลนี้ให้ developer
```

### 3. **Performance Monitoring**
```javascript
// ตรวจสอบ performance เป็นระยะ
await window.__DEBUG_ERRORS__.runDiagnostics();
```

## 🚨 Emergency Commands

เมื่อเจอปัญหาร้ายแรง:

```javascript
// 1. Export ข้อมูล debug ทั้งหมด
window.__DEBUG_ERRORS__.exportAll();

// 2. รัน diagnostics เต็มรูปแบบ
await window.__DEBUG_ERRORS__.runDiagnostics();

// 3. ทดสอบ core systems
await window.__DEBUG_ERRORS__.testDatabase();
await window.__DEBUG_ERRORS__.testAuth();

// 4. ดู recent errors
window.__DEBUG_ERRORS__.showErrors();
```

## 📱 Mobile Debugging

สำหรับ mobile devices:
1. เปิด remote debugging
2. ใช้ console commands ผ่าน desktop browser
3. Export debug data เพื่อวิเคราะห์

## 🔧 Configuration

Debug console จะทำงานเฉพาะใน development mode:
```typescript
// ใน App.tsx
{import.meta.env.DEV && (
  <ErrorConsole 
    isVisible={showErrorConsole}
    onToggle={() => setShowErrorConsole(!showErrorConsole)}
  />
)}
```

## 📈 Monitoring Dashboard

Visual debug console แสดง:
- 📊 Error count by type
- ⏱️ Real-time updates  
- 🔍 Detailed error inspection
- 📁 Export functionality
- 🧹 Clear options

---

**หมายเหตุ:** เครื่องมือเหล่านี้จะทำงานเฉพาะใน development mode เท่านั้น เพื่อความปลอดภัยและประสิทธิภาพในการใช้งานจริง