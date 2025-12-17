import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getFranchiseLocations } from '../api/FranchiseAPI';
import './FranchiseMap.css';
import { PROVINCE_LIST } from '../data/ListFranchiseMap.jsx';

const DEFAULT_CENTER = { lat: -6.2088, lng: 106.8456 };

const provinceCenters = PROVINCE_LIST.reduce((acc, province) => {
  acc[province.name] = { lat: province.lat, lng: province.lng };
  return acc;
}, {});

// Geocoding ringan jika kota tidak ada di PROVINCE_LIST: gunakan Places TextSearch via Maps JS
async function geocodeprovinceCenter(provinceName) {
  if (!provinceName) return null;
  if (provinceCenters[provinceName]) return provinceCenters[provinceName];
  if (typeof window === 'undefined' || !window.google || !window.google.maps) return null;
  return new Promise((resolve) => {
    try {
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      service.textSearch({ query: `${provinceName}, Indonesia` }, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
          const loc = results[0].geometry?.location;
          if (loc) {
            const center = { lat: loc.lat(), lng: loc.lng() };
            provinceCenters[provinceName] = center;
            resolve(center);
            return;
          }
        }
        resolve(null);
      });
    } catch (e) {
      resolve(null);
    }
  });
}

const FranchiseMap = ({ franchiseName, franchiseProvince }) => {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [error, setError] = useState(null);

  // --- Google Maps: refs ---
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const markerByIdRef = useRef(new Map());

  const isFirstLoadRef = useRef(true);

  const searchFranchiseLocations = useCallback(async (brandName, province) => {
    // Mulai pencarian baru: tampilkan loading dan bersihkan marker lama saja (pertahankan instance map)
    setLoading(true);
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    markerByIdRef.current.clear();
    setError(null);
    try {
      // Gunakan API backend yang sudah ada
      const response = await getFranchiseLocations(brandName, province);
      
      if (response.locations && response.locations.length > 0) {
        setLocations(response.locations);
        setSelectedLocation(response.locations[0]);
      } else {
        // Fallback ke data sample jika tidak ada hasil dari backend
        const fallbackLocations = getSampleLocations(brandName, province);
        setLocations(fallbackLocations);
        setSelectedLocation(fallbackLocations[0]);
      }
    } catch (error) {
      console.error('Error searching franchise locations:', error);
      setError(error.message);
      // Fallback ke data sample jika API gagal
      const fallbackLocations = getSampleLocations(brandName, province);
      setLocations(fallbackLocations);
      setSelectedLocation(fallbackLocations[0]);
    } finally {
      setLoading(false);
      isFirstLoadRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (franchiseName) {
      searchFranchiseLocations(franchiseName, franchiseProvince);
    }
  }, [franchiseName, franchiseProvince, searchFranchiseLocations]);

  // --- Google Maps: dynamic loader ---

  const loadGoogleMapsScript = () => {
    if (typeof window === 'undefined') return Promise.resolve();
    if (window.google && window.google.maps) return Promise.resolve();

    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-google-maps-loader]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Gagal memuat Google Maps JS')));
        return;
      }
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-google-maps-loader', 'true');
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Gagal memuat Google Maps JS'));
      document.body.appendChild(script);
    });
  };

  // Inisialisasi peta dan marker saat locations berubah
  useEffect(() => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return; // gunakan placeholder bila tidak ada API key
    if (!locations || locations.length === 0) return;

    let isCancelled = false;

    loadGoogleMapsScript()
      .then(() => {
        if (isCancelled) return;
        const google = window.google;
        if (!google || !mapRef.current) return;

        // Buat map jika belum ada
        if (!mapInstanceRef.current) {
          const setupMap = (center) => {
            const initialCenter = {
              lat: locations[0]?.lat ?? center.lat,
              lng: locations[0]?.lng ?? center.lng
            };
            mapInstanceRef.current = new google.maps.Map(mapRef.current, {
              center: initialCenter,
              zoom: 12,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: true
            });
            infoWindowRef.current = new google.maps.InfoWindow();
          };

          const preferredCenter = (franchiseProvince && provinceCenters[franchiseProvince]) ? provinceCenters[franchiseProvince] : null;
          if (preferredCenter) {
            setupMap(preferredCenter);
          } else if (franchiseProvince) {
            geocodeprovinceCenter(franchiseProvince).then((center) => {
              setupMap(center || DEFAULT_CENTER);
            });
          } else {
            setupMap(DEFAULT_CENTER);
          }
        }

        // Hapus marker lama
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];
        markerByIdRef.current.clear();

        const bounds = new google.maps.LatLngBounds();

        locations.forEach((loc) => {
          const position = { lat: loc.lat, lng: loc.lng };
          const marker = new google.maps.Marker({
            position,
            map: mapInstanceRef.current,
            title: loc.name
          });
          marker.addListener('click', () => {
            setSelectedLocation(loc);
            if (infoWindowRef.current) {
              const content = `
                <div style="max-width:240px">
                  <div style="font-weight:600;margin-bottom:4px">${loc.name}</div>
                  <div style="font-size:12px;color:#555">${loc.address || ''}</div>
                </div>
              `;
              infoWindowRef.current.setContent(content);
              infoWindowRef.current.open({ anchor: marker, map: mapInstanceRef.current });
            }
          });
          markersRef.current.push(marker);
          markerByIdRef.current.set(loc.id, marker);
          bounds.extend(position);
        });

        // Fit bounds ke semua marker
        if (locations.length === 1) {
          mapInstanceRef.current.setCenter(bounds.getCenter());
          mapInstanceRef.current.setZoom(15);
        } else {
          mapInstanceRef.current.fitBounds(bounds);
        }
      })
      .catch((e) => {
        console.error(e);
      });

    return () => {
      isCancelled = true;
    };
  }, [locations, franchiseProvince]);

  // Update center when province changes (keep map visible)
  useEffect(() => {
    const google = window.google;
    if (!google) return;
    if (!mapInstanceRef.current) return;
    const center = (franchiseProvince && provinceCenters[franchiseProvince]) ? provinceCenters[franchiseProvince] : null;
    if (center) {
      mapInstanceRef.current.setCenter(center);
      mapInstanceRef.current.setZoom(12);
    }
  }, [franchiseProvince]);

  // Fokus pada marker ketika selectedLocation berubah
  useEffect(() => {
    const google = window.google;
    if (!google) return;
    if (!mapInstanceRef.current || !selectedLocation) return;
    const marker = markerByIdRef.current.get(selectedLocation.id);
    if (marker) {
      mapInstanceRef.current.panTo(marker.getPosition());
      mapInstanceRef.current.setZoom(15);
      if (infoWindowRef.current) {
        const loc = selectedLocation;
        const content = `
          <div style="max-width:240px">
            <div style="font-weight:600;margin-bottom:4px">${loc.name}</div>
            <div style="font-size:12px;color:#555">${loc.address || ''}</div>
          </div>
        `;
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open({ anchor: marker, map: mapInstanceRef.current });
      }
    }
  }, [selectedLocation]);

  const getSampleLocations = (brandName, province) => {
    // Sample locations for when API key is not available or API fails
    const center = (province && provinceCenters[province]) ? provinceCenters[province] : DEFAULT_CENTER;
    const provinceLabel = province || 'Jakarta Pusat';
    return [
      {
        id: 1,
        name: `${brandName} - ${provinceLabel} 1`,
        address: `Jl. Utama No. 1, ${provinceLabel}`,
        lat: center.lat,
        lng: center.lng,
        type: 'Franchise'
      },
      {
        id: 2,
        name: `${brandName} - ${provinceLabel} 2`,
        address: `Jl. Raya No. 2, ${provinceLabel}`,
        lat: center.lat + 0.01,
        lng: center.lng + 0.01,
        type: 'Franchise'
      },
      {
        id: 3,
        name: `${brandName} - ${provinceLabel} 3`,
        address: `Jl. Besar No. 3, ${provinceLabel}`,
        lat: center.lat - 0.01,
        lng: center.lng - 0.01,
        type: 'Franchise'
      }
    ];
  };

  const getDirectionsUrl = (location) => {
    const query = encodeURIComponent(`${location.name}, ${location.address}`);
    return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  //

  if (loading && isFirstLoadRef.current) {
    return (
      <div className="franchise-map-container">
        <div className="map-header">
          <h3>
            <i className="fas fa-map-marker-alt"></i>
            Lokasi {franchiseName}
          </h3>
        </div>
        <div className="map-loading">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <p>Memuat peta lokasi franchise...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="franchise-map-container">
        <div className="map-header">
          <h3>
            <i className="fas fa-map-marker-alt"></i>
            Lokasi {franchiseName}
          </h3>
        </div>
        <div className="map-error">
          <i className="fas fa-exclamation-triangle"></i>
          <p>Gagal memuat lokasi franchise</p>
          <p className="error-details">{error}</p>
          <button onClick={() => searchFranchiseLocations(franchiseName, franchiseProvince)} className="retry-button">
            <i className="fas fa-redo"></i>
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="franchise-map-container">
      <div className="map-header">
        <h3>
          <i className="fas fa-map-marker-alt"></i>
          Lokasi {franchiseName}
        </h3>
        <p>Ditemukan {locations.length} lokasi franchise</p>
      </div>

      <div className={`map-content ${locations.length > 1 ? '' : 'single'}`}>
        {/* Location List */}
        {locations.length > 1 && (
          <div className="location-list">
            <h4>Daftar Lokasi</h4>
            <div className="location-items">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className={`location-item ${selectedLocation?.id === location.id ? 'active' : ''}`}
                  onClick={() => handleLocationSelect(location)}
                >
                  <div className="location-info">
                    <h5>{location.name}</h5>
                    <p className="address">
                      <i className="fas fa-map-marker-alt"></i>
                      {location.address}
                    </p>
                    {location.rating && (
                      <p className="rating">
                        <i className="fas fa-star"></i>
                        {location.rating.toFixed(1)}
                      </p>
                    )}
                  </div>
                  <div className="location-actions">
                    <a
                      href={getDirectionsUrl(location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="directions-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <i className="fas fa-directions"></i>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Map Display */}
        <div className="map-display" style={{ position: 'relative' }}>
          {loading && !isFirstLoadRef.current && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(255,255,255,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2
              }}
            >
              <div className="loading-spinner">
                <i className="fas fa-spinner fa-spin"></i>
              </div>
            </div>
          )}
          {selectedLocation ? (
            <>
              {process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? (
                <div ref={mapRef} className="map-canvas" />
              ) : (
                <div className="map-placeholder">
                  <div className="map-placeholder-content">
                    <i className="fas fa-map-marked-alt"></i>
                    <h4>{selectedLocation.name}</h4>
                    <p className="coordinates">
                      Koordinat: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                    </p>
                    <p className="note">
                      Tambahkan REACT_APP_GOOGLE_MAPS_API_KEY untuk menampilkan peta interaktif
                    </p>
                  </div>
                </div>
              )}
              
              <div className="selected-location-info">
                <h4>{selectedLocation.name}</h4>
                <p className="address">
                  <i className="fas fa-map-marker-alt"></i>
                  {selectedLocation.address}
                </p>
                {selectedLocation.rating && (
                  <p className="rating">
                    <i className="fas fa-star"></i>
                    Rating: {selectedLocation.rating.toFixed(1)}
                  </p>
                )}
                <div className="location-actions">
                  <a
                    href={getDirectionsUrl(selectedLocation)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="directions-button"
                  >
                    <i className="fas fa-directions"></i>
                    Petunjuk Arah
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(selectedLocation.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-map-button"
                  >
                    <i className="fas fa-external-link-alt"></i>
                    Lihat di Google Maps
                  </a>
                </div>
              </div>
            </>
          ) : (
            <div className="no-locations">
              <i className="fas fa-map-marked-alt"></i>
              <p>Tidak ada lokasi franchise yang ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FranchiseMap; 