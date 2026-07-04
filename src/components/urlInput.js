import { parseUrlList } from '../utils/validators.js';

export const renderUrlInput = () => {
  return `
    <div class="input-section glass-card">
      <div class="input-wrapper">
        <textarea 
          id="url-input" 
          placeholder="Enter URLs to scan, one per line...&#10;Example: https://google.com"
          aria-label="URLs to scan"
        ></textarea>
      </div>
      <div id="url-tags" class="url-tags"></div>
      <button id="btn-scan" class="btn-scan" disabled>
        ⚡ Scan All URLs
      </button>
    </div>
  `;
};

export const bindUrlInputEvents = (onScan) => {
  const textarea = document.getElementById('url-input');
  const tagsContainer = document.getElementById('url-tags');
  const btnScan = document.getElementById('btn-scan');
  
  let currentUrls = [];

  const updateTags = () => {
    tagsContainer.innerHTML = '';
    
    currentUrls.forEach((item, index) => {
      const tag = document.createElement('div');
      tag.className = 'url-tag';
      if (!item.isValid) tag.style.border = '1px solid var(--trust-danger)';
      
      tag.innerHTML = `
        <span>${item.domain || item.original}</span>
        <button data-index="${index}" aria-label="Remove URL">&times;</button>
      `;
      tagsContainer.appendChild(tag);
    });

    const validCount = currentUrls.filter(u => u.isValid).length;
    btnScan.disabled = validCount === 0 || currentUrls.length > 10;
    
    if (currentUrls.length > 10) {
      btnScan.textContent = 'Maximum 10 URLs allowed';
    } else {
      btnScan.innerHTML = validCount > 0 ? `⚡ Scan ${validCount} URL${validCount > 1 ? 's' : ''}` : '⚡ Scan All URLs';
    }
  };

  const handleInput = () => {
    const text = textarea.value;
    currentUrls = parseUrlList(text);
    updateTags();
  };

  textarea.addEventListener('input', handleInput);
  textarea.addEventListener('change', handleInput);

  tagsContainer.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const index = parseInt(e.target.dataset.index, 10);
      const lines = textarea.value.split(/\r?\n/);
      lines.splice(index, 1);
      textarea.value = lines.join('\n');
      handleInput();
    }
  });

  btnScan.addEventListener('click', () => {
    const validUrls = currentUrls.filter(u => u.isValid).map(u => u.original);
    if (validUrls.length > 0) {
      onScan(validUrls);
    }
  });
};
