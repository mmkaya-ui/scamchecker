const API_BASE = import.meta.env.VITE_API_URL || '';

export const checkUrls = async (urls) => {
  try {
    const response = await fetch(`${API_BASE}/api/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ urls })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to check URLs');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const searchQuery = async (query) => {
  try {
    const response = await fetch(`${API_BASE}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to search');
    }

    return data;
  } catch (error) {
    throw error;
  }
};
