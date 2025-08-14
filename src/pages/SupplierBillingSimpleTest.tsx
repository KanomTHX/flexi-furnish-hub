import React from 'react';
import SupplierBillingSimple from '@/components/warehouses/SupplierBillingSimple';

export default function SupplierBillingSimpleTest() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Supplier Billing Simple Test</h1>
        <p className="text-muted-foreground">ทดสอบ SupplierBillingSimple component</p>
      </div>
      
      <SupplierBillingSimple />
    </div>
  );
}