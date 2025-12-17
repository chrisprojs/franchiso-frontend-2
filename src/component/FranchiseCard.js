import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './FranchiseCard.css';
import BoostModal from './BoostModal';
import { verifyFranchise } from '../api/FranchiseAPI';

const IMAGE_API_URL = process.env.IMAGE_API_URLL || 'http://localhost:8081';

function FranchiseCard({ franchise, context, onCardClickOverride, onDelete, onStatusChange }) {
  const navigate = useNavigate();
  const accessToken = useSelector(state => state.franchisoAuth.accessToken);
  const [showBoost, setShowBoost] = useState(false);

  // Check if franchise is already boosted
  const isBoosted = franchise?.is_boosted === true || franchise?.isBoosted === true;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCardClick = () => {
    if (typeof onCardClickOverride === 'function') {
      onCardClickOverride();
    } else {
      // Redirect based on context
      if (context === 'admin') {
        navigate(`/admin/franchise/${franchise.id}/verify`);
      } else if (context === 'owner') {
        navigate(`/franchise/${franchise.id}/verify`);
      } else {
        // Default: from Search.js or other pages
        navigate(`/franchise/${franchise.id}`);
      }
    }
  };

  const handleRejectFranchise = async (franchise) => {
    if (!franchise?.id || !accessToken) return;
    
    const confirmReject = window.confirm(`Apakah Anda yakin ingin menolak verifikasi franchise "${franchise.brand}"?`);
    if (!confirmReject) return;

    try {
      await verifyFranchise(franchise.id, 'Ditolak', accessToken);
      alert(`Franchise "${franchise.brand}" berhasil ditolak!`);
      // Call callback to refresh the list
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (e) {
      alert(e.message || 'Gagal menolak verifikasi franchise');
    }
  };

  const handleAcceptFranchise = async (franchise) => {
    if (!franchise?.id || !accessToken) return;
    
    const confirmAccept = window.confirm(`Apakah Anda yakin ingin menerima verifikasi franchise "${franchise.brand}"?`);
    if (!confirmAccept) return;

    try {
      await verifyFranchise(franchise.id, 'Terverifikasi', accessToken);
      alert(`Franchise "${franchise.brand}" berhasil diterima!`);
      // Call callback to refresh the list
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (e) {
      alert(e.message || 'Gagal menerima verifikasi franchise');
    }
  };

  const getStatusInfo = () => {
    if (!franchise?.status) return null;
    const s = String(franchise.status).toLowerCase();
    if (s.includes('terverifikasi')) {
      return { cls: 'status-badge status-verified', label: 'Terverifikasi' };
    }
    if (s.includes('menunggu verifikasi')) {
      return { cls: 'status-badge status-pending', label: 'Menunggu Verifikasi' };
    }
    if (s.includes('ditolak')) {
      return { cls: 'status-badge status-rejected', label: 'Ditolak' };
    }
    return { cls: 'status-badge status-pending', label: franchise.status };
  };
  const statusInfo = getStatusInfo();

  return (
    <>
    <div className="franchise-card" onClick={handleCardClick}>
      <div className="franchise-card-header">
        <div className="franchise-owner">
          <img 
            src={`${IMAGE_API_URL}${typeof franchise.logo === 'string' ? franchise.logo : franchise.logo.file_path}` || "/image/logo.png"} 
            alt="Brand Logo" 
            className="owner-avatar"
          />
        </div>
        {context === 'owner' && (
          <div className="franchise-actions" onClick={(e) => e.stopPropagation()}>
            <button
              className="action-button"
              title="Update"
              onClick={() => navigate(`/franchise/${franchise.id}/edit`)}
            >
              <i className="fas fa-edit"></i>
            </button>
            <button
              className="action-button"
              title="Delete"
              onClick={(e) => { e.stopPropagation(); if (onDelete) onDelete(franchise); }}
            >
              <i className="fas fa-trash"></i>
            </button>
            <button
              className={`action-button ${isBoosted ? 'disabled' : ''}`}
              title={isBoosted ? "Boost sudah aktif" : "Boost"}
              onClick={() => !isBoosted && setShowBoost(true)}
              disabled={isBoosted}
            >
              <i className={`fas ${isBoosted ? 'fa-check-circle' : 'fa-bullhorn'}`}></i>
            </button>
          </div>
        )}
        {context === 'admin' && (
          <div className="franchise-actions" onClick={(e) => e.stopPropagation()}>
            <button
              className="action-button admin-verify"
              title="Terima Verifikasi"
              onClick={() => handleAcceptFranchise(franchise)}
            >
              <i className="fas fa-check-circle"></i>
            </button>
            <button
              className="action-button admin-reject"
              title="Tolak Verifikasi"
              onClick={() => handleRejectFranchise(franchise)}
            >
              <i className="fas fa-times-circle"></i>
            </button>
          </div>
        )}
        {(context === 'owner' || context === 'admin') && statusInfo && (
          <div className={statusInfo.cls}>{statusInfo.label}</div>
        )}
        {context === 'owner' && isBoosted && (
          <div className="status-badge status-boosted">Boosted</div>
        )}
        
        {/* Ad Photos - Square Image */}
        <div className="franchise-ad-photo">
          <img 
            src={`${IMAGE_API_URL}${typeof franchise.ad_photos?.[0] === 'string' ? franchise.ad_photos?.[0] : franchise.ad_photos?.[0].file_path}` || "/image/img1.png"} 
            alt="Franchise Ad" 
            className="ad-photo"
          />
        </div>
        
        <div className="franchise-year">
          Sejak {franchise.year_founded || 2018}
        </div>
      </div>
      
      <div className="franchise-info">
        <div className="brand-info">
          <p className="brand-name">{franchise.brand}</p>
        </div>
        
        <div className="franchise-details">
          <div className="detail-item">
            <i className="fas fa-coins"></i>
            <span>Rp Estimasi {formatCurrency(franchise.investment || 10000000)}</span>
          </div>
          
          <div className="detail-item">
            <i className="fas fa-seedling"></i>
            <span>Estimasi {formatCurrency(franchise.monthly_revenue || 5000000)}</span>
          </div>
          
          <div className="detail-item">
            <i className="fas fa-sync-alt"></i>
            <span>ROI {franchise.roi || 3} bulan</span>
          </div>
          
          <div className="detail-item">
            <i className="fas fa-store"></i>
            <span>{franchise.branch_count || 800}</span>
          </div>
        </div>
      </div>
    </div>
    {!isBoosted && (
      <BoostModal
        open={showBoost}
        onClose={() => setShowBoost(false)}
        franchiseId={franchise.id}
        onBoosted={() => {
          // Refresh the franchise data or show success message
          window.location.reload();
        }}
      />
    )}
    </>
  );
}

export default FranchiseCard;