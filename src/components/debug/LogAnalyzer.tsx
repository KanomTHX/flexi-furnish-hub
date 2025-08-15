// Log Analyzer Component
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { LogAnalyzer, LogAnalysis } from '@/utils/logAnalyzer';

export const LogAnalyzerComponent: React.FC = () => {
  const [analysis, setAnalysis] = useState<LogAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    try {
      const content = await file.text();
      const result = LogAnalyzer.analyzeLogFile(content);
      setAnalysis(result);
    } catch (error) {
      console.error('Failed to analyze log file:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertCircle className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Console Log Analyzer
          </CardTitle>
          <CardDescription>
            Upload and analyze console log files to identify issues and patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="log-file-input"
              />
              <label
                htmlFor="log-file-input"
                className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <Upload className="h-4 w-4" />
                {isAnalyzing ? 'Analyzing...' : 'Upload Console Log File (.json)'}
              </label>
            </div>
            {analysis && (
              <Button
                variant="outline"
                onClick={() => setAnalysis(null)}
              >
                Clear Analysis
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{analysis.summary.total}</div>
                  <div className="text-sm text-muted-foreground">Total Logs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {analysis.summary.byLevel.error || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {analysis.summary.byLevel.warn || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Warnings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {formatDuration(analysis.summary.timeRange.duration)}
                  </div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Log Levels:</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(analysis.summary.byLevel).map(([level, count]) => (
                    <Badge key={level} variant="outline">
                      {level}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Recommendations:</div>
                <ul className="list-disc list-inside space-y-1">
                  {analysis.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm">{rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Detailed Analysis */}
          <Tabs defaultValue="errors" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="errors">
                Errors ({analysis.issues.errors.length})
              </TabsTrigger>
              <TabsTrigger value="warnings">
                Warnings ({analysis.issues.warnings.length})
              </TabsTrigger>
              <TabsTrigger value="patterns">
                Patterns ({analysis.issues.patterns.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="errors">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    Error Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.issues.errors.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No errors found in the logs
                    </div>
                  ) : (
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {analysis.issues.errors.map((error, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getSeverityIcon(error.severity)}
                                <Badge variant={getSeverityColor(error.severity)}>
                                  {error.severity}
                                </Badge>
                                <Badge variant="outline">{error.category}</Badge>
                                {error.frequency > 1 && (
                                  <Badge variant="secondary">
                                    {error.frequency}x
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {error.timestamp.toLocaleString()}
                              </div>
                            </div>
                            
                            <div className="font-mono text-sm text-red-600 mb-2">
                              {error.message}
                            </div>
                            
                            {error.suggestions.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs font-medium mb-1">Suggestions:</div>
                                <ul className="text-xs text-muted-foreground list-disc list-inside">
                                  {error.suggestions.map((suggestion, i) => (
                                    <li key={i}>{suggestion}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="warnings">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Warning Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.issues.warnings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No warnings found in the logs
                    </div>
                  ) : (
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {analysis.issues.warnings.map((warning, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{warning.category}</Badge>
                                {warning.frequency > 1 && (
                                  <Badge variant="outline">
                                    {warning.frequency}x
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {warning.timestamp.toLocaleString()}
                              </div>
                            </div>
                            
                            <div className="font-mono text-sm text-yellow-600 mb-2">
                              {warning.message}
                            </div>
                            
                            {warning.suggestions.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs font-medium mb-1">Suggestions:</div>
                                <ul className="text-xs text-muted-foreground list-disc list-inside">
                                  {warning.suggestions.map((suggestion, i) => (
                                    <li key={i}>{suggestion}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="patterns">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Pattern Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.issues.patterns.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No recurring patterns found
                    </div>
                  ) : (
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {analysis.issues.patterns.map((pattern, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant={getImpactColor(pattern.impact)}>
                                  {pattern.impact} impact
                                </Badge>
                                <Badge variant="outline">
                                  {pattern.count} occurrences
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="font-mono text-sm mb-2">
                              {pattern.pattern}
                            </div>
                            
                            <div className="text-sm text-muted-foreground mb-2">
                              {pattern.description}
                            </div>
                            
                            {pattern.examples.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs font-medium mb-1">Examples:</div>
                                <div className="text-xs text-muted-foreground space-y-1">
                                  {pattern.examples.map((example, i) => (
                                    <div key={i} className="font-mono bg-gray-50 p-1 rounded">
                                      {example}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};