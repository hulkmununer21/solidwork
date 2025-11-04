import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Calendar,
  MessageCircle,
  User,
  Home,
  Clock,
  CheckCircle,
  XCircle,
  Bell,
  FileText,
  Settings,
  Wallet,
  Users,
  Video,
  MapPin,
  Check,
  X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";

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

const ProviderDashboardPage = () => {
  // Provider profile state
  const [providerInfo, setProviderInfo] = useState<any>(null);
  // Online/offline status
  const [isAvailable, setIsAvailable] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  // Navigation tab state
  const [activeTab, setActiveTab] = useState('home');
  // Bookings with merged patient info
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState<string | null>(null);
  const [declineLoading, setDeclineLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: provider } = await supabase
        .from("provider_profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (provider) {
        setProviderInfo(provider);
        setIsAvailable(!!provider.available);
      }

      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .eq("provider_id", user.id);

      const { data: patientsData } = await supabase
        .from("patient_profiles")
        .select("*");

      const mergedBookings = (bookingsData || []).map(booking => {
        const patient = (patientsData || []).find(p => p.id === booking.patient_id);
        return {
          ...booking,
          patient_profile: patient || null
        };
      });

      setBookings(mergedBookings);
    };

    fetchAllData();
  }, []);

  const handleAvailableToggle = async (checked: boolean) => {
    setLoadingStatus(true);
    setIsAvailable(checked);
    if (providerInfo) {
      await supabase
        .from("provider_profiles")
        .update({ available: checked })
        .eq("id", providerInfo.id);
      setProviderInfo({ ...providerInfo, available: checked });
    }
    setLoadingStatus(false);
  };

  // Accept booking handler
  const handleAcceptBooking = async (bookingId: string) => {
    setAcceptLoading(bookingId);
    await supabase
      .from("bookings")
      .update({ status: "pending_payment" })
      .eq("id", bookingId);
    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId ? { ...b, status: "pending_payment" } : b
      )
    );
    setAcceptLoading(null);
    alert("Booking accepted. Awaiting patient payment.");
  };

  // Decline booking handler
  const handleDeclineBooking = async (bookingId: string) => {
    setDeclineLoading(bookingId);
    await supabase
      .from("bookings")
      .update({ status: "declined" })
      .eq("id", bookingId);
    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId ? { ...b, status: "declined" } : b
      )
    );
    setDeclineLoading(null);
    alert("Booking declined.");
  };

  // Filter bookings for today's schedule
  const todaysSchedule = bookings.filter(b => {
    const bookingDate = b.date_time ? new Date(b.date_time) : null;
    return bookingDate && bookingDate.toDateString() === new Date().toDateString();
  });

  // Filter bookings for pending requests
  const pendingRequests = bookings.filter(b =>
    b.status === "requested" || b.status === "pending_provider"
  );

  const quickActions = [
    { icon: Calendar, label: 'Set Availability', color: 'bg-medical-blue' },
    { icon: MessageCircle, label: 'Inbox/Messages', color: 'bg-medical-green' },
    { icon: FileText, label: 'Medical Records', color: 'bg-purple-500' },
    { icon: Settings, label: 'Profile & Documents', color: 'bg-orange-500' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'requested': return 'bg-yellow-100 text-yellow-800';
      case 'pending_provider': return 'bg-yellow-100 text-yellow-800';
      case 'pending_payment': return 'bg-orange-100 text-orange-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const navigationItems = [
    { icon: Home, label: 'Home', id: 'home' },
    { icon: Calendar, label: 'Schedule', id: 'schedule' },
    { icon: MessageCircle, label: 'Messages', id: 'messages' },
    { icon: User, label: 'Profile', id: 'profile' }
  ];

  const getVerificationBadge = (status: string) => {
    if (status === "verified") {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 self-start">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      );
    }
    if (status === "pending") {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 self-start">
          <Clock className="w-3 h-3 mr-1" />
          Pending Verification
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200 self-start">
        <XCircle className="w-3 h-3 mr-1" />
        Not Verified
      </Badge>
    );
  };

  const handleViewDetails = (booking: any) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };
  const handleCloseModal = () => {
    setShowBookingModal(false);
    setSelectedBooking(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue-light to-white pb-24">
      {/* Header */}
      <div className="bg-white shadow-card p-4 sm:p-6 pt-12 sm:pt-16">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl font-bold font-display text-foreground">
                {providerInfo?.title
                  ? `${providerInfo.title} ${providerInfo.name || ""}`
                  : providerInfo?.name || "Provider"}
              </h1>
              {getVerificationBadge(providerInfo?.status)}
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {isAvailable ? 'Online' : 'Offline'}
              </span>
              <Switch
                checked={isAvailable}
                onCheckedChange={handleAvailableToggle}
                disabled={loadingStatus}
              />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-medical-blue" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Today's Schedule - merged patient info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-medical-blue" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysSchedule.length === 0 ? (
              <div className="text-muted-foreground text-sm">No bookings scheduled for today.</div>
            ) : (
              todaysSchedule.map((appointment) => {
                let timeInfo = null;
                let isDue = false;
                if (appointment.date_time) {
                  const bookingDate = new Date(appointment.date_time);
                  const diff = getTimeDiff(bookingDate);
                  isDue = diff.isDue;
                  timeInfo = diff.isDue
                    ? <span className="text-medical-green">Appointment time is due!</span>
                    : <span>
                        Starts in: {diff.days > 0 && `${diff.days}d `}{diff.hours > 0 && `${diff.hours}h `}{diff.minutes}m
                      </span>;
                }
                return (
                  <div key={appointment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback>
                          {appointment.patient_profile?.name
                            ? appointment.patient_profile.name.split(' ').map(n => n[0]).join('')
                            : "P"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm sm:text-base truncate">
                          {appointment.patient_profile?.name || "Patient"}
                        </p>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {appointment.date_time
                            ? new Date(appointment.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ""}
                          {appointment.mode === 'virtual' ? (
                            <Video className="h-3 w-3 ml-1" />
                          ) : (
                            <MapPin className="h-3 w-3 ml-1" />
                          )}
                          <span className="capitalize">{appointment.mode}</span>
                        </div>
                        {/* Time until appointment */}
                        {appointment.date_time && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {timeInfo}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <Badge className={`${getStatusColor(appointment.status)} text-xs`}>
                        {appointment.status.replace(/_/g, " ")}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs sm:text-sm"
                        onClick={() => handleViewDetails(appointment)}
                      >
                        View Details
                      </Button>
                      {/* Start Chat for confirmed bookings, enabled if time is due */}
                      {appointment.status === 'confirmed' && (
                        <Button
                          size="sm"
                          variant="medical"
                          className="animate-scale-in"
                          disabled={!isDue}
                          onClick={() => {
                            navigate(`/chat/${appointment.id}`);
                          }}
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Start Chat
                        </Button>
                      )}
                      {/* Resume Chat for in_progress bookings, always enabled */}
                      {appointment.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="medical"
                          className="animate-scale-in"
                          onClick={() => {
                            navigate(`/chat/${appointment.id}`);
                          }}
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Resume Chat
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Booking Details Modal */}
        <Dialog open={showBookingModal} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-md rounded-xl shadow-lg border bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-medical-blue" />
                Booking Details
              </DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {selectedBooking.patient_profile?.name
                        ? selectedBooking.patient_profile.name.split(' ').map(n => n[0]).join('')
                        : "P"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-base">
                      {selectedBooking.patient_profile?.name || "Unknown"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Patient
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-semibold">Date & Time:</span>
                    <br />
                    {selectedBooking.date_time
                      ? new Date(selectedBooking.date_time).toLocaleString()
                      : "N/A"}
                  </div>
                  <div>
                    <span className="font-semibold">Mode:</span>
                    <br />
                    <span className="capitalize">{selectedBooking.mode}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Status:</span>
                    <br />
                    <Badge className={getStatusColor(selectedBooking.status)}>
                      {selectedBooking.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-semibold">Duration:</span>
                    <br />
                    {selectedBooking.duration ? `${selectedBooking.duration} min` : "N/A"}
                  </div>
                </div>
                {selectedBooking.reason && (
                  <div className="mt-2">
                    <span className="font-semibold">Reason:</span>
                    <br />
                    <span className="text-muted-foreground">{selectedBooking.reason}</span>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className="w-full mt-2">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Pending Requests - merged patient info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-orange-500" />
              Pending Requests
              <Badge className="bg-red-100 text-red-800 text-xs">{pendingRequests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.length === 0 ? (
              <div className="text-muted-foreground text-sm">No pending requests.</div>
            ) : (
              pendingRequests.map((request) => (
                <div key={request.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-orange-50 rounded-lg border border-orange-200 gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback>
                        {request.patient_profile?.name
                          ? request.patient_profile.name.split(' ').map(n => n[0]).join('')
                          : "P"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground text-sm sm:text-base">
                        {request.patient_profile?.name || "Patient"}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {request.date_time
                          ? new Date(request.date_time).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : ""}
                      </p>
                      <p className="text-xs sm:text-sm text-orange-700 break-words">
                        {request.reason || ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 self-start sm:self-center">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm flex-1 sm:flex-none"
                      onClick={() => handleAcceptBooking(request.id)}
                      disabled={acceptLoading === request.id}
                    >
                      {acceptLoading === request.id ? "Accepting..." : (
                        <>
                          <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Accept
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 text-xs sm:text-sm flex-1 sm:flex-none"
                      onClick={() => handleDeclineBooking(request.id)}
                      disabled={declineLoading === request.id}
                    >
                      {declineLoading === request.id ? "Declining..." : (
                        <>
                          <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Decline
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 font-display text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {quickActions.map((action, i) => (
              <Card key={i} className="cursor-pointer hover:shadow-premium transition-premium border-0 shadow-card">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className={`${action.color} rounded-2xl p-3 sm:p-4 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 shadow-premium`}>
                    <action.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white mx-auto" />
                  </div>
                  <p className="font-medium text-foreground font-body text-xs sm:text-sm leading-tight">{action.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Earnings Snapshot */}
        <Card className="bg-gradient-to-r from-medical-green to-green-600 text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Wallet className="h-5 w-5" />
              <h3 className="font-bold text-lg sm:text-xl">Earnings Snapshot</h3>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <p className="text-base sm:text-lg font-semibold">This Month: 24 consultations completed</p>
              <p className="text-xl sm:text-2xl font-bold">Estimated Earnings: ₦48,000</p>
              <p className="text-xs sm:text-sm opacity-90">(Pilot phase – payouts handled by admin)</p>
            </div>
          </CardContent>
        </Card>

        {/* Notifications/Alerts */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3 sm:p-4">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-start gap-2 text-blue-800">
                <Bell className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">
                  {pendingRequests.length} patient{pendingRequests.length !== 1 ? "s" : ""} awaiting response
                </span>
              </div>
              <div className="flex items-start gap-2 text-green-800">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">Admin approved your license document</span>
              </div>
              <div className="flex items-start gap-2 text-orange-800">
                <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">Booking tomorrow at 10am</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-premium p-3 sm:p-4 safe-area-pb">
        <div className="flex justify-around max-w-md mx-auto">
          {navigationItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col items-center gap-1 cursor-pointer min-w-0 flex-1 py-1"
              onClick={() => {
                setActiveTab(item.id);
                if (item.id === 'schedule') {
                  navigate('/provider-schedule');
                } else if (item.id === 'messages') {
                  navigate('/provider-messages');
                } else if (item.id === 'profile') {
                  navigate('/provider-profile');
                }
              }}
            >
              <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${activeTab === item.id ? 'text-medical-blue' : 'text-muted-foreground'}`} />
              <span className={`text-xs font-body leading-tight text-center ${activeTab === item.id ? 'text-medical-blue font-semibold' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboardPage;