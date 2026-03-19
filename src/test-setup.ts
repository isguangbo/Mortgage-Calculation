import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock matchMedia for responsive design testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver for Chart.js
if (typeof window !== 'undefined') {
  window.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
  }));
}

// Mock Chart.js to avoid canvas issues in jsdom
vi.mock('react-chartjs-2', () => ({
  Bar: () => null,
}));
