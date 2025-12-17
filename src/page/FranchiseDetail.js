import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFranchiseById } from '../api/FranchiseAPI';
import FranchiseMap from '../component/FranchiseMap';
import './FranchiseDetail.css';
import { PROVINCE_LIST } from '../data/ListFranchiseMap.jsx';

const IMAGE_API_URL = process.env.IMAGE_API_URLL || 'http://localhost:8081';

function FranchiseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [franchise, setFranchise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const CITY_OPTIONS = PROVINCE_LIST.map((c) => c.name);
  const [selectedProvince, setSelectedCity] = useState('DKI JAKARTA');

  useEffect(() => {
    const fetchFranchiseDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getFranchiseById(id);
        setFranchise(data);
      } catch (err) {
        console.error('Error fetching franchise detail:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFranchiseDetail();
    }
  }, [id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleWhatsAppContact = () => {
    if (franchise?.whatsapp_contact) {
      const phoneNumber = franchise.whatsapp_contact.replace(/\D/g, '');
      const message = `Halo, saya tertarik dengan franchise ${franchise.brand}. Bisa minta informasi lebih lanjut?`;
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleWebsiteClick = () => {
    if (franchise?.website) {
      window.open(franchise.website, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="franchise-detail-loading">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
        <p>Memuat detail franchise...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="franchise-detail-error">
        <div className="error-content">
          <i className="fas fa-exclamation-triangle"></i>
          <h2>Terjadi Kesalahan</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/search')} className="back-button">
            <i className="fas fa-arrow-left"></i>
            Kembali ke Pencarian
          </button>
        </div>
      </div>
    );
  }

  if (!franchise) {
    return (
      <div className="franchise-detail-error">
        <div className="error-content">
          <i className="fas fa-search"></i>
          <h2>Franchise Tidak Ditemukan</h2>
          <p>Franchise yang Anda cari tidak ditemukan atau telah dihapus.</p>
          <button onClick={() => navigate('/search')} className="back-button">
            <i className="fas fa-arrow-left"></i>
            Kembali ke Pencarian
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="franchise-detail-page">
      {/* Header */}
      <div className="detail-header">
        <button onClick={() => navigate('/search')} className="back-button">
          <i className="fas fa-arrow-left"></i>
          Kembali
        </button>
        <h1>Detail Franchise</h1>
      </div>

      <div className="detail-content">
        {/* Image Gallery */}
        <div className="image-gallery">
          <div className="main-image">
            <img 
              src={`${IMAGE_API_URL}${typeof franchise.ad_photos?.[activeImageIndex] === 'string' ? franchise.ad_photos?.[activeImageIndex] : franchise.ad_photos?.[activeImageIndex].file_path}`} 
              alt={`${franchise.brand} - ${activeImageIndex + 1}`}
            />
            {franchise.is_boosted && (
              <div className="boosted-badge">
                <i className="fas fa-star"></i>
                Boosted
              </div>
            )}
          </div>
          
          {franchise.ad_photos && franchise.ad_photos.length > 1 && (
            <div className="image-thumbnails">
              {franchise.ad_photos.map((photo, index) => (
                <div 
                  key={index}
                  className={`thumbnail ${index === activeImageIndex ? 'active' : ''}`}
                  onClick={() => setActiveImageIndex(index)}
                >
                  <img 
                    src={`${IMAGE_API_URL}${typeof photo === "string" ? photo : photo.file_path}` || "/image/img1.png"} 
                    alt={`${franchise.brand} - Thumbnail ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Franchise Information */}
        <div className="franchise-info-section">
          <div className="brand-header">
            <div className="brand-logo">
              <img 
                src={`${IMAGE_API_URL}${typeof franchise.logo === "string" ? franchise.logo : franchise.logo.file_path}` || "/image/logo.png"} 
                alt={`${franchise.brand} Logo`}
              />
            </div>
            <div className="brand-details">
              <h2 className="brand-name">{franchise.brand}</h2>
              <div className="brand-meta">
                <span className="category">
                  <i className="fas fa-tags"></i>
                  {franchise.category?.category || 'Kategori tidak tersedia'}
                </span>
                <span className="year-founded">
                  <i className="fas fa-calendar-alt"></i>
                  Sejak {franchise.year_founded || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="key-metrics">
            <div className="metric-card">
              <div className="metric-icon">
                <i className="fas fa-coins"></i>
              </div>
              <div className="metric-content">
                <h3>Modal Investasi</h3>
                <p>{formatCurrency(franchise.investment || 0)}</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="metric-content">
                <h3>Pendapatan Bulanan</h3>
                <p>{formatCurrency(franchise.monthly_revenue || 0)}</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <i className="fas fa-sync-alt"></i>
              </div>
              <div className="metric-content">
                <h3>ROI</h3>
                <p>{franchise.roi || 0} bulan</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <i className="fas fa-store"></i>
              </div>
              <div className="metric-content">
                <h3>Jumlah Cabang</h3>
                <p>{franchise.branch_count || 0}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="description-section">
            <h3>Tentang Franchise</h3>
            <div className="description-content">
              {franchise.description ? (
                <p>{franchise.description}</p>
              ) : (
                <p className="no-description">
                  Deskripsi franchise belum tersedia.
                </p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="contact-section">
            <h3>Informasi Kontak</h3>
            <div className="contact-options">
              {franchise.whatsapp_contact && (
                <button onClick={handleWhatsAppContact} className="contact-button whatsapp">
                  <i className="fab fa-whatsapp"></i>
                  Hubungi via WhatsApp
                  <span className="phone-number">{franchise.whatsapp_contact}</span>
                </button>
              )}
              
              {franchise.website && (
                <button onClick={handleWebsiteClick} className="contact-button website">
                  <i className="fas fa-globe"></i>
                  Kunjungi Website
                </button>
              )}
            </div>
          </div>

          {/* Map Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <label htmlFor="city-select" style={{ fontWeight: 600 }}>Pilih Kota:</label>
            <select
              id="city-select"
              value={selectedProvince}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="filter-select"
              style={{ padding: '8px 12px' }}
            >
              {CITY_OPTIONS.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <FranchiseMap franchiseName={franchise.brand} franchiseProvince={selectedProvince} />
        </div>
      </div>
    </div>
  );
}

export default FranchiseDetail;