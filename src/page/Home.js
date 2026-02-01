import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { searchFranchises } from '../api/FranchiseAPI';
import FranchiseCard from '../component/FranchiseCard';

function Home() {
  const user = useSelector(state => state.franchisoAuth.user);
  const navigate = useNavigate();
  const [homeSearch, setHomeSearch] = useState('');

  // Section data: ROI tercepat, Top cabang, Termurah
  const [roiFranchises, setRoiFranchises] = useState([]);
  const [branchFranchises, setBranchFranchises] = useState([]);
  const [cheapFranchises, setCheapFranchises] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState({ roi: true, branch: true, cheap: true });

  // Auto-redirect based on role
  useEffect(() => {
    if (user?.role === 'Franchisor') {
      navigate('/dashboard/franchisor', { replace: true });
    } else if (user?.role === 'Admin') {
      navigate('/dashboard/admin', { replace: true });
    }
  }, [user, navigate]);

  // Fetch section lists only for guest or Franchisee
  useEffect(() => {
    if (user && user.role !== 'Franchisee') return;

    const fetchSections = async () => {
      setSectionsLoading({ roi: true, branch: true, cheap: true });
      try {
        const [roiRes, branchRes, cheapRes] = await Promise.all([
          searchFranchises({ page: 1, limit: 8, orderBy: 'roi', orderDirection: 'asc' }),
          searchFranchises({ page: 1, limit: 8, orderBy: 'branch_count', orderDirection: 'desc' }),
          searchFranchises({ page: 1, limit: 8, orderBy: 'investment', orderDirection: 'asc' }),
        ]);
        setRoiFranchises(roiRes.franchises || []);
        setBranchFranchises(branchRes.franchises || []);
        setCheapFranchises(cheapRes.franchises || []);
      } catch (err) {
        console.error('Error fetching home sections:', err);
        setRoiFranchises([]);
        setBranchFranchises([]);
        setCheapFranchises([]);
      } finally {
        setSectionsLoading({ roi: false, branch: false, cheap: false });
      }
    };

    fetchSections();
  }, [user]);

  let content;
  if (!user || user.role === 'Franchisee') {
    content = (
      <>
        <div className="home-content">
          <div className="home-img-left">
            <img src="/image/img1.png" alt="avatar" />
          </div>
          <div className="home-center">
            <h1>Temukan <span className="highlight">Franchise</span><br />Impian Anda</h1>
            <p>Mulailah perjalanan bisnis anda hari ini dengan Franchiso.</p>
            <div className="powered-by-gemini-badge">
              <i className="fas fa-sparkles"></i>
              <span>Powered By Gemini AI</span>
            </div>
            <form
              className="search-box"
              onSubmit={(e) => {
                e.preventDefault();
                const q = homeSearch.trim();
                navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
              }}
            >
              <input
                type="text"
                placeholder="Cari Franchise..."
                value={homeSearch}
                onChange={(e) => setHomeSearch(e.target.value)}
              />
              <button type="submit" className="btn-primary"><span role="img" aria-label="search">🔍</span> Cari</button>
            </form>
          </div>
          <div className="home-img-right">
            <img src="/image/img2.png" alt="store" />
          </div>
        </div>

        <div className="home-sections">
          <section className="home-section">
            <h2 className="home-section-title">Return Of Investment Tercepat 👑</h2>
            {sectionsLoading.roi ? (
              <div className="home-section-loading">Memuat...</div>
            ) : (
              <div className="home-franchise-grid">
                {roiFranchises.map((franchise, index) => (
                  <FranchiseCard key={franchise.id || index} franchise={franchise} />
                ))}
              </div>
            )}
          </section>

          <section className="home-section">
            <h2 className="home-section-title">Top Franchise Berdasarkan Jumlah Cabang 🏪</h2>
            {sectionsLoading.branch ? (
              <div className="home-section-loading">Memuat...</div>
            ) : (
              <div className="home-franchise-grid">
                {branchFranchises.map((franchise, index) => (
                  <FranchiseCard key={franchise.id || index} franchise={franchise} />
                ))}
              </div>
            )}
          </section>

          <section className="home-section">
            <h2 className="home-section-title">Franchise Termurah 💲</h2>
            {sectionsLoading.cheap ? (
              <div className="home-section-loading">Memuat...</div>
            ) : (
              <div className="home-franchise-grid">
                {cheapFranchises.map((franchise, index) => (
                  <FranchiseCard key={franchise.id || index} franchise={franchise} />
                ))}
              </div>
            )}
          </section>
        </div>
      </>
    );
  } else {
    content = null;
  }

  return (
    <div className="home-page">
      {content}
      <footer className="footer">© 2025 Franchiso. All rights reserved.</footer>
    </div>
  );
}

export default Home;
