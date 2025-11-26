import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const isAuthenticated = localStorage.getItem('ahs_auth_token');
    
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/splash');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue to-medical-blue-dark flex items-center justify-center">
      <div className="text-white text-center">
        <h1 className="text-2xl font-bold mb-2 font-display">Loading HSA...</h1>
        <div className="animate-pulse">Redirecting to splash screen</div>
      </div>
    </div>
  );
};

export default Index;
