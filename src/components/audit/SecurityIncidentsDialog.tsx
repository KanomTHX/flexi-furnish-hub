import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Shield,
  Clock,
  CheckCircle,
  Search,
  X
} from 'lucide-react';
import { useAudit } from '@/hooks/useAudit';
import { useToast } from '@/hooks/use-toast';

interface SecurityIncidentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SecurityIncidentsDialog: React.FC<SecurityIncidentsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { 
    allSecurityEvents, 
    users, 
    resolveSecurityEvent,
    getUnresolvedSecurityEvents 
  } = useAudit();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'unresolved' | 'all' | 'resolved'>('unresolved');
  const [searchTerm, setSearchTerm] = useState('');

  const unresolvedEvents = getUnresolvedSecurityEvents();
  const resolvedEvents = allSecurityEvents.filter(event => event.resolved);

  const getFilteredEvents = () => {
    let events: any[] = [];
    
    switch (activeTab) {
      case 'unresolved':
        events = unresolvedEvents;
        break;
      case 'resolved':
        events = resolvedEvents;
        break;
      default:
        events = allSecurityEvents;
    }

    if (searchTerm) {
      events = events.filter(event => 
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.ipAddress.includes(searchTerm)
      );
    }

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const handleResolveEvent = (eventId: string) => {
    resolveSecurityEvent(eventId, 'current-user', 'แกไขโดยผดแลระบบ');
    
    toast({
      title: "แกไขเหตการณสำเรจ! ",
      description: "เหตการณความปลอดภยไดรบการแกไขแลว"
    });
  };

  const filteredEvents = getFilteredEvents();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            เหตการณความปลอดภย
            {unresolvedEvents.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unresolvedEvents.length} รายการ
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            จดการและตดตามเหตการณความปลอดภยในระบบ
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="คนหาเหตการณ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="unresolved" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              ยงไมแกไข ({unresolvedEvents.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              ทงหมด ({allSecurityEvents.length})
            </TabsTrigger>
            <TabsTrigger value="resolved" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              แกไขแลว ({resolvedEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    ไมพบเหตการณความปลอดภย
                  </h3>
                  <p className="text-gray-500">
                    {activeTab === 'unresolved' 
                      ? 'ไมมเหตการณทยงไมไดแกไข' 
                      : 'ไมพบเหตการณทตรงกบเกณฑการคนหา'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event) => {
                  const user = event.userId ? users.find(u => u.id === event.userId) : null;
                  
                  return (
                    <Card 
                      key={event.id} 
                      className={!event.resolved ? 'border-red-200 bg-red-50' : 'border-gray-200'}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Badge className={
                                event.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                event.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                event.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {event.severity?.toUpperCase() || 'UNKNOWN'}
                              </Badge>
                              <Badge variant={event.resolved ? 'default' : 'destructive'}>
                                {event.resolved ? 'แกไขแลว' : 'ยงไมแกไข'}
                              </Badge>
                            </div>

                            <h3 className="font-medium text-gray-900 mb-2">
                              {event.description}
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{new Date(event.timestamp).toLocaleString('th-TH')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                <span>{event.ipAddress}</span>
                              </div>
                              {user && (
                                <div className="flex items-center gap-2">
                                  <span>{user.fullName}</span>
                                </div>
                              )}
                            </div>

                            {event.resolved && event.resolvedBy && (
                              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2 text-green-700 text-sm">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>
                                    แกไขโดย: {users.find(u => u.id === event.resolvedBy)?.fullName} 
                                    เมอ {event.resolvedAt && new Date(event.resolvedAt).toLocaleString('th-TH')}
                                  </span>
                                </div>
                                {event.notes && (
                                  <p className="text-sm text-green-600 mt-1">
                                    หมายเหต: {event.notes}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            {!event.resolved && (
                              <Button
                                size="sm"
                                onClick={() => handleResolveEvent(event.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                แกไข
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              แสดง {filteredEvents.length} จาก {allSecurityEvents.length} รายการ
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              ปด
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
