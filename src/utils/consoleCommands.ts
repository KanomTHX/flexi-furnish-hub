// Console Commands for Debugging
import { browserErrorHandler, ConsoleMonitor } from './browserErrorHandler';
import { ErrorDiagnostics } from './errorDiagnostics';
import { supabase } from '@/integrations/supabase/client';

// Add debugging commands to window in development
if (import.meta.env.DEV) {
  // Extend the existing debug object
  Object.assign(window.__DEBUG_ERRORS__ || {}, {
    // Error monitoring commands
    showErrors: () => {
      const errors = browserErrorHandler.getErrors();
      console.group('🚨 Browser Errors');
      errors.forEach((error, index) => {
        console.group(`${index + 1}. ${error.type} - ${error.timestamp.toLocaleTimeString()}`);
        console.error('Message:', error.message);
        if (error.source) console.log('Source:', `${error.source}:${error.line}:${error.column}`);
        if (error.url) console.log('URL:', error.url);
        if (error.stack) console.log('Stack:', error.stack);
        console.groupEnd();
      });
      console.groupEnd();
      return errors;
    },

    showLogs: (level?: string) => {
      const logs = level ? 
        ConsoleMonitor.getLogsByLevel(level as any) : 
        ConsoleMonitor.getLogs();
      
      console.group(`📝 Console Logs${level ? ` (${level})` : ''}`);
      logs.slice(-20).forEach((log, index) => {
        console.group(`${index + 1}. ${log.level} - ${log.timestamp.toLocaleTimeString()}`);
        console.log(...log.args);
        console.groupEnd();
      });
      console.groupEnd();
      return logs;
    },

    // Diagnostic commands
    runDiagnostics: async () => {
      console.log('🔍 Running diagnostics...');
      const results = await ErrorDiagnostics.runAllDiagnostics();
      
      console.group('🏥 Diagnostic Results');
      
      const categories = [...new Set(results.map(r => r.category))];
      categories.forEach(category => {
        const categoryResults = results.filter(r => r.category === category);
        const passed = categoryResults.filter(r => r.status === 'pass').length;
        const failed = categoryResults.filter(r => r.status === 'fail').length;
        const warnings = categoryResults.filter(r => r.status === 'warning').length;
        
        console.group(`${category} (✅ ${passed} | ❌ ${failed} | ⚠️ ${warnings})`);
        
        categoryResults.forEach(result => {
          const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
          console.log(`${icon} ${result.test}: ${result.message}`);
          if (result.details) console.log('Details:', result.details);
          if (result.fix) console.log('Fix:', result.fix);
        });
        
        console.groupEnd();
      });
      
      console.groupEnd();
      return results;
    },

    // Database testing commands
    testDatabase: async () => {
      console.log('🗄️ Testing database connection...');
      
      try {
        const startTime = Date.now();
        const { data, error } = await supabase
          .from('branches')
          .select('*')
          .limit(1);
        
        const responseTime = Date.now() - startTime;
        
        if (error) {
          console.error('❌ Database test failed:', error);
          return { success: false, error, responseTime };
        } else {
          console.log(`✅ Database test passed (${responseTime}ms)`);
          console.log('Sample data:', data);
          return { success: true, data, responseTime };
        }
      } catch (error) {
        console.error('❌ Database test error:', error);
        return { success: false, error };
      }
    },

    testAuth: async () => {
      console.log('🔐 Testing authentication...');
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Auth test failed:', error);
          return { success: false, error };
        } else {
          console.log('✅ Auth test passed');
          console.log('Session:', session ? {
            user: session.user.email,
            expires: new Date(session.expires_at! * 1000).toLocaleString()
          } : 'No active session');
          return { success: true, session };
        }
      } catch (error) {
        console.error('❌ Auth test error:', error);
        return { success: false, error };
      }
    },

    // Utility commands
    clearAll: () => {
      browserErrorHandler.clearErrors();
      ConsoleMonitor.clearLogs();
      console.clear();
      console.log('🧹 All errors and logs cleared');
    },

    exportAll: () => {
      const data = {
        errors: browserErrorHandler.getErrors(),
        logs: ConsoleMonitor.getLogs(),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `debug-export-${new Date().toISOString().slice(0, 19)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      console.log('📁 Debug data exported');
      return data;
    },

    // Log analysis commands
    analyzeLogs: async () => {
      console.log('📊 Analyzing console logs...');
      
      try {
        const { LogAnalyzer } = await import('../utils/logAnalyzer');
        const logs = ConsoleMonitor.getLogs();
        const analysis = LogAnalyzer.analyzeConsoleLog(logs);
        
        console.group('📊 Log Analysis Results');
        
        console.group('📈 Summary');
        console.log(`Total logs: ${analysis.summary.total}`);
        console.log('By level:', analysis.summary.byLevel);
        console.log(`Duration: ${analysis.summary.timeRange.duration}ms`);
        console.log(`Time range: ${analysis.summary.timeRange.start.toLocaleString()} - ${analysis.summary.timeRange.end.toLocaleString()}`);
        console.groupEnd();
        
        if (analysis.issues.errors.length > 0) {
          console.group(`🚨 Errors (${analysis.issues.errors.length})`);
          analysis.issues.errors.slice(0, 5).forEach((error, i) => {
            console.log(`${i + 1}. [${error.severity.toUpperCase()}] ${error.category}: ${error.message}`);
            console.log(`   Frequency: ${error.frequency}x | Time: ${error.timestamp.toLocaleTimeString()}`);
            if (error.suggestions.length > 0) {
              console.log(`   Suggestions: ${error.suggestions.join(', ')}`);
            }
          });
          if (analysis.issues.errors.length > 5) {
            console.log(`... and ${analysis.issues.errors.length - 5} more errors`);
          }
          console.groupEnd();
        }
        
        if (analysis.issues.warnings.length > 0) {
          console.group(`⚠️ Warnings (${analysis.issues.warnings.length})`);
          analysis.issues.warnings.slice(0, 3).forEach((warning, i) => {
            console.log(`${i + 1}. ${warning.category}: ${warning.message} (${warning.frequency}x)`);
          });
          if (analysis.issues.warnings.length > 3) {
            console.log(`... and ${analysis.issues.warnings.length - 3} more warnings`);
          }
          console.groupEnd();
        }
        
        if (analysis.issues.patterns.length > 0) {
          console.group(`🔄 Patterns (${analysis.issues.patterns.length})`);
          analysis.issues.patterns.slice(0, 3).forEach((pattern, i) => {
            console.log(`${i + 1}. [${pattern.impact.toUpperCase()}] ${pattern.pattern} (${pattern.count}x)`);
            console.log(`   ${pattern.description}`);
          });
          if (analysis.issues.patterns.length > 3) {
            console.log(`... and ${analysis.issues.patterns.length - 3} more patterns`);
          }
          console.groupEnd();
        }
        
        if (analysis.recommendations.length > 0) {
          console.group('💡 Recommendations');
          analysis.recommendations.forEach((rec, i) => {
            console.log(`${i + 1}. ${rec}`);
          });
          console.groupEnd();
        }
        
        console.groupEnd();
        console.log('💡 Tip: Visit /log-analysis page to upload and analyze log files with detailed UI');
        return analysis;
      } catch (error) {
        console.error('❌ Log analysis failed:', error);
        return null;
      }
    },

    // Help command
    help: () => {
      console.group('🛠️ Available Debug Commands');
      console.log('window.__DEBUG_ERRORS__.showErrors() - Show all browser errors');
      console.log('window.__DEBUG_ERRORS__.showLogs(level?) - Show console logs (optional level filter)');
      console.log('window.__DEBUG_ERRORS__.runDiagnostics() - Run full system diagnostics');
      console.log('window.__DEBUG_ERRORS__.testDatabase() - Test database connection');
      console.log('window.__DEBUG_ERRORS__.testAuth() - Test authentication');
      console.log('window.__DEBUG_ERRORS__.clearAll() - Clear all errors and logs');
      console.log('window.__DEBUG_ERRORS__.exportAll() - Export all debug data');
      console.log('window.__DEBUG_ERRORS__.help() - Show this help');
      console.log('window.__DEBUG_ERRORS__.analyzeLogs() - Analyze current console logs');
      console.groupEnd();
      
      console.group('📊 Quick Stats');
      const errorSummary = browserErrorHandler.getErrorSummary();
      const logSummary = ConsoleMonitor.getLogSummary();
      console.log(`Errors: ${errorSummary.total} (${Object.entries(errorSummary.byType).map(([type, count]) => `${type}: ${count}`).join(', ')})`);
      console.log(`Logs: ${logSummary.total} (errors: ${logSummary.errors}, warnings: ${logSummary.warnings})`);
      console.groupEnd();
    }
  });

  // Show welcome message
  console.log(
    '%c🛠️ Debug Console Ready!',
    'color: #10b981; font-size: 16px; font-weight: bold;'
  );
  console.log(
    '%cType window.__DEBUG_ERRORS__.help() for available commands',
    'color: #6b7280; font-size: 12px;'
  );
}