# Instruksi Setup Aplikasi Franchiso Frontend

## Masalah CORS yang Telah Diperbaiki

Error CORS yang sebelumnya terjadi:
```
Access to fetch at 'https://maps.googleapis.com/maps/api/place/textsearch/json?...' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Status**: ✅ **TELAH DIPERBAIKI** dengan menggunakan API backend sebagai proxy.

## Setup Environment Variables

### 1. Buat file `.env` di root project
```bash
# Salin dari env.example
cp env.example .env
```

### 2. Edit file `.env` dengan konfigurasi yang sesuai
```env
# Backend API URL (sesuaikan dengan backend Anda)
REACT_APP_API_URL=http://localhost:8080

# Google Maps API Key (untuk embed maps)
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyAWq_eUp0eA22Mzc-gioyirAvVOnN45ibg

# Environment
NODE_ENV=development
```

## Setup Backend (Go)

### 1. Pastikan backend berjalan di port 8080
```bash
# Di direktori backend Go
go run main.go
```

### 2. Implementasikan endpoint untuk lokasi franchise
Backend harus memiliki endpoint:
```
GET /franchise/locations?brand={brandName}
```

**Contoh implementasi Go (Gin):**
```go
func (h *Handler) GetFranchiseLocations(c *gin.Context) {
    brandName := c.Query("brand")
    apiKey := os.Getenv("GOOGLE_MAPS_API_KEY")
    
    // Panggil Google Maps API dari backend
    url := fmt.Sprintf("https://maps.googleapis.com/maps/api/place/textsearch/json?query=%s&key=%s&language=id&region=id", 
        url.QueryEscape(brandName), apiKey)
    
    resp, err := http.Get(url)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    defer resp.Body.Close()
    
    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    
    c.JSON(http.StatusOK, result)
}
```

## Setup Frontend (React)

### 1. Install dependencies
```bash
npm install
```

### 2. Jalankan aplikasi
```bash
npm start
```

Aplikasi akan berjalan di `http://localhost:3000`

## Testing

### 1. Test tanpa backend
- Buka `http://localhost:3000`
- Navigasi ke halaman franchise detail
- Sistem akan menggunakan data sample
- Tidak ada error CORS

### 2. Test dengan backend
- Pastikan backend berjalan di port 8080
- Pastikan endpoint `/franchise/locations` berfungsi
- Refresh halaman franchise detail
- Periksa console untuk response dari backend
- Lokasi franchise akan diambil dari Google Maps API via backend

## Struktur Response yang Diharapkan

Backend harus mengembalikan response dalam format:
```json
{
  "locations": [
    {
      "id": "1",
      "name": "Brand Name - Jakarta Pusat",
      "address": "Jl. Sudirman No. 123, Jakarta Pusat",
      "lat": -6.2088,
      "lng": 106.8456,
      "type": "Franchise",
      "rating": 4.5
    }
  ]
}
```

## Troubleshooting

### Error "Failed to fetch"
- Pastikan backend berjalan di port 8080
- Periksa endpoint `/franchise/locations`
- Periksa format response backend

### Masih ada error CORS
- Pastikan tidak ada kode yang memanggil Google Maps API langsung dari frontend
- Periksa file `FranchiseMap.js` sudah menggunakan `getFranchiseLocations`

### Google Maps tidak muncul
- Pastikan `REACT_APP_GOOGLE_MAPS_API_KEY` sudah diset
- Periksa API key valid di Google Cloud Console
- Pastikan Maps Embed API sudah diaktifkan

## Keuntungan Solusi Ini

1. **Tidak ada Error CORS** - Frontend tidak memanggil Google Maps API langsung
2. **Keamanan** - API key tersimpan di backend
3. **Fleksibilitas** - Backend dapat menambahkan caching dan logika bisnis
4. **Fallback** - Tetap berfungsi meskipun backend tidak tersedia
5. **Maintainability** - Mudah untuk mengubah logika pencarian

## File yang Telah Dimodifikasi

- `src/component/FranchiseMap.js` - Menggunakan API backend alih-alih Google Maps API langsung
- `src/api/FranchiseAPI.js` - Sudah memiliki fungsi `getFranchiseLocations`
- `CORS_SOLUTION_IMPLEMENTED.md` - Dokumentasi solusi CORS
- `env.example` - Template environment variables

## Next Steps

1. **Implementasikan backend endpoint** `/franchise/locations`
2. **Test integrasi** frontend-backend
3. **Hapus data sample** jika backend sudah berfungsi
4. **Deploy ke production** dengan konfigurasi yang sesuai 