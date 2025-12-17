import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerApi, login as loginApi, verifyEmail } from '../api/AuthAPI';
import { useDispatch } from 'react-redux';
import { setAuth } from '../store';

function setCookie(name, value, days) {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + (value || '') + expires + '; path=/';
}

function AuthForm({ type }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(3);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let data;
      if (type === 'register') {
        data = await registerApi({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        });
        // Setelah registrasi berhasil, tampilkan form verifikasi
        setRegisteredEmail(form.email);
        setShowVerification(true);
        setRemainingAttempts(3);
      } else {
        data = await loginApi({
          email: form.email,
          password: form.password,
        });
        // Set accessToken ke redux, refreshToken ke cookie
        dispatch(setAuth({ accessToken: data.access_token, user: data.user }));
        setCookie('refresh_token', data.refresh_token, 7);
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await verifyEmail({
        email: registeredEmail,
        verification_code: verificationCode,
      });

      // Verifikasi berhasil, set token dan redirect
      dispatch(setAuth({ accessToken: data.access_token, user: data.user }));
      setCookie('refresh_token', data.refresh_token, 7);
      navigate('/');
    } catch (err) {
      // Handle error dengan remaining attempts
      if (err.remaining_attempts !== undefined) {
        setRemainingAttempts(err.remaining_attempts);
        
        // Jika remaining attempts <= 0 atau error maksimum tercapai, redirect ke register
        if (err.remaining_attempts <= 0 || err.message.includes('batas maksimum')) {
          setError(`${err.message}. Anda akan diarahkan ke halaman registrasi...`);
          setTimeout(() => {
            navigate('/register');
          }, 3000);
          return;
        }
        setError(`${err.message}. Sisa percobaan: ${err.remaining_attempts}`);
      } else {
        setError(err.message || 'Verifikasi email gagal');
      }
    } finally {
      setLoading(false);
    }
  };

  // Jika sedang dalam mode verifikasi (setelah registrasi)
  if (showVerification && type === 'register') {
    return (
      <form className="auth-form" onSubmit={handleVerifyEmail}>
        <h1>Verifikasi Email</h1>
        <p style={{ marginBottom: 20, color: '#666', textAlign: 'center' }}>
          Kami telah mengirimkan kode verifikasi ke <strong>{registeredEmail}</strong>
        </p>
        <input
          type="text"
          name="verification_code"
          placeholder="Masukkan kode verifikasi"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          required
          maxLength={6}
          style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
        />
        <div style={{ marginBottom: 10, color: '#666', fontSize: '0.9em', textAlign: 'center' }}>
          Sisa percobaan: <strong>{remainingAttempts}</strong>
        </div>
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Memverifikasi...' : 'Verifikasi'}
        </button>
        {error && (
          <div style={{ 
            color: remainingAttempts <= 0 ? 'red' : '#d32f2f', 
            marginTop: 8,
            textAlign: 'center',
            fontSize: '0.9em'
          }}>
            {error}
          </div>
        )}
        <div style={{ marginTop: 16, alignSelf: 'center', width: '100%', textAlign: 'center' }}>
          <span>
            Tidak menerima kode? <Link to="/register" onClick={() => setShowVerification(false)}>Registrasi ulang</Link>
          </span>
        </div>
      </form>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h1>{type === 'login' ? 'Login' : 'Register'}</h1>
      {type === 'register' && (
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
        />
      )}
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        required
      />
      {type === 'register' && (
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          required
        >
          <option value="">Role</option>
          <option value="Franchisee">Franchisee</option>
          <option value="Franchisor">Franchisor</option>
          <option value="Admin">Admin</option>
        </select>
      )}
      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? 'Loading...' : (type === 'login' ? 'Login' : 'Register')}
      </button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      <div style={{ marginTop: 16, alignSelf: 'center', width: '100%', textAlign: 'center' }}>
        {type === 'login' ? (
          <span>Belum punya akun? <Link to="/register">Register</Link></span>
        ) : (
          <span>Sudah punya akun? <Link to="/login">Login</Link></span>
        )}
      </div>
    </form>
  );
}

export default AuthForm;
