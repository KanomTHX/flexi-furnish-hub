// ===================================================================
// SUPABASE GUARANTOR MANAGEMENT FUNCTIONS
// ฟังก์ชันจัดการข้อมูลผู้ค้ำประกัน
// ===================================================================

import { supabase } from './supabase';
import { Guarantor, ContractDocument, RiskAssessment } from '@/types/installments';

// ===================================================================
// GUARANTOR CRUD OPERATIONS
// ===================================================================

/**
 * สร้างผู้ค้ำประกันใหม่
 */
export async function createGuarantor(guarantorData: Omit<Guarantor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Guarantor> {
  try {
    const { data, error } = await supabase
      .from('guarantors')
      .insert([{
        name: guarantorData.name,
        phone: guarantorData.phone,
        email: guarantorData.email,
        address: guarantorData.address,
        id_card: guarantorData.idCard,
        occupation: guarantorData.occupation,
        monthly_income: guarantorData.monthlyIncome,
        workplace: guarantorData.workplace,
        work_address: guarantorData.workAddress,
        emergency_contact_name: guarantorData.emergencyContact?.name,
        emergency_contact_phone: guarantorData.emergencyContact?.phone,
        emergency_contact_relationship: guarantorData.emergencyContact?.relationship,
        created_by: guarantorData.createdBy || null,
        branch_id: guarantorData.branchId
      }])
      .select()
      .single();

    if (error) throw error;

    return mapGuarantorFromDB(data);
  } catch (error) {
    console.error('Error creating guarantor:', error);
    throw new Error('ไม่สามารถสร้างข้อมูลผู้ค้ำประกันได้');
  }
}

/**
 * ดึงข้อมูลผู้ค้ำประกันทั้งหมด
 */
export async function getGuarantors(branchId?: string): Promise<Guarantor[]> {
  try {
    let query = supabase
      .from('guarantors')
      .select('*')
      .order('created_at', { ascending: false });

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(mapGuarantorFromDB);
  } catch (error) {
    console.error('Error fetching guarantors:', error);
    throw new Error('ไม่สามารถดึงข้อมูลผู้ค้ำประกันได้');
  }
}

/**
 * ดึงข้อมูลผู้ค้ำประกันตาม ID
 */
export async function getGuarantorById(id: string): Promise<Guarantor | null> {
  try {
    const { data, error } = await supabase
      .from('guarantors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return mapGuarantorFromDB(data);
  } catch (error) {
    console.error('Error fetching guarantor:', error);
    throw new Error('ไม่สามารถดึงข้อมูลผู้ค้ำประกันได้');
  }
}

/**
 * ค้นหาผู้ค้ำประกันด้วยเลขบัตรประชาชน
 */
export async function getGuarantorByIdCard(idCard: string): Promise<Guarantor | null> {
  try {
    const { data, error } = await supabase
      .from('guarantors')
      .select('*')
      .eq('id_card', idCard)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return mapGuarantorFromDB(data);
  } catch (error) {
    console.error('Error fetching guarantor by ID card:', error);
    throw new Error('ไม่สามารถค้นหาผู้ค้ำประกันได้');
  }
}

/**
 * อัปเดตข้อมูลผู้ค้ำประกัน
 */
export async function updateGuarantor(id: string, updates: Partial<Guarantor>): Promise<Guarantor> {
  try {
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.idCard !== undefined) updateData.id_card = updates.idCard;
    if (updates.occupation !== undefined) updateData.occupation = updates.occupation;
    if (updates.monthlyIncome !== undefined) updateData.monthly_income = updates.monthlyIncome;
    if (updates.workplace !== undefined) updateData.workplace = updates.workplace;
    if (updates.workAddress !== undefined) updateData.work_address = updates.workAddress;
    
    if (updates.emergencyContact) {
      updateData.emergency_contact_name = updates.emergencyContact.name;
      updateData.emergency_contact_phone = updates.emergencyContact.phone;
      updateData.emergency_contact_relationship = updates.emergencyContact.relationship;
    }

    const { data, error } = await supabase
      .from('guarantors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return mapGuarantorFromDB(data);
  } catch (error) {
    console.error('Error updating guarantor:', error);
    throw new Error('ไม่สามารถอัปเดตข้อมูลผู้ค้ำประกันได้');
  }
}

/**
 * ลบผู้ค้ำประกัน
 */
export async function deleteGuarantor(id: string): Promise<void> {
  try {
    // ตรวจสอบว่ามีสัญญาที่ใช้ผู้ค้ำประกันนี้อยู่หรือไม่
    const { data: contracts, error: contractError } = await supabase
      .from('installment_contracts')
      .select('id')
      .eq('guarantor_id', id)
      .limit(1);

    if (contractError) throw contractError;

    if (contracts && contracts.length > 0) {
      throw new Error('ไม่สามารถลบผู้ค้ำประกันได้ เนื่องจากมีสัญญาที่เกี่ยวข้อง');
    }

    const { error } = await supabase
      .from('guarantors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting guarantor:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('ไม่สามารถลบผู้ค้ำประกันได้');
  }
}

// ===================================================================
// GUARANTOR SEARCH AND VALIDATION
// ===================================================================

/**
 * ค้นหาผู้ค้ำประกัน
 */
export async function searchGuarantors(
  searchTerm: string,
  branchId?: string
): Promise<Guarantor[]> {
  try {
    let query = supabase
      .from('guarantors')
      .select('*');

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    // ค้นหาจากชื่อ, เบอร์โทร, หรือเลขบัตรประชาชน
    query = query.or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,id_card.ilike.%${searchTerm}%`);

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return data.map(mapGuarantorFromDB);
  } catch (error) {
    console.error('Error searching guarantors:', error);
    throw new Error('ไม่สามารถค้นหาผู้ค้ำประกันได้');
  }
}

/**
 * ตรวจสอบความถูกต้องของข้อมูลผู้ค้ำประกัน
 */
export function validateGuarantorData(guarantor: Partial<Guarantor>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!guarantor.name?.trim()) {
    errors.push('กรุณากรอกชื่อ-นามสกุล');
  }

  if (!guarantor.phone?.trim()) {
    errors.push('กรุณากรอกเบอร์โทรศัพท์');
  } else if (!/^[0-9-+().\s]+$/.test(guarantor.phone)) {
    errors.push('รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง');
  }

  if (!guarantor.address?.trim()) {
    errors.push('กรุณากรอกที่อยู่');
  }

  if (!guarantor.idCard?.trim()) {
    errors.push('กรุณากรอกเลขบัตรประชาชน');
  } else if (!/^\d{1}-\d{4}-\d{5}-\d{2}-\d{1}$/.test(guarantor.idCard)) {
    errors.push('รูปแบบเลขบัตรประชาชนไม่ถูกต้อง (1-2345-67890-12-3)');
  }

  if (!guarantor.occupation?.trim()) {
    errors.push('กรุณากรอกอาชีพ');
  }

  if (!guarantor.monthlyIncome || guarantor.monthlyIncome <= 0) {
    errors.push('กรุณากรอกรายได้ต่อเดือน');
  } else if (guarantor.monthlyIncome < 10000) {
    errors.push('รายได้ต่อเดือนต้องไม่น้อยกว่า 10,000 บาท');
  }

  // ตรวจสอบอีเมล (ถ้ามี)
  if (guarantor.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guarantor.email)) {
    errors.push('รูปแบบอีเมลไม่ถูกต้อง');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * ตรวจสอบความสามารถในการค้ำประกัน
 */
export function assessGuarantorEligibility(
  guarantor: Guarantor,
  contractAmount: number
): { eligible: boolean; reasons: string[]; riskLevel: 'low' | 'medium' | 'high' } {
  const reasons: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  // ตรวจสอบรายได้
  const monthlyPaymentEstimate = contractAmount * 0.05; // ประมาณ 5% ของยอดสัญญา
  const incomeRatio = monthlyPaymentEstimate / guarantor.monthlyIncome!;

  if (incomeRatio > 0.3) {
    reasons.push('รายได้ของผู้ค้ำประกันอาจไม่เพียงพอ (ควรมีรายได้มากกว่า 3 เท่าของค่างวดประมาณ)');
    riskLevel = 'high';
  } else if (incomeRatio > 0.2) {
    riskLevel = 'medium';
  }

  // ตรวจสอบข้อมูลที่ขาดหาย
  if (!guarantor.workplace) {
    reasons.push('ไม่มีข้อมูลสถานที่ทำงาน');
    if (riskLevel === 'low') riskLevel = 'medium';
  }

  if (!guarantor.emergencyContact?.name) {
    reasons.push('ไม่มีข้อมูลผู้ติดต่อฉุกเฉิน');
    if (riskLevel === 'low') riskLevel = 'medium';
  }

  // ตรวจสอบยอดเงินที่เหมาะสม
  const maxRecommendedAmount = guarantor.monthlyIncome! * 20; // 20 เท่าของรายได้
  if (contractAmount > maxRecommendedAmount) {
    reasons.push(`ยอดสัญญาสูงเกินไป (แนะนำไม่เกิน ${maxRecommendedAmount.toLocaleString()} บาท)`);
    riskLevel = 'high';
  }

  return {
    eligible: reasons.length === 0 || riskLevel !== 'high',
    reasons,
    riskLevel
  };
}

// ===================================================================
// GUARANTOR DOCUMENTS
// ===================================================================

/**
 * อัปโหลดเอกสารผู้ค้ำประกัน
 */
export async function uploadGuarantorDocument(
  guarantorId: string,
  file: File,
  documentType: ContractDocument['documentType'],
  description?: string,
  userId?: string
): Promise<ContractDocument> {
  try {
    // อัปโหลดไฟล์ไป Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${guarantorId}_${documentType}_${Date.now()}.${fileExt}`;
    const filePath = `guarantor-documents/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // บันทึกข้อมูลเอกสารในฐานข้อมูล
    const { data, error } = await supabase
      .from('contract_documents')
      .insert([{
        guarantor_id: guarantorId,
        document_type: documentType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        description: description,
        uploaded_by: userId || 'system'
      }])
      .select()
      .single();

    if (error) throw error;

    return mapDocumentFromDB(data);
  } catch (error) {
    console.error('Error uploading guarantor document:', error);
    throw new Error('ไม่สามารถอัปโหลดเอกสารได้');
  }
}

/**
 * ดึงเอกสารของผู้ค้ำประกัน
 */
export async function getGuarantorDocuments(guarantorId: string): Promise<ContractDocument[]> {
  try {
    const { data, error } = await supabase
      .from('contract_documents')
      .select('*')
      .eq('guarantor_id', guarantorId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(mapDocumentFromDB);
  } catch (error) {
    console.error('Error fetching guarantor documents:', error);
    throw new Error('ไม่สามารถดึงเอกสารได้');
  }
}

// ===================================================================
// GUARANTOR STATISTICS
// ===================================================================

/**
 * ดึงสถิติผู้ค้ำประกัน
 */
export async function getGuarantorStats(branchId?: string) {
  try {
    let query = supabase
      .from('guarantors')
      .select('id, monthly_income, created_at');

    if (branchId) {
      query = query.eq('branch_id', branchId);
    }

    const { data: guarantors, error } = await query;

    if (error) throw error;

    // นับสัญญาที่ใช้ผู้ค้ำประกัน
    const { data: contracts, error: contractError } = await supabase
      .from('installment_contracts')
      .select('guarantor_id, status, total_amount')
      .not('guarantor_id', 'is', null);

    if (contractError) throw contractError;

    const totalGuarantors = guarantors.length;
    const activeGuarantors = new Set(contracts?.filter(c => c.status === 'active').map(c => c.guarantor_id)).size;
    const averageIncome = guarantors.reduce((sum, g) => sum + (g.monthly_income || 0), 0) / totalGuarantors;
    const totalGuaranteedAmount = contracts?.reduce((sum, c) => sum + c.total_amount, 0) || 0;

    return {
      totalGuarantors,
      activeGuarantors,
      averageIncome,
      totalGuaranteedAmount,
      utilizationRate: totalGuarantors > 0 ? (activeGuarantors / totalGuarantors) * 100 : 0
    };
  } catch (error) {
    console.error('Error fetching guarantor stats:', error);
    throw new Error('ไม่สามารถดึงสถิติผู้ค้ำประกันได้');
  }
}

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

/**
 * แปลงข้อมูลจากฐานข้อมูลเป็น Guarantor object
 */
function mapGuarantorFromDB(data: any): Guarantor {
  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    email: data.email,
    address: data.address,
    idCard: data.id_card,
    occupation: data.occupation,
    monthlyIncome: data.monthly_income,
    workplace: data.workplace,
    workAddress: data.work_address,
    emergencyContact: data.emergency_contact_name ? {
      name: data.emergency_contact_name,
      phone: data.emergency_contact_phone,
      relationship: data.emergency_contact_relationship
    } : undefined,
    created_at: data.created_at,
    updated_at: data.updated_at,
    createdBy: data.created_by,
    branchId: data.branch_id
  };
}

/**
 * แปลงข้อมูลเอกสารจากฐานข้อมูล
 */
function mapDocumentFromDB(data: any): ContractDocument {
  return {
    id: data.id,
    contractId: data.contract_id,
    guarantorId: data.guarantor_id,
    customerId: data.customer_id,
    documentType: data.document_type,
    fileName: data.file_name,
    filePath: data.file_path,
    fileSize: data.file_size,
    mimeType: data.mime_type,
    description: data.description,
    createdAt: data.created_at,
    uploadedBy: data.uploaded_by
  };
}