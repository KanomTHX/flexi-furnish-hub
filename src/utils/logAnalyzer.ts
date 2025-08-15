// Console Log Analyzer
export interface LogAnalysis {
  summary: {
    total: number;
    byLevel: Record<string, number>;
    timeRange: {
      start: Date;
      end: Date;
      duration: number;
    };
  };
  issues: {
    errors: LogIssue[];
    warnings: LogIssue[];
    patterns: PatternAnalysis[];
  };
  recommendations: string[];
}

export interface LogIssue {
  level: string;
  message: string;
  timestamp: Date;
  frequency: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  suggestions: string[];
}

export interface PatternAnalysis {
  pattern: string;
  count: number;
  description: string;
  impact: 'low' | 'medium' | 'high';
  examples: string[];
}

export class LogAnalyzer {
  static analyzeConsoleLog(logData: any): LogAnalysis {
    const logs = Array.isArray(logData) ? logData : logData.logs || [];
    
    if (!logs.length) {
      return {
        summary: {
          total: 0,
          byLevel: {},
          timeRange: {
            start: new Date(),
            end: new Date(),
            duration: 0
          }
        },
        issues: {
          errors: [],
          warnings: [],
          patterns: []
        },
        recommendations: ['No logs to analyze']
      };
    }

    const summary = this.generateSummary(logs);
    const issues = this.identifyIssues(logs);
    const recommendations = this.generateRecommendations(summary, issues);

    return {
      summary,
      issues,
      recommendations
    };
  }

  private static generateSummary(logs: any[]): LogAnalysis['summary'] {
    const byLevel: Record<string, number> = {};
    const timestamps = logs
      .map(log => new Date(log.timestamp))
      .filter(date => !isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    logs.forEach(log => {
      const level = log.level || 'unknown';
      byLevel[level] = (byLevel[level] || 0) + 1;
    });

    return {
      total: logs.length,
      byLevel,
      timeRange: {
        start: timestamps[0] || new Date(),
        end: timestamps[timestamps.length - 1] || new Date(),
        duration: timestamps.length > 1 ? 
          timestamps[timestamps.length - 1].getTime() - timestamps[0].getTime() : 0
      }
    };
  }

  private static identifyIssues(logs: any[]): LogAnalysis['issues'] {
    const errors: LogIssue[] = [];
    const warnings: LogIssue[] = [];
    const patterns: PatternAnalysis[] = [];

    // Group similar messages
    const messageGroups = new Map<string, any[]>();
    
    logs.forEach(log => {
      const message = this.normalizeMessage(log.args?.join(' ') || log.message || '');
      if (!messageGroups.has(message)) {
        messageGroups.set(message, []);
      }
      messageGroups.get(message)!.push(log);
    });

    // Analyze each group
    messageGroups.forEach((groupLogs, message) => {
      const firstLog = groupLogs[0];
      const level = firstLog.level || 'unknown';
      const frequency = groupLogs.length;

      if (level === 'error') {
        errors.push({
          level,
          message,
          timestamp: new Date(firstLog.timestamp),
          frequency,
          severity: this.determineSeverity(message, frequency),
          category: this.categorizeError(message),
          suggestions: this.getSuggestions(message)
        });
      } else if (level === 'warn') {
        warnings.push({
          level,
          message,
          timestamp: new Date(firstLog.timestamp),
          frequency,
          severity: this.determineSeverity(message, frequency),
          category: this.categorizeWarning(message),
          suggestions: this.getSuggestions(message)
        });
      }

      // Identify patterns
      if (frequency > 1) {
        patterns.push({
          pattern: message,
          count: frequency,
          description: this.describePattern(message, frequency),
          impact: this.assessPatternImpact(message, frequency),
          examples: groupLogs.slice(0, 3).map(log => 
            `${new Date(log.timestamp).toLocaleTimeString()}: ${log.args?.join(' ') || log.message}`
          )
        });
      }
    });

    // Sort by severity and frequency
    errors.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return (severityOrder[b.severity] - severityOrder[a.severity]) || (b.frequency - a.frequency);
    });

    warnings.sort((a, b) => b.frequency - a.frequency);
    patterns.sort((a, b) => b.count - a.count);

    return { errors, warnings, patterns };
  }

  private static normalizeMessage(message: string): string {
    return message
      .replace(/\d+/g, 'N') // Replace numbers with N
      .replace(/https?:\/\/[^\s]+/g, 'URL') // Replace URLs
      .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID') // Replace UUIDs
      .trim();
  }

  private static determineSeverity(message: string, frequency: number): LogIssue['severity'] {
    const lowerMessage = message.toLowerCase();
    
    // Critical issues
    if (lowerMessage.includes('cannot read property') ||
        lowerMessage.includes('typeerror') ||
        lowerMessage.includes('referenceerror') ||
        lowerMessage.includes('network error') ||
        lowerMessage.includes('failed to fetch')) {
      return frequency > 5 ? 'critical' : 'high';
    }

    // High severity
    if (lowerMessage.includes('error') ||
        lowerMessage.includes('failed') ||
        lowerMessage.includes('unauthorized') ||
        lowerMessage.includes('forbidden')) {
      return frequency > 3 ? 'high' : 'medium';
    }

    // Medium severity
    if (lowerMessage.includes('warning') ||
        lowerMessage.includes('deprecated') ||
        lowerMessage.includes('missing')) {
      return frequency > 10 ? 'medium' : 'low';
    }

    return frequency > 20 ? 'medium' : 'low';
  }

  private static categorizeError(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('cors')) {
      return 'Network';
    }
    if (lowerMessage.includes('auth') || lowerMessage.includes('unauthorized') || lowerMessage.includes('jwt')) {
      return 'Authentication';
    }
    if (lowerMessage.includes('database') || lowerMessage.includes('supabase') || lowerMessage.includes('sql')) {
      return 'Database';
    }
    if (lowerMessage.includes('typeerror') || lowerMessage.includes('referenceerror') || lowerMessage.includes('syntaxerror')) {
      return 'JavaScript';
    }
    if (lowerMessage.includes('react') || lowerMessage.includes('component') || lowerMessage.includes('hook')) {
      return 'React';
    }
    
    return 'General';
  }

  private static categorizeWarning(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('deprecated')) {
      return 'Deprecation';
    }
    if (lowerMessage.includes('performance') || lowerMessage.includes('memory')) {
      return 'Performance';
    }
    if (lowerMessage.includes('react') || lowerMessage.includes('hook')) {
      return 'React';
    }
    
    return 'General';
  }

  private static getSuggestions(message: string): string[] {
    const suggestions: string[] = [];
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('cannot read property')) {
      suggestions.push('Add null/undefined checks before accessing properties');
      suggestions.push('Use optional chaining (?.) operator');
    }

    if (lowerMessage.includes('network error') || lowerMessage.includes('failed to fetch')) {
      suggestions.push('Check internet connection');
      suggestions.push('Verify API endpoint URLs');
      suggestions.push('Check CORS configuration');
    }

    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('jwt')) {
      suggestions.push('Check authentication token');
      suggestions.push('Refresh user session');
      suggestions.push('Verify API permissions');
    }

    if (lowerMessage.includes('deprecated')) {
      suggestions.push('Update to newer API version');
      suggestions.push('Check documentation for alternatives');
    }

    if (lowerMessage.includes('react') && lowerMessage.includes('hook')) {
      suggestions.push('Check React Hook rules');
      suggestions.push('Verify component lifecycle');
    }

    return suggestions.length > 0 ? suggestions : ['Review code and documentation'];
  }

  private static describePattern(message: string, count: number): string {
    if (count > 50) {
      return `High frequency issue occurring ${count} times - may indicate a loop or recurring problem`;
    }
    if (count > 10) {
      return `Moderate frequency issue occurring ${count} times - worth investigating`;
    }
    return `Recurring issue occurring ${count} times`;
  }

  private static assessPatternImpact(message: string, count: number): PatternAnalysis['impact'] {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('error') && count > 10) {
      return 'high';
    }
    if (count > 50) {
      return 'high';
    }
    if (count > 10) {
      return 'medium';
    }
    return 'low';
  }

  private static generateRecommendations(
    summary: LogAnalysis['summary'], 
    issues: LogAnalysis['issues']
  ): string[] {
    const recommendations: string[] = [];

    // Error-based recommendations
    if (issues.errors.length > 0) {
      const criticalErrors = issues.errors.filter(e => e.severity === 'critical');
      if (criticalErrors.length > 0) {
        recommendations.push(`🚨 Address ${criticalErrors.length} critical errors immediately`);
      }

      const networkErrors = issues.errors.filter(e => e.category === 'Network');
      if (networkErrors.length > 0) {
        recommendations.push(`🌐 Fix ${networkErrors.length} network-related issues`);
      }

      const jsErrors = issues.errors.filter(e => e.category === 'JavaScript');
      if (jsErrors.length > 0) {
        recommendations.push(`🐛 Fix ${jsErrors.length} JavaScript errors`);
      }
    }

    // Pattern-based recommendations
    const highImpactPatterns = issues.patterns.filter(p => p.impact === 'high');
    if (highImpactPatterns.length > 0) {
      recommendations.push(`🔄 Investigate ${highImpactPatterns.length} high-frequency patterns`);
    }

    // Performance recommendations
    if (summary.total > 1000) {
      recommendations.push('📊 Consider reducing console output for better performance');
    }

    // General recommendations
    if (summary.byLevel.error > 0) {
      recommendations.push('🔍 Enable error monitoring and alerting');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ No major issues detected in console logs');
    }

    return recommendations;
  }

  // Utility method to analyze uploaded log file
  static analyzeLogFile(fileContent: string): LogAnalysis {
    try {
      const data = JSON.parse(fileContent);
      return this.analyzeConsoleLog(data);
    } catch (error) {
      return {
        summary: {
          total: 0,
          byLevel: {},
          timeRange: {
            start: new Date(),
            end: new Date(),
            duration: 0
          }
        },
        issues: {
          errors: [],
          warnings: [],
          patterns: []
        },
        recommendations: [`Failed to parse log file: ${error}`]
      };
    }
  }
}