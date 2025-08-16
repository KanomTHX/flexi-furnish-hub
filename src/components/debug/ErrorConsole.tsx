// Error Console Component for Development
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Bug, 
  Network, 
  FileX, 
  Zap,
  Trash2,
  Download,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { browserErrorHandler, ConsoleMonitor, BrowserError } from '@/utils/browserErrorHandler';

interface ErrorConsoleProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

export const ErrorConsole: React.FC<ErrorConsoleProps> = ({ 
  isVisible = false, 
  onToggle 
}) => {
  const [errors, setErrors] = useState<BrowserError[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedError, setSelectedError] = useState<BrowserError | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const updateData = () => {
      setErrors(browserErrorHandler.getErrors());
      setLogs(ConsoleMonitor.getLogs());
    };

    updateData();

    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(updateData, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const errorSummary = browserErrorHandler.getErrorSummary();
  const logSummary = ConsoleMonitor.getLogSummary();

  const getErrorIcon = (type: BrowserError['type']) => {
    switch (type) {
      case 'javascript': return <Bug className="h-4 w-4" />;
      case 'network': return <Network className="h-4 w-4" />;
      case 'resource': return <FileX className="h-4 w-4" />;
      case 'unhandled-promise': return <Zap className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getErrorColor = (type: BrowserError['type']) => {
    switch (type) {
      case 'javascript': return 'destructive';
      case 'network': return 'secondary';
      case 'resource': return 'outline';
      case 'unhandled-promise': return 'destructive';
      default: return 'default';
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600';
      case 'warn': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      case 'debug': return 'text-gray-600';
      default: return 'text-gray-800';
    }
  };

  const clearErrors = () => {
    browserErrorHandler.clearErrors();
    setErrors([]);
    setSelectedError(null);
  };

  const clearLogs = () => {
    ConsoleMonitor.clearLogs();
    setLogs([]);
  };

  const exportErrors = () => {
    const data = browserErrorHandler.exportErrors();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `errors-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportLogs = () => {
    const data = ConsoleMonitor.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `console-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggle}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug ({errorSummary.total})
          {errorSummary.total > 0 && (
            <Badge variant="destructive" className="ml-2">
              {errorSummary.total}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 z-50">
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Debug Console</CardTitle>
              <CardDescription className="text-xs">
                Errors: {errorSummary.total} | Logs: {logSummary.total}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${autoRefresh ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-6 w-6 p-0"
              >
                {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <Tabs defaultValue="errors" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger value="errors" className="text-xs">
                Errors ({errorSummary.total})
              </TabsTrigger>
              <TabsTrigger value="console" className="text-xs">
                Console ({logSummary.total})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="errors" className="mt-2">
              <div className="flex justify-between items-center mb-2">
                <div className="flex gap-1">
                  {Object.entries(errorSummary.byType).map(([type, count]) => (
                    <Badge key={type} variant={getErrorColor(type as BrowserError['type'])} className="text-xs">
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={clearErrors} className="h-6 px-2">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={exportErrors} className="h-6 px-2">
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="h-64">
                <div className="space-y-1">
                  {errors.slice(-20).reverse().map((error, index) => (
                    <div
                      key={index}
                      className="p-2 border rounded text-xs cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedError(error)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getErrorIcon(error.type)}
                        <Badge variant={getErrorColor(error.type)} className="text-xs">
                          {error.type}
                        </Badge>
                        <span className="text-gray-500">
                          {error.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="font-mono text-red-600 truncate">
                        {error.message}
                      </div>
                      {error.source && (
                        <div className="text-gray-500 truncate">
                          {error.source}:{error.line}:{error.column}
                        </div>
                      )}
                    </div>
                  ))}
                  {errors.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      No errors detected
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="console" className="mt-2">
              <div className="flex justify-between items-center mb-2">
                <div className="flex gap-1">
                  <Badge variant="destructive" className="text-xs">
                    Errors: {logSummary.errors}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Warnings: {logSummary.warnings}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={clearLogs} className="h-6 px-2">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={exportLogs} className="h-6 px-2">
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="h-64">
                <div className="space-y-1">
                  {logs.slice(-50).reverse().map((log, index) => (
                    <div key={index} className="p-1 border-b text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {log.level}
                        </Badge>
                        <span className="text-gray-500">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className={`font-mono ${getLogColor(log.level)}`}>
                        {log.args.map((arg, i) => (
                          <span key={i}>
                            {typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)}
                            {i < log.args.length - 1 && ' '}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      No console logs
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Error Detail Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96 max-h-96">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getErrorIcon(selectedError.type)}
                {selectedError.type} Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Message:</strong>
                    <div className="font-mono text-red-600 mt-1">
                      {selectedError.message}
                    </div>
                  </div>
                  
                  {selectedError.source && (
                    <div>
                      <strong>Source:</strong>
                      <div className="font-mono mt-1">
                        {selectedError.source}:{selectedError.line}:{selectedError.column}
                      </div>
                    </div>
                  )}
                  
                  {selectedError.url && (
                    <div>
                      <strong>URL:</strong>
                      <div className="font-mono mt-1 break-all">
                        {selectedError.url}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <strong>Timestamp:</strong>
                    <div className="mt-1">
                      {selectedError.timestamp.toLocaleString()}
                    </div>
                  </div>
                  
                  {selectedError.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="font-mono text-xs mt-1 bg-gray-100 p-2 rounded overflow-auto">
                        {selectedError.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="flex justify-end mt-4">
                <Button onClick={() => setSelectedError(null)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};