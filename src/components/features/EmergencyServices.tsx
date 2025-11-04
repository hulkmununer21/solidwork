import { useState } from "react";
import { Ambulance, Phone, MapPin, Clock, AlertTriangle, Shield, Heart, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface EmergencyService {
  id: string;
  name: string;
  type: 'ambulance' | 'hospital' | 'clinic' | 'fire' | 'police';
  phone: string;
  address: string;
  distance: string;
  eta: string;
  available: boolean;
  rating: number;
}

export const EmergencyServices = () => {
  const { toast } = useToast();
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Mock emergency services data
  const emergencyServices: EmergencyService[] = [
    {
      id: '1',
      name: 'Lagos State Ambulance Service',
      type: 'ambulance',
      phone: '199',
      address: 'Lagos Island, Lagos State',
      distance: '2.1 km',
      eta: '8-12 mins',
      available: true,
      rating: 4.5
    },
    {
      id: '2',
      name: 'Lagos University Teaching Hospital',
      type: 'hospital',
      phone: '+234-1-263-2261',
      address: 'Idi-Araba, Lagos',
      distance: '3.5 km',
      eta: '15-20 mins',
      available: true,
      rating: 4.7
    },
    {
      id: '3',
      name: 'First Cardiology Consultants',
      type: 'clinic',
      phone: '+234-1-271-8018',
      address: 'Ikoyi, Lagos',
      distance: '1.8 km',
      eta: '10-15 mins',
      available: true,
      rating: 4.6
    },
    {
      id: '4',
      name: 'Lagos State Fire Service',
      type: 'fire',
      phone: '199',
      address: 'Victoria Island, Lagos',
      distance: '1.2 km',
      eta: '5-8 mins',
      available: true,
      rating: 4.3
    }
  ];

  const emergencyContacts = [
    { name: 'National Emergency', number: '199', type: 'general' },
    { name: 'Police Emergency', number: '199', type: 'police' },
    { name: 'Fire Service', number: '199', type: 'fire' },
    { name: 'Ambulance Service', number: '199', type: 'medical' }
  ];

  const handleEmergencyCall = (service: EmergencyService) => {
    toast({
      title: "Calling Emergency Service",
      description: `Connecting you to ${service.name}...`,
      variant: "destructive"
    });
    
    // In real implementation, this would initiate actual phone call
    setTimeout(() => {
      toast({
        title: "Call Connected",
        description: "You are now connected to emergency services"
      });
    }, 2000);
  };

  const handleQuickDial = (contact: typeof emergencyContacts[0]) => {
    setIsEmergencyMode(true);
    toast({
      title: "Emergency Call Initiated",
      description: `Calling ${contact.name} (${contact.number})...`,
      variant: "destructive"
    });
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'ambulance': return Ambulance;
      case 'hospital': return Heart;
      case 'clinic': return Shield;
      case 'fire': return AlertTriangle;
      case 'police': return Shield;
      default: return Phone;
    }
  };

  const getServiceColor = (type: string) => {
    switch (type) {
      case 'ambulance': return 'text-red-600';
      case 'hospital': return 'text-blue-600';
      case 'clinic': return 'text-green-600';
      case 'fire': return 'text-orange-600';
      case 'police': return 'text-blue-800';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground font-display">Emergency Services</h2>
        <Badge variant="destructive" className="animate-pulse">
          Emergency Ready
        </Badge>
      </div>

      {/* Emergency Alert */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>In case of life-threatening emergency:</strong> Call 199 immediately or use the emergency buttons below.
        </AlertDescription>
      </Alert>

      {/* Quick Emergency Dial */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            Quick Emergency Dial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {emergencyContacts.map((contact, index) => (
              <Button
                key={index}
                variant="destructive"
                size="lg"
                onClick={() => handleQuickDial(contact)}
                className="h-auto py-4 flex flex-col space-y-1"
              >
                <Phone className="w-6 h-6" />
                <span className="text-sm font-medium">{contact.name}</span>
                <span className="text-xs">{contact.number}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Nearest Emergency Services */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Nearest Emergency Services</h3>
        
        {emergencyServices.map((service) => {
          const ServiceIcon = getServiceIcon(service.type);
          
          return (
            <Card 
              key={service.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedService === service.id ? 'ring-2 ring-red-500' : ''
              }`}
              onClick={() => setSelectedService(service.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-3 rounded-full bg-red-50 ${getServiceColor(service.type)}`}>
                      <ServiceIcon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{service.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{service.address}</p>
                      
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-muted-foreground" />
                          {service.distance}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-muted-foreground" />
                          ETA: {service.eta}
                        </div>
                        <Badge 
                          variant={service.available ? "secondary" : "destructive"}
                        >
                          {service.available ? 'Available' : 'Busy'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEmergencyCall(service);
                      }}
                      disabled={!service.available}
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      Call Now
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast({
                          title: "Getting Directions",
                          description: `Opening maps for ${service.name}`
                        });
                      }}
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      Directions
                    </Button>
                  </div>
                </div>

                {selectedService === service.id && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
                    <h4 className="font-medium mb-2 text-red-800">Contact Information</h4>
                    <div className="text-sm space-y-1 text-red-700">
                      <p>📞 Emergency Line: {service.phone}</p>
                      <p>📍 Address: {service.address}</p>
                      <p>⏱️ Estimated Arrival: {service.eta}</p>
                      <p>⭐ Rating: {service.rating}/5</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Emergency Preparation Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-green-600" />
            Emergency Preparedness
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p>• Keep your location services enabled for faster emergency response</p>
            <p>• Save important medical information in your health records</p>
            <p>• Keep emergency contacts updated in your profile</p>
            <p>• Know the location of the nearest hospital or clinic</p>
            <p>• Keep a basic first aid kit at home and work</p>
          </div>
          
          <Button variant="outline" className="w-full mt-4">
            <Heart className="w-4 h-4 mr-2" />
            Update Emergency Contacts
          </Button>
        </CardContent>
      </Card>

      {isEmergencyMode && (
        <div className="fixed inset-0 bg-red-600/90 flex items-center justify-center z-50">
          <Card className="mx-4 max-w-md">
            <CardContent className="p-8 text-center">
              <div className="animate-pulse mb-4">
                <Phone className="w-16 h-16 text-red-600 mx-auto" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Emergency Call Active</h2>
              <p className="text-muted-foreground mb-6">
                Connecting to emergency services...
              </p>
              <Button 
                onClick={() => setIsEmergencyMode(false)}
                variant="outline"
              >
                Cancel Call
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};