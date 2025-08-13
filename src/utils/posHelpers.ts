// POS helpers placeholder
export const calculateDiscount = (amount: number, rate: number) => amount * rate;
export const formatReceipt = (sale: any) => '';
export const validateBarcode = (barcode: string) => true;
export const generateSaleNumber = () => `SALE-${Date.now()}`;

export default { calculateDiscount, formatReceipt, validateBarcode };