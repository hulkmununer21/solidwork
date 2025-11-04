import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Stethoscope, ArrowRight } from "lucide-react";
import ahsLogo from "@/assets/ahs-logo-mobile.png";

interface UserTypeSelectionProps {
  onSelect: (type: 'patient' | 'provider') => void;
}

const UserTypeSelection = ({ onSelect }: UserTypeSelectionProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue-light to-white">
      {/* Header */}
      <div className="text-center pt-20 pb-12">
        <div className="bg-white rounded-2xl p-6 w-20 h-20 mx-auto mb-6 shadow-card">
          <img src={ahsLogo} alt="AHS" className="w-full h-full" />
        </div>
        <h1 className="text-3xl font-bold font-display mb-2 text-foreground">Welcome to AHS</h1>
        <p className="text-muted-foreground font-body">Choose how you'd like to continue</p>
      </div>

      {/* User Type Cards */}
      <div className="flex-1 px-6 pb-6">
        <div className="space-y-6 max-w-sm mx-auto">
          <Card 
            className="cursor-pointer transition-premium hover:shadow-premium border-2 hover:border-medical-blue hover:scale-105"
            onClick={() => onSelect('patient')}
          >
            <CardContent className="p-8 text-center">
              <div className="bg-medical-blue rounded-full p-4 w-16 h-16 mx-auto mb-4 shadow-premium">
                <Users className="h-8 w-8 text-white mx-auto" />
              </div>
              <h3 className="text-xl font-bold mb-2 font-display text-foreground">I'm a Patient</h3>
              <p className="text-muted-foreground text-sm font-body mb-4">
                Book appointments, manage health records, and connect with healthcare providers
              </p>
              <ArrowRight className="h-5 w-5 text-medical-blue mx-auto" />
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transition-premium hover:shadow-premium border-2 hover:border-medical-green hover:scale-105"
            onClick={() => onSelect('provider')}
          >
            <CardContent className="p-8 text-center">
              <div className="bg-medical-green rounded-full p-4 w-16 h-16 mx-auto mb-4 shadow-green">
                <Stethoscope className="h-8 w-8 text-white mx-auto" />
              </div>
              <h3 className="text-xl font-bold mb-2 font-display text-foreground">I'm a Healthcare Provider</h3>
              <p className="text-muted-foreground text-sm font-body mb-4">
                Manage patients, consultations, and grow your medical practice
              </p>
              <ArrowRight className="h-5 w-5 text-medical-green mx-auto" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center">
        <p className="text-xs text-muted-foreground font-body">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default UserTypeSelection;