import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Shield, Smartphone } from "lucide-react";

interface OnboardingScreensProps {
  onComplete: () => void;
}

const screens = [
  { icon: Heart, title: "Your Health, Your Priority", description: "Connect with certified healthcare providers across Africa" },
  { icon: Shield, title: "Secure & Compliant", description: "Your medical data is protected with end-to-end encryption and NDPR compliance" },
  { icon: Smartphone, title: "Healthcare Anywhere", description: "Book appointments, access health records, and consult with doctors - all from your mobile device" }
];

const OnboardingScreens = ({ onComplete }: OnboardingScreensProps) => {
  const [current, setCurrent] = useState(0);

  const handleNext = () => {
    if (current < screens.length - 1) setCurrent(current + 1);
    else onComplete();
  };

  const IconComponent = screens[current].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue-light to-white flex flex-col justify-between p-8">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="bg-medical-blue rounded-full p-8 mb-8 shadow-premium">
          <IconComponent className="h-20 w-20 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-6 text-foreground font-display">{screens[current].title}</h1>
        <p className="text-lg text-muted-foreground font-body max-w-md">{screens[current].description}</p>
      </div>
      
      <div>
        <div className="flex justify-center space-x-3 mb-8">
          {screens.map((_, i) => (
            <div key={i} className={`h-3 rounded-full transition-all ${i === current ? 'w-8 bg-medical-blue' : i < current ? 'w-3 bg-medical-green' : 'w-3 bg-muted'}`} />
          ))}
        </div>
        <Button onClick={handleNext} size="lg" className="w-full bg-medical-blue hover:bg-medical-blue-dark text-white shadow-premium font-semibold">
          {current === screens.length - 1 ? 'Get Started' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};

export default OnboardingScreens;