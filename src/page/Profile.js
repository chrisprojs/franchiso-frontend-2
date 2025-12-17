import React from 'react';
import { useSelector } from 'react-redux';

function Profile() {
  const user = useSelector(state => state.franchisoAuth.user);

  if (!user) {
    return (
      <div style={{ padding: '24px' }}>
        <h2>Profil</h2>
        <p>Anda belum login.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <h2>Profil</h2>
      <div style={{ marginTop: '12px' }}>
        <div><b>Nama:</b> {user.name}</div>
        <div><b>Email:</b> {user.email}</div>
        {user.role && <div><b>Role:</b> {user.role}</div>}
      </div>
    </div>
  );
}

export default Profile;

