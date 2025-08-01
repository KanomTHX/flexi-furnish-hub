import { useState, useMemo, useCallback } from 'react';
import {
  Claim,
  ClaimStatistics,
  WarrantyPolicy,
  ClaimTemplate,
  Customer,
  Product,
  ClaimFilter,
  WarrantyFilter,
  CreateClaimForm,
  UpdateClaimForm,
  ClaimStatus,
  ClaimPriority,
  ClaimTimelineEntry,
  ClaimResolution,
  CustomerSatisfactionRating
} from '@/types/claims';
import {
  mockClaims,
  mockCustomers,
  mockProducts,
  mockWarrantyPolicies,
  mockClaimTemplates,
  calculateClaimsStatistics
} from '@/data/mockClaimsData';

export function useClaims() {
  // State management
  const [claims, setClaims] = useState<Claim[]>(mockClaims);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [warrantyPolicies, setWarrantyPolicies] = useState<WarrantyPolicy[]>(mockWarrantyPolicies);
  const [claimTemplates, setClaimTemplates] = useState<ClaimTemplate[]>(mockClaimTemplates);
  
  // Filters
  const [claimFilter, setClaimFilter] = useState<ClaimFilter>({});
  const [warrantyFilter, setWarrantyFilter] = useState<WarrantyFilter>({});

  // Calculate statistics
  const statistics: ClaimStatistics = useMemo(() => 
    calculateClaimsStatistics(), 
    [claims]
  );

  // Filtered data
  const filteredClaims = useMemo(() => {
    return claims.filter(claim => {
      const matchesStatus = !claimFilter.status || claim.status === claimFilter.status;
      const matchesType = !claimFilter.type || claim.type === claimFilter.type;
      const matchesPriority = !claimFilter.priority || claim.priority === claimFilter.priority;
      const matchesCategory = !claimFilter.category || claim.category === claimFilter.category;
      const matchesAssignedTo = !claimFilter.assignedTo || claim.assignedTo === claimFilter.assignedTo;
      const matchesCustomer = !claimFilter.customerId || claim.customerId === claimFilter.customerId;
      
      const matchesDateFrom = !claimFilter.dateFrom || claim.claimDate >= claimFilter.dateFrom;
      const matchesDateTo = !claimFilter.dateTo || claim.claimDate <= claimFilter.dateTo;
      
      const matchesWarrantyStatus = !claimFilter.warrantyStatus || 
        (claimFilter.warrantyStatus === 'under_warranty' && claim.warrantyInfo.isUnderWarranty) ||
        (claimFilter.warrantyStatus === 'expired' && !claim.warrantyInfo.isUnderWarranty) ||
        claimFilter.warrantyStatus === 'all';
      
      const matchesSearch = !claimFilter.search ||
        claim.claimNumber.toLowerCase().includes(claimFilter.search.toLowerCase()) ||
        claim.issueDescription.toLowerCase().includes(claimFilter.search.toLowerCase()) ||
        claim.customer.name.toLowerCase().includes(claimFilter.search.toLowerCase()) ||
        claim.product.name.toLowerCase().includes(claimFilter.search.toLowerCase());

      return matchesStatus && matchesType && matchesPriority && matchesCategory && 
             matchesAssignedTo && matchesCustomer && matchesDateFrom && matchesDateTo && 
             matchesWarrantyStatus && matchesSearch;
    });
  }, [claims, claimFilter]);

  // Claim operations
  const createClaim = useCallback((claimData: CreateClaimForm) => {
    const customer = customers.find(c => c.id === claimData.customerId);
    const product = products.find(p => p.id === claimData.productId);
    
    if (!customer || !product) {
      throw new Error('Customer or Product not found');
    }

    // Calculate warranty info
    const purchaseDate = new Date(claimData.purchaseDate);
    const warrantyEndDate = new Date(purchaseDate);
    warrantyEndDate.setMonth(warrantyEndDate.getMonth() + product.warrantyPeriod);
    const now = new Date();
    const isUnderWarranty = now <= warrantyEndDate;
    const remainingDays = Math.ceil((warrantyEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const newClaim: Claim = {
      id: `claim-${Date.now()}`,
      claimNumber: `CLM-${new Date().getFullYear()}-${String(claims.length + 1).padStart(3, '0')}`,
      type: claimData.type,
      status: 'submitted',
      priority: claimData.priority,
      customerId: claimData.customerId,
      customer,
      productId: claimData.productId,
      product,
      purchaseDate: claimData.purchaseDate,
      claimDate: new Date().toISOString().split('T')[0],
      issueDescription: claimData.issueDescription,
      category: claimData.category,
      warrantyInfo: {
        isUnderWarranty,
        warrantyStartDate: claimData.purchaseDate,
        warrantyEndDate: warrantyEndDate.toISOString().split('T')[0],
        warrantyType: 'manufacturer',
        coverageDetails: ['ข้อบกพร่องจากการผลิต', 'ชิ้นส่วนที่ชำรุด'],
        remainingDays: Math.max(0, remainingDays)
      },
      attachments: [],
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'created',
          description: 'สร้างคำขอเคลมใหม่',
          performedBy: claimData.customerId
        }
      ],
      createdBy: claimData.customerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setClaims(prev => [...prev, newClaim]);
    return newClaim;
  }, [claims.length, customers, products]);

  const updateClaim = useCallback((claimId: string, updates: UpdateClaimForm) => {
    setClaims(prev => prev.map(claim => {
      if (claim.id === claimId) {
        const updatedClaim = { ...claim, ...updates, updatedAt: new Date().toISOString() };
        
        // Add timeline entry for status change
        if (updates.status && updates.status !== claim.status) {
          const timelineEntry: ClaimTimelineEntry = {
            id: `tl-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'status_changed',
            description: `เปลี่ยนสถานะเป็น ${updates.status}`,
            performedBy: 'current-user'
          };
          updatedClaim.timeline = [...claim.timeline, timelineEntry];
        }

        // Add timeline entry for assignment
        if (updates.assignedTo && updates.assignedTo !== claim.assignedTo) {
          const timelineEntry: ClaimTimelineEntry = {
            id: `tl-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'assigned',
            description: `มอบหมายให้ ${updates.assignedTo}`,
            performedBy: 'current-user'
          };
          updatedClaim.timeline = [...claim.timeline, timelineEntry];
          updatedClaim.assignedBy = 'current-user';
          updatedClaim.assignedAt = new Date().toISOString();
        }

        return updatedClaim;
      }
      return claim;
    }));
  }, []);

  const updateClaimStatus = useCallback((claimId: string, status: ClaimStatus) => {
    updateClaim(claimId, { status });
  }, [updateClaim]);

  const updateClaimPriority = useCallback((claimId: string, priority: ClaimPriority) => {
    updateClaim(claimId, { priority });
  }, [updateClaim]);

  const assignClaim = useCallback((claimId: string, assignedTo: string) => {
    updateClaim(claimId, { assignedTo });
  }, [updateClaim]);

  const resolveClaim = useCallback((claimId: string, resolution: ClaimResolution) => {
    setClaims(prev => prev.map(claim => {
      if (claim.id === claimId) {
        const timelineEntry: ClaimTimelineEntry = {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'completed',
          description: `แก้ไขปัญหาเสร็จสิ้น: ${resolution.type}`,
          performedBy: resolution.resolvedBy
        };

        return {
          ...claim,
          status: 'completed',
          resolution,
          actualCost: resolution.totalCost,
          completedAt: resolution.resolvedAt,
          timeline: [...claim.timeline, timelineEntry],
          updatedAt: new Date().toISOString()
        };
      }
      return claim;
    }));
  }, []);

  const addCustomerSatisfaction = useCallback((claimId: string, satisfaction: CustomerSatisfactionRating) => {
    setClaims(prev => prev.map(claim => {
      if (claim.id === claimId) {
        return {
          ...claim,
          customerSatisfaction: satisfaction,
          updatedAt: new Date().toISOString()
        };
      }
      return claim;
    }));
  }, []);

  const addClaimComment = useCallback((claimId: string, comment: string, performedBy: string) => {
    setClaims(prev => prev.map(claim => {
      if (claim.id === claimId) {
        const timelineEntry: ClaimTimelineEntry = {
          id: `tl-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'comment_added',
          description: comment,
          performedBy
        };

        return {
          ...claim,
          timeline: [...claim.timeline, timelineEntry],
          updatedAt: new Date().toISOString()
        };
      }
      return claim;
    }));
  }, []);

  // Filter operations
  const clearClaimFilter = useCallback(() => {
    setClaimFilter({});
  }, []);

  const clearWarrantyFilter = useCallback(() => {
    setWarrantyFilter({});
  }, []);

  // Utility functions
  const getClaimById = useCallback((claimId: string) => {
    return claims.find(claim => claim.id === claimId);
  }, [claims]);

  const getCustomerById = useCallback((customerId: string) => {
    return customers.find(customer => customer.id === customerId);
  }, [customers]);

  const getProductById = useCallback((productId: string) => {
    return products.find(product => product.id === productId);
  }, [products]);

  const getPendingClaims = useCallback(() => {
    return claims.filter(claim => 
      ['submitted', 'under_review', 'approved', 'in_progress', 'waiting_parts'].includes(claim.status)
    );
  }, [claims]);

  const getHighPriorityClaims = useCallback(() => {
    return claims.filter(claim => claim.priority === 'urgent' || claim.priority === 'high');
  }, [claims]);

  const getOverdueClaims = useCallback(() => {
    const now = new Date();
    return claims.filter(claim => {
      if (claim.status === 'completed' || claim.status === 'cancelled') return false;
      
      const claimDate = new Date(claim.claimDate);
      const daysSinceCreated = Math.ceil((now.getTime() - claimDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Consider overdue based on priority
      const overdueThreshold = {
        urgent: 1,
        high: 3,
        medium: 7,
        low: 14
      };
      
      return daysSinceCreated > overdueThreshold[claim.priority];
    });
  }, [claims]);

  const getClaimsByCustomer = useCallback((customerId: string) => {
    return claims.filter(claim => claim.customerId === customerId);
  }, [claims]);

  const getClaimsByProduct = useCallback((productId: string) => {
    return claims.filter(claim => claim.productId === productId);
  }, [claims]);

  const getWarrantyStatus = useCallback((productId: string, purchaseDate: string) => {
    const product = getProductById(productId);
    if (!product) return null;

    const purchase = new Date(purchaseDate);
    const warrantyEnd = new Date(purchase);
    warrantyEnd.setMonth(warrantyEnd.getMonth() + product.warrantyPeriod);
    
    const now = new Date();
    const isUnderWarranty = now <= warrantyEnd;
    const remainingDays = Math.ceil((warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      isUnderWarranty,
      warrantyEndDate: warrantyEnd.toISOString().split('T')[0],
      remainingDays: Math.max(0, remainingDays)
    };
  }, [getProductById]);

  // Template operations
  const getClaimTemplate = useCallback((type: string, category: string) => {
    return claimTemplates.find(template => 
      template.type === type && template.category === category && template.isActive
    );
  }, [claimTemplates]);

  return {
    // Data
    claims: filteredClaims,
    allClaims: claims,
    customers,
    products,
    warrantyPolicies,
    claimTemplates,
    statistics,

    // Filters
    claimFilter,
    warrantyFilter,
    setClaimFilter,
    setWarrantyFilter,
    clearClaimFilter,
    clearWarrantyFilter,

    // Claim operations
    createClaim,
    updateClaim,
    updateClaimStatus,
    updateClaimPriority,
    assignClaim,
    resolveClaim,
    addCustomerSatisfaction,
    addClaimComment,

    // Utility functions
    getClaimById,
    getCustomerById,
    getProductById,
    getPendingClaims,
    getHighPriorityClaims,
    getOverdueClaims,
    getClaimsByCustomer,
    getClaimsByProduct,
    getWarrantyStatus,
    getClaimTemplate
  };
}