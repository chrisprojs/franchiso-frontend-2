import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { uploadFranchise, getCategories } from '../api/FranchiseAPI';
import './UploadFranchise.css';

function UploadFranchise() {
  const navigate = useNavigate();
  const accessToken = useSelector(state => state.franchisoAuth.accessToken);
  const user = useSelector(state => state.franchisoAuth.user);

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    category_id: '',
    brand: '',
    description: '',
    investment: '',
    monthly_revenue: '',
    roi: '',
    branch_count: '',
    year_founded: '',
    website: '',
    whatsapp_contact: ''
  });

  const [files, setFiles] = useState({
    logo: null,
    ad_photos: [],
    stpw: null,
    nib: null,
    npwp: null
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Check authentication
    if (!accessToken || !user) {
      navigate('/login');
      return;
    }

    // Load categories
    const loadCategories = async () => {
      try {
        const response = await getCategories();
        
        // Handle different possible response structures
        let categoriesData = [];
        if (Array.isArray(response)) {
          categoriesData = response;
        } else if (response && Array.isArray(response.categories)) {
          categoriesData = response.categories;
        } else if (response && Array.isArray(response.data)) {
          categoriesData = response.data;
        } else if (response && response.data && Array.isArray(response.data.categories)) {
          categoriesData = response.data.categories;
        }
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCategories();
  }, [accessToken, user, navigate]);

  // Format angka ke tampilan Rupiah dengan titik pemisah ribuan
  const formatRupiah = (value) => {
    if (!value || value === '') return '';
    const numericValue = value.toString().replace(/\D/g, '');
    if (numericValue === '') return '';
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Hilangkan semua karakter non-digit (untuk disimpan / dikirim ke backend)
  const parseRupiah = (value) => {
    if (!value || value === '') return '';
    return value.toString().replace(/\D/g, '');
  };

  const handleRupiahChange = (name, formattedValue) => {
    const numericValue = parseRupiah(formattedValue);
    setFormData(prev => ({
      ...prev,
      [name]: numericValue
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e, field) => {
    const selectedFiles = Array.from(e.target.files);
    console.log(`File change for ${field}:`, selectedFiles);
    
    if (field === 'ad_photos') {
      // Check if this is an "add more" action or initial selection
      const isAddMore = e.target.dataset.addMore === 'true';
      
      if (isAddMore) {
        // Add to existing files
        setFiles(prev => ({
          ...prev,
          [field]: [...(prev[field] || []), ...selectedFiles]
        }));
      } else {
        // Initial selection - replace existing files
        setFiles(prev => ({
          ...prev,
          [field]: selectedFiles
        }));
      }
    } else {
      setFiles(prev => ({
        ...prev,
        [field]: selectedFiles[0] || null
      }));
    }
    
    // Clear error when user selects files
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
    
    // Reset the input value so user can select the same file again if needed
    e.target.value = '';
  };



  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.category_id) newErrors.category_id = 'Kategori wajib dipilih';
    if (!formData.brand) newErrors.brand = 'Brand wajib diisi';
    if (!formData.description) newErrors.description = 'Deskripsi wajib diisi';
    if (!formData.investment) newErrors.investment = 'Modal investasi wajib diisi';
    if (!formData.monthly_revenue) newErrors.monthly_revenue = 'Pendapatan per bulan wajib diisi';
    if (!formData.roi) newErrors.roi = 'ROI wajib diisi';
    if (!formData.branch_count) newErrors.branch_count = 'Jumlah cabang wajib diisi';
    if (!formData.year_founded) newErrors.year_founded = 'Tahun pendirian wajib diisi';
    if (!formData.website) newErrors.website = 'Website wajib diisi';
    if (!formData.whatsapp_contact) newErrors.whatsapp_contact = 'Kontak WhatsApp wajib diisi';
    
    // File validation
    if (!files.logo) newErrors.logo = 'Logo wajib diupload';
    if (!files.ad_photos || files.ad_photos.length === 0) newErrors.ad_photos = 'Minimal satu foto iklan wajib diupload';

    // Numeric validation
    if (formData.investment && isNaN(formData.investment)) newErrors.investment = 'Modal investasi harus berupa angka';
    if (formData.monthly_revenue && isNaN(formData.monthly_revenue)) newErrors.monthly_revenue = 'Pendapatan per bulan harus berupa angka';
    if (formData.roi && isNaN(formData.roi)) newErrors.roi = 'ROI harus berupa angka';
    if (formData.branch_count && isNaN(formData.branch_count)) newErrors.branch_count = 'Jumlah cabang harus berupa angka';
    if (formData.year_founded && isNaN(formData.year_founded)) newErrors.year_founded = 'Tahun pendirian harus berupa angka';

    // Year validation
    if (formData.year_founded && (formData.year_founded < 1900 || formData.year_founded > new Date().getFullYear())) {
      newErrors.year_founded = 'Tahun pendirian tidak valid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Add form fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      // Add files
      if (files.logo) {
        formDataToSend.append('logo', files.logo);
      }
      
      if (files.ad_photos && files.ad_photos.length > 0) {
        files.ad_photos.forEach((file, index) => {
          console.log(`Appending ad_photo ${index}:`, file.name, file.type, file.size);
          formDataToSend.append('ad_photos', file);
        });
      } else {
        console.log('No ad_photos files to append');
      }
      
      if (files.stpw) {
        formDataToSend.append('stpw', files.stpw);
      }
      
      if (files.nib) {
        formDataToSend.append('nib', files.nib);
      }
      
      if (files.npwp) {
        formDataToSend.append('npwp', files.npwp);
      }

      // Debug: Log all FormData entries
      for (let [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.type}, ${value.size} bytes)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      const response = await uploadFranchise(formDataToSend, accessToken);
      
      alert('Franchise berhasil diupload! Menunggu verifikasi admin.');
      navigate('/dashboard/franchisor');
      
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Gagal upload franchise: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderFileInput = (field, label, multiple = false, accept = '*') => (
    <div className="form-group">
      <label>{label}</label>
      
      {/* For multiple files (ad_photos), show only the add button initially */}
      {multiple ? (
        <>
          {/* Hidden file input for adding files */}
          <input
            type="file"
            onChange={(e) => handleFileChange(e, field)}
            multiple={true}
            accept={accept}
            className="file-input"
            style={{ display: 'none' }}
            data-add-more="true"
            id={`${field}-add-more`}
          />
          
          {/* Show add button if no files selected */}
          {(!files[field] || files[field].length === 0) && (
            <div className="file-upload-container add-photo-container">
              <div className="file-upload-placeholder">
                <i className="fas fa-plus"></i>
                <span>Tambah Foto Iklan</span>
              </div>
              <input
                type="file"
                onChange={(e) => handleFileChange(e, field)}
                multiple={true}
                accept={accept}
                className="file-input"
              />
            </div>
          )}
          
          {/* Show file preview and management buttons */}
          {files[field] && files[field].length > 0 && (
            <div className="file-preview">
              {files[field].map((file, index) => (
                <div key={index} className="file-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {accept && accept.includes('image') && file.type && file.type.startsWith('image/') ? (
                    <img
                      alt={`preview-${index}`}
                      src={URL.createObjectURL(file)}
                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }}
                    />
                  ) : (
                    <i className="fas fa-file"></i>
                  )}
                  <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                  <button
                    type="button"
                    className="remove-file-btn"
                    onClick={() => {
                      const newFiles = files[field].filter((_, i) => i !== index);
                      setFiles(prev => ({
                        ...prev,
                        [field]: newFiles
                      }));
                    }}
                    title="Hapus file"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="clear-all-btn"
                  onClick={() => {
                    setFiles(prev => ({
                      ...prev,
                      [field]: []
                    }));
                  }}
                >
                  Hapus Semua
                </button>
                <button
                  type="button"
                  className="add-more-btn"
                  onClick={() => {
                    // Trigger the hidden file input for adding more files
                    const addMoreInput = document.getElementById(`${field}-add-more`);
                    if (addMoreInput) {
                      addMoreInput.click();
                    }
                  }}
                >
                  Tambah File Lagi
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* For single files, show the normal file upload container */}
          <div className="file-upload-container">
            <input
              type="file"
              onChange={(e) => handleFileChange(e, field)}
              multiple={multiple}
              accept={accept}
              className={`file-input ${errors[field] ? 'error' : ''}`}
            />
            <div className="file-upload-placeholder">
              <i className="fas fa-upload"></i>
              <span>Klik untuk upload file</span>
            </div>
          </div>
          
          {/* Show file preview for single files */}
          {files[field] && (
            <div className="file-preview">
              <div className="file-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {accept && accept.includes('image') && files[field].type && files[field].type.startsWith('image/') ? (
                  <img
                    alt={`preview-${field}`}
                    src={URL.createObjectURL(files[field])}
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }}
                  />
                ) : (
                  <i className="fas fa-file"></i>
                )}
                <span>{files[field].name} ({(files[field].size / 1024).toFixed(1)} KB)</span>
                <button
                  type="button"
                  className="remove-file-btn"
                  onClick={() => {
                    setFiles(prev => ({
                      ...prev,
                      [field]: null
                    }));
                  }}
                  title="Hapus file"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
      {errors[field] && <span className="error-message">{errors[field]}</span>}
    </div>
  );

  if (!accessToken || !user) {
    return null;
  }

  return (
    <div className="upload-franchise-page">
      <div className="upload-container">
        <div className="upload-header">
          <h1>Upload Franchise</h1>
          <p>Isi form di bawah untuk mengupload franchise baru</p>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-row">
            <div className="form-group">
              <label>Brand *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="Brand"
                className={errors.brand ? 'error' : ''}
              />
              {errors.brand && <span className="error-message">{errors.brand}</span>}
            </div>

            <div className="form-group">
              <label>Kategori *</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className={errors.category_id ? 'error' : ''}
              >
                <option value="">Pilih Kategori</option>
                {categories.map(category => {
                  return (
                    <option key={category.id} value={category.id}>
                      {category.category || category.name || 'Unknown Category'}
                    </option>
                  );
                })}
              </select>
              {errors.category_id && <span className="error-message">{errors.category_id}</span>}
              {/* Debug info */}
              <small style={{ color: '#666', fontSize: '0.8rem' }}>
                Loaded {categories.length} categories
              </small>
            </div>
          </div>

          <div className="form-row">
            {renderFileInput('logo', 'Logo', false, 'image/*')}
            {renderFileInput('ad_photos', 'Foto Iklan', true, 'image/*')}
          </div>

          <div className="form-group">
            <label>Deskripsi *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Deskripsi"
              rows="4"
              className={errors.description ? 'error' : ''}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Modal Investasi *</label>
              <input
                type="text"
                name="investment"
                value={formData.investment ? `Rp ${formatRupiah(formData.investment)}` : ''}
                onChange={(e) => handleRupiahChange('investment', e.target.value)}
                placeholder="Modal Investasi"
                className={errors.investment ? 'error' : ''}
              />
              {errors.investment && <span className="error-message">{errors.investment}</span>}
            </div>

            <div className="form-group">
              <label>Pendapatan per Bulan *</label>
              <input
                type="text"
                name="monthly_revenue"
                value={formData.monthly_revenue ? `Rp ${formatRupiah(formData.monthly_revenue)}` : ''}
                onChange={(e) => handleRupiahChange('monthly_revenue', e.target.value)}
                placeholder="Pendapatan per Bulan"
                className={errors.monthly_revenue ? 'error' : ''}
              />
              {errors.monthly_revenue && <span className="error-message">{errors.monthly_revenue}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>ROI (Return of Investment) *</label>
              <input
                type="number"
                name="roi"
                value={formData.roi}
                onChange={handleInputChange}
                placeholder="ROI"
                className={errors.roi ? 'error' : ''}
              />
              {errors.roi && <span className="error-message">{errors.roi}</span>}
            </div>

            <div className="form-group">
              <label>Jumlah Cabang *</label>
              <input
                type="number"
                name="branch_count"
                value={formData.branch_count}
                onChange={handleInputChange}
                placeholder="Jumlah Cabang"
                className={errors.branch_count ? 'error' : ''}
              />
              {errors.branch_count && <span className="error-message">{errors.branch_count}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tahun Pendirian *</label>
              <input
                type="number"
                name="year_founded"
                value={formData.year_founded}
                onChange={handleInputChange}
                placeholder="Tahun Pendirian"
                className={errors.year_founded ? 'error' : ''}
              />
              {errors.year_founded && <span className="error-message">{errors.year_founded}</span>}
            </div>

            <div className="form-group">
              <label>Website *</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="Website"
                className={errors.website ? 'error' : ''}
              />
              {errors.website && <span className="error-message">{errors.website}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Kontak WhatsApp *</label>
            <input
              type="text"
              name="whatsapp_contact"
              value={formData.whatsapp_contact}
              onChange={handleInputChange}
              placeholder="Kontak WhatsApp"
              className={errors.whatsapp_contact ? 'error' : ''}
            />
            {errors.whatsapp_contact && <span className="error-message">{errors.whatsapp_contact}</span>}
          </div>

          <div className="form-row">
            {renderFileInput('stpw', 'STPW', false, '.pdf,.doc,.docx')}
            {renderFileInput('nib', 'NIB', false, '.pdf,.doc,.docx')}
            {renderFileInput('npwp', 'NPWP', false, '.pdf,.doc,.docx')}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/dashboard/franchisor')}
              className="btn-secondary"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Mengupload...' : 'Upload Franchise'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UploadFranchise; 