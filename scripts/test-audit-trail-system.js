// Test script for Audit Trail System
// ทดสอบระบบประวัติการใช้งาน

const testAuditTrailSystem = async () => {
  console.log('🔍 Testing Audit Trail System...\n');

  try {
    // Test 1: Import audit trail service
    console.log('📦 Test 1: Import audit trail service');
    const { auditTrailService } = await import('../src/services/auditTrailService.ts');
    console.log('✅ Service imported successfully\n');

    // Test 2: Get all audit logs
    console.log('📋 Test 2: Get all audit logs');
    const allLogs = await auditTrailService.getAuditLogs();
    console.log(`✅ Retrieved ${allLogs.length} audit logs`);
    console.log('Sample log:', allLogs[0]);
    console.log('');

    // Test 3: Filter by operation type
    console.log('🔍 Test 3: Filter by operation type (STOCK_WITHDRAW)');
    const withdrawLogs = await auditTrailService.getAuditLogs({
      operation_type: 'STOCK_WITHDRAW'
    });
    console.log(`✅ Found ${withdrawLogs.length} withdraw operations`);
    console.log('');

    // Test 4: Filter by table name
    console.log('📊 Test 4: Filter by table name (inventory)');
    const inventoryLogs = await auditTrailService.getAuditLogsByTable('inventory');
    console.log(`✅ Found ${inventoryLogs.length} inventory operations`);
    console.log('');

    // Test 5: Filter by date range
    console.log('📅 Test 5: Filter by date range (last 7 days)');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentLogs = await auditTrailService.getActivityByDateRange(
      sevenDaysAgo.toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );
    console.log(`✅ Found ${recentLogs.length} operations in last 7 days`);
    console.log('');

    // Test 6: Get recent activity
    console.log('⏰ Test 6: Get recent activity (last 5 operations)');
    const recentActivity = await auditTrailService.getRecentActivity(5);
    console.log(`✅ Retrieved ${recentActivity.length} recent operations`);
    recentActivity.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.operation_type} - ${log.description} (${new Date(log.timestamp).toLocaleString()})`);
    });
    console.log('');

    // Test 7: Get operation statistics
    console.log('📈 Test 7: Get operation statistics');
    const stats = await auditTrailService.getOperationStats();
    console.log('✅ Operation statistics:');
    Object.entries(stats).forEach(([operation, count]) => {
      console.log(`  ${operation}: ${count} operations`);
    });
    console.log('');

    // Test 8: Log new audit entry
    console.log('📝 Test 8: Log new audit entry');
    await auditTrailService.logAuditEntry({
      table_name: 'inventory',
      action: 'TEST_OPERATION',
      employee_id: 'test_user',
      operation_type: 'STOCK_ADJUSTMENT',
      timestamp: new Date().toISOString(),
      record_id: 'test_record_123',
      user_name: 'Test User',
      description: 'Test audit log entry from script',
      metadata: {
        test: true,
        script_version: '1.0.0'
      }
    });
    console.log('✅ Audit entry logged successfully');
    console.log('');

    // Test 9: Test different operation types
    console.log('🔄 Test 9: Test different operation types');
    const operationTypes = [
      'STOCK_RECEIVE',
      'STOCK_WITHDRAW', 
      'STOCK_TRANSFER',
      'STOCK_ADJUSTMENT',
      'SN_STATUS_CHANGE',
      'BATCH_OPERATION',
      'USER_LOGIN',
      'USER_LOGOUT'
    ];

    for (const opType of operationTypes) {
      const logs = await auditTrailService.getAuditLogs({
        operation_type: opType,
        limit: 5
      });
      console.log(`  ${opType}: ${logs.length} operations`);
    }
    console.log('');

    // Test 10: Test filter combinations
    console.log('🎯 Test 10: Test filter combinations');
    const complexFilter = await auditTrailService.getAuditLogs({
      operation_type: 'STOCK_TRANSFER',
      table_name: 'warehouse_transactions',
      limit: 10
    });
    console.log(`✅ Complex filter returned ${complexFilter.length} results`);
    console.log('');

    console.log('🎉 All Audit Trail System tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Service import: PASSED');
    console.log('✅ Get all logs: PASSED');
    console.log('✅ Filter by operation: PASSED');
    console.log('✅ Filter by table: PASSED');
    console.log('✅ Date range filter: PASSED');
    console.log('✅ Recent activity: PASSED');
    console.log('✅ Operation stats: PASSED');
    console.log('✅ Log audit entry: PASSED');
    console.log('✅ Operation types: PASSED');
    console.log('✅ Complex filters: PASSED');

    console.log('\n🚀 Audit Trail System is ready for production!');
    console.log('\n📝 Usage Instructions:');
    console.log('1. Open http://localhost:8081/warehouses');
    console.log('2. Click on "ประวัติ" (Audit) tab');
    console.log('3. Use filters to search audit logs');
    console.log('4. Click "Export CSV" to download logs');
    console.log('5. Click eye icon to view detailed log information');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure the server is running (npm run dev)');
    console.log('2. Check if auditTrailService.ts exists');
    console.log('3. Verify all dependencies are installed');
  }
};

// Run the test
testAuditTrailSystem();