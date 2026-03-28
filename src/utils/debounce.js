/**
 * Debounce utility - delay function execution
 * @param {Function} func
 * @param {number} wait - milliseconds to wait
 * @returns {Function} debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle utility - limit function execution frequency
 * @param {Function} func
 * @param {number} limit - milliseconds between executions
 * @returns {Function} throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
