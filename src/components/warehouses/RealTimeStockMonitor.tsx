import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Package, 
  TrendingDown, 
  TrendingUp, 
  Wifi, 
  WifiOff,
  Bell,
  BellOff,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useRealTimeStock } from '@/hooks/useRealTimeStock';
import type { StockAlert, StockUpdateEvent } from '@/types/warehouseStock';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

export interface RealTimeStockMonitorProps {
  warehouseId?: string;
  productId?: string;
  className?: string;
}

export function RealTimeStockMonitor({ 
  warehouseId, 
  productId, 
  className 
}: RealTimeStockMonitorProps) {
  const [enabled, setEnabled] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  const {
    isConnected,
    connectionStatus,
    recentUpdates,
    activeAlerts,
    updateCount,
    lastUpdateTime,
    connect,
    disconnect,
    clearUpdates,
    markAlertAsRead
  } = useRealTimeStock(`monitor-${warehouseId || 'all'}-${productId || 'all'}`, {
    warehouseId,
    productId,
    enabled,
    showNotifications,
    includeMovements: true,
    includeSerialNumbers: true,
    includeAlerts: true
  });

  // Filter alerts based on read status
  const displayedAlerts = showOnlyUnread 
    ? activeAlerts.filter(alert => !alert.isRead)
    : activeAlerts;

  // Get connection status icon and color
  const getConnectionIcon = () => {
    if (isConnected) {
      return <Wifi className="h-4 w-4 text-green-500" />;
    }
    return <WifiOff className="h-4 w-4 text-red-500" />;
  };

  const getConnectionBadge = () => {
    const variant = isConnected ? 'default' : 'destructive';
    const text = isConnected ? 'Connected' : 'Disconnected';
    return <Badge variant={variant}>{text}</Badge>;
  };

  // Get alert severity icon
  const getAlertIcon = (severity: StockAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get update type icon
  const getUpdateIcon = (type: StockUpdateEvent['type']) => {
    switch (type) {
      case 'stock_level_changed':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'movement_logged':
        return <Package className="h-4 w-4 text-green-500" />;
      case 'serial_number_updated':
        return <Activity className="h-4 w-4 text-purple-500" />;
      case 'alert_triggered':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format update message
  const formatUpdateMessage = (event: StockUpdateEvent) => {
    switch (event.type) {
      case 'stock_level_changed':
        return `Stock level updated for ${event.data.productName || 'product'}`;
      case 'movement_logged':
        return `Stock movement: ${event.data.type || 'movement'} recorded`;
      case 'serial_number_updated':
        return `Serial number ${event.data.serialNumber} status changed to ${event.data.status}`;
      case 'alert_triggered':
        return event.data.message;
      default:
        return 'Stock update received';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connection Status and Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getConnectionIcon()}
              <CardTitle className="text-lg">Real-Time Stock Monitor</CardTitle>
              {getConnectionBadge()}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="notifications"
                checked={showNotifications}
                onCheckedChange={setShowNotifications}
              />
              <Label htmlFor="notifications" className="text-sm">
                {showNotifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </Label>
              <Switch
                id="monitoring"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
              <Label htmlFor="monitoring" className="text-sm">Monitor</Label>
            </div>
          </div>
          <CardDescription>
            {isConnected ? (
              <>
                Monitoring stock changes in real-time. 
                {updateCount > 0 && (
                  <> {updateCount} updates received{lastUpdateTime && (
                    <>, last update {formatDistanceToNow(lastUpdateTime, { addSuffix: true, locale: th })}
                  </>)}.</>
                )}
              </>
            ) : (
              'Real-time monitoring is disabled or disconnected.'
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span>Active Alerts ({activeAlerts.length})</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                >
                  {showOnlyUnread ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {showOnlyUnread ? 'Show All' : 'Unread Only'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {displayedAlerts.map((alert) => (
                  <Alert 
                    key={alert.id} 
                    className={`${alert.isRead ? 'opacity-60' : ''} ${
                      alert.severity === 'critical' ? 'border-red-500' : 
                      alert.severity === 'warning' ? 'border-yellow-500' : 
                      'border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2">
                        {getAlertIcon(alert.severity)}
                        <div className="flex-1">
                          <AlertTitle className="text-sm font-medium">
                            {alert.productName} - {alert.warehouseName}
                          </AlertTitle>
                          <AlertDescription className="text-xs">
                            {alert.message}
                            {alert.recommendedAction && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                <strong>Action:</strong> {alert.recommendedAction}
                              </div>
                            )}
                            <div className="mt-1 text-xs text-muted-foreground">
                              Current stock: {alert.currentStock}
                              {alert.threshold && ` (threshold: ${alert.threshold})`}
                            </div>
                          </AlertDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {alert.severity}
                        </Badge>
                        {!alert.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAlertAsRead(alert.id)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))}
                {displayedAlerts.length === 0 && showOnlyUnread && (
                  <div className="text-center text-muted-foreground py-4">
                    No unread alerts
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Recent Updates */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <span>Recent Updates</span>
              {updateCount > 0 && (
                <Badge variant="secondary">{updateCount}</Badge>
              )}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={clearUpdates}
              disabled={recentUpdates.length === 0}
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            {recentUpdates.length > 0 ? (
              <div className="space-y-2">
                {recentUpdates.map((update, index) => (
                  <div key={`${update.timestamp.getTime()}-${index}`} className="flex items-start space-x-3 p-2 rounded-lg border">
                    {getUpdateIcon(update.type)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {formatUpdateMessage(update)}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {update.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDistanceToNow(update.timestamp, { addSuffix: true, locale: th })}
                        </span>
                      </div>
                      {(update.warehouseId || update.productId) && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {update.warehouseId && `Warehouse: ${update.warehouseId}`}
                          {update.warehouseId && update.productId && ' • '}
                          {update.productId && `Product: ${update.productId}`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent updates</p>
                <p className="text-xs">Stock changes will appear here in real-time</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Connection Details */}
      {!isConnected && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-sm">Connection Status: {connectionStatus}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={connect}
              >
                Reconnect
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}