import { validateSymbol } from './validation';

describe('validateSymbol', () => {
  it('accepts valid uppercase symbols', () => {
    expect(validateSymbol('AAPL').valid).toBe(true);
    expect(validateSymbol('TSLA').valid).toBe(true);
  });

  it('rejects lowercase symbols', () => {
    expect(validateSymbol('aapl').valid).toBe(false);
  });

  it('rejects symbols longer than 5 chars', () => {
    expect(validateSymbol('TOOLONG').valid).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateSymbol('').valid).toBe(false);
  });
});
