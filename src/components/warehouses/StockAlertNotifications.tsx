import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Bell, 
  BellOff, 
  CheckCircle, 
  Clock, 
  Eye, 
  EyeOff, 
  Package, 
  Settings, 
  Trash2, 
  X 
} from 'lucide-react';
import { useRealTimeStock } from '@/hooks/useRealTimeStock';
import { RealTimeStockService } from '@/services/realTimeStockService';
import type { StockAlert } from '@/types/warehouseStock';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface StockAlertNotificationsProps {
  warehouseId?: string;
  className?: string;
  compact?: boolean;
}

export function StockAlertNotifications({ 
  warehouseId, 
  className,
  compact = false 
}: StockAlertNotificationsProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [alertThresholds, setAlertThresholds] = useState(RealTimeStockService.getAlertThresholds());
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [showOnlyCritical, setShowOnlyCritical] = useState(false);

  const {
    activeAlerts,
    markAlertAsRead,
    isConnected
  } = useRealTimeStock(`alerts-${warehouseId || 'all'}`, {
    warehouseId,
    enabled: true,
    showNotifications: true,
    includeAlerts: true,
    includeMovements: false,
    includeSerialNumbers: false
  });

  // Filter alerts
  const filteredAlerts = activeAlerts.filter(alert => {
    if (showOnlyUnread && alert.isRead) return false;
    if (showOnlyCritical && alert.severity !== 'critical') return false;
    return true;
  });

  // Count unread alerts
  const unreadCount = activeAlerts.filter(alert => !alert.isRead).length;
  const criticalCount = activeAlerts.filter(alert => alert.severity === 'critical').length;

  // Update alert thresholds
  const handleThresholdUpdate = () => {
    RealTimeStockService.updateAlertThresholds(alertThresholds);
    setShowSettings(false);
  };

  // Mark all as read
  const markAllAsRead = () => {
    activeAlerts.forEach(alert => {
      if (!alert.isRead) {
        markAlertAsRead(alert.id);
      }
    });
  };

  // Get alert priority color
  const getAlertColor = (alert: StockAlert) => {
    switch (alert.severity) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      case 'info':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  // Get alert icon
  const getAlertIcon = (alert: StockAlert) => {
    switch (alert.type) {
      case 'out_of_stock':
        return <Package className="h-4 w-4 text-red-500" />;
      case 'low_stock':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
        
        {/* Compact alert list - could be a dropdown */}
        {activeAlerts.length > 0 && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50">
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Stock Alerts</h3>
                <Badge variant="secondary">{unreadCount} unread</Badge>
              </div>
            </div>
            <ScrollArea className="max-h-64">
              <div className="p-2 space-y-2">
                {filteredAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-2 rounded border text-sm ${getAlertColor(alert)} ${
                      alert.isRead ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2">
                        {getAlertIcon(alert)}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {alert.productName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {alert.warehouseName} • Stock: {alert.currentStock}
                          </div>
                        </div>
                      </div>
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
                ))}
                {activeAlerts.length > 5 && (
                  <div className="text-center text-xs text-muted-foreground py-2">
                    +{activeAlerts.length - 5} more alerts
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">Stock Alerts</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} unread</Badge>
            )}
            {criticalCount > 0 && (
              <Badge variant="destructive">{criticalCount} critical</Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOnlyUnread(!showOnlyUnread)}
            >
              {showOnlyUnread ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOnlyCritical(!showOnlyCritical)}
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Alert Settings</DialogTitle>
                  <DialogDescription>
                    Configure stock alert thresholds
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="lowStock">Low Stock Threshold</Label>
                    <Input
                      id="lowStock"
                      type="number"
                      value={alertThresholds.lowStock}
                      onChange={(e) => setAlertThresholds(prev => ({
                        ...prev,
                        lowStock: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="outOfStock">Out of Stock Threshold</Label>
                    <Input
                      id="outOfStock"
                      type="number"
                      value={alertThresholds.outOfStock}
                      onChange={(e) => setAlertThresholds(prev => ({
                        ...prev,
                        outOfStock: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="overstock">Overstock Threshold</Label>
                    <Input
                      id="overstock"
                      type="number"
                      value={alertThresholds.overstock}
                      onChange={(e) => setAlertThresholds(prev => ({
                        ...prev,
                        overstock: parseInt(e.target.value) || 0
                      }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSettings(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleThresholdUpdate}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
              >
                <CheckCircle className="h-4 w-4" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>
        <CardDescription>
          {isConnected ? (
            <>
              Real-time stock alerts and notifications. 
              {activeAlerts.length > 0 ? (
                <> {activeAlerts.length} active alerts.</>
              ) : (
                <> No active alerts.</>
              )}
            </>
          ) : (
            'Real-time alerts are disabled or disconnected.'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {filteredAlerts.length > 0 ? (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <Alert 
                  key={alert.id} 
                  className={`${getAlertColor(alert)} ${alert.isRead ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getAlertIcon(alert)}
                      <div className="flex-1">
                        <AlertTitle className="text-sm font-medium">
                          {alert.productName} - {alert.warehouseName}
                        </AlertTitle>
                        <AlertDescription className="text-sm">
                          {alert.message}
                          {alert.recommendedAction && (
                            <div className="mt-2 p-2 bg-white/50 rounded text-xs">
                              <strong>Recommended Action:</strong> {alert.recommendedAction}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-xs text-muted-foreground">
                              Current stock: <strong>{alert.currentStock}</strong>
                              {alert.threshold && ` (threshold: ${alert.threshold})`}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDistanceToNow(alert.createdAt, { addSuffix: true, locale: th })}
                            </div>
                          </div>
                        </AlertDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {alert.severity}
                      </Badge>
                      {!alert.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAlertAsRead(alert.id)}
                          title="Mark as read"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No alerts to display</p>
              <p className="text-xs">
                {showOnlyUnread ? 'No unread alerts' : 
                 showOnlyCritical ? 'No critical alerts' : 
                 'Stock alerts will appear here when thresholds are exceeded'}
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}