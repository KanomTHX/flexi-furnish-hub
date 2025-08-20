import { useState, useMemo, useCallback, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

export function useClaims() {
  // State management
  const [claims, setClaims] = useState<Claim[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warrantyPolicies, setWarrantyPolicies] = useState<WarrantyPolicy[]>([]);
  const [claimTemplates, setClaimTemplates] = useState<ClaimTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from Supabase
  useEffect(() => {
    loadClaimsData();
  }, []);

  const loadClaimsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load claims with related data
      const { data: claimsData, error: claimsError } = await supabase
        .from('claims')
        .select(`
          *,
          customers(id, name, phone, email),
          products(id, name, cost_price),
          employees(id, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (claimsError) throw claimsError;

      // Load customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (customersError) throw customersError;

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (productsError) throw productsError;

      // Transform data to match expected format
      const transformedCustomers: Customer[] = (customersData || []).map(customer => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        idCard: '',
        occupation: '',
        monthlyIncome: 0,
        customerType: 'individual' as const
      }));

      const transformedProducts: Product[] = (productsData || []).map(product => ({
        id: product.id,
        name: product.name,
        category: 'เฟอร์นิเจอร์',
        model: product.name,
        brand: 'Generic',
        price: product.cost_price || 0,
        warrantyPeriod: 12 // months
      }));

      // Transform claims data
      const transformedClaims: Claim[] = (claimsData || []).map(claim => ({
        id: claim.id,
        claimNumber: claim.claim_number,
        customerId: claim.customer_id,
        customerName: claim.customers?.name || 'ไม่ระบุ',
        productId: claim.product_id,
        productName: claim.products?.name || 'ไม่ระบุ',
        claimDate: claim.claim_date,
        type: claim.claim_type as any,
        category: 'general' as const,
        priority: 'medium' as const,
        status: claim.status as any,
        issueDescription: claim.description,
        estimatedCost: claim.compensation_amount || 0,
        actualCost: claim.compensation_amount || 0,
        assignedTo: claim.handled_by,
        assignedToName: claim.employees ? `${claim.employees.first_name || ''} ${claim.employees.last_name || ''}`.trim() : '',
        createdAt: claim.created_at,
        updatedAt: claim.updated_at,
        timeline: [],
        attachments: [],
        warrantyInfo: {
          isUnderWarranty: claim.claim_type === 'warranty',
          warrantyEndDate: '',
          remainingDays: 0
        },
        resolution: claim.resolution ? {
          type: 'replacement' as const,
          description: claim.resolution,
          cost: claim.compensation_amount || 0,
          completedAt: claim.updated_at,
          completedBy: claim.handled_by || '',
          completedByName: claim.employees?.name || ''
        } : undefined
      }));

      setCustomers(transformedCustomers);
      setProducts(transformedProducts);
      setClaims(transformedClaims);
      
      // Load warranty policies and claim templates from database
      // For now, set empty arrays as these tables don't exist yet
      // In the future, these could be loaded from warranty_policies and claim_templates tables
      setWarrantyPolicies([]);
      setClaimTemplates([]);
      
    } catch (err) {
      console.error('Error loading claims data:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };
  
  // Filters
  const [claimFilter, setClaimFilter] = useState<ClaimFilter>({});
  const [warrantyFilter, setWarrantyFilter] = useState<WarrantyFilter>({});

  // Calculate statistics
  const statistics: ClaimStatistics = useMemo(() => {
    const totalClaims = claims.length;
    const pendingClaims = claims.filter(c => ['submitted', 'under_review', 'approved', 'in_progress'].includes(c.status)).length;
    const completedClaims = claims.filter(c => c.status === 'completed').length;
    
    // Calculate real average resolution time
    const completedClaimsWithDates = claims.filter(c => 
      c.status === 'completed' && c.createdAt && c.updatedAt
    );
    
    const averageResolutionTime = completedClaimsWithDates.length > 0 
      ? completedClaimsWithDates.reduce((acc, claim) => {
          const created = new Date(claim.createdAt!);
          const completed = new Date(claim.updatedAt!);
          const days = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          return acc + days;
        }, 0) / completedClaimsWithDates.length
      : 0;
    
    // Calculate overdue rate
    const now = new Date();
    const overdueClaims = claims.filter(c => {
      if (['completed', 'cancelled'].includes(c.status) || !c.createdAt) return false;
      const created = new Date(c.createdAt);
      const daysDiff = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      const overdueThreshold = {
        urgent: 1,
        high: 3,
        medium: 7,
        low: 14
      };
      return daysDiff > overdueThreshold[c.priority];
    }).length;
    
    const overdueRate = totalClaims > 0 ? Math.round((overdueClaims / totalClaims) * 100) : 0;
    
    // Calculate claims by type from actual data
    const claimsByType = {
      warranty: claims.filter(c => c.type === 'warranty').length,
      damage: claims.filter(c => c.type === 'damage').length,
      defect: claims.filter(c => c.type === 'defect').length,
      other: claims.filter(c => c.type === 'other').length,
      missing_parts: claims.filter(c => c.type === 'missing_parts').length,
      installation: claims.filter(c => c.type === 'installation').length
    };
    
    // Calculate monthly trends from actual data
    const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthClaims = claims.filter(c => {
        if (!c.createdAt) return false;
        const claimDate = new Date(c.createdAt);
        return claimDate.getMonth() === date.getMonth() && 
               claimDate.getFullYear() === date.getFullYear();
      });
      
      const completedInMonth = monthClaims.filter(c => c.status === 'completed').length;
      const avgCost = monthClaims.length > 0 
        ? monthClaims.reduce((sum, c) => sum + (c.actualCost || 0), 0) / monthClaims.length
        : 0;
      
      return {
        month: monthName,
        totalClaims: monthClaims.length,
        completedClaims: completedInMonth,
        averageCost: Math.round(avgCost),
        satisfactionRating: 0 // Will be calculated when we have feedback data
      };
    });
    
    // Calculate top issues from actual data
    const issueCount: Record<string, number> = {};
    claims.forEach(claim => {
      if (claim.category) {
        issueCount[claim.category] = (issueCount[claim.category] || 0) + 1;
      }
    });
    
    const topIssues = Object.entries(issueCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));
    
    return {
      totalClaims,
      pendingClaims,
      completedClaims,
      cancelledClaims: claims.filter(c => c.status === 'cancelled').length,
      averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
      customerSatisfactionRate: 0, // Will be calculated when we have feedback data
      customerSatisfactionAverage: 0, // Will be calculated when we have feedback data
      warrantyClaimsPercentage: claims.filter(c => c.warrantyInfo?.isUnderWarranty).length / totalClaims * 100 || 0,
      mostCommonIssue: topIssues[0]?.issue || 'ไม่มีข้อมูล',
      totalCompensation: claims.reduce((sum, c) => sum + (c.actualCost || 0), 0),
      totalClaimsCost: claims.reduce((sum, c) => sum + (c.actualCost || 0), 0),
      claimsThisMonth: claims.filter(c => {
        const claimDate = new Date(c.claimDate);
        const now = new Date();
        return claimDate.getMonth() === now.getMonth() && claimDate.getFullYear() === now.getFullYear();
      }).length,
      urgentClaims: claims.filter(c => c.priority === 'urgent').length,
      overdueRate,
      resolutionRate: completedClaims / totalClaims * 100 || 0,
      claimsByType,
      claimsByStatus: { 
        submitted: claims.filter(c => c.status === 'submitted').length,
        under_review: claims.filter(c => c.status === 'under_review').length,
        approved: claims.filter(c => c.status === 'approved').length,
        rejected: claims.filter(c => c.status === 'rejected').length,
        in_progress: claims.filter(c => c.status === 'in_progress').length,
        waiting_parts: claims.filter(c => c.status === 'waiting_parts').length,
        completed: completedClaims,
        cancelled: claims.filter(c => c.status === 'cancelled').length
      },
      claimsByPriority: { 
        urgent: claims.filter(c => c.priority === 'urgent').length, 
        high: claims.filter(c => c.priority === 'high').length,
        medium: claims.filter(c => c.priority === 'medium').length,
        low: claims.filter(c => c.priority === 'low').length
      },
      monthlyTrends,
      topIssues
    };
  }, [claims]);

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
  const createClaim = useCallback(async (claimData: CreateClaimForm) => {
    try {
      const customer = customers.find(c => c.id === claimData.customerId);
      const product = products.find(p => p.id === claimData.productId);
      
      if (!customer || !product) {
        throw new Error('Customer or Product not found');
      }

      // Generate claim number
      const claimNumber = `CLM-${new Date().getFullYear()}-${String(claims.length + 1).padStart(3, '0')}`;
      
      // Insert into database
      const { data: newClaimData, error } = await supabase
        .from('claims')
        .insert({
          claim_number: claimNumber,
          customer_id: claimData.customerId,
          product_id: claimData.productId,
          claim_date: new Date().toISOString().split('T')[0],
          claim_type: claimData.type,
          description: claimData.issueDescription,
          status: 'pending',
          compensation_amount: 0
        })
        .select(`
          *,
          customers(id, name, phone, email),
          products(id, name, cost_price)
        `)
        .single();

      if (error) throw error;

      // Transform the response to match our Claim interface
      const newClaim: Claim = {
        id: newClaimData.id,
        claimNumber: newClaimData.claim_number,
        customerId: newClaimData.customer_id,
        customerName: newClaimData.customers?.name || 'ไม่ระบุ',
        productId: newClaimData.product_id,
        productName: newClaimData.products?.name || 'ไม่ระบุ',
        claimDate: newClaimData.claim_date,
        type: newClaimData.claim_type as any,
        category: claimData.category,
        priority: claimData.priority,
        status: newClaimData.status as any,
        issueDescription: newClaimData.description,
        estimatedCost: 0,
        actualCost: 0,
        assignedTo: newClaimData.handled_by,
        assignedToName: '',
        createdAt: newClaimData.created_at,
        updatedAt: newClaimData.updated_at,
        timeline: [],
        attachments: [],
        warrantyInfo: {
          isUnderWarranty: newClaimData.claim_type === 'warranty',
          warrantyEndDate: '',
          remainingDays: 0
        }
      };

      // Update local state
      setClaims(prev => [...prev, newClaim]);
      return newClaim;
    } catch (error) {
      console.error('Error creating claim:', error);
      throw error;
    }
  }, [claims.length, customers, products, supabase]);

  const updateClaim = useCallback(async (claimId: string, updates: UpdateClaimForm) => {
    try {
      const { error } = await supabase
        .from('claims')
        .update({
          status: updates.status,
          handled_by: updates.assignedTo,
          resolution: updates.resolution?.description,
          compensation_amount: updates.actualCost || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', claimId);

      if (error) throw error;

      // Update local state
      setClaims(prev => prev.map(claim => {
        if (claim.id === claimId) {
          // Handle resolution update properly
          const { resolution, ...otherUpdates } = updates;
          const updatedClaim = { 
            ...claim, 
            ...otherUpdates, 
            updatedAt: new Date().toISOString()
          };
          
          // Only update resolution if it's a complete ClaimResolution
          if (resolution && resolution.type) {
            updatedClaim.resolution = resolution as ClaimResolution;
          }
          
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
    } catch (error) {
      console.error('Error updating claim:', error);
      throw error;
    }
  }, []);

  const updateClaimStatus = useCallback(async (claimId: string, status: ClaimStatus) => {
    try {
      const { error } = await supabase
        .from('claims')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', claimId);

      if (error) throw error;

      // Update local state
      setClaims(prev => prev.map(claim => {
        if (claim.id === claimId) {
          return {
            ...claim,
            status,
            updatedAt: new Date().toISOString()
          };
        }
        return claim;
      }));
    } catch (error) {
      console.error('Error updating claim status:', error);
      throw error;
    }
  }, []);

  const updateClaimPriority = useCallback(async (claimId: string, priority: ClaimPriority) => {
    try {
      // Update local state only since priority is not stored in database
      setClaims(prev => prev.map(claim => {
        if (claim.id === claimId) {
          return {
            ...claim,
            priority,
            updatedAt: new Date().toISOString()
          };
        }
        return claim;
      }));
    } catch (error) {
      console.error('Error updating claim priority:', error);
      throw error;
    }
  }, []);

  const assignClaim = useCallback(async (claimId: string, assignedTo: string) => {
    try {
      const { error } = await supabase
        .from('claims')
        .update({
          handled_by: assignedTo,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', claimId);

      if (error) throw error;

      // Update local state
      setClaims(prev => prev.map(claim => {
        if (claim.id === claimId) {
          return {
            ...claim,
            assignedTo,
            status: 'in_progress',
            updatedAt: new Date().toISOString()
          };
        }
        return claim;
      }));
    } catch (error) {
      console.error('Error assigning claim:', error);
      throw error;
    }
  }, [supabase]);

  const resolveClaim = useCallback(async (claimId: string, resolution: ClaimResolution) => {
    try {
      const { error } = await supabase
        .from('claims')
        .update({
          status: 'completed',
          resolution: resolution.description,
          compensation_amount: resolution.cost || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', claimId);

      if (error) throw error;

      // Update local state
      setClaims(prev => prev.map(claim => {
        if (claim.id === claimId) {
          const timelineEntry: ClaimTimelineEntry = {
            id: `tl-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'completed',
            description: `แก้ไขปัญหาเสร็จสิ้น: ${resolution.type}`,
            performedBy: resolution.completedBy
          };

          return {
            ...claim,
            status: 'completed',
            resolution,
            actualCost: resolution.cost,
            completedAt: resolution.completedAt,
            timeline: [...claim.timeline, timelineEntry],
            updatedAt: new Date().toISOString()
          };
        }
        return claim;
      }));
    } catch (error) {
      console.error('Error resolving claim:', error);
      throw error;
    }
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