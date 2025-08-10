import { supabase } from './supabase';

export interface Notification {
  id: string;
  userId: string;
  type: 'transfer_created' | 'transfer_received' | 'transfer_confirmed' | 'transfer_cancelled';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

export interface CreateNotificationRequest {
  userId: string;
  type: Notification['type'];
  title: string;
  message: string;
  data?: Record<string, any>;
}

export class NotificationService {
  /**
   * สร้างการแจ้งเตือนใหม่
   */
  async createNotification(request: CreateNotificationRequest): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: request.userId,
        type: request.type,
        title: request.title,
        message: request.message,
        data: request.data,
        is_read: false
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapNotification(data);
  }

  /**
   * ส่งการแจ้งเตือนเมื่อมีการโอนใหม่
   */
  async notifyTransferCreated(transferId: string, targetWarehouseId: string, transferNumber: string, sourceWarehouseName: string): Promise<void> {
    try {
      // หาผู้ใช้ในคลังปลายทาง
      const { data: users, error } = await supabase
        .from('employee_profiles')
        .select('user_id, name')
        .eq('warehouse_id', targetWarehouseId)
        .in('role', ['warehouse_manager', 'warehouse_staff']);

      if (error) throw error;

      // ส่งการแจ้งเตือนให้ทุกคนในคลังปลายทาง
      const notifications = users.map(user => ({
        userId: user.user_id,
        type: 'transfer_received' as const,
        title: 'มีการโอนสินค้าใหม่',
        message: `ได้รับการโอนสินค้า ${transferNumber} จาก ${sourceWarehouseName}`,
        data: { transferId, transferNumber }
      }));

      await Promise.all(
        notifications.map(notification => this.createNotification(notification))
      );

      // ส่ง real-time notification ผ่าน Supabase Realtime
      await this.sendRealtimeNotification(targetWarehouseId, {
        type: 'transfer_received',
        title: 'มีการโอนสินค้าใหม่',
        message: `ได้รับการโอนสินค้า ${transferNumber} จาก ${sourceWarehouseName}`,
        transferId,
        transferNumber
      });

    } catch (error) {
      console.error('Error sending transfer notification:', error);
    }
  }

  /**
   * ส่งการแจ้งเตือนเมื่อยืนยันการรับสินค้า
   */
  async notifyTransferConfirmed(transferId: string, sourceWarehouseId: string, transferNumber: string, targetWarehouseName: string, confirmedBy: string): Promise<void> {
    try {
      // หาผู้ใช้ในคลังต้นทาง
      const { data: users, error } = await supabase
        .from('employee_profiles')
        .select('user_id, name')
        .eq('warehouse_id', sourceWarehouseId)
        .in('role', ['warehouse_manager', 'warehouse_staff']);

      if (error) throw error;

      // ส่งการแจ้งเตือนให้ทุกคนในคลังต้นทาง
      const notifications = users.map(user => ({
        userId: user.user_id,
        type: 'transfer_confirmed' as const,
        title: 'การโอนสินค้าเสร็จสิ้น',
        message: `${targetWarehouseName} ได้รับสินค้า ${transferNumber} เรียบร้อยแล้ว`,
        data: { transferId, transferNumber, confirmedBy }
      }));

      await Promise.all(
        notifications.map(notification => this.createNotification(notification))
      );

      // ส่ง real-time notification
      await this.sendRealtimeNotification(sourceWarehouseId, {
        type: 'transfer_confirmed',
        title: 'การโอนสินค้าเสร็จสิ้น',
        message: `${targetWarehouseName} ได้รับสินค้า ${transferNumber} เรียบร้อยแล้ว`,
        transferId,
        transferNumber
      });

    } catch (error) {
      console.error('Error sending confirmation notification:', error);
    }
  }

  /**
   * ส่งการแจ้งเตือนเมื่อยกเลิกการโอน
   */
  async notifyTransferCancelled(transferId: string, sourceWarehouseId: string, targetWarehouseId: string, transferNumber: string, reason: string): Promise<void> {
    try {
      // หาผู้ใช้ในทั้งสองคลัง
      const { data: users, error } = await supabase
        .from('employee_profiles')
        .select('user_id, name, warehouse_id')
        .in('warehouse_id', [sourceWarehouseId, targetWarehouseId])
        .in('role', ['warehouse_manager', 'warehouse_staff']);

      if (error) throw error;

      // ส่งการแจ้งเตือนให้ทุกคนที่เกี่ยวข้อง
      const notifications = users.map(user => ({
        userId: user.user_id,
        type: 'transfer_cancelled' as const,
        title: 'การโอนสินค้าถูกยกเลิก',
        message: `การโอน ${transferNumber} ถูกยกเลิก: ${reason}`,
        data: { transferId, transferNumber, reason }
      }));

      await Promise.all(
        notifications.map(notification => this.createNotification(notification))
      );

      // ส่ง real-time notification
      await Promise.all([
        this.sendRealtimeNotification(sourceWarehouseId, {
          type: 'transfer_cancelled',
          title: 'การโอนสินค้าถูกยกเลิก',
          message: `การโอน ${transferNumber} ถูกยกเลิก: ${reason}`,
          transferId,
          transferNumber
        }),
        this.sendRealtimeNotification(targetWarehouseId, {
          type: 'transfer_cancelled',
          title: 'การโอนสินค้าถูกยกเลิก',
          message: `การโอน ${transferNumber} ถูกยกเลิก: ${reason}`,
          transferId,
          transferNumber
        })
      ]);

    } catch (error) {
      console.error('Error sending cancellation notification:', error);
    }
  }

  /**
   * ดึงการแจ้งเตือนของผู้ใช้
   */
  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.map(this.mapNotification);
  }

  /**
   * ทำเครื่องหมายการแจ้งเตือนว่าอ่านแล้ว
   */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  }

  /**
   * ทำเครื่องหมายการแจ้งเตือนทั้งหมดว่าอ่านแล้ว
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  }

  /**
   * ลบการแจ้งเตือน
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  }

  /**
   * นับการแจ้งเตือนที่ยังไม่อ่าน
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  }

  /**
   * ส่ง real-time notification ผ่าน Supabase channel
   */
  private async sendRealtimeNotification(warehouseId: string, payload: any): Promise<void> {
    try {
      const channel = supabase.channel(`warehouse_${warehouseId}`);
      await channel.send({
        type: 'broadcast',
        event: 'notification',
        payload
      });
    } catch (error) {
      console.error('Error sending realtime notification:', error);
    }
  }

  /**
   * แปลงข้อมูลจากฐานข้อมูลเป็น Notification object
   */
  private mapNotification(data: any): Notification {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      isRead: data.is_read,
      createdAt: new Date(data.created_at)
    };
  }
}

export const notificationService = new NotificationService();