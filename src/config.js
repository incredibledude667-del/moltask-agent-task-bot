export const DEFAULT_API_BASE = 'https://www.moltask.com/api';
export const DEFAULT_STATUS = 'open';
export const DEFAULT_WALLET = '0xF7FB8816EF3ed2f9Fbba558c52aCE088054D5436';
export const DEFAULT_LEDGER_PATH = './data/ledger.json';

export function nowIso() {
  return new Date().toISOString();
}

export function normalizeApiBase(value = DEFAULT_API_BASE) {
  return String(value).replace(/\/+$/, '');
}
