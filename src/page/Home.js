import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

function Home() {
  const user = useSelector(state => state.franchisoAuth.user);
  // const token = useSelector(state => state.franchisoAuth.accessToken);
  const navigate = useNavigate();
  const [homeSearch, setHomeSearch] = useState('');

  // Auto-redirect based on role
  useEffect(() => {
    if (user?.role === 'Franchisor') {
      navigate('/dashboard/franchisor', { replace: true });
    } else if (user?.role === 'Admin') {
      navigate('/dashboard/admin', { replace: true });
    }
  }, [user, navigate]);

  let content;
  if (!user || user.role === 'Franchisee') {
    content = (
      <div className="home-content">
        <div className="home-img-left">
          <img src="/image/img1.png" alt="avatar" />
        </div>
        <div className="home-center">
          <h1>Temukan <span className="highlight">Franchise</span><br />Impian Anda</h1>
          <p>Mulailah perjalanan bisnis anda hari ini dengan Franchiso.</p>
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
    );
  } else {
    // While redirecting for authenticated users, render nothing
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
