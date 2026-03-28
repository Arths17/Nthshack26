import { f2, fB, fV, sma } from './formatters';

describe('formatters utility functions', () => {
  test('f2 formats numbers to 2 decimal places', () => {
    expect(f2(1234.567)).toBe('1,234.57');
    expect(f2(null)).toBe('—');
  });

  test('fB formats billions and trillions', () => {
    expect(fB(1_500_000_000_000)).toBe('$1.50T');
    expect(fB(2_000_000_000)).toBe('$2.0B');
    expect(fB(3_000_000)).toBe('$3M');
    expect(fB(0)).toBe('—');
  });

  test('fV formats volume', () => {
    expect(fV(1_500_000_000)).toBe('1.5B');
    expect(fV(2_000_000)).toBe('2.0M');
    expect(fV(3_000)).toBe('3K');
    expect(fV(0)).toBe('—');
  });

  test('sma calculates simple moving average', () => {
    const arr = [
      { close: 1 },
      { close: 2 },
      { close: 3 },
      { close: 4 },
      { close: 5 },
    ];
    expect(sma(arr, 3)).toEqual([null, null, 2, 3, 4]);
  });
});
