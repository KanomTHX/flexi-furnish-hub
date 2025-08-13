// POS system check utility
export const checkPosConnection = () => Promise.resolve({ connected: true });
export const validatePosSettings = () => true;

export default { checkPosConnection, validatePosSettings };