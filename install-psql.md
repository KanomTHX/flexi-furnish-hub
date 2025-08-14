# การติดตั้ง psql บน Windows

## วิธีที่ 1: ติดตั้งผ่าน PostgreSQL
1. ดาวน์โหลด PostgreSQL จาก: https://www.postgresql.org/download/windows/
2. ติดตั้งตามขั้นตอน (เลือก psql command line tools)
3. เพิ่ม PostgreSQL bin folder ใน PATH

## วิธีที่ 2: ใช้ Chocolatey
```cmd
choco install postgresql
```

## วิธีที่ 3: ใช้ Scoop
```cmd
scoop install postgresql
```

## ตรวจสอบการติดตั้ง
```cmd
psql --version
```