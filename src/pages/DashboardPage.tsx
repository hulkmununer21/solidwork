import { 
  Bell, 
  Calendar, 
  MessageCircle, 
  Home, 
  Clock, 
  User, 
  Users,
  FileText,
  Heart,
  Pill,
  CheckCircle,
  Video,
  MapPin,
  ChevronRight,
  Ambulance,
  Leaf,
  Brain,
  Shield,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";

// Helper to calculate age from date of birth (YYYY-MM or YYYY-MM-DD)
function calculateAge(dob: string | null): string {
  if (!dob) return "Not Set";
  const parts = dob.split("-");
  if (parts.length < 2) return "Not Set";
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) || 1;
  const day = parts[2] ? parseInt(parts[2], 10) : 1;
  if (isNaN(year) || isNaN(month) || isNaN(day)) return "Not Set";
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age.toString() : "Not Set";
}

// Helper to calculate time difference to booking
function getTimeDiff(bookingDate: Date) {
  const now = new Date();
  const diffMs = bookingDate.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const absMinutes = Math.abs(diffMinutes);
  const days = Math.floor(absMinutes / (60 * 24));
  const hours = Math.floor((absMinutes % (60 * 24)) / 60);
  const minutes = absMinutes % 60;
  return {
    isDue: diffMinutes <= 0,
    days,
    hours,
    minutes,
    diffMinutes
  };
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good Morning" : currentHour < 18 ? "Good Afternoon" : "Good Evening";
  
  // State for patient profile
  const [patientData, setPatientData] = useState<any>(null);
  // State for bookings with merged provider info
  const [bookings, setBookings] = useState<any[]>([]);
  // Loading state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch patient profile, bookings, and provider profiles separately, then merge
    const fetchAllData = async () => {
      setLoading(true);
      // Get logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPatientData(null);
        setBookings([]);
        setLoading(false);
        return;
      }

      // Fetch patient profile
      const { data: patient, error: patientError } = await supabase
        .from("patient_profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setPatientData(patient || null);

      // Fetch bookings for this patient
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("patient_id", user.id);

      // Fetch all provider profiles
      const { data: providersData, error: providersError } = await supabase
        .from("provider_profiles")
        .select("*");

      // Merge provider info into each booking
      const mergedBookings = (bookingsData || []).map(booking => {
        const provider = (providersData || []).find(p => p.id === booking.provider_id);
        return {
          ...booking,
          provider_profile: provider || null
        };
      });

      setBookings(mergedBookings);
      setLoading(false);
    };

    fetchAllData();
  }, []);

  // Patient info with fallback
  const name = patientData?.name || "Not Set";
  const healthId = patientData?.health_id || "Not Set";
  const dob = patientData?.date_of_birth || null;
  const age = calculateAge(dob);
  const gender = patientData?.gender || "Not Set";
  const condition = patientData?.conditions || "Not Set";
  const profileImage = patientData?.profile_image || null;

  // Find next appointment (confirmed or in_progress, future date)
  const now = new Date();
  const nextAppointment = bookings.find(b => 
    b.date_time && new Date(b.date_time) > now &&
    (b.status === "confirmed" || b.status === "in_progress")
  );

  // Get recent providers (unique, last 2)
  const recentProviders = bookings
    .map(b => b.provider_profile)
    .filter((p, i, arr) => p && arr.findIndex(x => x?.name === p?.name) === i)
    .slice(0, 2);

  // Get most recent completed booking for recent activity
  const recentActivity = bookings
    .filter(b => b.status === "completed")
    .sort((a, b) => {
      const ta = a.date_time ? new Date(a.date_time).getTime() : 0;
      const tb = b.date_time ? new Date(b.date_time).getTime() : 0;
      return tb - ta;
    })[0];

  // Helper for "days ago"
  const getDaysAgo = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const diff = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return diff === 0 ? "Today" : `${diff} day${diff > 1 ? "s" : ""} ago`;
  };

  // Helper for time to booking and join now button
  let timeInfo = null;
  let isDue = false;
  if (nextAppointment && nextAppointment.date_time) {
    const bookingDate = new Date(nextAppointment.date_time);
    const diff = getTimeDiff(bookingDate);
    isDue = diff.isDue;
    timeInfo = diff.isDue
      ? <span className="text-medical-green">Appointment time is due!</span>
      : <span>
          Starts in: {diff.days > 0 && `${diff.days}d `}{diff.hours > 0 && `${diff.hours}h `}{diff.minutes}m
        </span>;
  }

  return (
    <main className="min-h-screen bg-gradient-subtle pb-20">
      {/* Header Section: Greeting and Patient Mini Profile */}
      <header className="bg-gradient-to-r from-medical-blue to-medical-blue-dark text-white p-6 rounded-b-3xl shadow-premium">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold font-display">{greeting}, {name !== "Not Set" ? name.split(' ')[0] : "User"}!</h1>
            <p className="text-white/90 text-sm font-body">Your health, our priority</p>
          </div>
          <div className="relative">
            <Bell className="w-6 h-6 text-white" />
            <div className="absolute -top-2 -right-2 bg-medical-green text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              2
            </div>
          </div>
        </div>
        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-4">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16 border-2 border-white/30">
              <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                {name !== "Not Set" ? name.split(' ').map((n: string) => n[0]).join('') : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-white font-semibold">ID: {healthId}</span>
                <Badge variant="secondary" className="bg-medical-green text-white">
                  Active
                </Badge>
              </div>
              <p className="text-white/90 text-sm">{age} years • {gender}</p>
              <p className="text-medical-green-light text-sm font-medium">{condition}</p>
            </div>
          </div>
        </Card>
      </header>

      <section className="p-6 space-y-6">
        {/* Quick Actions Section */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4 font-display">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 hover:shadow-card transition-all duration-300 cursor-pointer bg-card border border-border">
              <div className="text-center">
                <div className="bg-primary/10 rounded-2xl p-4 mb-3 mx-auto w-16 h-16 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-card-foreground font-display text-sm">Book Consultation</h3>
                <p className="text-xs text-muted-foreground mt-1 font-body">Find & schedule</p>
              </div>
            </Card>
            
            <Card className="p-4 hover:shadow-card transition-all duration-300 cursor-pointer bg-card border border-border">
              <div className="text-center">
                <div className="bg-secondary/10 rounded-2xl p-4 mb-3 mx-auto w-16 h-16 flex items-center justify-center">
                  <Users className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="font-semibold text-card-foreground font-display text-sm">My Providers</h3>
                <p className="text-xs text-muted-foreground mt-1 font-body">Recent doctors</p>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-card transition-all duration-300 cursor-pointer bg-card border border-border">
              <div className="text-center">
                <div className="bg-premium-purple/10 rounded-2xl p-4 mb-3 mx-auto w-16 h-16 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-premium-purple" />
                </div>
                <h3 className="font-semibold text-card-foreground font-display text-sm">Messages</h3>
                <p className="text-xs text-muted-foreground mt-1 font-body">Chat with doctors</p>
              </div>
            </Card>
            
            <Card className="p-4 hover:shadow-card transition-all duration-300 cursor-pointer bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground border-0">
              <div className="text-center">
                <div className="bg-white/20 rounded-2xl p-4 mb-3 mx-auto w-16 h-16 flex items-center justify-center">
                  <Ambulance className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold text-white font-display text-sm">Emergency</h3>
                <p className="text-xs text-white/90 mt-1 font-body">Call 199 now</p>
              </div>
            </Card>

            <Card 
              className="p-4 hover:shadow-card transition-all duration-300 cursor-pointer bg-card border border-border"
              onClick={() => navigate("/ai-remedies")}
            >
              <div className="text-center">
                <div className="bg-green-100 rounded-2xl p-4 mb-3 mx-auto w-16 h-16 flex items-center justify-center">
                  <Leaf className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-card-foreground font-display text-sm">AI Remedies</h3>
                <p className="text-xs text-muted-foreground mt-1 font-body">Home treatments</p>
              </div>
            </Card>

            <Card 
              className="p-4 hover:shadow-card transition-all duration-300 cursor-pointer bg-card border border-border"
              onClick={() => navigate("/xray-explainer")}
            >
              <div className="text-center">
                <div className="bg-blue-100 rounded-2xl p-4 mb-3 mx-auto w-16 h-16 flex items-center justify-center">
                  <Brain className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-card-foreground font-display text-sm">X-ray AI</h3>
                <p className="text-xs text-muted-foreground mt-1 font-body">Image analysis</p>
              </div>
            </Card>

            <Card 
              className="p-4 hover:shadow-card transition-all duration-300 cursor-pointer bg-card border border-border"
              onClick={() => navigate("/pharmacy-map")}
            >
              <div className="text-center">
                <div className="bg-orange-100 rounded-2xl p-4 mb-3 mx-auto w-16 h-16 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="font-semibold text-card-foreground font-display text-sm">Pharmacies</h3>
                <p className="text-xs text-muted-foreground mt-1 font-body">Find nearby</p>
              </div>
            </Card>

            <Card 
              className="p-4 hover:shadow-card transition-all duration-300 cursor-pointer bg-card border border-border"
              onClick={() => navigate("/insurance-integration")}
            >
              <div className="text-center">
                <div className="bg-purple-100 rounded-2xl p-4 mb-3 mx-auto w-16 h-16 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-card-foreground font-display text-sm">Insurance</h3>
                <p className="text-xs text-muted-foreground mt-1 font-body">Coverage info</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Next Appointment Section */}
        <section aria-label="Upcoming appointments">
          <h2 className="text-xl font-bold text-foreground mb-4 font-display">Next Appointment</h2>
          {nextAppointment ? (
            <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
              <div className="flex items-center space-x-4">
                <Avatar className="w-14 h-14">
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                    {nextAppointment.provider_profile?.name
                      ? nextAppointment.provider_profile.name.split(' ').map(n => n[0]).join('')
                      : "DR"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground font-display">{nextAppointment.provider_profile?.name || "Provider"}</h3>
                  <p className="text-muted-foreground text-sm">{nextAppointment.provider_profile?.specialty || ""}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center text-sm text-foreground">
                      <Clock className="w-4 h-4 mr-1" />
                      {nextAppointment.date_time
                        ? new Date(nextAppointment.date_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : ""}
                    </div>
                  </div>
                  {/* Time until appointment */}
                  {nextAppointment.date_time && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {timeInfo}
                    </div>
                  )}
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                      {nextAppointment.mode === "virtual" ? (
                        <Video className="w-3 h-3 mr-1" />
                      ) : (
                        <MapPin className="w-3 h-3 mr-1" />
                      )}
                      {nextAppointment.mode === "virtual" ? "Virtual Consultation" : "Physical Consultation"}
                    </Badge>
                    <Badge variant="default" className="bg-primary text-primary-foreground">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {nextAppointment.status}
                    </Badge>
                    {/* Join Now button for confirmed and time is due */}
                    {nextAppointment.status === "confirmed" && nextAppointment.date_time && (
                      <Button
                        size="sm"
                        variant="medical"
                        className="animate-scale-in ml-2"
                        disabled={!isDue}
                        onClick={() => {
                          navigate(`/chat/${nextAppointment.id}`);
                        }}
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Join Now
                      </Button>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>
          ) : (
            <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
              <div className="text-muted-foreground text-sm">No upcoming appointment.</div>
            </Card>
          )}
        </section>

        {/* Recent Providers Section */}
        <section aria-label="Recent providers">
          <h2 className="text-xl font-bold text-foreground mb-4 font-display">Recent Providers</h2>
          <div className="flex gap-4">
            {recentProviders.length === 0 ? (
              <Card className="p-4 bg-card border border-border flex-1">
                <div className="text-muted-foreground text-sm">No recent providers.</div>
              </Card>
            ) : (
              recentProviders.map((provider, idx) => (
                <Card key={idx} className="p-4 bg-card border border-border flex-1">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {provider?.name
                          ? provider.name.split(' ').map(n => n[0]).join('')
                          : "DR"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-foreground">{provider?.name || "Provider"}</h3>
                      <p className="text-xs text-muted-foreground">{provider?.specialty || ""}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Reminders & Notifications Section */}
        <section aria-label="Health reminders">
          <h2 className="text-xl font-bold text-foreground mb-4 font-display">Reminders</h2>
          <div className="space-y-3">
            <Card className="p-4 border border-medical-warning/20 bg-medical-warning/5">
              <div className="flex items-center space-x-3">
                <div className="bg-medical-warning/20 rounded-full p-2">
                  <Pill className="w-5 h-5 text-medical-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">Medication Reminder</h3>
                  <p className="text-sm text-muted-foreground">Take Metformin - 2 tablets after lunch</p>
                </div>
                <span className="text-xs text-medical-warning font-medium">Due in 2h</span>
              </div>
            </Card>

            <Card className="p-4 border border-primary/20 bg-primary/5">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/20 rounded-full p-2">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">Health Checkup</h3>
                  <p className="text-sm text-muted-foreground">Time for your quarterly blood sugar check</p>
                </div>
                <span className="text-xs text-primary font-medium">This week</span>
              </div>
            </Card>
          </div>
        </section>

        {/* Recent Activity Section */}
        <section aria-label="Recent medical activity">
          <h2 className="text-xl font-bold text-foreground mb-4 font-display">Recent Activity</h2>
          {recentActivity ? (
            <Card className="p-4 border border-border bg-card">
              <div className="flex items-start space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {recentActivity.provider_profile?.name
                      ? recentActivity.provider_profile.name.split(' ').map(n => n[0]).join('')
                      : "DR"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">
                    Last Consultation - {recentActivity.provider_profile?.name || "Provider"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {recentActivity.reason || "Consultation completed."}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs text-muted-foreground">
                      {getDaysAgo(recentActivity.date_time)}
                    </span>
                    <Button variant="outline" size="sm" className="text-xs">
                      <FileText className="w-3 h-3 mr-1" />
                      View Notes
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-4 border border-border bg-card">
              <div className="text-muted-foreground text-sm">No recent activity.</div>
            </Card>
          )}
        </section>

        {/* Health Tip Section */}
        <aside aria-label="Daily health tip">
        <Card className="p-4 bg-gradient-to-r from-medical-green/10 to-medical-green/5 border border-medical-green/20">
          <div className="flex items-start space-x-3">
            <div className="bg-medical-green/20 rounded-full p-2 mt-1">
              <Heart className="w-5 h-5 text-medical-green" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2 font-display">Health Tip of the Day</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Stay hydrated! Drinking adequate water helps regulate blood sugar levels and supports overall diabetes management. Aim for 8-10 glasses daily.
              </p>
            </div>
          </div>
        </Card>
        </aside>
      </section>

      {/* Bottom Navigation Section */}
      <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-premium">
        <div className="flex justify-around py-3">
          {[
            { icon: Home, label: 'Home', active: true, route: '/dashboard' },
            { icon: Calendar, label: 'Bookings', active: false, route: '/bookings' },
            { icon: MessageCircle, label: 'Messages', active: false, route: '/messages' },
            { icon: User, label: 'Profile', active: false, route: '/profile' }
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.route)}
              className={`flex flex-col items-center py-2 px-4 transition-colors ${
                item.active 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-body">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
};

export default DashboardPage;