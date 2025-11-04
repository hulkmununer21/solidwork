import { useState } from "react";
import { Watch, Smartphone, Heart, Activity, Zap, Wifi, WifiOff, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface DeviceData {
  id: string;
  name: string;
  type: 'smartwatch' | 'fitness-band' | 'phone';
  connected: boolean;
  battery: number;
  lastSync: string;
  data: {
    heartRate: number;
    steps: number;
    calories: number;
    sleep: number;
  };
}

export const WearableIntegration = () => {
  const { toast } = useToast();
  const [devices, setDevices] = useState<DeviceData[]>([
    {
      id: '1',
      name: 'Apple Watch Series 9',
      type: 'smartwatch',
      connected: true,
      battery: 78,
      lastSync: '2 mins ago',
      data: {
        heartRate: 72,
        steps: 8420,
        calories: 340,
        sleep: 7.5
      }
    },
    {
      id: '2',
      name: 'iPhone 15 Pro',
      type: 'phone',
      connected: true,
      battery: 65,
      lastSync: 'Just now',
      data: {
        heartRate: 0,
        steps: 8420,
        calories: 340,
        sleep: 0
      }
    },
    {
      id: '3',
      name: 'Fitbit Charge 5',
      type: 'fitness-band',
      connected: false,
      battery: 0,
      lastSync: '2 days ago',
      data: {
        heartRate: 0,
        steps: 0,
        calories: 0,
        sleep: 0
      }
    }
  ]);

  const handleToggleConnection = (deviceId: string) => {
    setDevices(prev => prev.map(device => 
      device.id === deviceId 
        ? { ...device, connected: !device.connected }
        : device
    ));
    
    const device = devices.find(d => d.id === deviceId);
    toast({
      title: device?.connected ? "Device Disconnected" : "Device Connected",
      description: `${device?.name} ${device?.connected ? 'disconnected from' : 'connected to'} AHS Health Platform`
    });
  };

  const handleSyncDevice = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device?.connected) {
      toast({
        title: "Device Not Connected",
        description: "Please connect the device first",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Syncing Data",
      description: "Updating your health data from connected devices..."
    });

    // Simulate sync
    setTimeout(() => {
      setDevices(prev => prev.map(d => 
        d.id === deviceId 
          ? { ...d, lastSync: 'Just now' }
          : d
      ));
      
      toast({
        title: "Sync Complete",
        description: "Your health data has been updated successfully"
      });
    }, 2000);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'smartwatch': return Watch;
      case 'fitness-band': return Activity;
      case 'phone': return Smartphone;
      default: return Watch;
    }
  };

  const connectedDevices = devices.filter(d => d.connected);
  const totalSteps = connectedDevices.reduce((sum, device) => sum + device.data.steps, 0);
  const avgHeartRate = connectedDevices.filter(d => d.data.heartRate > 0).reduce((sum, device, _, arr) => 
    sum + device.data.heartRate / arr.length, 0) || 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground font-display">Wearable Devices</h2>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Steps</p>
                <p className="text-2xl font-bold">{totalSteps.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-red-100 p-2 rounded-full">
                <Heart className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Heart Rate</p>
                <p className="text-2xl font-bold">{Math.round(avgHeartRate)} <span className="text-sm text-muted-foreground">bpm</span></p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Wifi className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Connected Devices</p>
                <p className="text-2xl font-bold">{connectedDevices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">My Devices</h3>
        {devices.map((device) => {
          const DeviceIcon = getDeviceIcon(device.type);
          
          return (
            <Card key={device.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-full ${device.connected ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <DeviceIcon className={`w-6 h-6 ${device.connected ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-foreground">{device.name}</h3>
                        <Badge variant={device.connected ? "default" : "secondary"}>
                          {device.connected ? (
                            <><Wifi className="w-3 h-3 mr-1" />Connected</>
                          ) : (
                            <><WifiOff className="w-3 h-3 mr-1" />Disconnected</>
                          )}
                        </Badge>
                      </div>
                      
                      {device.connected && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                          {device.data.heartRate > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground">Heart Rate</p>
                              <p className="font-semibold">{device.data.heartRate} bpm</p>
                            </div>
                          )}
                          {device.data.steps > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground">Steps</p>
                              <p className="font-semibold">{device.data.steps.toLocaleString()}</p>
                            </div>
                          )}
                          {device.data.calories > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground">Calories</p>
                              <p className="font-semibold">{device.data.calories}</p>
                            </div>
                          )}
                          {device.data.sleep > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground">Sleep</p>
                              <p className="font-semibold">{device.data.sleep}h</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 mt-3 text-sm text-muted-foreground">
                        {device.connected && device.battery > 0 && (
                          <div className="flex items-center space-x-2">
                            <Zap className="w-4 h-4" />
                            <span>{device.battery}%</span>
                            <Progress value={device.battery} className="w-16 h-2" />
                          </div>
                        )}
                        <span>Last sync: {device.lastSync}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={device.connected}
                      onCheckedChange={() => handleToggleConnection(device.id)}
                    />
                    {device.connected && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSyncDevice(device.id)}
                      >
                        Sync Now
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Device</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Connect your Apple Watch, Fitbit, Samsung Galaxy Watch, or other health devices to automatically sync your health data.
          </p>
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Scan for Devices
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};