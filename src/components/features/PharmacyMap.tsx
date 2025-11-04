import { useState } from "react";
import { MapPin, Navigation, Phone, Clock, Star, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  phone: string;
  hours: string;
  status: 'open' | 'closed' | 'closing-soon';
  hasDelivery: boolean;
}

export const PharmacyMap = () => {
  const { toast } = useToast();
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedPharmacy, setSelectedPharmacy] = useState<string | null>(null);

  // Mock pharmacy data
  const pharmacies: Pharmacy[] = [
    {
      id: '1',
      name: 'HealthPlus Pharmacy',
      address: '123 Victoria Island, Lagos',
      distance: '0.5 km',
      rating: 4.5,
      phone: '+234-1-234-5678',
      hours: '24/7',
      status: 'open',
      hasDelivery: true
    },
    {
      id: '2',
      name: 'Alpha Pharmacy',
      address: '456 Ikoyi Road, Lagos',
      distance: '1.2 km',
      rating: 4.2,
      phone: '+234-1-234-5679',
      hours: '8:00 AM - 10:00 PM',
      status: 'open',
      hasDelivery: false
    },
    {
      id: '3',
      name: 'MedPlus Drugstore',
      address: '789 Surulere Street, Lagos',
      distance: '2.1 km',
      rating: 4.7,
      phone: '+234-1-234-5680',
      hours: '8:00 AM - 8:00 PM',
      status: 'closing-soon',
      hasDelivery: true
    },
    {
      id: '4',
      name: 'Unity Pharmacy',
      address: '321 Ikeja Avenue, Lagos',
      distance: '3.5 km',
      rating: 3.9,
      phone: '+234-1-234-5681',
      hours: '9:00 AM - 6:00 PM',
      status: 'closed',
      hasDelivery: false
    }
  ];

  const handleGetDirections = (pharmacy: Pharmacy) => {
    toast({
      title: "Opening Maps",
      description: `Getting directions to ${pharmacy.name}...`
    });
  };

  const handleCallPharmacy = (pharmacy: Pharmacy) => {
    toast({
      title: "Calling Pharmacy",
      description: `Dialing ${pharmacy.phone}...`
    });
  };

  const handleFindLocation = () => {
    toast({
      title: "Finding Location",
      description: "Searching for pharmacies near you..."
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-green-600';
      case 'closing-soon': return 'text-yellow-600';
      case 'closed': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Open';
      case 'closing-soon': return 'Closing Soon';
      case 'closed': return 'Closed';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground font-display">Nearby Pharmacies</h2>
        <Button variant="outline" onClick={handleFindLocation}>
          <Navigation className="w-4 h-4 mr-2" />
          Use My Location
        </Button>
      </div>

      {/* Search */}
      <div className="flex space-x-2">
        <Input
          placeholder="Enter your location..."
          value={searchLocation}
          onChange={(e) => setSearchLocation(e.target.value)}
          className="flex-1"
        />
        <Button>
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>

      {/* Mock Map Area */}
      <Card>
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-blue-50 to-green-50 h-64 rounded-lg flex items-center justify-center">
            <div className="text-center p-6">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Interactive Map</h3>
              <p className="text-muted-foreground">
                Map showing nearby pharmacies will appear here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                (Real implementation would use Google Maps or similar)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pharmacy List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Pharmacies Near You</h3>
        {pharmacies.map((pharmacy) => (
          <Card 
            key={pharmacy.id}
            className={`cursor-pointer transition-all ${
              selectedPharmacy === pharmacy.id 
                ? 'ring-2 ring-primary shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedPharmacy(pharmacy.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-foreground">{pharmacy.name}</h3>
                    {pharmacy.hasDelivery && (
                      <Badge variant="secondary">Delivery</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mb-2">{pharmacy.address}</p>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1 text-muted-foreground" />
                      {pharmacy.distance}
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-500 fill-current" />
                      {pharmacy.rating}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-muted-foreground" />
                      <span className={getStatusColor(pharmacy.status)}>
                        {getStatusText(pharmacy.status)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    Hours: {pharmacy.hours}
                  </p>
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGetDirections(pharmacy);
                    }}
                  >
                    <Navigation className="w-3 h-3 mr-1" />
                    Directions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCallPharmacy(pharmacy);
                    }}
                  >
                    <Phone className="w-3 h-3 mr-1" />
                    Call
                  </Button>
                </div>
              </div>

              {selectedPharmacy === pharmacy.id && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Additional Information</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>📞 Phone: {pharmacy.phone}</p>
                    <p>🕒 Operating Hours: {pharmacy.hours}</p>
                    {pharmacy.hasDelivery && <p>🚚 Home delivery available</p>}
                    <p>⭐ Rating: {pharmacy.rating}/5 stars</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <Phone className="w-4 h-4 mr-2" />
            Call Nearest 24/7 Pharmacy
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <MapPin className="w-4 h-4 mr-2" />
            Find Pharmacies with Delivery
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Clock className="w-4 h-4 mr-2" />
            Show Only Open Pharmacies
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};