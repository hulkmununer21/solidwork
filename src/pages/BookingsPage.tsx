import { 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  Plus, 
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Home,
  MessageCircle,
  User,
  FileText,
  Star,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { format, isAfter, isSameDay } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";

// Helper to calculate time difference
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

const BookingsPage = () => {
  const navigate = useNavigate();

  // State for bookings, providers, reviews
  const [bookings, setBookings] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state for booking details
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Modal state for payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // Fetch bookings, providers, and reviews separately
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      // Fetch bookings for this patient, including requested status
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .eq("patient_id", user.id)
        .in("status", ["requested", "pending_payment", "confirmed", "in_progress", "completed"]);

      // Fetch all provider profiles
      const { data: providersData } = await supabase
        .from("provider_profiles")
        .select("*");

      // Fetch all reviews
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("*");

      setBookings(bookingsData || []);
      setProviders(providersData || []);
      setReviews(reviewsData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Merge provider info into bookings
  const bookingsWithProvider = bookings.map(b => {
    const provider = providers.find(p => p.id === b.provider_id);
    return { ...b, provider };
  });

  // Split bookings into upcoming and past
  const now = new Date();
  const upcomingAppointments = bookingsWithProvider.filter(b => {
    const bookingDate = b.date_time ? new Date(b.date_time) : null;
    // Upcoming: date is today or in future, and status is not 'completed'
    return bookingDate && (isAfter(bookingDate, now) || isSameDay(bookingDate, now)) && b.status && b.status.toLowerCase() !== "completed";
  });
  const pastAppointments = bookingsWithProvider.filter(b => {
    // Past: status is 'completed'
    return b.status && b.status.toLowerCase() === "completed";
  });

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-medical-green" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-medical-warning" />;
      case 'requested':
        return <AlertCircle className="w-4 h-4 text-medical-warning" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getModeIcon = (mode: string) => {
    return mode?.toLowerCase() === 'virtual' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />;
  };

  // Payment handler
  const handleConfirmPayment = async () => {
    if (!selectedBooking) return;
    setPaymentLoading(true);
    setPaymentError("");
    const { error } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        payment_status: "paid"
      })
      .eq("id", selectedBooking.id);
    setPaymentLoading(false);
    if (error) {
      setPaymentError("Payment failed. Please try again.");
    } else {
      setShowPaymentModal(false);
      setBookings(bookings.map(b =>
        b.id === selectedBooking.id
          ? { ...b, status: "confirmed", payment_status: "paid" }
          : b
      ));
    }
  };

  // Start appointment and initialize chat
  const handleStartAppointment = async (appointment: any) => {
    // Update booking status to in_progress
    await supabase
      .from("bookings")
      .update({ status: "in_progress" })
      .eq("id", appointment.id);

    // Insert initial message from patient
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from("messages")
      .insert({
        booking_id: appointment.id,
        sender_id: user.id,
        text: "hello, i have started a chat session",
        timestamp: new Date().toISOString()
      });

    // Optionally refresh bookings state here if needed

    // Navigate to messages page with booking_id
    navigate(`/messages?booking_id=${appointment.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle pb-20">
      {/* Header */}
      <div className="gradient-hero text-white p-6 rounded-b-3xl shadow-premium">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold font-display">My Bookings</h1>
            <p className="text-white/90 text-sm font-body">Manage your appointments</p>
          </div>
          <Button 
            variant="secondary" 
            size="sm"
            className="shadow-card animate-scale-in"
            onClick={() => navigate("/book-now")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Book Now
          </Button>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white shadow-card">
            <TabsTrigger value="upcoming" className="font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Upcoming ({upcomingAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Past ({pastAppointments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {loading ? (
              <Card className="p-8 text-center">
                <div className="space-y-4">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Loading appointments...</h3>
                  </div>
                </div>
              </Card>
            ) : upcomingAppointments.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="space-y-4">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">No upcoming appointments</h3>
                    <p className="text-muted-foreground">Book your next appointment to get started</p>
                  </div>
                  <Button className="mt-4" onClick={() => navigate("/book-now")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Book Appointment
                  </Button>
                </div>
              </Card>
            ) : (
              upcomingAppointments.map((appointment, index) => {
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
                  <Card 
                    key={appointment.id} 
                    className="p-6 hover:shadow-card transition-all duration-300 cursor-pointer border-l-4 border-l-primary animate-fade-in hover-scale"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="space-y-4">
                      {/* Header Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                              {appointment.provider?.name
                                ? appointment.provider.name.split(' ').map(n => n[0]).join('')
                                : ''}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-foreground font-display">{appointment.provider?.name || "Provider"}</h3>
                            <p className="text-muted-foreground text-sm">{appointment.provider?.specialty || ""}</p>
                          </div>
                        </div>
                        <Badge 
                          variant={appointment.status?.toLowerCase() === 'confirmed' ? 'default' : 'secondary'} 
                          className="px-3 py-1 animate-scale-in"
                        >
                          {getStatusIcon(appointment.status)}
                          <span className="ml-1">{appointment.status}</span>
                        </Badge>
                      </div>

                      {/* Appointment Details */}
                      <div className="bg-gradient-subtle rounded-lg p-4 border border-border/50">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-primary/10 rounded-full p-2">
                              <Calendar className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground font-medium">Date & Time</p>
                              <p className="font-semibold text-sm text-foreground">
                                {appointment.date_time
                                  ? format(new Date(appointment.date_time), "MMM d, yyyy 'at' h:mm a")
                                  : `${appointment.date} at ${appointment.time}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="bg-secondary/10 rounded-full p-2">
                              <Clock className="w-4 h-4 text-secondary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground font-medium">Duration</p>
                              <p className="font-semibold text-sm text-foreground">{appointment.duration || "30 min"}</p>
                            </div>
                          </div>
                        </div>
                        {/* Time until appointment */}
                        {appointment.date_time && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {timeInfo}
                          </div>
                        )}
                      </div>

                      {/* Action Row */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs bg-card border-primary/20">
                            {getModeIcon(appointment.mode)}
                            <span className="ml-1">{appointment.mode}</span>
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-secondary/10 text-secondary border-secondary/20">
                            {appointment.type || ""}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          {/* Pay Now button for status === "pending_payment" */}
                          {appointment.status === "pending_payment" && (
                            <Button
                              size="sm"
                              variant="medical"
                              className="animate-scale-in"
                              onClick={() => {
                                setSelectedBooking(appointment);
                                setShowPaymentModal(true);
                              }}
                            >
                              Pay Now
                            </Button>
                          )}
                          {/* Start Appointment button for confirmed and time is due */}
                          {appointment.status === "confirmed" && appointment.date_time && isDue && (
                            <Button
                              size="sm"
                              variant="medical"
                              className="animate-scale-in"
                              onClick={() => handleStartAppointment(appointment)}
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Start Appointment
                            </Button>
                          )}
                          {/* Start Chat button for in_progress */}
                          {appointment.status === "in_progress" && (
                            <Button
                              size="sm"
                              variant="medical"
                              className="animate-scale-in"
                              onClick={() => {
                                navigate(`/messages?booking_id=${appointment.id}`);
                              }}
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Start Chat
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="hover-scale"
                            onClick={() => {
                              setSelectedBooking(appointment);
                              setShowBookingModal(true);
                            }}
                          >
                            <ChevronRight className="w-3 h-3 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {loading ? (
              <Card className="p-8 text-center">
                <div className="space-y-4">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Loading appointments...</h3>
                  </div>
                </div>
              </Card>
            ) : pastAppointments.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="space-y-4">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">No past appointments</h3>
                  </div>
                </div>
              </Card>
            ) : (
              pastAppointments.map((appointment) => (
                <Card key={appointment.id} className="p-6 border-l-4 border-l-muted-foreground">
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                            {appointment.provider?.name
                              ? appointment.provider.name.split(' ').map(n => n[0]).join('')
                              : ''}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-foreground font-display">{appointment.provider?.name || "Provider"}</h3>
                          <p className="text-muted-foreground text-sm">{appointment.provider?.specialty || ""}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {appointment.status}
                      </Badge>
                    </div>

                    {/* Appointment Details */}
                    <div className="bg-muted/20 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Date & Time</p>
                            <p className="font-medium text-sm">
                              {appointment.date_time
                                ? format(new Date(appointment.date_time), "MMM d, yyyy 'at' h:mm a")
                                : `${appointment.date} at ${appointment.time}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Duration</p>
                            <p className="font-medium text-sm">{appointment.duration || "30 min"}</p>
                          </div>
                        </div>
                      </div>
                      
                      {appointment.notes && (
                        <div className="pt-3 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                          <p className="text-sm text-foreground">{appointment.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {getModeIcon(appointment.mode)}
                          <span className="ml-1">{appointment.mode}</span>
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {appointment.type || ""}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedBooking(appointment);
                          setShowBookingModal(true);
                        }}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        View Summary
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Details Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-md rounded-xl shadow-lg border bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              Booking Details
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {selectedBooking.provider?.name
                      ? selectedBooking.provider.name.split(' ').map(n => n[0]).join('')
                      : "P"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-base">
                    {selectedBooking.provider?.name || "Unknown"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedBooking.provider?.specialty}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-semibold">Date & Time:</span>
                  <br />
                  {selectedBooking.date_time
                    ? format(new Date(selectedBooking.date_time), "MMM d, yyyy 'at' HH:mm")
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
                  <Badge>
                    {selectedBooking.status}
                  </Badge>
                </div>
                <div>
                  <span className="font-semibold">Fee:</span>
                  <br />
                  {selectedBooking.price_snapshot ? `₦${selectedBooking.price_snapshot}` : "N/A"}
                </div>
              </div>
              {selectedBooking.reason && (
                <div className="mt-2">
                  <span className="font-semibold">Reason:</span>
                  <br />
                  <span className="text-muted-foreground">{selectedBooking.reason}</span>
                </div>
              )}
              {selectedBooking.notes && (
                <div className="mt-2">
                  <span className="font-semibold">Notes:</span>
                  <br />
                  <span className="text-muted-foreground">{selectedBooking.notes}</span>
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

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md rounded-xl shadow-lg border bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              Payment
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {selectedBooking.provider?.name
                      ? selectedBooking.provider.name.split(' ').map(n => n[0]).join('')
                      : "P"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-base">
                    {selectedBooking.provider?.name || "Unknown"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedBooking.provider?.specialty}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-semibold">Date & Time:</span>
                  <br />
                  {selectedBooking.date_time
                    ? format(new Date(selectedBooking.date_time), "MMM d, yyyy 'at' HH:mm")
                    : "N/A"}
                </div>
                <div>
                  <span className="font-semibold">Mode:</span>
                  <br />
                  <span className="capitalize">{selectedBooking.mode}</span>
                </div>
                <div>
                  <span className="font-semibold">Fee:</span>
                  <br />
                  {selectedBooking.price_snapshot ? `₦${selectedBooking.price_snapshot}` : "N/A"}
                </div>
                <div>
                  <span className="font-semibold">Status:</span>
                  <br />
                  <Badge>
                    {selectedBooking.status}
                  </Badge>
                </div>
              </div>
              {selectedBooking.reason && (
                <div className="mt-2">
                  <span className="font-semibold">Reason:</span>
                  <br />
                  <span className="text-muted-foreground">{selectedBooking.reason}</span>
                </div>
              )}
              {paymentError && (
                <div className="text-red-600 text-xs">{paymentError}</div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="w-full mt-2">
                Cancel
              </Button>
            </DialogClose>
            <Button
              className="w-full mt-2"
              disabled={paymentLoading}
              onClick={handleConfirmPayment}
            >
              {paymentLoading ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-premium">
        <div className="flex justify-around py-3">
          {[
            { icon: Home, label: 'Home', active: false, route: '/dashboard' },
            { icon: Calendar, label: 'Bookings', active: true, route: '/bookings' },
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
      </div>
    </div>
  );
};

export default BookingsPage;