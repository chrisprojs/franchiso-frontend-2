import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store';

function Navbar() {
  const user = useSelector(state => state.franchisoAuth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    // Hapus cookie refresh_token
    document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    // Reset state auth
    dispatch(logout());
    setOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <span role="img" aria-label="store">🏪</span>
        <b>Franchiso</b>
      </div>
      <div className="nav-links">
        <Link to="/">Beranda</Link>
        <Link to="/search">Cari</Link>
        <Link to="/about">Tentang Kami</Link>
      </div>
      <div className="nav-actions">
        {!user && <Link to="/register" className="btn-outline">Daftar</Link>}
        {!user && <Link to="/login" className="btn-outline">Login</Link>}
        {user && (
          <div ref={menuRef} className="user-menu">
            <button
              onClick={() => setOpen(prev => !prev)}
              className="btn-ghost user-button"
            >
              Hi, {user.name.split(' ')[0]}
              <span aria-hidden>▾</span>
            </button>
            {open && (
              <div className="dropdown-menu">
                <Link to="/profile" onClick={() => setOpen(false)} className="dropdown-item">Lihat Profile</Link>
                {user.role === 'admin' && (
                  <Link to="/dashboard/admin" onClick={() => setOpen(false)} className="dropdown-item">Admin Dashboard</Link>
                )}
                {user.role === 'franchisor' && (
                  <Link to="/dashboard/franchisor" onClick={() => setOpen(false)} className="dropdown-item">Franchisor Dashboard</Link>
                )}
                <button onClick={handleLogout} className="dropdown-item">Keluar</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
