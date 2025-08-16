// Simple integration service replacement
export class SimpleIntegrationService {
  static async syncData() {
    return { success: true, message: 'Sync completed' };
  }

  static async getStatus() {
    return { connected: true, status: 'active' };
  }
}

export default SimpleIntegrationService;