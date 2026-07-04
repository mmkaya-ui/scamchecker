export const renderSearchInput = () => {
  return `
    <div class="input-section glass-card">
      <div class="input-wrapper search-wrapper">
        <input 
          type="text" 
          id="search-input" 
          placeholder="e.g. IPTV, Buy Shoes, Crypto Exchange"
          aria-label="Search term"
        />
      </div>
      <p class="search-help">We'll find the top 5 services for this term and rank them by trust score.</p>
      <button id="btn-search" class="btn-scan" disabled>
        🔍 Search & Verify
      </button>
    </div>
  `;
};

export const bindSearchInputEvents = (onSearch) => {
  const input = document.getElementById('search-input');
  const btnSearch = document.getElementById('btn-search');
  
  const handleInput = () => {
    const val = input.value.trim();
    btnSearch.disabled = val.length === 0;
  };

  input.addEventListener('input', handleInput);
  input.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' && !btnSearch.disabled) {
      onSearch(input.value.trim());
    }
  });

  btnSearch.addEventListener('click', () => {
    const val = input.value.trim();
    if (val.length > 0) {
      onSearch(val);
    }
  });
};
