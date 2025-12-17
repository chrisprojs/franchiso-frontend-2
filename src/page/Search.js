import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { searchFranchises, getCategories } from '../api/FranchiseAPI';
import FranchiseCard from '../component/FranchiseCard';
import './Search.css';

function Search() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [franchises, setFranchises] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState({});
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    minInvestment: '',
    maxInvestment: '',
    minMonthlyRevenue: '',
    minROI: '',
    maxROI: '',
    minBranchCount: '',
    maxBranchCount: '',
    minYearFounded: '',
    maxYearFounded: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [searchByImage, setSearchByImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Sync searchQuery with URL param `q`
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setSearchQuery(q);
    setCurrentPage(1);
  }, [location.search]);

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await getCategories();
        setCategories(response.categories || []);
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Close mobile filters when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMobileFilters && !event.target.closest('.filter-sidebar-content') && !event.target.closest('.filter-toggle')) {
        setShowMobileFilters(false);
      }
    };

    if (showMobileFilters) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [showMobileFilters]);

  const toggleFilter = (filterName) => {
    setExpandedFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const handleFilterChange = (filterName, value) => {
    // Validasi untuk memastikan nilai tidak negatif
    if (value !== '' && parseFloat(value) < 0) {
      return;
    }
    
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));

    // Update selected category name
    if (filterName === 'category') {
      if (value === '') {
        setSelectedCategoryName('');
      } else {
        const selectedCategory = categories.find(cat => cat.id === value);
        setSelectedCategoryName(selectedCategory ? selectedCategory.category : '');
      }
    }
  };

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      const searchParams = {
        searchQuery,
        page: currentPage,
        limit,
        ...filters
      };

      // Remove empty values
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key] === '' || searchParams[key] === null || searchParams[key] === undefined) {
          delete searchParams[key];
        }
      });

      const response = await searchFranchises(searchParams, searchByImage);
      setFranchises(response.franchises || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Error searching franchises:', error);
      setFranchises([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage, limit, filters, searchByImage]);

  useEffect(() => {
    handleSearch();
  }, [currentPage, handleSearch]);

  // Auto-refresh when filters or search query changes
  useEffect(() => {
    // Add a small delay to avoid too many API calls while typing
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters, searchQuery, searchByImage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    // Keep filters in URL if needed in the future
    navigate({ pathname: '/search', search: params.toString() });
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      minInvestment: '',
      maxInvestment: '',
      minMonthlyRevenue: '',
      minROI: '',
      maxROI: '',
      minBranchCount: '',
      maxBranchCount: '',
      minYearFounded: '',
      maxYearFounded: '',
    });
    setSearchQuery('');
    setSelectedCategoryName('');
    setCurrentPage(1);
    setSearchByImage(null);
    setImagePreview(null);
  };

  const toggleMobileFilters = () => {
    setShowMobileFilters(!showMobileFilters);
  };

  const closeMobileFilters = () => {
    setShowMobileFilters(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Harap pilih file gambar');
        return;
      }
      // Validate file size (e.g., max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran gambar harus kurang dari 10MB');
        return;
      }
      setSearchByImage(file);
      setCurrentPage(1);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSearchByImage(null);
    setImagePreview(null);
    setCurrentPage(1);
  };

  return (
    <div className="search-page">
      {/* Search Bar */}
      <div className="search-container">
        <div className="search-form-wrapper">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className="search-input-group">
              <input
                type="text"
                placeholder="Cari Franchise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button">
                <i className="fas fa-search"></i>
                Cari
              </button>
            </div>
          </form>
          
          {/* Image Search Section */}
          <div className="image-search-section">
            <label htmlFor="image-upload" className="image-upload-label">
              <i className="fas fa-image"></i>
              Cari yang anda mimpikan
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="image-upload-input"
            />
            {imagePreview && (
              <div className="image-preview-container">
                <img src={imagePreview} alt="Preview" className="image-preview" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="image-remove-btn"
                  title="Hapus gambar"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="search-content">
        {/* Mobile Filter Toggle Button */}
        <button 
          className={`filter-toggle ${showMobileFilters ? 'active' : ''}`}
          onClick={toggleMobileFilters}
        >
          <i className="fas fa-filter"></i>
          Filter Pencarian
          <i className="fas fa-chevron-down"></i>
        </button>

        {/* Filter Sidebar */}
        <div className={`filter-sidebar ${showMobileFilters ? 'active' : ''}`}>
          <div className="filter-sidebar-content">
            <button className="filter-close" onClick={closeMobileFilters}>
              <i className="fas fa-times"></i>
            </button>
          <div className="filter-header">
            <h3>Filter pencarian</h3>
            <button onClick={clearFilters} className="clear-filters">
              <i className="fas fa-times"></i>
              Bersihkan
            </button>
          </div>

          {/* Modal Investasi */}
          <div className="filter-group">
            <div 
              className="filter-title" 
              onClick={() => toggleFilter('investment')}
            >
              <i className="fas fa-coins"></i>
              Modal Investasi
              <i className={`fas fa-chevron-down ${expandedFilters.investment ? 'expanded' : ''}`}></i>
            </div>
            {expandedFilters.investment && (
              <div className="filter-content">
                <div className="range-inputs">
                  <input
                    type="number"
                    placeholder="Min (Rp)"
                    value={filters.minInvestment}
                    onChange={(e) => handleFilterChange('minInvestment', e.target.value)}
                    className="filter-input"
                  />
                  <input
                    type="number"
                    placeholder="Max (Rp)"
                    value={filters.maxInvestment}
                    onChange={(e) => handleFilterChange('maxInvestment', e.target.value)}
                    className="filter-input"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pendapatan per Bulan */}
          <div className="filter-group">
            <div 
              className="filter-title" 
              onClick={() => toggleFilter('monthlyRevenue')}
            >
              <i className="fas fa-chart-line"></i>
              Pendapatan per Bulan
              <i className={`fas fa-chevron-down ${expandedFilters.monthlyRevenue ? 'expanded' : ''}`}></i>
            </div>
            {expandedFilters.monthlyRevenue && (
              <div className="filter-content">
                <div className="range-inputs">
                  <input
                    type="number"
                    placeholder="Min (Rp)"
                    value={filters.minMonthlyRevenue}
                    onChange={(e) => handleFilterChange('minMonthlyRevenue', e.target.value)}
                    className="filter-input"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Kategori */}
          <div className="filter-group">
            <div 
              className="filter-title" 
              onClick={() => toggleFilter('category')}
            >
              <i className="fas fa-tags"></i>
              Kategori
              <i className={`fas fa-chevron-down ${expandedFilters.category ? 'expanded' : ''}`}></i>
            </div>
            {expandedFilters.category && (
              <div className="filter-content">
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="filter-select"
                >
                  <option value="">Semua Kategori</option>
                                     {categoriesLoading ? (
                     <option value="">Loading categories...</option>
                   ) : (
                     categories.map(category => (
                       <option key={category.id} value={category.id}>{category.category}</option>
                     ))
                   )}
                </select>
              </div>
            )}
          </div>

          {/* Jumlah Cabang */}
          <div className="filter-group">
            <div 
              className="filter-title" 
              onClick={() => toggleFilter('branchCount')}
            >
              <i className="fas fa-store"></i>
              Jumlah Cabang
              <i className={`fas fa-chevron-down ${expandedFilters.branchCount ? 'expanded' : ''}`}></i>
            </div>
            {expandedFilters.branchCount && (
              <div className="filter-content">
                <div className="range-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minBranchCount}
                    onChange={(e) => handleFilterChange('minBranchCount', e.target.value)}
                    className="filter-input"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxBranchCount}
                    onChange={(e) => handleFilterChange('maxBranchCount', e.target.value)}
                    className="filter-input"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tahun Berdiri */}
          <div className="filter-group">
            <div 
              className="filter-title" 
              onClick={() => toggleFilter('yearFounded')}
            >
              <i className="fas fa-calendar-alt"></i>
              Tahun Berdiri
              <i className={`fas fa-chevron-down ${expandedFilters.yearFounded ? 'expanded' : ''}`}></i>
            </div>
            {expandedFilters.yearFounded && (
              <div className="filter-content">
                <div className="range-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minYearFounded}
                    onChange={(e) => handleFilterChange('minYearFounded', e.target.value)}
                    className="filter-input"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxYearFounded}
                    onChange={(e) => handleFilterChange('maxYearFounded', e.target.value)}
                    className="filter-input"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ROI */}
          <div className="filter-group">
            <div 
              className="filter-title" 
              onClick={() => toggleFilter('roi')}
            >
              <i className="fas fa-sync-alt"></i>
              Return of Investment (ROI)
              <i className={`fas fa-chevron-down ${expandedFilters.roi ? 'expanded' : ''}`}></i>
            </div>
            {expandedFilters.roi && (
              <div className="filter-content">
                <div className="range-inputs">
                  <input
                    type="number"
                    placeholder="Min (bulan)"
                    value={filters.minROI}
                    onChange={(e) => handleFilterChange('minROI', e.target.value)}
                    className="filter-input"
                  />
                  <input
                    type="number"
                    placeholder="Max (bulan)"
                    value={filters.maxROI}
                    onChange={(e) => handleFilterChange('maxROI', e.target.value)}
                    className="filter-input"
                  />
                </div>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <div className="search-results-header">
            <h2>
              {searchQuery ? `Mencari "${searchQuery}"...` : 'Semua Franchise'}
            </h2>
            {selectedCategoryName && (
              <p className="selected-category">
                Kategori: <strong>{selectedCategoryName}</strong>
              </p>
            )}
            <p>{total} franchise ditemukan</p>
          </div>

          {loading ? (
            <div className="loading">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Mencari franchise...</p>
            </div>
          ) : franchises.length > 0 ? (
            <div className="franchise-grid">
              {franchises.map((franchise, index) => (
                <FranchiseCard key={franchise.id || index} franchise={franchise} />
              ))}
            </div>
          ) : (
            <div className="no-results">
              <i className="fas fa-search"></i>
              <p>Tidak ada franchise yang ditemukan</p>
              <p>Coba ubah filter atau kata kunci pencarian</p>
            </div>
          )}

          {/* Pagination */}
          {total > limit && (
            <div className="pagination">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                <i className="fas fa-chevron-left"></i>
                Sebelumnya
              </button>
              <span className="page-info">
                Halaman {currentPage} dari {Math.ceil(total / limit)}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage >= Math.ceil(total / limit)}
                className="pagination-btn"
              >
                Selanjutnya
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Search;