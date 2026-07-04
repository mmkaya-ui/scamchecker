import { formatScore } from '../utils/format.js';

export const renderScoreGauge = (score, colorStr, idPrefix) => {
  const displayScore = formatScore(score);
  
  // Circle math
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // ~339.29
  // If score is null/undefined, show empty
  const percentage = score !== null ? Math.min(Math.max(score, 0), 100) / 100 : 0;
  const strokeDashoffset = circumference - (percentage * circumference);

  return `
    <div class="gauge-container">
      <svg class="gauge-svg" viewBox="0 0 120 120" role="meter" aria-label="Trust score: ${displayScore} out of 100" aria-valuenow="${score || 0}" aria-valuemin="0" aria-valuemax="100">
        <circle class="gauge-bg" cx="60" cy="60" r="${radius}"></circle>
        <circle 
          class="gauge-progress" 
          cx="60" cy="60" r="${radius}" 
          style="stroke: var(--trust-${colorStr}); stroke-dasharray: ${circumference}; stroke-dashoffset: ${circumference}; /* Will be animated to ${strokeDashoffset} */"
          id="gauge-ring-${idPrefix}"
        ></circle>
      </svg>
      <div class="gauge-text color-${colorStr}" id="gauge-text-${idPrefix}">${displayScore}</div>
    </div>
  `;
};

// Function to trigger animation after DOM insertion
export const animateGauge = (idPrefix, score, duration = 1200) => {
  const ring = document.getElementById(`gauge-ring-${idPrefix}`);
  const text = document.getElementById(`gauge-text-${idPrefix}`);
  
  if (ring && score !== null) {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const percentage = Math.min(Math.max(score, 0), 100) / 100;
    const strokeDashoffset = circumference - (percentage * circumference);
    
    // Trigger reflow to ensure animation plays
    void ring.offsetWidth;
    ring.style.strokeDashoffset = strokeDashoffset;
  }
  
  if (text && score !== null) {
    const start = 0;
    const target = score;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      text.textContent = Math.round(current);
    }, 16);
  }
};
