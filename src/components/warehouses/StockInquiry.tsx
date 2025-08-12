import React from 'react';
import { DisabledWarehouseComponent } from './DisabledWarehouseComponent';

interface StockInquiryProps {
  searchFilters?: any;
  onFilterChange?: (filters: any) => void;
  onSerialNumberSelect?: (serialNumber: any) => void;
}

export function StockInquiry({ 
  searchFilters = {}, 
  onFilterChange,
  onSerialNumberSelect 
}: StockInquiryProps) {
  return (
    <DisabledWarehouseComponent 
      title="Stock Inquiry"
      description="Search and query stock information"
    />
  );
}

const StockInquiryDefault: React.FC = () => {
  return (
    <DisabledWarehouseComponent 
      title="Stock Inquiry"
      description="Search and query stock information"
    />
  );
};

export default StockInquiryDefault;