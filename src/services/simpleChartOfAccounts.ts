// Simple chart of accounts service
export class SimpleChartOfAccountsService {
  static async getAccounts() {
    return [];
  }

  static async createAccount(account: any) {
    return { id: '1', ...account };
  }
}

export default SimpleChartOfAccountsService;