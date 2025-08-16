// Simple warehouse hook
import { useState } from 'react';

export const useWarehouse = () => {
  const [warehouses] = useState([]);
  const [stockLevel] = useState([]);
  const [loading] = useState(false);

  return {
    warehouses,
    stockLevel,
    loading,
    getMovementHistory: () => Promise.resolve([])
  };
};