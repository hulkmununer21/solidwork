import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Shield, Users, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingScreensProps {
  onComplete?: () => void;
}

const screens = [
  {
    icon: Heart,
    title: "Welcome to HSA",
    description: "Your trusted partner in healthcare, connecting you with quality medical services across Africa."
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your health data is protected with enterprise-grade security and complete privacy."
  },
  {
    icon: Users,
    title: "Expert Care Network",
    description: "Access to certified healthcare providers and specialists whenever you need them."
  }
];

const OnboardingPage = ({ onComplete }: OnboardingScreensProps) => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      localStorage.setItem('ahs_onboarding_completed', 'true');
      if (onComplete) {
        onComplete();
      } else {
        navigate('/user-type');
      }
    }
  };

  const currentScreenData = screens[currentScreen];
  const IconComponent = currentScreenData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue to-medical-blue-dark flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Screen Content */}
        <div className="text-center mb-12">
          <div className="bg-white/20 backdrop-blur-md rounded-full p-6 mb-8 mx-auto w-24 h-24 flex items-center justify-center glass-morphism">
            <IconComponent className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4 font-display">
            {currentScreenData.title}
          </h1>
          
          <p className="text-white/90 text-lg leading-relaxed font-body">
            {currentScreenData.description}
          </p>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center mb-8 space-x-3">
          {screens.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentScreen 
                  ? 'bg-white scale-125' 
                  : index < currentScreen 
                    ? 'bg-medical-green' 
                    : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <Button
          onClick={handleNext}
          className="w-full bg-white text-medical-blue hover:bg-white/90 transition-all duration-300 py-6 text-lg font-semibold rounded-2xl shadow-premium"
        >
          {currentScreen === screens.length - 1 ? (
            <>
              Get Started
              <Check className="ml-2 w-5 h-5" />
            </>
          ) : (
            <>
              Continue
              <ChevronRight className="ml-2 w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default OnboardingPage;