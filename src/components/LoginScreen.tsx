import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Stethoscope, ArrowRight, Eye, EyeOff, Mail, Lock, User, Phone, ChevronLeft } from "lucide-react";

interface LoginScreenProps {
  userType: 'patient' | 'provider';
  onComplete: () => void;
  onBack: () => void;
}

const LoginScreen = ({ userType, onComplete, onBack }: LoginScreenProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login/signup
    setTimeout(onComplete, 1000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const userTypeConfig = userType === 'patient' 
    ? { 
        color: 'medical-blue', 
        icon: Users, 
        title: 'Patient Portal',
        bgClass: 'bg-medical-blue',
        hoverClass: 'hover:bg-medical-blue-dark'
      }
    : { 
        color: 'medical-green', 
        icon: Stethoscope, 
        title: 'Provider Portal',
        bgClass: 'bg-medical-green',
        hoverClass: 'hover:bg-medical-green-dark'
      };

  const IconComponent = userTypeConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue-light to-white flex flex-col">
      {/* Header */}
      <div className="flex items-center p-6 pt-16">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="flex-1 text-center">
          <div className={`${userTypeConfig.bgClass} rounded-full p-3 w-12 h-12 mx-auto mb-2`}>
            <IconComponent className="h-6 w-6 text-white mx-auto" />
          </div>
          <h2 className="font-bold font-display text-foreground">{userTypeConfig.title}</h2>
        </div>
        <div className="w-10" />
      </div>

      {/* Auth Toggle */}
      <div className="px-6 mb-8">
        <div className="bg-muted rounded-xl p-1 flex max-w-sm mx-auto">
          <Button
            variant={isLogin ? "default" : "ghost"}
            className={`flex-1 rounded-lg transition-premium ${
              isLogin ? `${userTypeConfig.bgClass} ${userTypeConfig.hoverClass} text-white` : ''
            }`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </Button>
          <Button
            variant={!isLogin ? "default" : "ghost"}
            className={`flex-1 rounded-lg transition-premium ${
              !isLogin ? `${userTypeConfig.bgClass} ${userTypeConfig.hoverClass} text-white` : ''
            }`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 px-6">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-sm mx-auto">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-foreground">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  className={`pl-10 h-12 border-2 focus:border-${userType === 'patient' ? 'medical-blue' : 'medical-green'} transition-premium`}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className={`pl-10 h-12 border-2 focus:border-${userType === 'patient' ? 'medical-blue' : 'medical-green'} transition-premium`}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-foreground">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  className={`pl-10 h-12 border-2 focus:border-${userType === 'patient' ? 'medical-blue' : 'medical-green'} transition-premium`}
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className={`pl-10 pr-10 h-12 border-2 focus:border-${userType === 'patient' ? 'medical-blue' : 'medical-green'} transition-premium`}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {isLogin && (
            <div className="text-right">
              <Button variant="link" className={`text-${userTypeConfig.color} p-0 h-auto`}>
                Forgot Password?
              </Button>
            </div>
          )}

          <Button 
            type="submit"
            size="lg"
            className={`w-full ${userTypeConfig.bgClass} ${userTypeConfig.hoverClass} text-white shadow-premium transition-premium font-semibold`}
          >
            {isLogin ? 'Sign In' : 'Create Account'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </form>
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

export default LoginScreen;