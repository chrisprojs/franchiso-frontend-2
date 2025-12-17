const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export async function register({ name, email, password, role }) {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password, role }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Register gagal');
  }

  return await response.json();
}

export async function login({ email, password }) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Login gagal');
  }

  return await response.json();
}

export async function verifyEmail({ email, verification_code }) {
  const response = await fetch(`${API_URL}/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, verification_code }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Jika error, throw dengan detail error dan remaining_attempts jika ada
    const error = {
      message: data.error || 'Verifikasi email gagal',
      remaining_attempts: data.remaining_attempts,
    };
    throw error;
  }

  return data;
}