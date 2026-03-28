/**
 * Input validation utilities for trading data
 */

/**
 * Validate stock symbol format (1-5 uppercase letters)
 * @param {string} symbol
 * @returns {object} { valid: boolean, error?: string }
 */
export const validateSymbol = (symbol) => {
  if (!symbol || typeof symbol !== "string") {
    return { valid: false, error: "Symbol is required" };
  }
  if (!/^[A-Z]{1,5}$/.test(symbol.trim())) {
    return { valid: false, error: "Symbol must be 1-5 uppercase letters" };
  }
  return { valid: true };
};

/**
 * Validate trade quantity
 * @param {number} quantity
 * @param {number} minQty
 * @param {number} maxQty
 * @returns {object} { valid: boolean, error?: string }
 */
export const validateQuantity = (quantity, minQty = 1, maxQty = 100_000) => {
  if (quantity == null || !Number.isInteger(quantity)) {
    return { valid: false, error: "Quantity must be a whole number" };
  }
  if (quantity < minQty) {
    return { valid: false, error: `Quantity must be at least ${minQty}` };
  }
  if (quantity > maxQty) {
    return { valid: false, error: `Quantity cannot exceed ${maxQty}` };
  }
  return { valid: true };
};

/**
 * Validate trade price
 * @param {number} price
 * @returns {object} { valid: boolean, error?: string }
 */
export const validatePrice = (price) => {
  if (price == null || typeof price !== "number" || price <= 0) {
    return { valid: false, error: "Price must be a positive number" };
  }
  return { valid: true };
};

/**
 * Validate cash available for trade
 * @param {number} cash
 * @param {number} quantity
 * @param {number} price
 * @returns {object} { valid: boolean, error?: string }
 */
export const validateCashAvailable = (cash, quantity, price) => {
  const required = quantity * price;
  if (required > cash) {
    return {
      valid: false,
      error: `Insufficient cash: need $${required.toFixed(2)}, have $${cash.toFixed(2)}`,
    };
  }
  return { valid: true };
};

/**
 * Validate position exists for sale
 * @param {number} currentShares
 * @param {number} quantityToSell
 * @returns {object} { valid: boolean, error?: string }
 */
export const validatePositionExists = (currentShares, quantityToSell) => {
  if (!currentShares || currentShares < quantityToSell) {
    return {
      valid: false,
      error: `Cannot sell ${quantityToSell} shares: only have ${currentShares || 0}`,
    };
  }
  return { valid: true };
};
