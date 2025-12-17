# Setup Google Maps API untuk Fitur Peta Franchise

## Overview
Fitur peta franchise memungkinkan pengguna untuk melihat lokasi-lokasi franchise berdasarkan nama brand. Saat ini menggunakan placeholder, tetapi dapat diintegrasikan dengan Google Maps API untuk peta interaktif yang lengkap.

## Fitur yang Tersedia

### 1. Daftar Lokasi Franchise
- Menampilkan daftar lokasi franchise berdasarkan nama brand
- Informasi alamat lengkap untuk setiap lokasi
- Tombol petunjuk arah langsung ke Google Maps

### 2. Peta Interaktif (Placeholder)
- Saat ini menampilkan placeholder dengan koordinat
- Dapat diintegrasikan dengan Google Maps API
- Menampilkan informasi lokasi yang dipilih

### 3. Navigasi
- Link langsung ke Google Maps untuk petunjuk arah
- Link untuk melihat lokasi di Google Maps

## Setup Google Maps API

### 1. Dapatkan API Key
1. Kunjungi [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang ada
3. Aktifkan Google Maps JavaScript API
4. Buat API key di bagian Credentials

### 2. Konfigurasi Environment Variables
Tambahkan API key ke file `.env`:
```
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 3. Implementasi Peta Interaktif
Untuk mengaktifkan peta interaktif, ganti placeholder di `src/component/FranchiseMap.js`:

```javascript
// Ganti map-placeholder dengan iframe Google Maps
<div className="map-iframe-container">
  <iframe
    title={`Peta lokasi ${selectedLocation.name}`}
    width="100%"
    height="400"
    frameBorder="0"
    style={{ border: 0 }}
    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(`${selectedLocation.name}, ${selectedLocation.address}`)}&zoom=15`}
    allowFullScreen
  />
</div>
```

### 4. CSS untuk Iframe
Tambahkan CSS untuk iframe di `src/component/FranchiseMap.css`:
```css
.map-iframe-container {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map-iframe-container iframe {
  border-radius: 8px;
}
```

## API Endpoint untuk Lokasi Franchise

### Endpoint: `GET /franchise/locations`
Mengambil lokasi franchise berdasarkan nama brand.

**Query Parameters:**
- `brand` (string): Nama brand franchise

**Response:**
```json
{
  "locations": [
    {
      "id": "1",
      "name": "Brand Name - Jakarta Pusat",
      "address": "Jl. Sudirman No. 123, Jakarta Pusat",
      "lat": -6.2088,
      "lng": 106.8456,
      "type": "Franchise"
    }
  ]
}
```

## Integrasi dengan Backend

Untuk mengintegrasikan dengan backend, update fungsi `getFranchiseLocations` di `src/component/FranchiseMap.js`:

```javascript
import { getFranchiseLocations } from '../api/FranchiseAPI';

const searchFranchiseLocations = async (brandName) => {
  setLoading(true);
  try {
    const response = await getFranchiseLocations(brandName);
    setLocations(response.locations || []);
    if (response.locations && response.locations.length > 0) {
      setSelectedLocation(response.locations[0]);
    }
  } catch (error) {
    console.error('Error fetching franchise locations:', error);
    // Fallback handling
  } finally {
    setLoading(false);
  }
};
```

## Struktur Data Lokasi

Setiap lokasi franchise harus memiliki struktur data berikut:

```typescript
interface FranchiseLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: string;
}
```

## Fitur Tambahan yang Dapat Dikembangkan

1. **Clustering Markers**: Mengelompokkan marker yang berdekatan
2. **Search by Location**: Pencarian franchise berdasarkan lokasi
3. **Distance Calculation**: Menghitung jarak dari lokasi pengguna
4. **Route Planning**: Perencanaan rute ke multiple lokasi
5. **Real-time Location**: Update lokasi real-time

## Troubleshooting

### API Key Issues
- Pastikan API key valid dan memiliki izin untuk Maps JavaScript API
- Periksa billing account di Google Cloud Console
- Pastikan domain aplikasi diizinkan dalam API key restrictions

### CORS Issues
- Pastikan backend mengizinkan request dari domain frontend
- Gunakan proxy development di React jika diperlukan

### Performance Issues
- Implementasikan lazy loading untuk peta
- Gunakan caching untuk data lokasi
- Optimalkan ukuran gambar dan assets

## Dependencies yang Diperlukan

Saat ini tidak memerlukan dependencies tambahan karena menggunakan iframe Google Maps. Jika ingin menggunakan React Google Maps library:

```bash
npm install @googlemaps/js-api-loader react-google-maps-api
```

**Note**: Perhatikan kompatibilitas versi React dengan library yang dipilih. 