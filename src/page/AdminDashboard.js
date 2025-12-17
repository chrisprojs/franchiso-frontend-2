import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { getUnverifiedFranchises } from '../api/FranchiseAPI'
import FranchiseCard from '../component/FranchiseCard'
import './Search.css'

function AdminDashboard() {
  const navigate = useNavigate()
  const accessToken = useSelector(state => state.franchisoAuth.accessToken)
  const user = useSelector(state => state.franchisoAuth.user)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [franchises, setFranchises] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const loadUnverifiedFranchises = async () => {
      if (!accessToken) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const response = await getUnverifiedFranchises(accessToken)
        setFranchises(response.franchises || response || [])
        setError(null)
      } catch (e) {
        console.error(e)
        setError(e.message || 'Gagal memuat data')
        setFranchises([])
      } finally {
        setLoading(false)
      }
    }

    loadUnverifiedFranchises()
  }, [accessToken, refreshKey])

  return (
    <div className="search-page">
      <div className="search-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Verifikasi Franchise{user ? `, ${user.name.split(' ')[0]}` : ''}</h2>
      </div>

      <div className="search-container">
        <div className="main-content">
          {(!accessToken || !user) && (
            <div className="no-results">
              <i className="fas fa-user-lock"></i>
              <p>Silakan login sebagai admin untuk melihat franchise yang perlu diverifikasi</p>
              <button className="btn-primary" onClick={() => navigate('/login')}>Login</button>
            </div>
          )}

          {accessToken && user && (
            <>
              {loading ? (
                <div className="loading">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Memuat franchise yang perlu diverifikasi...</p>
                </div>
              ) : error ? (
                <div className="no-results">
                  <i className="fas fa-exclamation-triangle"></i>
                  <p>{error}</p>
                </div>
              ) : franchises.length > 0 ? (
                <div className="franchise-grid">
                  {franchises.map((franchise, index) => (
                    <FranchiseCard
                      key={franchise.id || index}
                      franchise={franchise}
                      context="admin"
                      onStatusChange={() => setRefreshKey(prev => prev + 1)}
                    />
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  <i className="fas fa-check-circle"></i>
                  <p>Tidak ada franchise yang perlu diverifikasi.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard