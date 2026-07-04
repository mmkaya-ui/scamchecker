export const renderEmptyState = () => `
  <div style="text-align: center; padding: 4rem 1rem; opacity: 0.7; animation: slideUp 0.5s ease;">
    <svg xmlns="http://www.w3.org/O/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="width: 64px; height: 64px; margin-bottom: 1rem; color: var(--text-muted); animation: float 3s ease-in-out infinite;">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
    <h2 style="font-size: 1.25rem; margin-bottom: 0.5rem;">Ready to Scan</h2>
    <p style="color: var(--text-secondary); max-width: 400px; margin: 0 auto;">
      Enter one or more URLs above to begin. TrustedLens will analyze them against multiple threat intelligence databases and scam blocklists.
    </p>
  </div>
`;
