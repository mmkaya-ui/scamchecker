export const getTrustLevel = (score) => {
  if (score >= 80) return { label: 'High Trust', badge: 'Appears Safe', color: 'green' };
  if (score >= 60) return { label: 'Moderate', badge: 'Exercise Caution', color: 'yellow' };
  if (score >= 35) return { label: 'Low Trust', badge: 'Multiple Concerns', color: 'orange' };
  return { label: 'Very Low', badge: 'Likely Dangerous', color: 'red' };
};

export const aggregateScore = (results) => {
  const baseWeights = {
    ipqs: 0.20,
    virustotal: 0.15,
    safebrowsing: 0.10,
    scamadviser: 0.10,
    scamvoid: 0.08,
    urlvoid: 0.08,
    trustpilot: 0.09,
    whois: 0.12,
    ssl: 0.08
  };

  let totalAvailableWeight = 0;
  const availableServices = {};

  // First pass: identify available services and sum their base weights
  for (const [service, data] of Object.entries(results)) {
    if (data && data.available && typeof data.score === 'number') {
      availableServices[service] = data;
      totalAvailableWeight += baseWeights[service];
    }
  }

  // If fewer than 2 services are available, we can't reliably score
  const availableCount = Object.keys(availableServices).length;
  if (availableCount < 2) {
    return {
      trustScore: null,
      trustLevel: null,
      trustBadge: null,
      trustColor: null,
      availableCount,
      error: 'Insufficient data sources available to calculate a reliable score.'
    };
  }

  // Second pass: calculate weighted score, scaling up weights to equal 1.0 (100%)
  let weightedScoreSum = 0;
  for (const [service, data] of Object.entries(availableServices)) {
    // Redistribute weight: (baseWeight / totalAvailableWeight)
    const adjustedWeight = baseWeights[service] / totalAvailableWeight;
    weightedScoreSum += data.score * adjustedWeight;
  }

  const finalScore = Math.round(weightedScoreSum);
  const level = getTrustLevel(finalScore);

  return {
    trustScore: finalScore,
    trustLevel: level.label,
    trustBadge: level.badge,
    trustColor: level.color,
    availableCount,
  };
};
