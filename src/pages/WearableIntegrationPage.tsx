import { useState } from "react";
import { ArrowLeft, Watch, Smartphone, Heart, Activity, Zap, Wifi, WifiOff, Plus, Settings, RefreshCw, TrendingUp, Battery } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface DeviceData {
  id: string;
  name: string;
  type: 'smartwatch' | 'fitness-band' | 'phone';
  brand: string;
  connected: boolean;
  battery: number;
  lastSync: string;
  data: {
    heartRate: number;
    steps: number;
    calories: number;
    sleep: number;
    distance: number;
  };
  features: string[];
}

const WearableIntegrationPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [devices, setDevices] = useState<DeviceData[]>([
    {
      id: '1',
      name: 'Apple Watch Series 9',
      type: 'smartwatch',
      brand: 'Apple',
      connected: true,
      battery: 78,
      lastSync: '2 mins ago',
      data: {
        heartRate: 72,
        steps: 8420,
        calories: 340,
        sleep: 7.5,
        distance: 6.2
      },
      features: ['Heart Rate', 'Steps', 'Sleep', 'Workout', 'ECG']
    },
    {
      id: '2',
      name: 'iPhone 15 Pro',
      type: 'phone',
      brand: 'Apple',
      connected: true,
      battery: 65,
      lastSync: 'Just now',
      data: {
        heartRate: 0,
        steps: 8420,
        calories: 340,
        sleep: 0,
        distance: 6.2
      },
      features: ['Steps', 'Health Records', 'Fall Detection']
    },
    {
      id: '3',
      name: 'Fitbit Charge 6',
      type: 'fitness-band',
      brand: 'Fitbit',
      connected: false,
      battery: 0,
      lastSync: '2 days ago',
      data: {
        heartRate: 0,
        steps: 0,
        calories: 0,
        sleep: 0,
        distance: 0
      },
      features: ['Heart Rate', 'Steps', 'Sleep', 'Stress', 'SpO2']
    },
    {
      id: '4',
      name: 'Galaxy Watch 6',
      type: 'smartwatch',
      brand: 'Samsung',
      connected: false,
      battery: 0,
      lastSync: 'Never',
      data: {
        heartRate: 0,
        steps: 0,
        calories: 0,
        sleep: 0,
        distance: 0
      },
      features: ['Heart Rate', 'Steps', 'Sleep', 'Body Composition']
    }
  ]);

  const [syncInProgress, setSyncInProgress] = useState<string | null>(null);

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

  const handleSyncDevice = async (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device?.connected) {
      toast({
        title: "Device Not Connected",
        description: "Please connect the device first",
        variant: "destructive"
      });
      return;
    }

    setSyncInProgress(deviceId);
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
      
      setSyncInProgress(null);
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

  const getBrandColor = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'apple': return 'text-gray-700';
      case 'samsung': return 'text-blue-600';
      case 'fitbit': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const connectedDevices = devices.filter(d => d.connected);
  const totalSteps = connectedDevices.reduce((sum, device) => sum + device.data.steps, 0);
  const avgHeartRate = connectedDevices.filter(d => d.data.heartRate > 0).reduce((sum, device, _, arr) => 
    sum + device.data.heartRate / arr.length, 0) || 0;
  const totalDistance = connectedDevices.reduce((sum, device) => sum + device.data.distance, 0);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-display">Wearable Devices</h1>
            <p className="text-white/90">Connect and sync your health devices</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <Activity className="w-6 h-6 mx-auto mb-2 text-green-300" />
              <p className="text-2xl font-bold">{totalSteps.toLocaleString()}</p>
              <p className="text-white/90 text-sm">Steps Today</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <Heart className="w-6 h-6 mx-auto mb-2 text-red-300" />
              <p className="text-2xl font-bold">{Math.round(avgHeartRate)} <span className="text-sm">bpm</span></p>
              <p className="text-white/90 text-sm">Avg Heart Rate</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-300" />
              <p className="text-2xl font-bold">{totalDistance.toFixed(1)} <span className="text-sm">km</span></p>
              <p className="text-white/90 text-sm">Distance</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-4 text-center">
              <Wifi className="w-6 h-6 mx-auto mb-2 text-purple-300" />
              <p className="text-2xl font-bold">{connectedDevices.length}/{devices.length}</p>
              <p className="text-white/90 text-sm">Connected</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4">
          <Button variant="default" size="lg" className="gradient-premium text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add New Device
          </Button>
          <Button variant="outline" size="lg">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync All Devices
          </Button>
          <Button variant="outline" size="lg">
            <Settings className="w-4 h-4 mr-2" />
            Sync Settings
          </Button>
        </div>

        <Tabs defaultValue="devices" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="devices">My Devices</TabsTrigger>
            <TabsTrigger value="data">Health Data</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-4">
            {/* Device Management */}
            {devices.map((device) => {
              const DeviceIcon = getDeviceIcon(device.type);
              
              return (
                <Card key={device.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`p-4 rounded-full ${device.connected ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <DeviceIcon className={`w-8 h-8 ${device.connected ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-foreground text-lg">{device.name}</h3>
                            <Badge 
                              variant={device.connected ? "default" : "secondary"}
                              className={device.connected ? "bg-green-500" : ""}
                            >
                              {device.connected ? (
                                <><Wifi className="w-3 h-3 mr-1" />Connected</>
                              ) : (
                                <><WifiOff className="w-3 h-3 mr-1" />Disconnected</>
                              )}
                            </Badge>
                            <Badge variant="outline" className={getBrandColor(device.brand)}>
                              {device.brand}
                            </Badge>
                          </div>
                          
                          {/* Device Features */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {device.features.map((feature, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                          
                          {device.connected && (
                            <>
                              {/* Health Data Display */}
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                                {device.data.heartRate > 0 && (
                                  <div className="bg-red-50 p-3 rounded-lg">
                                    <Heart className="w-4 h-4 text-red-600 mb-1" />
                                    <p className="text-xs text-red-600">Heart Rate</p>
                                    <p className="font-semibold text-red-800">{device.data.heartRate} bpm</p>
                                  </div>
                                )}
                                {device.data.steps > 0 && (
                                  <div className="bg-green-50 p-3 rounded-lg">
                                    <Activity className="w-4 h-4 text-green-600 mb-1" />
                                    <p className="text-xs text-green-600">Steps</p>
                                    <p className="font-semibold text-green-800">{device.data.steps.toLocaleString()}</p>
                                  </div>
                                )}
                                {device.data.calories > 0 && (
                                  <div className="bg-orange-50 p-3 rounded-lg">
                                    <Zap className="w-4 h-4 text-orange-600 mb-1" />
                                    <p className="text-xs text-orange-600">Calories</p>
                                    <p className="font-semibold text-orange-800">{device.data.calories}</p>
                                  </div>
                                )}
                                {device.data.sleep > 0 && (
                                  <div className="bg-blue-50 p-3 rounded-lg">
                                    <div className="w-4 h-4 text-blue-600 mb-1">🌙</div>
                                    <p className="text-xs text-blue-600">Sleep</p>
                                    <p className="font-semibold text-blue-800">{device.data.sleep}h</p>
                                  </div>
                                )}
                                {device.data.distance > 0 && (
                                  <div className="bg-purple-50 p-3 rounded-lg">
                                    <TrendingUp className="w-4 h-4 text-purple-600 mb-1" />
                                    <p className="text-xs text-purple-600">Distance</p>
                                    <p className="font-semibold text-purple-800">{device.data.distance} km</p>
                                  </div>
                                )}
                              </div>
                              
                              {/* Device Status */}
                              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                                {device.battery > 0 && (
                                  <div className="flex items-center space-x-2">
                                    <Battery className="w-4 h-4" />
                                    <span>{device.battery}%</span>
                                    <Progress value={device.battery} className="w-20 h-2" />
                                  </div>
                                )}
                                <span>Last sync: {device.lastSync}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Device Controls */}
                      <div className="flex flex-col items-end space-y-3">
                        <Switch
                          checked={device.connected}
                          onCheckedChange={() => handleToggleConnection(device.id)}
                        />
                        {device.connected && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSyncDevice(device.id)}
                            disabled={syncInProgress === device.id}
                          >
                            {syncInProgress === device.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                            ) : (
                              <RefreshCw className="w-3 h-3 mr-1" />
                            )}
                            {syncInProgress === device.id ? 'Syncing...' : 'Sync Now'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Add New Device */}
            <Card className="border-dashed border-2 hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-12 text-center">
                <Plus className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Add New Device</h3>
                <p className="text-muted-foreground mb-6">
                  Connect your Apple Watch, Fitbit, Samsung Galaxy Watch, or other health devices
                </p>
                <Button variant="outline" size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Scan for Devices
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            {/* Aggregated Health Data */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Health Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Activity</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Steps</span>
                        <span className="font-semibold">{totalSteps.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Distance</span>
                        <span className="font-semibold">{totalDistance.toFixed(1)} km</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Calories</span>
                        <span className="font-semibold">{connectedDevices.reduce((sum, d) => sum + d.data.calories, 0)} kcal</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Vitals</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Heart Rate</span>
                        <span className="font-semibold">{Math.round(avgHeartRate)} bpm</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Resting HR</span>
                        <span className="font-semibold">65 bpm</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Sleep & Recovery</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Sleep Duration</span>
                        <span className="font-semibold">7h 30m</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Sleep Quality</span>
                        <span className="font-semibold">Good</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Health Trends Coming Soon</h3>
                  <p className="text-muted-foreground">
                    View your weekly health data trends and patterns here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Sync Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Sync Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Auto-sync</h4>
                    <p className="text-sm text-muted-foreground">Automatically sync data from connected devices</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Real-time monitoring</h4>
                    <p className="text-sm text-muted-foreground">Monitor heart rate and activity in real-time</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Battery notifications</h4>
                    <p className="text-sm text-muted-foreground">Notify when device battery is low</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Data Privacy */}
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your health data is encrypted and securely stored. You control what data is shared and with whom.
                </p>
                <Button variant="outline" className="w-full">
                  Manage Privacy Settings
                </Button>
                <Button variant="outline" className="w-full">
                  Download My Data
                </Button>
                <Button variant="destructive" className="w-full">
                  Delete All Device Data
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WearableIntegrationPage;