const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Example implementation using fetch
export async function getMyFranchises(accessToken) {
  const response = await fetch(`${API_URL}/franchise/my_franchises`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch franchises');
  }
  return response.json();
}

export async function getFranchiseById(id) {
  const response = await fetch(`${API_URL}/franchise/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch franchise by ID');
  }
  return response.json();
}

export async function getFranchisePrivateById(id, accessToken) {
  const response = await fetch(`${API_URL}/franchise/${id}?showPrivate=true`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch private franchise by ID');
  }
  return response.json();
}

export async function boostFranchise(id, pkg, accessToken) {
  const response = await fetch(`${API_URL}/boost/${id}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ package: String(pkg) })
  });
  if (!response.ok) {
    let errorBody;
    try {
      errorBody = await response.json();
    } catch (e) {
      errorBody = await response.text();
    }
    const msg = (errorBody && (errorBody.error || errorBody.message)) || (typeof errorBody === 'string' ? errorBody : JSON.stringify(errorBody));
    throw new Error(msg || 'Failed to initiate boost');
  }
  return response.json();
}

export async function getCategories() {
  const response = await fetch(`${API_URL}/franchise/categories`);
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
}

export async function searchFranchises(query, searchByImage = null) {
  const formData = new FormData();
  
  // Add searchQuery
  if (query.searchQuery) {
    formData.append('search_query', query.searchQuery);
  }
  
  // Add category (optional)
  if (query.category) {
    formData.append('category', query.category);
  }
  
  // Add numeric filters (convert to int if not empty)
  if (query.minInvestment && query.minInvestment !== '') {
    formData.append('min_investment', parseInt(query.minInvestment));
  }
  if (query.maxInvestment && query.maxInvestment !== '') {
    formData.append('max_investment', parseInt(query.maxInvestment));
  }
  if (query.minMonthlyRevenue && query.minMonthlyRevenue !== '') {
    formData.append('min_monthly_revenue', parseInt(query.minMonthlyRevenue));
  }
  if (query.minROI && query.minROI !== '') {
    formData.append('min_roi', parseInt(query.minROI));
  }
  if (query.maxROI && query.maxROI !== '') {
    formData.append('max_roi', parseInt(query.maxROI));
  }
  if (query.minBranchCount && query.minBranchCount !== '') {
    formData.append('min_branch_count', parseInt(query.minBranchCount));
  }
  if (query.maxBranchCount && query.maxBranchCount !== '') {
    formData.append('max_branch_count', parseInt(query.maxBranchCount));
  }
  if (query.minYearFounded && query.minYearFounded !== '') {
    formData.append('min_year_founded', parseInt(query.minYearFounded));
  }
  if (query.maxYearFounded && query.maxYearFounded !== '') {
    formData.append('max_year_founded', parseInt(query.maxYearFounded));
  }
  
  // Add pagination
  if (query.page) {
    formData.append('page', parseInt(query.page));
  }
  if (query.limit) {
    formData.append('limit', parseInt(query.limit));
  }
  
  // Add image file if provided
  if (searchByImage) {
    formData.append('search_by_image', searchByImage);
  }
  
  const response = await fetch(`${API_URL}/franchise`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Failed to search franchises');
  }
  return response.json();
}

export async function uploadFranchise(data, accessToken) {
  try {
    const response = await fetch(`${API_URL}/franchise/upload`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: data,
    });

    if (!response.ok) {
      // Try to decode JSON error body, fallback to text
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (e) {
        errorBody = await response.text();
      }
      console.error('Upload failed with status:', response.status, 'body:', errorBody);
      const msg = (errorBody && (errorBody.error || errorBody.message)) || (typeof errorBody === 'string' ? errorBody : JSON.stringify(errorBody));
      throw new Error(msg || `Failed to upload franchise (status ${response.status})`);
    }
    return response.json();
  } catch (err) {
    throw new Error(err.message || 'Failed to upload franchise');
  }
}

export async function editFranchise(id, data, accessToken) {
  try {
    const response = await fetch(`${API_URL}/franchise/edit/${id}`, {
      method: 'PUT',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: data,
    });

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (e) {
        errorBody = await response.text();
      }
      const msg = (errorBody && (errorBody.error || errorBody.message)) || (typeof errorBody === 'string' ? errorBody : JSON.stringify(errorBody));
      throw new Error(msg || `Failed to edit franchise (status ${response.status})`);
    }
    return response.json();
  } catch (err) {
    throw new Error(err.message || 'Failed to edit franchise');
  }
}

export async function getFranchiseLocations(brandName, province) {
  const params = new URLSearchParams();
  if (brandName) params.append('brand', brandName);
  if (province) params.append('province', province);

  const response = await fetch(`${API_URL}/franchise/locations?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch franchise locations');
  }
  const data = await response.json();

  // Map API response to expected format
  return {
    locations: Array.isArray(data.results) ? data.results.map(item => ({
      id: item.place_id,
      name: item.name,
      address: item.formatted_address,
      lat: item.geometry.location.lat,
      lng: item.geometry.location.lng,
      rating: item.rating,
      openNow: item.opening_hours?.open_now
    })) : [],
    status: data.status
  };
}

export async function deleteFranchise(id, accessToken) {
  try {
    const response = await fetch(`${API_URL}/franchise/delete/${id}`, {
      method: 'DELETE',
      mode: 'cors',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (e) {
        errorBody = await response.text();
      }
      const msg = (errorBody && (errorBody.error || errorBody.message)) || (typeof errorBody === 'string' ? errorBody : JSON.stringify(errorBody));
      throw new Error(msg || `Failed to delete franchise (status ${response.status})`);
    }
    // Some DELETE endpoints return 204 No Content
    try {
      return await response.json();
    } catch (_) {
      return { success: true };
    }
  } catch (err) {
    throw new Error(err.message || 'Failed to delete franchise');
  }
}

// Admin API functions
export async function getUnverifiedFranchises(accessToken) {
  const response = await fetch(`${API_URL}/admin/verify-franchise`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch unverified franchises');
  }
  return response.json();
}

export async function verifyFranchise(id, status, accessToken) {
  const response = await fetch(`${API_URL}/admin/verify-franchise/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  });
  if (!response.ok) {
    let errorBody;
    try {
      errorBody = await response.json();
    } catch (e) {
      errorBody = await response.text();
    }
    const msg = (errorBody && (errorBody.error || errorBody.message)) || (typeof errorBody === 'string' ? errorBody : JSON.stringify(errorBody));
    throw new Error(msg || 'Failed to verify franchise');
  }
  return response.json();
}

