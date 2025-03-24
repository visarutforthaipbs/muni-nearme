# เทศบาลใกล้ฉัน (Municipality Near Me)

เว็บแอปพลิเคชันแสดงข้อมูลเทศบาลบริเวณใกล้เคียงกับตำแหน่งของผู้ใช้ พร้อมแสดงข้อมูลงบประมาณปี 2566

## คุณสมบัติ

- แสดงแผนที่เทศบาลทั่วประเทศไทย
- ระบุตำแหน่งผู้ใช้และค้นหาเทศบาลใกล้เคียง
- แสดงข้อมูลงบประมาณและรายละเอียดของเทศบาล
- รองรับการแสดงผลบนอุปกรณ์มือถือ
- รองรับการจัดสรรงบประมาณในฐานะนายกเทศมนตรี
- บันทึกการจัดสรรงบประมาณและไอเดียการเพิ่มรายได้ลงฐานข้อมูล MongoDB

## โครงสร้างโปรเจค

```
municipality-near-me/
├── backend/               # เซิร์ฟเวอร์ Express.js
│   ├── package.json       # ไฟล์กำหนดการติดตั้งสำหรับเซิร์ฟเวอร์
│   ├── server.js          # โค้ดหลักของเซิร์ฟเวอร์
│   └── .env               # ตัวแปรสภาพแวดล้อมสำหรับเซิร์ฟเวอร์
├── frontend/              # แอปพลิเคชัน React
│   ├── public/            # ไฟล์สาธารณะของ React
│   ├── src/               # โค้ดหลักของแอปพลิเคชัน React
│   ├── package.json       # ไฟล์กำหนดการติดตั้งสำหรับไคลเอนต์
│   ├── tsconfig.json      # การตั้งค่า TypeScript
│   └── .env               # ตัวแปรสภาพแวดล้อมสำหรับไคลเอนต์
├── package.json           # ไฟล์กำหนดการติดตั้งหลักสำหรับ monorepo
└── README.md              # เอกสารโปรเจค
```

## การติดตั้งสำหรับการพัฒนา

1. ติดตั้ง dependencies:

```bash
# ติดตั้ง dependencies ทั้งหมด (frontend และ backend)
npm run install:all
```

2. **สำคัญ: ประมวลผลไฟล์ GeoJSON** (จำเป็นต้องทำก่อนการใช้งาน):

```bash
npm run convert-data
```

**หมายเหตุ:** การประมวลผลไฟล์ GeoJSON อาจใช้เวลานานและหน่วยความจำมาก เนื่องจากไฟล์มีขนาดใหญ่ (\~128MB) หากพบปัญหา "JavaScript heap out of memory" ให้ใช้คำสั่งนี้แทน:

```bash
cd frontend && node --max-old-space-size=4096 src/utils/convertGeoJson.js
```

3. ตั้งค่าไฟล์ `.env` ในไดเรกทอรี `frontend` และ `backend`:

   **backend/.env**

   ```
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/municipality-budget
   NODE_ENV=development
   ```

   **frontend/.env**

   ```
   REACT_APP_API_URL=http://localhost:3001/api
   ```

4. รันแอปพลิเคชันในโหมด development:

```bash
npm run dev
```

เว็บแอปพลิเคชันจะเปิดที่ <http://localhost:3000> ในเบราว์เซอร์ของคุณ

## การติดตั้ง MongoDB

1. **ติดตั้งและรัน MongoDB ในเครื่องคุณ** (สำหรับการพัฒนา)

```bash
# สำหรับ macOS ด้วย Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# สำหรับ Windows/Linux โปรดดูคำแนะนำที่ https://docs.mongodb.com/manual/installation/
```

2. **หรือใช้ MongoDB Atlas** (สำหรับการพัฒนาและโปรดักชัน)
   - สร้างบัญชีที่ [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
   - สร้าง cluster ใหม่ (ใช้ tier ฟรี)
   - สร้าง Database User และตั้งค่า Network Access
   - ได้รับ connection string และอัปเดตใน `.env` ไฟล์

## การ Deploy บน Render.com

1. **สร้างบัญชี Render** ที่ [render.com](https://render.com)

2. **สร้าง Web Service ใหม่**:

   - เชื่อมต่อกับ GitHub repository ของคุณ
   - กำหนดชื่อบริการ (เช่น "municipality-budget")
   - ตั้งค่า Root Directory: `backend`
   - ตั้งค่า Build Command: `npm run render-postbuild`
   - ตั้งค่า Start Command: `npm start`
   - เลือก Free tier
   - คลิก "Create Web Service"

3. **เพิ่มตัวแปรสภาพแวดล้อม**:
   - `MONGODB_URI`: connection string ของคุณจาก MongoDB Atlas
   - `NODE_ENV`: "production"
   - `PORT`: "10000" (Render ใช้พอร์ตนี้ภายใน)

## การแก้ไขปัญหา

- **ไม่พบข้อมูลแผนที่:** ตรวจสอบว่าได้รันคำสั่ง `npm run convert-data` เรียบร้อยแล้ว
- **ไฟล์ GeoJSON มีขนาดใหญ่เกินไป:** แก้ไขค่า `simplifyGeometry` ในไฟล์ `src/utils/convertGeoJson.js` เพื่อลดขนาดไฟล์
- **ไม่สามารถเชื่อมต่อกับ MongoDB:** ตรวจสอบว่า MongoDB กำลังทำงานและ connection string ถูกต้อง
- **การส่งข้อมูลล้มเหลว:** ตรวจสอบว่าเซิร์ฟเวอร์ backend กำลังทำงานและสามารถเข้าถึงได้

## เทคโนโลยีที่ใช้

- **Frontend**: React + TypeScript
- **Maps**: Leaflet (แผนที่แบบโอเพนซอร์ส)
- **Backend**: Express.js
- **Database**: MongoDB
- **Hosting**: Render.com

## ข้อมูลเพิ่มเติม

แอปพลิเคชันนี้ใช้ข้อมูล GeoJSON ของเทศบาลทั่วประเทศไทย พร้อมข้อมูลงบประมาณประจำปี 2566 เพื่อแสดงให้ประชาชนสามารถเข้าถึงข้อมูลเทศบาลใกล้เคียงได้อย่างสะดวก
