export const formatScore = (score) => {
  if (score === null || score === undefined) return 'N/A';
  return Math.round(score);
};

export const formatDomainAge = (days) => {
  if (days === null || days === undefined) return 'Unknown';
  if (days < 30) return `${days} days (⚠️ very new)`;
  
  if (days < 365) return `${days} days`;
  
  const years = (days / 365.25).toFixed(1);
  return `${years} years`;
};

export const escapeHtml = (unsafe) => {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};
