import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { getFranchisePrivateById, verifyFranchise } from '../api/FranchiseAPI'
import './FranchiseDetail.css'

const IMAGE_API_URL = process.env.IMAGE_API_URLL || 'http://localhost:8081'

function AdminFranchiseVerificationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = useSelector(state => state.franchisoAuth.accessToken)

  const [franchise, setFranchise] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [verifying, setVerifying] = useState(false)

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  const handleWhatsAppContact = () => {
    if (franchise?.whatsapp_contact) {
      const phoneNumber = franchise.whatsapp_contact.replace(/\D/g, '')
      const message = `Halo, saya tertarik dengan franchise ${franchise.brand}. Bisa minta informasi lebih lanjut?`
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')
    }
  }

  const handleWebsiteClick = () => {
    if (franchise?.website) {
      window.open(franchise.website, '_blank')
    }
  }

  const handleVerify = async (status) => {
    if (!franchise?.id || verifying) return
    
    const statusText = status === 'Terverifikasi' ? 'menerima' : 'menolak'
    const confirmAction = window.confirm(`Apakah Anda yakin ingin ${statusText} verifikasi franchise "${franchise.brand}"?`)
    
    if (!confirmAction) return

    try {
      setVerifying(true)
      await verifyFranchise(franchise.id, status, token)
      alert(`Franchise "${franchise.brand}" berhasil ${statusText}!`)
      navigate('/dashboard/admin')
    } catch (e) {
      alert(e.message || `Gagal ${statusText} verifikasi franchise`)
    } finally {
      setVerifying(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      if (!id || !token) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const data = await getFranchisePrivateById(id, token)
        setFranchise(data)
        setError(null)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, token])

  if (loading) {
    return (
      <div className="franchise-detail-loading">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
        <p>Memuat detail verifikasi...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="franchise-detail-error">
        <div className="error-content">
          <i className="fas fa-exclamation-triangle"></i>
          <h2>Terjadi Kesalahan</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="back-button">
            <i className="fas fa-arrow-left"></i>
            Kembali
          </button>
        </div>
      </div>
    )
  }

  if (!franchise) {
    return null
  }

  return (
    <div className="franchise-detail-page">
      <div className="detail-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <i className="fas fa-arrow-left"></i>
          Kembali
        </button>
        <h1>Detail Verifikasi Franchise</h1>
      </div>

      <div className="detail-content">
        <div className="image-gallery">
          <div className="main-image">
            <img 
              src={`${IMAGE_API_URL}${franchise.ad_photos?.[activeImageIndex]}` || "/image/img1.png"}
              alt={franchise.brand}
            />
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
                    src={`${IMAGE_API_URL}${photo}` || "/image/img1.png"}
                    alt={`${franchise.brand} - Thumbnail ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="franchise-info-section">
          <div className="brand-header">
            <div className="brand-logo">
              <img src={`${IMAGE_API_URL}${franchise.logo}` || "/image/logo.png"} alt={`${franchise.brand} Logo`} />
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
                <p>{formatCurrency(franchise.investment)}</p>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="metric-content">
                <h3>Pendapatan Bulanan</h3>
                <p>{formatCurrency(franchise.monthly_revenue)}</p>
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
                <p className="no-description">Deskripsi franchise belum tersedia.</p>
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

          {/* Verification Documents */}
          <div className="verification-docs">
            <h3>Dokumen Verifikasi</h3>
            <div className="doc-links">
              {franchise?.stpw && (
                <a className="doc-link" href={`${IMAGE_API_URL}${franchise.stpw}`} target="_blank" rel="noreferrer">
                  <i className="fas fa-file-alt"></i>
                  SPTW
                </a>
              )}
              {franchise?.nib && (
                <a className="doc-link" href={`${IMAGE_API_URL}${franchise.nib}`} target="_blank" rel="noreferrer">
                  <i className="fas fa-file-alt"></i>
                  NIB
                </a>
              )}
              {franchise?.npwp && (
                <a className="doc-link" href={`${IMAGE_API_URL}${franchise.npwp}`} target="_blank" rel="noreferrer">
                  <i className="fas fa-file-alt"></i>
                  NPWP
                </a>
              )}
            </div>
          </div>

          {/* Admin Verification Actions */}
          <div className="verification-actions">
            <h3>Verifikasi Franchise</h3>
            <div className="action-buttons">
              <button 
                onClick={() => handleVerify('Terverifikasi')} 
                className="verify-button accept"
                disabled={verifying}
              >
                <i className="fas fa-check"></i>
                {verifying ? 'Memproses...' : 'Terima Verifikasi'}
              </button>
              <button 
                onClick={() => handleVerify('Ditolak')} 
                className="verify-button reject"
                disabled={verifying}
              >
                <i className="fas fa-times"></i>
                {verifying ? 'Memproses...' : 'Tolak Verifikasi'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminFranchiseVerificationDetail
