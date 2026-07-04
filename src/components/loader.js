export const renderLoader = (urlCount) => {
  return `
    <div class="loader-section">
      <h2 style="font-size: 1.5rem; margin-bottom: 1rem;">Scanning ${urlCount} URL${urlCount > 1 ? 's' : ''}...</h2>
      <p style="color: var(--text-secondary);">Querying 9 security databases in real-time</p>
      
      <div class="loader-bar"></div>
      
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 2rem; opacity: 0.7;">
        <span class="url-tag">IPQualityScore ⟳</span>
        <span class="url-tag">VirusTotal ⟳</span>
        <span class="url-tag">Safe Browsing ⟳</span>
        <span class="url-tag">ScamVoid ⟳</span>
        <span class="url-tag">URLVoid ⟳</span>
      </div>
    </div>
  `;
};
