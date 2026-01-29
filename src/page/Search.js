import React, { useState, useEffect } from 'react';
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
  const [isSuggestedByAI, setIsSuggestedByAI] = useState(false);
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
  const imageInputRef = React.useRef(null);

  // Sync state from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setSearchQuery(q);
    
    // Sync filters from URL
    setFilters({
      category: params.get('category') || '',
      minInvestment: params.get('minInvestment') || '',
      maxInvestment: params.get('maxInvestment') || '',
      minMonthlyRevenue: params.get('minMonthlyRevenue') || '',
      minROI: params.get('minROI') || '',
      maxROI: params.get('maxROI') || '',
      minBranchCount: params.get('minBranchCount') || '',
      maxBranchCount: params.get('maxBranchCount') || '',
      minYearFounded: params.get('minYearFounded') || '',
      maxYearFounded: params.get('maxYearFounded') || '',
    });
    
    const page = parseInt(params.get('page')) || 1;
    setCurrentPage(page);
  }, [location.search]);

  // Update selected category name when filters.category changes
  useEffect(() => {
    if (filters.category && categories.length > 0) {
      const selectedCategory = categories.find(cat => cat.id === filters.category);
      setSelectedCategoryName(selectedCategory ? selectedCategory.category : '');
    } else {
      setSelectedCategoryName('');
    }
  }, [filters.category, categories]);

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

  // Format number to Rupiah string (with thousand separators)
  const formatRupiah = (value) => {
    if (!value || value === '') return '';
    const numericValue = value.toString().replace(/\D/g, '');
    if (numericValue === '') return '';
    // Format with thousand separators (Indonesian format uses dot as thousand separator)
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Parse Rupiah formatted string to number (remove all non-digit characters including "Rp" and spaces)
  const parseRupiah = (value) => {
    if (!value || value === '') return '';
    // Remove all non-digit characters (including "Rp", spaces, dots, etc.)
    return value.toString().replace(/\D/g, '');
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
  };

  const handleRupiahFilterChange = (filterName, formattedValue) => {
    const numericValue = parseRupiah(formattedValue);
    handleFilterChange(filterName, numericValue);
  };

  const handleFilterKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    }
  };

  const handleFilterBlur = (e) => {
    // Trigger search when leaving filter input (except searchQuery)
    if (e) {
      e.preventDefault();
    }
    const params = new URLSearchParams();
    
    // Add search query
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }
    
    // Add filters to URL params
    if (filters.category) params.set('category', filters.category);
    if (filters.minInvestment) params.set('minInvestment', filters.minInvestment);
    if (filters.maxInvestment) params.set('maxInvestment', filters.maxInvestment);
    if (filters.minMonthlyRevenue) params.set('minMonthlyRevenue', filters.minMonthlyRevenue);
    if (filters.minROI) params.set('minROI', filters.minROI);
    if (filters.maxROI) params.set('maxROI', filters.maxROI);
    if (filters.minBranchCount) params.set('minBranchCount', filters.minBranchCount);
    if (filters.maxBranchCount) params.set('maxBranchCount', filters.maxBranchCount);
    if (filters.minYearFounded) params.set('minYearFounded', filters.minYearFounded);
    if (filters.maxYearFounded) params.set('maxYearFounded', filters.maxYearFounded);
    
    // Reset to page 1 and navigate
    params.set('page', '1');
    navigate({ pathname: '/search', search: params.toString() });
  };

  // Perform search when URL params or image search changes
  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
        // Read params from URL to ensure consistency
        const urlParams = new URLSearchParams(location.search);
        const urlSearchQuery = urlParams.get('q') || '';
        const urlPage = parseInt(urlParams.get('page')) || 1;
        
        const urlFilters = {
          category: urlParams.get('category') || '',
          minInvestment: urlParams.get('minInvestment') || '',
          maxInvestment: urlParams.get('maxInvestment') || '',
          minMonthlyRevenue: urlParams.get('minMonthlyRevenue') || '',
          minROI: urlParams.get('minROI') || '',
          maxROI: urlParams.get('maxROI') || '',
          minBranchCount: urlParams.get('minBranchCount') || '',
          maxBranchCount: urlParams.get('maxBranchCount') || '',
          minYearFounded: urlParams.get('minYearFounded') || '',
          maxYearFounded: urlParams.get('maxYearFounded') || '',
        };

        const searchParams = {
          searchQuery: urlSearchQuery,
          page: urlPage,
          limit,
          ...urlFilters
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
        setIsSuggestedByAI(response.is_suggested_by_ai || false);
      } catch (error) {
        console.error('Error searching franchises:', error);
        setFranchises([]);
        setTotal(0);
        setIsSuggestedByAI(false);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [location.search, searchByImage, limit]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    // Add search query
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }
    
    // Add filters to URL params
    if (filters.category) params.set('category', filters.category);
    if (filters.minInvestment) params.set('minInvestment', filters.minInvestment);
    if (filters.maxInvestment) params.set('maxInvestment', filters.maxInvestment);
    if (filters.minMonthlyRevenue) params.set('minMonthlyRevenue', filters.minMonthlyRevenue);
    if (filters.minROI) params.set('minROI', filters.minROI);
    if (filters.maxROI) params.set('maxROI', filters.maxROI);
    if (filters.minBranchCount) params.set('minBranchCount', filters.minBranchCount);
    if (filters.maxBranchCount) params.set('maxBranchCount', filters.maxBranchCount);
    if (filters.minYearFounded) params.set('minYearFounded', filters.minYearFounded);
    if (filters.maxYearFounded) params.set('maxYearFounded', filters.maxYearFounded);
    
    // Reset to page 1 and navigate
    params.set('page', '1');
    navigate({ pathname: '/search', search: params.toString() });
  };

  const clearFilters = () => {
    setSearchByImage(null);
    setImagePreview(null);
    // Navigate to clean URL to trigger search reset
    navigate({ pathname: '/search', search: '' });
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
      // Create preview first
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Set image file - this will trigger search via useEffect
      setSearchByImage(file);
    }
  };

  const handleRemoveImage = () => {
    setSearchByImage(null);
    setImagePreview(null);
    // Reset input file value to allow selecting the same file again
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
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
              ref={imageInputRef}
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
                    type="text"
                    placeholder="Min (contoh: 1000000)"
                    value={filters.minInvestment ? `Rp ${formatRupiah(filters.minInvestment)}` : ''}
                    onChange={(e) => handleRupiahFilterChange('minInvestment', e.target.value)}
                    onKeyPress={handleFilterKeyPress}
                    onBlur={handleFilterBlur}
                    className="filter-input"
                  />
                </div>
                <div className="range-inputs">
                  <input
                    type="text"
                    placeholder="Max (contoh: 5000000)"
                    value={filters.maxInvestment ? `Rp ${formatRupiah(filters.maxInvestment)}` : ''}
                    onChange={(e) => handleRupiahFilterChange('maxInvestment', e.target.value)}
                    onKeyPress={handleFilterKeyPress}
                    onBlur={handleFilterBlur}
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
                    type="text"
                    placeholder="Min (contoh: 500000)"
                    value={filters.minMonthlyRevenue ? `Rp ${formatRupiah(filters.minMonthlyRevenue)}` : ''}
                    onChange={(e) => handleRupiahFilterChange('minMonthlyRevenue', e.target.value)}
                    onKeyPress={handleFilterKeyPress}
                    onBlur={handleFilterBlur}
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
                  onChange={(e) => {
                    handleFilterChange('category', e.target.value);
                    // Trigger search immediately when category changes
                    const params = new URLSearchParams();
                    if (searchQuery.trim()) params.set('q', searchQuery.trim());
                    if (e.target.value) params.set('category', e.target.value);
                    Object.keys(filters).forEach(key => {
                      if (key !== 'category' && filters[key]) {
                        params.set(key, filters[key]);
                      }
                    });
                    params.set('page', '1');
                    navigate({ pathname: '/search', search: params.toString() });
                  }}
                  onKeyPress={handleFilterKeyPress}
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
                    onKeyPress={handleFilterKeyPress}
                    onBlur={handleFilterBlur}
                    className="filter-input"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxBranchCount}
                    onChange={(e) => handleFilterChange('maxBranchCount', e.target.value)}
                    onKeyPress={handleFilterKeyPress}
                    onBlur={handleFilterBlur}
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
                    onKeyPress={handleFilterKeyPress}
                    onBlur={handleFilterBlur}
                    className="filter-input"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxYearFounded}
                    onChange={(e) => handleFilterChange('maxYearFounded', e.target.value)}
                    onKeyPress={handleFilterKeyPress}
                    onBlur={handleFilterBlur}
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
                    onKeyPress={handleFilterKeyPress}
                    onBlur={handleFilterBlur}
                    className="filter-input"
                  />
                  <input
                    type="number"
                    placeholder="Max (bulan)"
                    value={filters.maxROI}
                    onChange={(e) => handleFilterChange('maxROI', e.target.value)}
                    onKeyPress={handleFilterKeyPress}
                    onBlur={handleFilterBlur}
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
            <div className="header-title-wrapper">
              <h2>
                {(() => {
                  const params = new URLSearchParams(location.search);
                  const urlQuery = params.get('q') || '';
                  return urlQuery ? `Mencari "${urlQuery}"...` : 'Semua Franchise';
                })()}
              </h2>
              {isSuggestedByAI && (
                <div className="ai-suggested-badge">
                  <i className="fas fa-sparkles"></i>
                  <span>Disarankan oleh AI</span>
                </div>
              )}
            </div>
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
            <div className={`franchise-grid`}>
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
                onClick={() => {
                  const newPage = Math.max(1, currentPage - 1);
                  const params = new URLSearchParams(location.search);
                  params.set('page', newPage.toString());
                  navigate({ pathname: '/search', search: params.toString() });
                }}
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
                onClick={() => {
                  const newPage = currentPage + 1;
                  const params = new URLSearchParams(location.search);
                  params.set('page', newPage.toString());
                  navigate({ pathname: '/search', search: params.toString() });
                }}
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