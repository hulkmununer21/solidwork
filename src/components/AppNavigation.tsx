import { useState, useEffect } from "react";
import SplashScreen from "@/components/SplashScreen";
import OnboardingScreens from "@/components/OnboardingScreens";
import UserTypeSelection from "@/components/UserTypeSelection";
import LoginScreen from "@/components/LoginScreen";
import Dashboard from "@/components/Dashboard";

type AppState = 'splash' | 'onboarding' | 'userTypeSelection' | 'login' | 'dashboard';
type UserType = 'patient' | 'provider' | null;

const AppNavigation = () => {
  const [currentScreen, setCurrentScreen] = useState<AppState>('splash');
  const [selectedUserType, setSelectedUserType] = useState<UserType>(null);

  // Check if user has completed onboarding before
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('ahs_onboarding_completed');
    const isAuthenticated = localStorage.getItem('ahs_auth_token');
    const storedUserType = localStorage.getItem('ahs_user_type') as UserType;
    
    if (hasCompletedOnboarding && isAuthenticated && storedUserType) {
      setSelectedUserType(storedUserType);
      setCurrentScreen('dashboard');
    } else if (hasCompletedOnboarding && storedUserType) {
      setSelectedUserType(storedUserType);
      setCurrentScreen('login');
    } else if (hasCompletedOnboarding) {
      setCurrentScreen('userTypeSelection');
    }
  }, []);

  const handleSplashComplete = () => {
    const hasCompletedOnboarding = localStorage.getItem('ahs_onboarding_completed');
    if (hasCompletedOnboarding) {
      setCurrentScreen('userTypeSelection');
    } else {
      setCurrentScreen('onboarding');
    }
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('ahs_onboarding_completed', 'true');
    setCurrentScreen('userTypeSelection');
  };

  const handleUserTypeSelection = (userType: 'patient' | 'provider') => {
    setSelectedUserType(userType);
    localStorage.setItem('ahs_user_type', userType);
    setCurrentScreen('login');
  };

  const handleBackToUserTypeSelection = () => {
    setCurrentScreen('userTypeSelection');
  };

  const handleLoginComplete = () => {
    localStorage.setItem('ahs_auth_token', 'demo_token_' + Date.now());
    setCurrentScreen('dashboard');
  };

  return (
    <div className="relative">
      {currentScreen === 'splash' && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}
      
      {currentScreen === 'onboarding' && (
        <OnboardingScreens onComplete={handleOnboardingComplete} />
      )}
      
      {currentScreen === 'userTypeSelection' && (
        <UserTypeSelection onSelect={handleUserTypeSelection} />
      )}
      
      {currentScreen === 'login' && selectedUserType && (
        <LoginScreen 
          userType={selectedUserType}
          onComplete={handleLoginComplete}
          onBack={handleBackToUserTypeSelection}
        />
      )}
      
      {currentScreen === 'dashboard' && (
        <Dashboard />
      )}
    </div>
  );
};

export default AppNavigation;