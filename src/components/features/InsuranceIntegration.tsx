import { useState } from "react";
import { Shield, CreditCard, FileText, Plus, Edit, Check, Star, Users, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface InsurancePolicy {
  id: string;
  provider: string;
  policyNumber: string;
  groupNumber: string;
  memberName: string;
  coverage: string;
  status: 'active' | 'inactive';
  expiryDate: string;
}

interface InsurancePlan {
  id: string;
  provider: string;
  name: string;
  monthlyPremium: number;
  annualPremium: number;
  coverage: string[];
  rating: number;
  reviews: number;
  popular: boolean;
  description: string;
  maxCoverage: string;
}

export const InsuranceIntegration = () => {
  const { toast } = useToast();
  const [isAddingPolicy, setIsAddingPolicy] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    provider: '',
    policyNumber: '',
    groupNumber: '',
    memberName: '',
    coverage: ''
  });

  // Mock insurance plans for purchase
  const [availablePlans] = useState<InsurancePlan[]>([
    {
      id: '1',
      provider: 'AIICO Insurance',
      name: 'Comprehensive Health Plan',
      monthlyPremium: 45000,
      annualPremium: 480000,
      coverage: ['Hospitalization', 'Outpatient Care', 'Emergency Services', 'Prescription Drugs', 'Mental Health'],
      rating: 4.8,
      reviews: 1250,
      popular: true,
      description: 'Complete healthcare coverage with nationwide network access',
      maxCoverage: '₦5,000,000'
    },
    {
      id: '2',
      provider: 'Leadway Health',
      name: 'Family Care Plus',
      monthlyPremium: 35000,
      annualPremium: 360000,
      coverage: ['Family Coverage', 'Maternity Care', 'Pediatric Care', 'Dental Care', 'Vision Care'],
      rating: 4.6,
      reviews: 980,
      popular: false,
      description: 'Designed for families with comprehensive coverage for all ages',
      maxCoverage: '₦3,000,000'
    },
    {
      id: '3',
      provider: 'Hygeia HMO',
      name: 'Premium Executive',
      monthlyPremium: 65000,
      annualPremium: 720000,
      coverage: ['Executive Health Check', 'Specialist Care', '24/7 Telemedicine', 'International Coverage', 'Wellness Programs'],
      rating: 4.9,
      reviews: 2100,
      popular: true,
      description: 'Premium healthcare for executives and high-net-worth individuals',
      maxCoverage: '₦10,000,000'
    },
    {
      id: '4',
      provider: 'Reliance Health',
      name: 'Basic Care',
      monthlyPremium: 15000,
      annualPremium: 150000,
      coverage: ['Basic Hospitalization', 'Emergency Care', 'Generic Prescriptions'],
      rating: 4.2,
      reviews: 650,
      popular: false,
      description: 'Affordable basic healthcare coverage for essential medical needs',
      maxCoverage: '₦1,000,000'
    }
  ]);

  // Mock existing policies
  const [policies, setPolicies] = useState<InsurancePolicy[]>([
    {
      id: '1',
      provider: 'AIICO Insurance',
      policyNumber: 'AIC-2024-001234',
      groupNumber: 'GRP-789456',
      memberName: 'Sarah Johnson',
      coverage: 'Comprehensive Health Plan',
      status: 'active',
      expiryDate: '2024-12-31'
    }
  ]);

  const handlePurchasePlan = (plan: InsurancePlan) => {
    toast({
      title: "Processing Purchase",
      description: `Redirecting to checkout for ${plan.name}...`
    });
    // In a real app, this would integrate with payment processing
  };

  const handleAddPolicy = () => {
    if (!newPolicy.provider || !newPolicy.policyNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in provider and policy number",
        variant: "destructive"
      });
      return;
    }

    const policy: InsurancePolicy = {
      id: Date.now().toString(),
      ...newPolicy,
      status: 'active',
      expiryDate: '2024-12-31'
    };

    setPolicies(prev => [...prev, policy]);
    setNewPolicy({
      provider: '',
      policyNumber: '',
      groupNumber: '',
      memberName: '',
      coverage: ''
    });
    setIsAddingPolicy(false);

    toast({
      title: "Insurance Added",
      description: "Your insurance policy has been saved successfully"
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-bold text-foreground font-display">Insurance Marketplace</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Compare and purchase the best insurance plans for your healthcare needs, or manage your existing policies.
        </p>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Plans</TabsTrigger>
          <TabsTrigger value="my-policies">My Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {availablePlans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-primary' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-4">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Shield className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground">{plan.provider}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        ₦{plan.monthlyPremium.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">per month</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="ml-1 text-sm font-medium">{plan.rating}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-1" />
                      {plan.reviews} reviews
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Maximum Coverage:</span>
                      <span className="font-semibold">{plan.maxCoverage}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Annual Premium:</span>
                      <span className="font-semibold">₦{plan.annualPremium.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Coverage Includes:</h4>
                    <div className="grid grid-cols-1 gap-1">
                      {plan.coverage.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                      {plan.coverage.length > 3 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          +{plan.coverage.length - 3} more benefits
                        </div>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={() => handlePurchasePlan(plan)}
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Purchase Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-policies" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-foreground">Your Insurance Policies</h2>
            <Button onClick={() => setIsAddingPolicy(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Existing Policy
            </Button>
          </div>

          {/* Current Policies */}
          <div className="space-y-4">
            {policies.map((policy) => (
              <Card key={policy.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Shield className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">{policy.provider}</h3>
                        <p className="text-muted-foreground mb-3">{policy.coverage}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Policy Number</p>
                            <p className="font-medium">{policy.policyNumber}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Member Name</p>
                            <p className="font-medium">{policy.memberName}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Expiry Date</p>
                            <p className="font-medium flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(policy.expiryDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            <Badge variant={policy.status === 'active' ? 'secondary' : 'outline'}>
                              {policy.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {policies.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Insurance Policies</h3>
                  <p className="text-muted-foreground mb-4">You haven't added any insurance policies yet.</p>
                  <Button onClick={() => setIsAddingPolicy(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Policy
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Add New Policy Form */}
          {isAddingPolicy && (
            <Card>
              <CardHeader>
                <CardTitle>Add Existing Insurance Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="provider">Insurance Provider</Label>
                  <Input
                    id="provider"
                    value={newPolicy.provider}
                    onChange={(e) => setNewPolicy(prev => ({ ...prev, provider: e.target.value }))}
                    placeholder="e.g., AIICO Insurance, Leadway, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="policyNumber">Policy Number</Label>
                  <Input
                    id="policyNumber"
                    value={newPolicy.policyNumber}
                    onChange={(e) => setNewPolicy(prev => ({ ...prev, policyNumber: e.target.value }))}
                    placeholder="Enter your policy number"
                  />
                </div>
                <div>
                  <Label htmlFor="memberName">Member Name</Label>
                  <Input
                    id="memberName"
                    value={newPolicy.memberName}
                    onChange={(e) => setNewPolicy(prev => ({ ...prev, memberName: e.target.value }))}
                    placeholder="Name on the policy"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleAddPolicy}>
                    <Check className="w-4 h-4 mr-2" />
                    Save Policy
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingPolicy(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};