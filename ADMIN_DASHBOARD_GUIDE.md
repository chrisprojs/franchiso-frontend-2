# Panduan Admin Dashboard - Franchiso

## 🎯 Fitur Utama

Admin Dashboard memungkinkan admin untuk memverifikasi franchise yang diajukan oleh franchisor dengan dua cara:

### 1. **Daftar Franchise yang Perlu Diverifikasi**
- Menampilkan semua franchise dengan status "Menunggu Verifikasi"
- Setiap franchise ditampilkan dalam bentuk card dengan informasi dasar
- Dua tombol aksi untuk setiap franchise

### 2. **Tombol Aksi di Franchise Card**

#### 🔵 **Tombol Biru (👁️) - "Lihat Detail Verifikasi"**
- **Fungsi**: Membuka halaman detail verifikasi franchise
- **Aksi**: Navigasi ke `/admin/franchise/{id}/verify`
- **Kegunaan**: Review lengkap franchise sebelum memutuskan

#### 🔴 **Tombol Merah (✗) - "Tolak Verifikasi"**
- **Fungsi**: Langsung menolak verifikasi franchise
- **Aksi**: Konfirmasi → Reject → Auto-refresh list
- **Kegunaan**: Reject cepat untuk franchise yang jelas tidak memenuhi syarat

### 3. **Halaman Detail Verifikasi** (`/admin/franchise/{id}/verify`)

#### 📋 **Informasi yang Ditampilkan:**
- Detail lengkap franchise (brand, kategori, tahun berdiri)
- Metrik bisnis (modal investasi, pendapatan bulanan, ROI, jumlah cabang)
- Deskripsi franchise
- Informasi kontak (WhatsApp, website)
- Dokumen verifikasi (SPTW, NIB, NPWP)

#### ✅ **Tombol Verifikasi di Halaman Detail:**

**🟢 Tombol Hijau - "Terima Verifikasi"**
- Mengubah status menjadi "Terverifikasi"
- Konfirmasi sebelum aksi
- Navigasi otomatis ke admin dashboard

**🔴 Tombol Merah - "Tolak Verifikasi"**
- Mengubah status menjadi "Ditolak"
- Konfirmasi sebelum aksi
- Navigasi otomatis ke admin dashboard

## 🚀 Cara Penggunaan

### **Langkah 1: Login sebagai Admin**
1. Login dengan akun yang memiliki role "admin"
2. Admin dashboard akan muncul di dropdown menu navbar

### **Langkah 2: Akses Admin Dashboard**
1. Klik "Admin Dashboard" di navbar
2. Lihat daftar franchise yang perlu diverifikasi

### **Langkah 3: Verifikasi Franchise**

#### **Opsi A: Review Detail Dulu (Direkomendasikan)**
1. Klik tombol biru (👁️) "Lihat Detail Verifikasi"
2. Review semua informasi franchise dan dokumen
3. Klik "Terima Verifikasi" (hijau) atau "Tolak Verifikasi" (merah)
4. Konfirmasi aksi
5. Otomatis kembali ke admin dashboard

#### **Opsi B: Reject Cepat**
1. Klik tombol merah (✗) "Tolak Verifikasi"
2. Konfirmasi penolakan
3. Franchise langsung ditolak dan dihapus dari list

## 📊 Status Franchise

### **Status yang Ditampilkan:**
- **🟡 Menunggu Verifikasi**: Franchise baru yang perlu diverifikasi
- **🟢 Terverifikasi**: Franchise yang sudah diterima
- **🔴 Ditolak**: Franchise yang ditolak

## 🔧 API Endpoints

### **1. Get Unverified Franchises**
```
GET /admin/verify-franchise
Authorization: Bearer {access_token}
```

### **2. Verify Franchise**
```
PUT /admin/verify-franchise/{franchise_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "status": "Terverifikasi" | "Ditolak"
}
```

## 🎨 UI/UX Features

### **Responsive Design**
- Admin dashboard responsive untuk mobile dan desktop
- Tombol verifikasi stack vertically di mobile
- Card layout menyesuaikan screen size

### **User Experience**
- Loading states untuk semua aksi
- Error handling yang user-friendly
- Konfirmasi sebelum aksi penting
- Auto-refresh list setelah reject

### **Visual Indicators**
- **Tombol Biru**: Untuk melihat detail (tidak mengubah status)
- **Tombol Merah**: Untuk reject cepat
- **Tombol Hijau**: Untuk accept (hanya di halaman detail)
- **Status Badge**: Menampilkan status franchise

## ⚠️ Best Practices

### **Untuk Admin:**
1. **Selalu review detail** sebelum memutuskan accept/reject
2. **Periksa dokumen** (SPTW, NIB, NPWP) dengan teliti
3. **Gunakan reject cepat** hanya untuk franchise yang jelas tidak memenuhi syarat
4. **Perhatikan metrik bisnis** untuk evaluasi kelayakan

### **Workflow yang Direkomendasikan:**
1. Lihat daftar franchise unverified
2. Klik tombol biru untuk review detail
3. Periksa semua informasi dan dokumen
4. Buat keputusan berdasarkan kriteria yang jelas
5. Klik accept atau reject dengan konfirmasi

## 🔒 Keamanan

### **Role-based Access**
- Hanya user dengan role "admin" yang dapat mengakses
- API endpoints memerlukan authorization token
- Validasi server-side untuk semua aksi

### **Audit Trail**
- Semua aksi verifikasi tercatat di database
- Timestamp dan admin yang melakukan aksi tersimpan
- History perubahan status dapat dilacak

## 📱 Mobile Experience

### **Touch-friendly Design**
- Tombol yang cukup besar untuk touch interaction
- Swipe gestures untuk navigasi
- Optimized layout untuk layar kecil

### **Mobile-specific Features**
- Tombol stack vertically di mobile
- Simplified navigation
- Touch-friendly confirmation dialogs
