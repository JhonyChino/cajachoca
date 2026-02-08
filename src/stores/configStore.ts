import { createSignal, createEffect } from 'solid-js';

// Available currencies
export type Currency = 'USD' | 'BOB' | 'EUR';

export interface AppConfig {
  currency: Currency;
  downloadPath: string;
}

// Default configuration
const defaultConfig: AppConfig = {
  currency: 'USD',
  downloadPath: '',
};

// Load config from localStorage
const loadConfig = (): AppConfig => {
  try {
    const stored = localStorage.getItem('cajachoca_config');
    if (stored) {
      return { ...defaultConfig, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Error loading config:', e);
  }
  return defaultConfig;
};

// Create signals
const [config, setConfig] = createSignal<AppConfig>(loadConfig());

// Save config to localStorage whenever it changes
createEffect(() => {
  try {
    localStorage.setItem('cajachoca_config', JSON.stringify(config()));
  } catch (e) {
    console.error('Error saving config:', e);
  }
});

// Update currency
export const setCurrency = (currency: Currency) => {
  setConfig(prev => ({ ...prev, currency }));
};

// Update download path
export const setDownloadPath = (path: string) => {
  setConfig(prev => ({ ...prev, downloadPath: path }));
};

// Get currency symbol
export const getCurrencySymbol = (currency?: Currency): string => {
  const curr = currency || config().currency;
  switch (curr) {
    case 'USD':
      return '$';
    case 'BOB':
      return 'Bs.';
    case 'EUR':
      return '€';
    default:
      return '$';
  }
};

// Get currency name
export const getCurrencyName = (currency?: Currency): string => {
  const curr = currency || config().currency;
  switch (curr) {
    case 'USD':
      return 'Dólar estadounidense';
    case 'BOB':
      return 'Bolivianos';
    case 'EUR':
      return 'Euro';
    default:
      return 'Dólar estadounidense';
  }
};

// Format currency amount
export const formatCurrency = (amount: number, currency?: Currency): string => {
  const curr = currency || config().currency;
  const symbol = getCurrencySymbol(curr);
  
  // Format number with 2 decimal places
  const formatted = amount.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `${symbol} ${formatted}`;
};

// Export config signal
export { config };