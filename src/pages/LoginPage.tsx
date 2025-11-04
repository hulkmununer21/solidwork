import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Phone, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/supabaseClient";

type UserType = 'patient' | 'provider';

interface LoginPageProps {
  onComplete?: () => void;
  onBack?: () => void;
}

// Helper to generate health_id in format AHS-1234567
const generateHealthId = () => {
  const randomNum = Math.floor(1000000 + Math.random() * 9000000);
  return `AHS-${randomNum}`;
};

const LoginPage = ({ onComplete, onBack }: LoginPageProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = (searchParams.get('type') || localStorage.getItem('ahs_user_type') || 'patient') as UserType;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (result.error) {
          setError(result.error.message);
          setLoading(false);
          return;
        }

        // Check user role from metadata
        const { user } = result.data;
        const userRole = user?.user_metadata?.userType;

        if (userRole !== userType) {
          setError(`You are registered as a ${userRole}. Please log in as a ${userRole}.`);
          setLoading(false);
          return;
        }

        localStorage.setItem('ahs_auth_token', result.data.session?.access_token || '');
        localStorage.setItem('ahs_user_type', userType);

        setLoading(false);

        if (onComplete) {
          onComplete();
        } else {
          navigate(userType === 'provider' ? '/provider-dashboard' : '/dashboard');
        }
      } else {
        // Registration
        result = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              phone: formData.phone,
              userType,
            }
          }
        });

        if (result.error) {
          setError(result.error.message);
          setLoading(false);
          return;
        }

        localStorage.setItem('ahs_auth_token', result.data.session?.access_token || '');
        localStorage.setItem('ahs_user_type', userType);

        // Initialize patient profile for patient role
        if (userType === 'patient') {
          const healthId = generateHealthId();
          const { user } = result.data;
          // Insert into patient_profiles table
          const { error: profileError } = await supabase
            .from('patient_profiles')
            .insert([
              {
                id: user?.id,
                name: formData.name,
                phone: formData.phone,
                health_id: healthId,
                status: 'active',
              }
            ]);
          if (profileError) {
            setError('Registration succeeded, but failed to initialize patient profile.');
            setLoading(false);
            return;
          }
        }

        // Initialize provider profile for provider role
        if (userType === 'provider') {
          const { user } = result.data;
          // Insert into provider_profiles table (no health_id)
          const { error: providerError } = await supabase
            .from('provider_profiles')
            .insert([
              {
                id: user?.id,
                name: formData.name,
                phone: formData.phone,
                status: 'pending',
              }
            ]);
          if (providerError) {
            setError('Registration succeeded, but failed to initialize provider profile.');
            setLoading(false);
            return;
          }
        }

        setLoading(false);

        if (onComplete) {
          onComplete();
        } else {
          navigate(userType === 'provider' ? '/provider-dashboard' : '/dashboard');
        }
      }
    } catch (err) {
      setError('Authentication error. Please try again.');
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/user-type');
    }
  };

  const userTypeConfig = {
    patient: {
      color: 'medical-green',
      icon: User,
      title: 'Patient',
      signInTitle: 'Welcome Back!',
      signUpTitle: 'Join AHS Today'
    },
    provider: {
      color: 'premium-purple',
      icon: Stethoscope,
      title: 'Healthcare Provider',
      signInTitle: 'Provider Portal',
      signUpTitle: 'Join Our Network'
    }
  };

  const config = userTypeConfig[userType];
  const IconComponent = config.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue to-medical-blue-dark flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={handleBack}
            className="absolute top-6 left-6 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className={`bg-${config.color} rounded-full p-4 mb-6 mx-auto w-20 h-20 flex items-center justify-center shadow-premium`}>
            <IconComponent className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2 font-display">
            {isLogin ? config.signInTitle : config.signUpTitle}
          </h1>
          <p className="text-white/90 font-body">
            {config.title}
          </p>
        </div>

        {/* Auth Toggle */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-1 mb-8 flex glass-morphism">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
              isLogin 
                ? 'bg-white text-medical-blue shadow-card' 
                : 'text-white/80 hover:text-white'
            }`}
            disabled={loading}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
              !isLogin 
                ? 'bg-white text-medical-blue shadow-card' 
                : 'text-white/80 hover:text-white'
            }`}
            disabled={loading}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="text-red-400 text-center mb-2">{error}</div>
          )}
          {!isLogin && (
            <div className="relative">
              <User className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-${config.color}`} />
              <Input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                className="pl-12 bg-white/20 border-white/30 text-white placeholder-white focus:border-white focus:bg-white/25 backdrop-blur-md rounded-2xl py-6"
                required={!isLogin}
                disabled={loading}
              />
            </div>
          )}
          
          <div className="relative">
            <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-${config.color}`} />
            <Input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
              className="pl-12 bg-white/20 border-white/30 text-white placeholder-white focus:border-white focus:bg-white/25 backdrop-blur-md rounded-2xl py-6"
              required
              disabled={loading}
            />
          </div>

          {!isLogin && (
            <div className="relative">
              <Phone className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-${config.color}`} />
              <Input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleInputChange}
                className="pl-12 bg-white/20 border-white/30 text-white placeholder-white focus:border-white focus:bg-white/25 backdrop-blur-md rounded-2xl py-6"
                required={!isLogin}
                disabled={loading}
              />
            </div>
          )}
          
          <div className="relative">
            <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-${config.color}`} />
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className="pl-12 pr-12 bg-white/20 border-white/30 text-white placeholder-white focus:border-white focus:bg-white/25 backdrop-blur-md rounded-2xl py-6"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/80 hover:text-white transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                className="text-white/80 hover:text-white text-sm transition-colors font-body"
                disabled={loading}
                // You can implement forgot password logic here
              >
                Forgot Password?
              </button>
            </div>
          )}

          <Button
            type="submit"
            className={`w-full bg-${config.color} hover:bg-${config.color}/90 text-white py-6 text-lg font-semibold rounded-2xl shadow-premium transition-all duration-300`}
            disabled={loading}
          >
            {loading
              ? (isLogin ? 'Signing In...' : 'Creating Account...')
              : (isLogin ? 'Sign In' : 'Create Account')}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-white/60 text-xs mt-8 font-body">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default LoginPage;