import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { getMyFranchises, deleteFranchise } from '../api/FranchiseAPI'
import FranchiseCard from '../component/FranchiseCard'
import './Search.css'

function FranchisorDashboard() {
  const navigate = useNavigate()
  const accessToken = useSelector(state => state.franchisoAuth.accessToken)
  const user = useSelector(state => state.franchisoAuth.user)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [franchises, setFranchises] = useState([])

  useEffect(() => {
    const loadMyFranchises = async () => {
      if (!accessToken) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const response = await getMyFranchises(accessToken)
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

    loadMyFranchises()
  }, [accessToken])

  const handleUpload = () => {
    navigate('/franchise/upload')
  }

  const handleDelete = async (franchise) => {
    if (!franchise?.id) return
    const confirmDelete = window.confirm(`Hapus franchise "${franchise.brand || franchise.id}"?`)
    if (!confirmDelete) return
    try {
      await deleteFranchise(franchise.id, accessToken)
      setFranchises(prev => prev.filter(f => f.id !== franchise.id))
    } catch (e) {
      alert(e.message || 'Gagal menghapus franchise')
    }
  }

  return (
    <div className="search-page">
      <div className="search-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Franchise Milik Saya{user ? `, ${user.name.split(' ')[0]}` : ''}...</h2>
        <button className="btn-primary" onClick={handleUpload}>Upload Franchise</button>
      </div>

      <div className="search-container">
        <div className="main-content">
          {(!accessToken || !user) && (
            <div className="no-results">
              <i className="fas fa-user-lock"></i>
              <p>Silakan login untuk melihat franchise milik Anda</p>
              <button className="btn-primary" onClick={() => navigate('/login')}>Login</button>
            </div>
          )}

          {accessToken && user && (
            <>
              {loading ? (
                <div className="loading">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Memuat franchise...</p>
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
                      context="owner"
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  <i className="fas fa-box-open"></i>
                  <p>Anda belum memiliki franchise.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default FranchisorDashboard