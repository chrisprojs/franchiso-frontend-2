import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { boostFranchise, getFranchisePrivateById } from '../api/FranchiseAPI';

const MIDTRANS_SNAP_URL = 'https://app.sandbox.midtrans.com/snap/snap.js';

function BoostModal({ open, onClose, franchiseId, onBoosted }) {
  const accessToken = useSelector((state) => state.franchisoAuth.accessToken);
  const [selectedPackage, setSelectedPackage] = useState('7');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const pollingRef = useRef(null);

  const clientKey = useMemo(() => process.env.MIDTRANS_CLIENT_KEY || '', []);

  const packagePriceMap = useMemo(() => ({
    '7': 100000,
    '14': 180000,
    '30': 350000,
  }), []);

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }, []);

  const loadSnapScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.snap) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = MIDTRANS_SNAP_URL;
      if (clientKey) {
        script.setAttribute('data-client-key', clientKey);
      }
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Gagal memuat Midtrans Snap JS'));
      document.body.appendChild(script);
    });
  }, [clientKey]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stopPolling();
      setStatus('');
      setError('');
      setLoading(false);
    }
  }, [open, stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const startPollingBoostStatus = useCallback(() => {
    stopPolling();
    let attempts = 0;
    const maxAttempts = 60; // ~2 menit jika interval 2s
    setStatus('Memeriksa status boost...');
    pollingRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const data = await getFranchisePrivateById(franchiseId, accessToken);
        if (data && (data.is_boosted === true || data.isBoosted === true)) {
          stopPolling();
          setStatus('Boost aktif.');
          if (typeof onBoosted === 'function') onBoosted();
          onClose && onClose();
        } else if (attempts >= maxAttempts) {
          stopPolling();
          setStatus('Waktu tunggu habis. Silakan cek detail franchise.');
        }
      } catch (e) {
        // keep polling unless max attempts reached
        if (attempts >= maxAttempts) {
          stopPolling();
          setError(e.message || 'Gagal memeriksa status boost');
        }
      }
    }, 2000);
  }, [accessToken, franchiseId, onBoosted, onClose, stopPolling]);

  const handlePay = useCallback(async () => {
    if (!accessToken) {
      setError('Silakan login terlebih dahulu.');
      return;
    }
    setLoading(true);
    setError('');
    setStatus('Menyiapkan pembayaran...');
    try {
      await loadSnapScript();
      const resp = await boostFranchise(franchiseId, selectedPackage, accessToken);
      const token = resp?.snap_token || resp?.snapToken || resp?.snapToken || resp?.SnapToken;
      const redirectUrl = resp?.redirect_url || resp?.redirectUrl || resp?.RedirectUrl;
      if (!token) {
        throw new Error('Token pembayaran tidak tersedia');
      }
      setStatus('Membuka Snap...');
      // Close modal immediately after successful payment initiation
      onClose && onClose();
      window.snap.pay(token, {
        onSuccess: function() {
          setStatus('Pembayaran sukses. Mengaktifkan boost...');
          startPollingBoostStatus();
        },
        onPending: function() {
          setStatus('Pembayaran tertunda. Memeriksa status boost...');
          startPollingBoostStatus();
        },
        onError: function(result) {
          setError('Pembayaran gagal');
          console.error(result);
        },
        onClose: function() {
          setStatus('Anda menutup popup pembayaran.');
        },
      });
      if (redirectUrl) {
        // Optional: open in new tab as fallback
        // window.open(redirectUrl, '_blank');
      }
    } catch (e) {
      setError(e.message || 'Terjadi kesalahan saat memulai boost');
    } finally {
      setLoading(false);
    }
  }, [accessToken, franchiseId, loadSnapScript, selectedPackage, startPollingBoostStatus, onClose]);

  if (!open) return null;

  return (
    <div className="boost-modal-overlay" onClick={onClose}>
      <div className="boost-modal" onClick={(e) => e.stopPropagation()}>
        <div className="boost-modal-header">
          <h3>Boost Franchise</h3>
          <button className="boost-close" onClick={onClose}><i className="fas fa-times"></i></button>
        </div>
        <div className="boost-modal-body">
          <p>Pilih paket durasi:</p>
          <div className="boost-packages">
            {['7','14','30'].map((p) => {
              const isActive = selectedPackage === p;
              const price = packagePriceMap[p];
              return (
                <button
                  key={p}
                  className={`boost-package ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedPackage(p)}
                  disabled={loading}
                >
                  <span className="boost-title">{p} Hari</span>
                  <span className="boost-price">{formatCurrency(price)}</span>
                  <span className="boost-desc">Sorotan iklan selama {p} hari</span>
                </button>
              );
            })}
          </div>
          {status && <div className="boost-status">{status}</div>}
          {error && <div className="boost-error">{error}</div>}
        </div>
        <div className="boost-modal-footer">
          <button className="boost-cancel" onClick={onClose} disabled={loading}>Batal</button>
          <button className="boost-pay" onClick={handlePay} disabled={loading}>
            {loading ? 'Memproses...' : 'Bayar & Boost'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BoostModal;


