import { useEffect } from "react";
import ahsLogo from "@/assets/ahs-logo-mobile.png";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-medical-blue to-medical-blue-dark">
      <div className="text-center">
        <div className="bg-white rounded-3xl p-8 shadow-float mb-8 border-4 border-white/20">
          <img src={ahsLogo} alt="HSA" className="w-24 h-24 mx-auto" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2 font-display">HSA</h1>
        <p className="text-white/90 text-lg font-body">Health Service Africa</p>
        <div className="flex justify-center mt-8 space-x-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-4 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;