import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { editFranchise, getCategories, getFranchisePrivateById } from '../api/FranchiseAPI';
import './UploadFranchise.css';

const IMAGE_API_URL = process.env.IMAGE_API_URLL || 'http://localhost:8081';

function EditFranchise() {
  const { id } = useParams();
  const navigate = useNavigate();
  const accessToken = useSelector(state => state.franchisoAuth.accessToken);
  const user = useSelector(state => state.franchisoAuth.user);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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

  const [existingMedia, setExistingMedia] = useState({
    logo: '',
    ad_photos: [],
    stpw: '',
    nib: '',
    npwp: ''
  });

  // Track which existing ad photos to keep/remove
  const [existingAdPhotos, setExistingAdPhotos] = useState([]); // { url: string, keep: boolean }

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!accessToken || !user) {
      navigate('/login');
      return;
    }

    const loadInitial = async () => {
      try {
        setInitialLoading(true);
        const [catsResp, detail] = await Promise.all([
          getCategories(),
          getFranchisePrivateById(id, accessToken)
        ]);

        // categories
        let categoriesData = [];
        if (Array.isArray(catsResp)) categoriesData = catsResp;
        else if (catsResp && Array.isArray(catsResp.categories)) categoriesData = catsResp.categories;
        else if (catsResp && Array.isArray(catsResp.data)) categoriesData = catsResp.data;
        else if (catsResp && catsResp.data && Array.isArray(catsResp.data.categories)) categoriesData = catsResp.data.categories;
        setCategories(categoriesData);

        // normalize detail
        const d = detail?.franchise || detail || {};
        setFormData({
          category_id: d.category?.id || d.category_id || '',
          brand: d.brand || '',
          description: d.description || '',
          investment: d.investment != null ? String(d.investment) : '',
          monthly_revenue: d.monthly_revenue != null ? String(d.monthly_revenue) : '',
          roi: d.roi != null ? String(d.roi) : '',
          branch_count: d.branch_count != null ? String(d.branch_count) : '',
          year_founded: d.year_founded != null ? String(d.year_founded) : '',
          website: d.website || '',
          whatsapp_contact: d.whatsapp_contact || ''
        });

        const existing = {
          logo: d.logo || '',
          ad_photos: Array.isArray(d.ad_photos) ? d.ad_photos : [],
          stpw: d.stpw || '',
          nib: d.nib || '',
          npwp: d.npwp || ''
        };
        setExistingMedia(existing);
        setExistingAdPhotos((existing.ad_photos || []).map(u => ({ url: u, keep: true })));
      } catch (e) {
        console.error(e);
        alert(e.message || 'Gagal memuat data');
      } finally {
        setInitialLoading(false);
      }
    };

    loadInitial();
  }, [id, accessToken, user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e, field) => {
    const selectedFiles = Array.from(e.target.files);

    if (field === 'ad_photos') {
      // append, not replace
      setFiles(prev => ({ ...prev, [field]: [...(prev.ad_photos || []), ...selectedFiles] }));
    } else {
      setFiles(prev => ({ ...prev, [field]: selectedFiles[0] || null }));
    }

    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    e.target.value = '';
  };

  const removeNewAdPhotoAt = (index) => {
    setFiles(prev => ({ ...prev, ad_photos: (prev.ad_photos || []).filter((_, i) => i !== index) }));
  };

  const toggleKeepExistingAdPhoto = (url) => {
    setExistingAdPhotos(prev => prev.map(item => item.url === url ? { ...item, keep: !item.keep } : item));
  };

  const validateForm = () => {
    const newErrors = {};

    // Only basic numeric validations; fields optional in edit
    if (formData.investment && isNaN(formData.investment)) newErrors.investment = 'Modal investasi harus angka';
    if (formData.monthly_revenue && isNaN(formData.monthly_revenue)) newErrors.monthly_revenue = 'Pendapatan per bulan harus angka';
    if (formData.roi && isNaN(formData.roi)) newErrors.roi = 'ROI harus angka';
    if (formData.branch_count && isNaN(formData.branch_count)) newErrors.branch_count = 'Jumlah cabang harus angka';
    if (formData.year_founded && isNaN(formData.year_founded)) newErrors.year_founded = 'Tahun pendirian harus angka';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchUrlAsFile = async (relativeUrl, fallbackName) => {
    const fullUrl = `${IMAGE_API_URL}${relativeUrl}`;
    const resp = await fetch(fullUrl);
    if (!resp.ok) throw new Error(`Gagal mengambil file: ${relativeUrl}`);
    const blob = await resp.blob();
    // Try to infer extension from type
    const ext = (blob.type && blob.type.split('/')[1]) || 'jpg';
    const name = fallbackName || `existing_${Math.random().toString(36).slice(2)}.${ext}`;
    return new File([blob], name, { type: blob.type || 'application/octet-stream' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formDataToSend = new FormData();

      // Append only provided fields (backend treats missing as unchanged)
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          formDataToSend.append(key, value);
        }
      });

      if (files.logo) formDataToSend.append('logo', files.logo);

      // Existing ad photos that are kept -> fetch as File and append
      const keptExisting = existingAdPhotos.filter(x => x.keep).map(x => x.url);
      const keptFiles = await Promise.all(keptExisting.map((u, idx) => fetchUrlAsFile(u, `existing_${idx}.jpg`))).catch(() => []);
      keptFiles.forEach(f => formDataToSend.append('ad_photos', f));

      // New ad photos appended after existing ones
      if (files.ad_photos && files.ad_photos.length > 0) {
        files.ad_photos.forEach(file => formDataToSend.append('ad_photos', file));
      }

      if (files.stpw) formDataToSend.append('stpw', files.stpw);
      if (files.nib) formDataToSend.append('nib', files.nib);
      if (files.npwp) formDataToSend.append('npwp', files.npwp);

      await editFranchise(id, formDataToSend, accessToken);
      alert('Franchise berhasil diupdate');
      navigate('/dashboard/franchisor');
    } catch (error) {
      console.error('Edit error:', error);
      alert(`Gagal update franchise: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = useMemo(() => {
    return categories.map(category => (
      <option key={category.id} value={category.id}>
        {category.category || category.name || 'Unknown Category'}
      </option>
    ));
  }, [categories]);

  if (!accessToken || !user) return null;

  return (
    <div className="upload-franchise-page">
      <div className="upload-container">
        <div className="upload-header">
          <h1>Edit Franchise</h1>
          <p>Ubah data franchise Anda. Kosongkan field yang tidak ingin diubah.</p>
        </div>

        {initialLoading ? (
          <div className="loading" style={{ padding: '24px' }}>
            <i className="fas fa-spinner fa-spin"></i>
            <p>Memuat data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="upload-form">
            <div className="form-row">
              <div className="form-group">
                <label>Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  placeholder="Brand"
                  className={errors.brand ? 'error' : ''}
                />
              </div>

              <div className="form-group">
                <label>Kategori</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className={errors.category_id ? 'error' : ''}
                >
                  <option value="">Pilih Kategori</option>
                  {categoryOptions}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Logo</label>
                {existingMedia.logo && !files.logo ? (
                  <div className="file-preview" style={{ marginBottom: 8 }}>
                    <img alt="Logo" src={`${IMAGE_API_URL}${existingMedia.logo}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                  </div>
                ) : null}
                <div className="file-upload-container">
                  <input type="file" onChange={(e) => handleFileChange(e, 'logo')} accept="image/*" className={`file-input ${errors.logo ? 'error' : ''}`} />
                  <div className="file-upload-placeholder">
                    <i className="fas fa-upload"></i>
                    <span>Klik untuk upload file</span>
                  </div>
                </div>
                {files.logo && (
                  <div className="file-preview" style={{ marginTop: 8 }}>
                    <div className="file-item">
                      <img alt="Logo Baru" src={URL.createObjectURL(files.logo)} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, marginRight: 8 }} />
                      <span>{files.logo.name} ({(files.logo.size / 1024).toFixed(1)} KB)</span>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={() => setFiles(prev => ({ ...prev, logo: null }))}
                        title="Hapus file"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Foto Iklan</label>

                {/* Upload area + hidden add-more */}
                <div className="file-upload-container add-photo-container">
                  <div className="file-upload-placeholder">
                    <i className="fas fa-upload"></i>
                    <span>Tambah Foto Iklan</span>
                  </div>
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'ad_photos')}
                    multiple={true}
                    accept="image/*"
                    className="file-input"
                  />
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'ad_photos')}
                    multiple={true}
                    accept="image/*"
                    className="file-input"
                    style={{ display: 'none' }}
                    data-add-more="true"
                    id="ad_photos-add-more"
                  />
                </div>

                {/* Unified stacked list: existing kept + new files */}
                {(() => {
                  const unified = [
                    ...existingAdPhotos.filter(x => x.keep).map(x => ({ type: 'existing', url: x.url })),
                    ...((files.ad_photos || []).map((f, idx) => ({ type: 'new', file: f, idx })))
                  ];
                  if (unified.length === 0) return null;
                  return (
                    <div className="file-preview" style={{ marginTop: 8 }}>
                      {unified.map((item, index) => (
                        <div key={`${item.type}-${index}`} className="file-item" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {item.type === 'existing' ? (
                            <img alt={`Ad ${index}`} src={`${IMAGE_API_URL}${item.url}`} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                          ) : (
                            item.file && item.file.type && item.file.type.startsWith('image/') ? (
                              <img alt={`Baru ${index}`} src={URL.createObjectURL(item.file)} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                            ) : (
                              <i className="fas fa-file"></i>
                            )
                          )}
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.type === 'existing' ? (item.url.split('/').pop() || 'existing.jpg') : (`${item.file.name} (${(item.file.size / 1024).toFixed(1)} KB)`)}
                          </span>
                          <button
                            type="button"
                            className="remove-file-btn"
                            onClick={() => {
                              if (item.type === 'existing') {
                                toggleKeepExistingAdPhoto(item.url);
                              } else {
                                removeNewAdPhotoAt(item.idx);
                              }
                            }}
                            title="Hapus item"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: '10px', marginTop: 8 }}>
                        <button
                          type="button"
                          className="add-more-btn"
                          onClick={() => {
                            const addMoreInput = document.getElementById('ad_photos-add-more');
                            if (addMoreInput) addMoreInput.click();
                          }}
                        >
                          Tambah File Lagi
                        </button>
                        <button
                          type="button"
                          className="clear-all-btn"
                          onClick={() => {
                            // clear both lists
                            setExistingAdPhotos(prev => prev.map(p => ({ ...p, keep: false })));
                            setFiles(prev => ({ ...prev, ad_photos: [] }));
                          }}
                        >
                          Hapus Semua
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="form-group">
              <label>Deskripsi</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Deskripsi"
                rows="4"
                className={errors.description ? 'error' : ''}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Modal Investasi</label>
                <input type="number" name="investment" value={formData.investment} onChange={handleInputChange} placeholder="Modal Investasi" className={errors.investment ? 'error' : ''} />
              </div>
              <div className="form-group">
                <label>Pendapatan per Bulan</label>
                <input type="number" name="monthly_revenue" value={formData.monthly_revenue} onChange={handleInputChange} placeholder="Pendapatan per Bulan" className={errors.monthly_revenue ? 'error' : ''} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>ROI (bulan)</label>
                <input type="number" name="roi" value={formData.roi} onChange={handleInputChange} placeholder="ROI" className={errors.roi ? 'error' : ''} />
              </div>
              <div className="form-group">
                <label>Jumlah Cabang</label>
                <input type="number" name="branch_count" value={formData.branch_count} onChange={handleInputChange} placeholder="Jumlah Cabang" className={errors.branch_count ? 'error' : ''} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Tahun Pendirian</label>
                <input type="number" name="year_founded" value={formData.year_founded} onChange={handleInputChange} placeholder="Tahun Pendirian" className={errors.year_founded ? 'error' : ''} />
              </div>
              <div className="form-group">
                <label>Website</label>
                <input type="url" name="website" value={formData.website} onChange={handleInputChange} placeholder="Website" className={errors.website ? 'error' : ''} />
              </div>
            </div>

            <div className="form-group">
              <label>Kontak WhatsApp</label>
              <input type="text" name="whatsapp_contact" value={formData.whatsapp_contact} onChange={handleInputChange} placeholder="Kontak WhatsApp" className={errors.whatsapp_contact ? 'error' : ''} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>STPW</label>
                {existingMedia.stpw ? (
                  !files.stpw && (
                    <div className="file-preview" style={{ marginBottom: 8 }}>
                      <a href={`${IMAGE_API_URL}${existingMedia.stpw}`} target="_blank" rel="noreferrer">Lihat STPW saat ini</a>
                    </div>
                  )
                ) : (
                  <small style={{ color: '#666' }}>Belum ada file STPW</small>
                )}
                <div className="file-upload-container">
                  <input type="file" onChange={(e) => handleFileChange(e, 'stpw')} accept=".pdf,.doc,.docx" className="file-input" />
                  <div className="file-upload-placeholder">
                    <i className="fas fa-upload"></i>
                    <span>Klik untuk upload file</span>
                  </div>
                </div>
                {files.stpw && (
                  <div className="file-preview" style={{ marginTop: 8 }}>
                    <div className="file-item">
                      <i className="fas fa-file"></i>
                      <span>{files.stpw.name} ({(files.stpw.size / 1024).toFixed(1)} KB)</span>
                      <button type="button" className="remove-file-btn" onClick={() => setFiles(prev => ({ ...prev, stpw: null }))} title="Hapus file">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>NIB</label>
                {existingMedia.nib ? (
                  !files.nib && (
                    <div className="file-preview" style={{ marginBottom: 8 }}>
                      <a href={`${IMAGE_API_URL}${existingMedia.nib}`} target="_blank" rel="noreferrer">Lihat NIB saat ini</a>
                    </div>
                  )
                ) : (
                  <small style={{ color: '#666' }}>Belum ada file NIB</small>
                )}
                <div className="file-upload-container">
                  <input type="file" onChange={(e) => handleFileChange(e, 'nib')} accept=".pdf,.doc,.docx" className="file-input" />
                  <div className="file-upload-placeholder">
                    <i className="fas fa-upload"></i>
                    <span>Klik untuk upload file</span>
                  </div>
                </div>
                {files.nib && (
                  <div className="file-preview" style={{ marginTop: 8 }}>
                    <div className="file-item">
                      <i className="fas fa-file"></i>
                      <span>{files.nib.name} ({(files.nib.size / 1024).toFixed(1)} KB)</span>
                      <button type="button" className="remove-file-btn" onClick={() => setFiles(prev => ({ ...prev, nib: null }))} title="Hapus file">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>NPWP</label>
                {existingMedia.npwp ? (
                  !files.npwp && (
                    <div className="file-preview" style={{ marginBottom: 8 }}>
                      <a href={`${IMAGE_API_URL}${existingMedia.npwp}`} target="_blank" rel="noreferrer">Lihat NPWP saat ini</a>
                    </div>
                  )
                ) : (
                  <small style={{ color: '#666' }}>Belum ada file NPWP</small>
                )}
                <div className="file-upload-container">
                  <input type="file" onChange={(e) => handleFileChange(e, 'npwp')} accept=".pdf,.doc,.docx" className="file-input" />
                  <div className="file-upload-placeholder">
                    <i className="fas fa-upload"></i>
                    <span>Klik untuk upload file</span>
                  </div>
                </div>
                {files.npwp && (
                  <div className="file-preview" style={{ marginTop: 8 }}>
                    <div className="file-item">
                      <i className="fas fa-file"></i>
                      <span>{files.npwp.name} ({(files.npwp.size / 1024).toFixed(1)} KB)</span>
                      <button type="button" className="remove-file-btn" onClick={() => setFiles(prev => ({ ...prev, npwp: null }))} title="Hapus file">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => navigate('/dashboard/franchisor')} className="btn-secondary" disabled={loading}>
                Batal
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default EditFranchise;
