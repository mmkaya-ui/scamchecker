export const checkUrls = async (urls) => {
  try {
    const response = await fetch('/api/check', {
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
