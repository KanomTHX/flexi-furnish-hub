// Settings helpers placeholder
export const validateSettings = (settings: any) => true;
export const validateGeneralSettings = (settings: any) => true;
export const validateUserSettings = (settings: any) => true;
export const saveSettings = (settings: any) => Promise.resolve();
export const formatSystemInfo = (info: any) => info;
export const validateUserRole = (role: string) => true;
export const checkPermissions = (user: any, action: string) => true;
export const getLanguages = () => [
  { id: 'th', name: 'ไทย', flag: '🇹🇭' },
  { id: 'en', name: 'English', flag: '🇺🇸' }
];
export const getTimezones = () => [
  { id: 'Asia/Bangkok', name: 'Bangkok', offset: '+07:00' },
  { id: 'UTC', name: 'UTC', offset: '+00:00' }
];
export const getCurrencies = () => [
  { id: 'THB', name: 'Thai Baht', symbol: '฿' },
  { id: 'USD', name: 'US Dollar', symbol: '$' }
];
export const getUsers = () => [
  { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin' }
];
export const getAvailableLanguages = () => ['th', 'en'];
export const getAvailableTimezones = () => ['Asia/Bangkok', 'UTC'];
export const getAvailableCurrencies = () => ['THB', 'USD'];

export default { 
  validateSettings, 
  validateGeneralSettings,
  validateUserSettings,
  saveSettings, 
  formatSystemInfo, 
  validateUserRole, 
  checkPermissions,
  getAvailableLanguages,
  getAvailableTimezones,
  getAvailableCurrencies
};