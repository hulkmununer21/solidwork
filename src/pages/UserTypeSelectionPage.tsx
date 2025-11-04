import { useNavigate } from "react-router-dom";
import { User, Stethoscope } from "lucide-react";
import ahsLogo from "@/assets/ahs-logo-mobile.png";

interface UserTypeSelectionPageProps {
  onSelect?: (type: 'patient' | 'provider') => void;
}

const UserTypeSelectionPage = ({ onSelect }: UserTypeSelectionPageProps) => {
  const navigate = useNavigate();

  const handleSelect = (type: 'patient' | 'provider') => {
    localStorage.setItem('ahs_user_type', type);
    if (onSelect) {
      onSelect(type);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue to-medical-blue-dark flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-white/20 backdrop-blur-md rounded-full p-4 mb-6 mx-auto w-20 h-20 flex items-center justify-center glass-morphism">
            <img src={ahsLogo} alt="AHS" className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 font-display">
            Welcome to AHS
          </h1>
          <p className="text-white/90 text-lg font-body">
            How would you like to use our platform?
          </p>
        </div>

        {/* User Type Cards */}
        <div className="space-y-4">
          {/* Patient Option */}
          <button
            onClick={() => handleSelect('patient')}
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-left hover:bg-white/20 transition-all duration-300 glass-morphism group"
          >
            <div className="flex items-center">
              <div className="bg-medical-green rounded-full p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white font-display">I'm a Patient</h3>
                <p className="text-white/80 text-sm font-body">
                  Looking for healthcare services and consultations
                </p>
              </div>
            </div>
          </button>

          {/* Provider Option */}
          <button
            onClick={() => handleSelect('provider')}
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-left hover:bg-white/20 transition-all duration-300 glass-morphism group"
          >
            <div className="flex items-center">
              <div className="bg-premium-purple rounded-full p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white font-display">I'm a Provider</h3>
                <p className="text-white/80 text-sm font-body">
                  Healthcare professional offering medical services
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserTypeSelectionPage;