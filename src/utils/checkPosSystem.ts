// POS system check utility
export const checkPosConnection = () => Promise.resolve({ connected: true });
export const validatePosSettings = () => true;
export const checkPosSystemTables = () => Promise.resolve({ success: true, tables: [] });
export const checkPosSystemColumns = () => Promise.resolve({ success: true, columns: [] });

export default { checkPosConnection, validatePosSettings };