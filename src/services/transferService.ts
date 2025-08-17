import { supabase } from '@/integrations/supabase/client';
import {
  TransferRequest,
  TransferShipment,
  CreateTransferRequestData,
  CreateTransferShipmentData,
  UpdateTransferRequestData,
  ApproveTransferRequestData,
  ReceiveShipmentData,
  TransferRequestFilters,
  TransferShipmentFilters,
  TransferStatistics,
  TransferRequestsResponse,
  TransferShipmentsResponse,
} from '@/types/transfer';

class TransferService {
  // Transfer Requests
  async getTransferRequests(
    filters: TransferRequestFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<TransferRequestsResponse> {
    try {
      let query = supabase
        .from('transfer_requests')
        .select(`
          *,
          source_warehouse:warehouses!source_warehouse_id(*),
          destination_warehouse:warehouses!destination_warehouse_id(*),
          requested_by_user:auth.users!requested_by(*),
          approved_by_user:auth.users!approved_by(*),
          items:transfer_request_items(*,
            product:products(*)
          ),
          shipments:transfer_shipments(*),
          documents:transfer_documents(*)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority);
      }
      if (filters.source_warehouse_id) {
        query = query.eq('source_warehouse_id', filters.source_warehouse_id);
      }
      if (filters.destination_warehouse_id) {
        query = query.eq('destination_warehouse_id', filters.destination_warehouse_id);
      }
      if (filters.requested_by) {
        query = query.eq('requested_by', filters.requested_by);
      }
      if (filters.date_from) {
        query = query.gte('request_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('request_date', filters.date_to);
      }
      if (filters.search) {
        query = query.or(`request_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        has_more: (count || 0) > page * limit,
      };
    } catch (error) {
      console.error('Error fetching transfer requests:', error);
      throw error;
    }
  }

  async getTransferRequest(id: string): Promise<TransferRequest | null> {
    try {
      const { data, error } = await supabase
        .from('transfer_requests')
        .select(`
          *,
          source_warehouse:warehouses!source_warehouse_id(*),
          destination_warehouse:warehouses!destination_warehouse_id(*),
          requested_by_user:auth.users!requested_by(*),
          approved_by_user:auth.users!approved_by(*),
          items:transfer_request_items(*,
            product:products(*)
          ),
          shipments:transfer_shipments(*,
            items:transfer_shipment_items(*,
              product:products(*),
              serial_numbers:transfer_serial_numbers(*)
            )
          ),
          documents:transfer_documents(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching transfer request:', error);
      throw error;
    }
  }

  async createTransferRequest(data: CreateTransferRequestData): Promise<TransferRequest> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Create transfer request
      const { data: request, error: requestError } = await supabase
        .from('transfer_requests')
        .insert({
          source_warehouse_id: data.source_warehouse_id,
          destination_warehouse_id: data.destination_warehouse_id,
          requested_by: user.user.id,
          priority: data.priority,
          required_date: data.required_date,
          notes: data.notes,
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Create transfer request items
      const items = data.items.map(item => ({
        transfer_request_id: request.id,
        product_id: item.product_id,
        requested_quantity: item.requested_quantity,
        unit_cost: item.unit_cost,
        total_cost: item.requested_quantity * item.unit_cost,
        notes: item.notes,
      }));

      const { error: itemsError } = await supabase
        .from('transfer_request_items')
        .insert(items);

      if (itemsError) throw itemsError;

      // Fetch the complete request with relations
      return await this.getTransferRequest(request.id) as TransferRequest;
    } catch (error) {
      console.error('Error creating transfer request:', error);
      throw error;
    }
  }

  async updateTransferRequest(id: string, data: UpdateTransferRequestData): Promise<TransferRequest> {
    try {
      const { data: request, error } = await supabase
        .from('transfer_requests')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log audit trail
      await this.logAuditTrail({
        transfer_request_id: id,
        action: 'transfer_request_updated',
        new_values: data,
      });

      return await this.getTransferRequest(id) as TransferRequest;
    } catch (error) {
      console.error('Error updating transfer request:', error);
      throw error;
    }
  }

  async approveTransferRequest(id: string, data: ApproveTransferRequestData): Promise<TransferRequest> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Update transfer request status
      const { error: requestError } = await supabase
        .from('transfer_requests')
        .update({
          status: 'approved',
          approved_by: user.user.id,
          approval_date: new Date().toISOString(),
          notes: data.notes,
        })
        .eq('id', id);

      if (requestError) throw requestError;

      // Update approved quantities for items
      for (const item of data.items) {
        const { error: itemError } = await supabase
          .from('transfer_request_items')
          .update({ approved_quantity: item.approved_quantity })
          .eq('id', item.id);

        if (itemError) throw itemError;
      }

      // Log audit trail
      await this.logAuditTrail({
        transfer_request_id: id,
        action: 'transfer_request_approved',
        new_values: { approved_by: user.user.id, items: data.items },
      });

      return await this.getTransferRequest(id) as TransferRequest;
    } catch (error) {
      console.error('Error approving transfer request:', error);
      throw error;
    }
  }

  async rejectTransferRequest(id: string, reason: string): Promise<TransferRequest> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('transfer_requests')
        .update({
          status: 'rejected',
          approved_by: user.user.id,
          approval_date: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', id);

      if (error) throw error;

      // Log audit trail
      await this.logAuditTrail({
        transfer_request_id: id,
        action: 'transfer_request_rejected',
        new_values: { rejection_reason: reason },
      });

      return await this.getTransferRequest(id) as TransferRequest;
    } catch (error) {
      console.error('Error rejecting transfer request:', error);
      throw error;
    }
  }

  // Transfer Shipments
  async getTransferShipments(
    filters: TransferShipmentFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<TransferShipmentsResponse> {
    try {
      let query = supabase
        .from('transfer_shipments')
        .select(`
          *,
          transfer_request:transfer_requests(*,
            source_warehouse:warehouses!source_warehouse_id(*),
            destination_warehouse:warehouses!destination_warehouse_id(*)
          ),
          shipped_by_user:auth.users!shipped_by(*),
          received_by_user:auth.users!received_by(*),
          items:transfer_shipment_items(*,
            product:products(*),
            serial_numbers:transfer_serial_numbers(*)
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.transfer_request_id) {
        query = query.eq('transfer_request_id', filters.transfer_request_id);
      }
      if (filters.shipped_by) {
        query = query.eq('shipped_by', filters.shipped_by);
      }
      if (filters.carrier_name) {
        query = query.ilike('carrier_name', `%${filters.carrier_name}%`);
      }
      if (filters.tracking_number) {
        query = query.ilike('tracking_number', `%${filters.tracking_number}%`);
      }
      if (filters.date_from) {
        query = query.gte('ship_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('ship_date', filters.date_to);
      }
      if (filters.search) {
        query = query.or(`shipment_number.ilike.%${filters.search}%,tracking_number.ilike.%${filters.search}%`);
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        has_more: (count || 0) > page * limit,
      };
    } catch (error) {
      console.error('Error fetching transfer shipments:', error);
      throw error;
    }
  }

  async createTransferShipment(data: CreateTransferShipmentData): Promise<TransferShipment> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Create transfer shipment
      const { data: shipment, error: shipmentError } = await supabase
        .from('transfer_shipments')
        .insert({
          transfer_request_id: data.transfer_request_id,
          shipped_by: user.user.id,
          carrier_name: data.carrier_name,
          tracking_number: data.tracking_number,
          shipping_method: data.shipping_method,
          ship_date: new Date().toISOString(),
          expected_delivery_date: data.expected_delivery_date,
          shipping_cost: data.shipping_cost || 0,
          notes: data.notes,
          status: 'shipped',
        })
        .select()
        .single();

      if (shipmentError) throw shipmentError;

      // Create shipment items
      for (const item of data.items) {
        const { data: shipmentItem, error: itemError } = await supabase
          .from('transfer_shipment_items')
          .insert({
            transfer_shipment_id: shipment.id,
            transfer_request_item_id: item.transfer_request_item_id,
            product_id: item.product_id,
            shipped_quantity: item.shipped_quantity,
            unit_cost: item.unit_cost,
          })
          .select()
          .single();

        if (itemError) throw itemError;

        // Add serial numbers if provided
        if (item.serial_numbers && item.serial_numbers.length > 0) {
          const serialNumbers = item.serial_numbers.map(serial => ({
            transfer_shipment_item_id: shipmentItem.id,
            serial_number: serial,
            product_id: item.product_id,
            status: 'shipped' as const,
          }));

          const { error: serialError } = await supabase
            .from('transfer_serial_numbers')
            .insert(serialNumbers);

          if (serialError) throw serialError;
        }
      }

      // Update transfer request status
      const { error: requestError } = await supabase
        .from('transfer_requests')
        .update({ status: 'in_transit' })
        .eq('id', data.transfer_request_id);

      if (requestError) throw requestError;

      // Log audit trail
      await this.logAuditTrail({
        transfer_request_id: data.transfer_request_id,
        transfer_shipment_id: shipment.id,
        action: 'shipment_created',
        new_values: { shipment_id: shipment.id },
      });

      return shipment;
    } catch (error) {
      console.error('Error creating transfer shipment:', error);
      throw error;
    }
  }

  async receiveShipment(shipmentId: string, data: ReceiveShipmentData): Promise<TransferShipment> {
    try {
      // Update shipment status
      const { error: shipmentError } = await supabase
        .from('transfer_shipments')
        .update({
          status: 'delivered',
          received_by: data.received_by,
          actual_delivery_date: data.actual_delivery_date,
          notes: data.notes,
        })
        .eq('id', shipmentId);

      if (shipmentError) throw shipmentError;

      // Update shipment items
      for (const item of data.items) {
        const { error: itemError } = await supabase
          .from('transfer_shipment_items')
          .update({
            received_quantity: item.received_quantity,
            damaged_quantity: item.damaged_quantity || 0,
            condition_notes: item.condition_notes,
          })
          .eq('id', item.id);

        if (itemError) throw itemError;

        // Update serial numbers if provided
        if (item.serial_numbers) {
          for (const serial of item.serial_numbers) {
            const { error: serialError } = await supabase
              .from('transfer_serial_numbers')
              .update({
                status: serial.status,
                condition_notes: serial.condition_notes,
              })
              .eq('id', serial.id);

            if (serialError) throw serialError;
          }
        }
      }

      // Get transfer request ID to update status
      const { data: shipment } = await supabase
        .from('transfer_shipments')
        .select('transfer_request_id')
        .eq('id', shipmentId)
        .single();

      if (shipment) {
        // Update transfer request status to completed
        const { error: requestError } = await supabase
          .from('transfer_requests')
          .update({
            status: 'completed',
            completion_date: new Date().toISOString(),
          })
          .eq('id', shipment.transfer_request_id);

        if (requestError) throw requestError;

        // Log audit trail
        await this.logAuditTrail({
          transfer_request_id: shipment.transfer_request_id,
          transfer_shipment_id: shipmentId,
          action: 'shipment_received',
          new_values: { received_by: data.received_by },
        });
      }

      return await this.getTransferShipment(shipmentId) as TransferShipment;
    } catch (error) {
      console.error('Error receiving shipment:', error);
      throw error;
    }
  }

  async getTransferShipment(id: string): Promise<TransferShipment | null> {
    try {
      const { data, error } = await supabase
        .from('transfer_shipments')
        .select(`
          *,
          transfer_request:transfer_requests(*),
          shipped_by_user:auth.users!shipped_by(*),
          received_by_user:auth.users!received_by(*),
          items:transfer_shipment_items(*,
            product:products(*),
            serial_numbers:transfer_serial_numbers(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching transfer shipment:', error);
      throw error;
    }
  }

  // Statistics and Analytics
  async getTransferStatistics(dateFrom?: string, dateTo?: string): Promise<TransferStatistics> {
    try {
      let query = supabase.from('transfer_requests').select('*');
      
      if (dateFrom) {
        query = query.gte('request_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('request_date', dateTo);
      }

      const { data: requests, error } = await query;
      if (error) throw error;

      const stats: TransferStatistics = {
        total_requests: requests?.length || 0,
        pending_requests: requests?.filter(r => r.status === 'pending').length || 0,
        approved_requests: requests?.filter(r => r.status === 'approved').length || 0,
        completed_requests: requests?.filter(r => r.status === 'completed').length || 0,
        rejected_requests: requests?.filter(r => r.status === 'rejected').length || 0,
        total_value: requests?.reduce((sum, r) => sum + (r.total_value || 0), 0) || 0,
        average_processing_time: 0, // TODO: Calculate based on request_date and completion_date
        top_source_warehouses: [], // TODO: Implement warehouse statistics
        top_destination_warehouses: [], // TODO: Implement warehouse statistics
        monthly_trends: [], // TODO: Implement monthly trends
      };

      return stats;
    } catch (error) {
      console.error('Error fetching transfer statistics:', error);
      throw error;
    }
  }

  // Audit Trail
  private async logAuditTrail(data: {
    transfer_request_id?: string;
    transfer_shipment_id?: string;
    action: string;
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
  }): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('transfer_audit_log')
        .insert({
          transfer_request_id: data.transfer_request_id,
          transfer_shipment_id: data.transfer_shipment_id,
          action: data.action,
          old_values: data.old_values,
          new_values: data.new_values,
          performed_by: user.user.id,
        });

      if (error) {
        console.error('Error logging audit trail:', error);
      }
    } catch (error) {
      console.error('Error logging audit trail:', error);
    }
  }

  // Document Management
  async uploadDocument(file: File, transferRequestId?: string, transferShipmentId?: string, documentType: string = 'other'): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `transfer-documents/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save document record
      const { error: docError } = await supabase
        .from('transfer_documents')
        .insert({
          transfer_request_id: transferRequestId,
          transfer_shipment_id: transferShipmentId,
          document_type: documentType,
          document_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.user.id,
        });

      if (docError) throw docError;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }

  async deleteTransferRequest(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('transfer_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log audit trail
      await this.logAuditTrail({
        transfer_request_id: id,
        action: 'transfer_request_deleted',
      });
    } catch (error) {
      console.error('Error deleting transfer request:', error);
      throw error;
    }
  }
}

export const transferService = new TransferService();
export default transferService;