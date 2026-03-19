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

// Mock ResizeObserver for ECharts/Chart.js
if (typeof window !== 'undefined') {
  window.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
  }));
}

// Mock complex visualization components to avoid canvas issues in jsdom
vi.mock('react-chartjs-2', () => ({
  Bar: () => null,
}));

vi.mock('./components/DeepInsights', () => ({
  default: () => null,
}));

vi.mock('echarts-for-react', () => ({
  default: () => null,
}));
