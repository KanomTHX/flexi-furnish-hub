# 🔧 คำแนะนำการแก้ไข Environment Variables Error

## ❌ ปัญหาที่พบ

```
Error caught by boundary: TypeError: Failed to construct 'URL': Invalid URL
```

**สาเหตุ**: ไม่มีการตั้งค่า Environment Variables ในไฟล์ `.env.local`

## ✅ วิธีแก้ไข

### 1. สร้างไฟล์ .env.local

สร้างไฟล์ `.env.local` ในโฟลเดอร์หลักของโปรเจกต์ (ระดับเดียวกับ `package.json`)

### 2. คัดลอกเนื้อหาจาก .env.example

```env
# Supabase Configuration
# คัดลอกไฟล์นี้เป็น .env.local และใส่ค่าจริงจาก Supabase Dashboard

# Supabase URL - หาได้จาก Settings > API
VITE_SUPABASE_URL=https://hartshwcchbsnmbrjdyn.supabase.co

# Supabase Anon Key - หาได้จาก Settings > API  
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMzc1NzQsImV4cCI6MjA2OTYxMzU3NH0.A1hn4-J2z9h4iuBXQ7xhh2F5UWXHmTPP92tncJfsF24

# Service Role Key - หาได้จาก Settings > API (สำหรับ admin operations)
# ⚠️ ระวัง: Key นี้มีสิทธิ์เต็ม ใช้เฉพาะในการพัฒนาเท่านั้น
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcnRzaHdjY2hic25tYnJqZHluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzNzU3NCwiZXhwIjoyMDY5NjEzNTc0fQ.EuWZV7-3o9GsDPGKAS4L4L3t7GKQkn7kfnoHpc9IzOw

# เลือกใช้ Key แบบไหน (false = anon key, true = service role key)
VITE_USE_SERVICE_ROLE=true
```

### 3. รีสตาร์ทเซิร์ฟเวอร์

```bash
# หยุดเซิร์ฟเวอร์ (Ctrl+C)
npm run dev
```

### 4. ตรวจสอบผลลัพธ์

- ไปที่ `http://localhost:8081/database`
- ควรเห็นหน้าจัดการฐานข้อมูลแทน error

## 🔍 การตรวจสอบ

### ตรวจสอบไฟล์ .env.local

```bash
# ตรวจสอบว่าไฟล์มีอยู่
ls -la .env.local

# ดูเนื้อหาในไฟล์
cat .env.local
```

### ตรวจสอบใน Browser Console

```javascript
// เปิด Developer Tools (F12) และรันใน Console
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing')
console.log('VITE_USE_SERVICE_ROLE:', import.meta.env.VITE_USE_SERVICE_ROLE)
```

## 📁 โครงสร้างไฟล์

```
project-root/
├── package.json
├── .env.example          ← ไฟล์ตัวอย่าง
├── .env.local           ← ไฟล์ที่ต้องสร้าง (ไม่ commit)
├── src/
└── ...
```

## ⚠️ ข้อควรระวัง

### 1. ชื่อไฟล์
- ✅ `.env.local` (ถูกต้อง)
- ❌ `.env` (ผิด)
- ❌ `env.local` (ผิด)

### 2. ตำแหน่งไฟล์
- ✅ ในโฟลเดอร์หลัก (ระดับเดียวกับ package.json)
- ❌ ในโฟลเดอร์ src/

### 3. การ Commit
- ✅ `.env.example` - commit ได้
- ❌ `.env.local` - ห้าม commit (มี sensitive data)

### 4. Prefix
- ✅ `VITE_` - สำหรับ Vite
- ❌ `NEXT_PUBLIC_` - สำหรับ Next.js

## 🎯 ผลลัพธ์ที่คาดหวัง

หลังจากแก้ไขแล้ว:

1. **ไม่มี Error** - หน้าเว็บโหลดได้ปกติ
2. **เข้าหน้า Database ได้** - ไม่มี URL error
3. **แสดง Environment Check** - สถานะเป็นสีเขียว
4. **ใช้ Admin Mode ได้** - ถ้าตั้งค่า Service Role Key

## 🔧 การแก้ไขปัญหาเพิ่มเติม

### ปัญหา: ยังมี Error หลังสร้างไฟล์

1. **ตรวจสอบ syntax** - ไม่มีช่องว่างหรือตัวอักษรพิเศษ
2. **ตรวจสอบ encoding** - ใช้ UTF-8
3. **รีสตาร์ทเซิร์ฟเวอร์** - หยุดและเริ่มใหม่
4. **ล้าง cache** - `npm run dev -- --force`

### ปัญหา: Keys ไม่ถูกต้อง

1. **ไปที่ Supabase Dashboard**
2. **Settings → API**
3. **คัดลอก URL และ Keys ใหม่**
4. **แทนที่ในไฟล์ .env.local**

---

**🎉 หลังจากแก้ไขแล้ว คุณจะสามารถเข้าหน้า Database และใช้ Admin Mode ได้!**