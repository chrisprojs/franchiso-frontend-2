import React from 'react';
import AuthImage from '../component/AuthImage';
import AuthForm from '../component/AuthForm';

function Register() {
  return (
    <div className="auth-page">
      <div className="auth-content">
        <AuthImage />
        <AuthForm type="register" />
      </div>
      <footer className="footer">© 2025 Franchiso. All rights reserved.</footer>
    </div>
  );
}

export default Register;
