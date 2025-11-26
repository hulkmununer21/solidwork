import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const SplashPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/onboarding');
  };

  return (
    <main className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-medical-blue to-medical-blue-dark">
      <div className="text-center">
        <div className="bg-white rounded-3xl p-3 shadow-float mb-8 border-4 border-white/20 max-w-[250px] mx-auto">
          <img 
            src="/lovable-uploads/0bb1befb-972c-476e-820f-f5d902b8e03b.png" 
            alt="AHS - African Health Service Logo - Connect with healthcare providers across Africa" 
            className="w-full h-auto mx-auto object-contain"
            width="250"
            height="250"
          />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2 font-display">HSA - Health Service Africa</h1>
        <p className="text-white/90 text-lg font-body mb-8">Connect with certified healthcare providers across Africa</p>
        
        <div className="space-y-4">
          <Button 
            onClick={handleGetStarted}
            className="bg-white text-medical-blue hover:bg-white/90 font-semibold px-8 py-3 text-lg"
            size="lg"
          >
            Get Started
          </Button>
          
          <div className="text-center">
            <p className="text-white/80 text-sm">Your health, our priority</p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SplashPage;