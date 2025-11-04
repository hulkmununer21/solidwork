import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar as CalendarIcon, 
  MessageCircle, 
  User, 
  Home,
  Clock,
  Plus,
  Video,
  MapPin,
  Edit,
  Trash2,
  List,
  Grid3X3,
  FileText,
  X,
  Send
} from "lucide-react";
import { format, startOfWeek, endOfWeek, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";

// Booking status constants
const BOOKING_STATUSES = [
  "requested",
  "pending_provider",
  "pending_payment",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "disputed"
];

// Helper for time options
const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00"
];

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

const ProviderSchedulePage = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilitySlots, setAvailabilitySlots] = useState<any[]>([]);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [slotForm, setSlotForm] = useState({
    date: "",
    day_of_week: "",
    start_time: "",
    end_time: "",
    is_recurring: false
  });
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedChatBooking, setSelectedChatBooking] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [providerId, setProviderId] = useState<string>("");
  const navigate = useNavigate();

  // Fetch provider availability from Supabase
  const fetchAvailability = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setProviderId(user.id);
    const { data, error } = await supabase
      .from("provider_availability")
      .select("*")
      .eq("provider_id", user.id)
      .eq("is_active", true);
    setLoading(false);
    if (!error && data) setAvailabilitySlots(data);
  };

  // Fetch bookings for the present provider and merge patient info manually
  const fetchBookings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Fetch bookings for this provider
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("*")
      .eq("provider_id", user.id);
    // Fetch all patient profiles
    const { data: patientsData } = await supabase
      .from("patient_profiles")
      .select("*");
    // Merge patient info into each booking
    const mergedBookings = (bookingsData || []).map(booking => {
      const patient = (patientsData || []).find(p => p.id === booking.patient_id);
      return {
        ...booking,
        patient_profile: patient || null
      };
    });
    setBookings(mergedBookings);
  };

  useEffect(() => {
    fetchAvailability();
    fetchBookings();
  }, []);

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    const patientName = booking.patient_profile?.name || "";
    const matchesSearch = patientName.toLowerCase().includes(searchQuery.toLowerCase());
    const bookingDate = booking.date_time ? new Date(booking.date_time) : null;
    const matchesDate = bookingDate && (
      timeRange === 'today' ? isSameDay(bookingDate, selectedDate) :
      timeRange === 'week' ? bookingDate >= startOfWeek(selectedDate) && bookingDate <= endOfWeek(selectedDate) :
      bookingDate >= startOfMonth(selectedDate) && bookingDate <= endOfMonth(selectedDate)
    );
    return matchesStatus && matchesSearch && matchesDate;
  });

  // Unique bookings for the selected date (no duplicates)
  const uniqueBookingsForDate = (() => {
    const seen = new Set();
    return filteredBookings.filter(b => {
      const bookingDate = b.date_time ? new Date(b.date_time) : null;
      if (!bookingDate || !isSameDay(bookingDate, selectedDate)) return false;
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    });
  })();

  const pendingCount = bookings.filter(b => b.status === 'requested').length;

  const navigationItems = [
    { icon: Home, label: 'Home', id: 'home' },
    { icon: CalendarIcon, label: 'Schedule', id: 'schedule' },
    { icon: MessageCircle, label: 'Messages', id: 'messages' },
    { icon: User, label: 'Profile', id: 'profile' }
  ];

  // Helper to get slots for selected date (supports both one-off and weekly recurring)
  const slotsForDate = availabilitySlots.filter(slot => {
    // One-off slot for a specific date
    if (!slot.is_recurring && slot.date === format(selectedDate, "yyyy-MM-dd")) {
      return true;
    }
    // Recurring weekly slot for this day of week
    if (slot.is_recurring && slot.day_of_week === selectedDate.getDay()) {
      return true;
    }
    return false;
  });

  // Add or Edit slot
  const handleSaveSlot = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    let payload: any = {
      provider_id: user.id,
      start_time: slotForm.start_time,
      end_time: slotForm.end_time,
      is_recurring: slotForm.is_recurring,
      is_active: true
    };
    if (slotForm.is_recurring) {
      payload.day_of_week = slotForm.day_of_week;
      payload.date = null;
    } else {
      payload.day_of_week = null;
      payload.date = slotForm.date; // Use the picked date from the modal
    }
    if (editingSlot) {
      await supabase
        .from("provider_availability")
        .update(payload)
        .eq("id", editingSlot.id);
    } else {
      await supabase
        .from("provider_availability")
        .insert([payload]);
    }
    setShowAvailabilityDialog(false);
    setEditingSlot(null);
    setSlotForm({
      date: "",
      day_of_week: "",
      start_time: "",
      end_time: "",
      is_recurring: false
    });
    setLoading(false);
    fetchAvailability();
  };

  // Delete slot
  const handleDeleteSlot = async (slot: any) => {
    setLoading(true);
    await supabase
      .from("provider_availability")
      .delete()
      .eq("id", slot.id);
    setLoading(false);
    fetchAvailability();
  };

  // Open dialog for new slot
  const openAddSlotDialog = () => {
    setEditingSlot(null);
    setSlotForm({
      date: format(selectedDate, "yyyy-MM-dd"),
      day_of_week: "",
      start_time: "",
      end_time: "",
      is_recurring: false
    });
    setShowAvailabilityDialog(true);
  };

  // Open dialog for edit slot
  const openEditSlotDialog = (slot: any) => {
    setEditingSlot(slot);
    setSlotForm({
      date: slot.date ? format(new Date(slot.date), "yyyy-MM-dd") : format(selectedDate, "yyyy-MM-dd"),
      day_of_week: slot.day_of_week || "",
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_recurring: slot.is_recurring
    });
    setShowAvailabilityDialog(true);
  };

  // Booking status actions
  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);
    fetchBookings();
  };

  // UI helpers for status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending_provider': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'pending_payment': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'disputed': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Modal handlers
  const handleViewDetails = (booking: any) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };
  const handleCloseModal = () => {
    setShowBookingModal(false);
    setSelectedBooking(null);
  };

  // Chat logic for provider side (no navigation, just set selectedChatBooking)
  const handleStartOrResumeChat = async (booking: any) => {
    setSelectedChatBooking(booking);
    setChatLoading(true);
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("booking_id", booking.id)
      .order("timestamp", { ascending: true });
    setChatMessages(msgs || []);
    setChatLoading(false);
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !selectedChatBooking) return;
    setChatLoading(true);
    await supabase
      .from("messages")
      .insert({
        booking_id: selectedChatBooking.id,
        sender_id: providerId,
        text: chatInput,
        timestamp: new Date().toISOString()
      });
    setChatInput("");
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("booking_id", selectedChatBooking.id)
      .order("timestamp", { ascending: true });
    setChatMessages(msgs || []);
    setChatLoading(false);
  };

  // List view with bookings shown once per day, and slots below
  const renderListView = () => (
    <div className="space-y-4">
      {/* Bookings for the selected date (unique, shown once) */}
      {uniqueBookingsForDate.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-base mb-2">Bookings for this day</h3>
          {uniqueBookingsForDate.map(booking => {
            let timeInfo = null;
            let isDue = false;
            if (booking.date_time) {
              const bookingDate = new Date(booking.date_time);
              const diff = getTimeDiff(bookingDate);
              isDue = diff.isDue;
              timeInfo = diff.isDue
                ? <span className="text-medical-green">Appointment time is due!</span>
                : <span>
                    Starts in: {diff.days > 0 && `${diff.days}d `}{diff.hours > 0 && `${diff.hours}h `}{diff.minutes}m
                  </span>;
            }
            return (
              <Card key={booking.id} className="border-l-4 border-l-blue-500 mb-2">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {booking.patient_profile?.name
                            ? booking.patient_profile.name.split(' ').map(n => n[0]).join('')
                            : ''}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{booking.patient_profile?.name || "Unknown"}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {booking.mode === 'virtual' ? (
                            <Video className="h-3 w-3" />
                          ) : (
                            <MapPin className="h-3 w-3" />
                          )}
                          <span>
                            {booking.duration || 30}min • {booking.mode} • {booking.date_time ? format(new Date(booking.date_time), "HH:mm") : ""}
                          </span>
                        </div>
                        {/* Time until appointment */}
                        {booking.date_time && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {timeInfo}
                          </div>
                        )}
                        {booking.reason && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            <span className="font-semibold">Reason:</span> {booking.reason}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status.replace(/_/g, " ")}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => handleViewDetails(booking)}
                      >
                        Details
                      </Button>
                      {/* Action buttons for each status */}
                      {booking.status === 'requested' && (
                        <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white"
                          onClick={() => updateBookingStatus(booking.id, 'pending_provider')}
                        >
                          Accept
                        </Button>
                      )}
                      {booking.status === 'pending_provider' && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => updateBookingStatus(booking.id, 'pending_payment')}
                        >
                          Request Payment
                        </Button>
                      )}
                      {booking.status === 'pending_payment' && (
                        <Button size="sm" className="bg-pink-600 hover:bg-pink-700 text-white"
                          disabled
                        >
                          Awaiting Payment
                        </Button>
                      )}
                      {/* Only show Start Chat button for confirmed bookings, enabled if time is due */}
                      {booking.status === 'confirmed' && (
                        <Button
                          size="sm"
                          variant="medical"
                          className="animate-scale-in"
                          disabled={!isDue}
                          onClick={() => handleStartOrResumeChat(booking)}
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Start Chat
                        </Button>
                      )}
                      {/* Resume Chat for in_progress bookings, always enabled */}
                      {booking.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="medical"
                          className="animate-scale-in"
                          onClick={() => handleStartOrResumeChat(booking)}
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Resume Chat
                        </Button>
                      )}
                      {booking.status === 'disputed' && (
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white"
                          disabled
                        >
                          Disputed
                        </Button>
                      )}
                      {booking.status === 'cancelled' && (
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white"
                          disabled
                        >
                          Cancelled
                        </Button>
                      )}
                      {booking.status === 'completed' && (
                        <Button size="sm" className="bg-gray-600 hover:bg-gray-700 text-white"
                          disabled
                        >
                          Completed
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
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
      {/* Chat Interface (Provider side, minimalistic, no navigation) */}
      {selectedChatBooking && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {selectedChatBooking.patient_profile?.name
                    ? selectedChatBooking.patient_profile.name.split(' ').map(n => n[0]).join('')
                    : "P"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-base">
                  {selectedChatBooking.patient_profile?.name || "Unknown"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Patient
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setSelectedChatBooking(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto mb-4" style={{ maxHeight: "300px" }}>
              <div className="space-y-4">
                {chatLoading ? (
                  <div className="text-center text-muted-foreground">Loading messages...</div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMe = msg.sender_id === providerId;
                    const senderName = isMe ? "Me" : selectedChatBooking.patient_profile?.name || "Patient";
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div className="flex items-end space-x-2 max-w-[80%]">
                          {!isMe && (
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-medical-blue text-white text-xs font-bold">
                                {senderName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`p-3 rounded-2xl ${
                              isMe
                                ? "bg-primary text-primary-foreground"
                                : "bg-card border border-border text-card-foreground"
                            }`}
                          >
                            <p className="text-sm">{msg.text}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className={`text-xs ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                              </span>
                              <span className="text-xs ml-2 font-semibold">{senderName}</span>
                            </div>
                          </div>
                          {isMe && (
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-primary text-white text-xs font-bold">
                                Me
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Type your message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                className="flex-1"
                disabled={selectedChatBooking.status === "completed"}
              />
              <Button
                onClick={handleSendChatMessage}
                disabled={!chatInput.trim() || selectedChatBooking.status === "completed"}
                className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {selectedChatBooking.status === "completed" && (
              <div className="text-xs text-muted-foreground mt-2 text-center">
                Chat closed for completed appointments.
              </div>
            )}
          </div>
        </div>
      )}
      {/* Time slots with availability or "Available slot" */}
      <div className="space-y-2">
        {timeSlots.map((time) => {
          const availability = slotsForDate.find(slot => slot.start_time === time);
          return (
            <div key={time} className="flex items-center gap-3 min-h-[60px] p-2 border-b border-gray-100">
              <div className="w-16 text-sm font-medium text-muted-foreground">
                {time}
              </div>
              <div className="flex-1">
                {availability ? (
                  <Card className="border-l-4 border-l-green-500 bg-green-50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Available: {availability.start_time} - {availability.end_time}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                            onClick={() => openEditSlotDialog(availability)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600"
                            onClick={() => handleDeleteSlot(availability)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="h-12 border border-dashed border-gray-200 rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                    Available slot
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* Availability Dialog */}
      {showAvailabilityDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">{editingSlot ? "Edit Availability" : "Add Availability"}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <Select
                  value={slotForm.start_time}
                  onValueChange={v => setSlotForm(f => ({ ...f, start_time: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <Select
                  value={slotForm.end_time}
                  onValueChange={v => setSlotForm(f => ({ ...f, end_time: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select end time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Recurring Weekly?</label>
                <Select
                  value={slotForm.is_recurring ? "yes" : "no"}
                  onValueChange={v => setSlotForm(f => ({ ...f, is_recurring: v === "yes" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No (One-off)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Day of week selector for recurring slots */}
              {slotForm.is_recurring && (
                <div>
                  <label className="block text-sm font-medium mb-1">Day of Week</label>
                  <Select
                    value={slotForm.day_of_week}
                    onValueChange={v => setSlotForm(f => ({ ...f, day_of_week: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                      <SelectItem value="0">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* Date picker for one-off slots */}
              {!slotForm.is_recurring && (
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <Input
                    type="date"
                    value={slotForm.date}
                    onChange={e => setSlotForm(f => ({ ...f, date: e.target.value }))}
                    min={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowAvailabilityDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveSlot}
                disabled={
                  loading ||
                  !slotForm.start_time ||
                  !slotForm.end_time ||
                  (slotForm.is_recurring && slotForm.day_of_week === "") ||
                  (!slotForm.is_recurring && !slotForm.date)
                }
              >
                {loading ? "Saving..." : editingSlot ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCalendarView = () => (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && setSelectedDate(date)}
        className="rounded-md border"
      />
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h3>
        {slotsForDate.length === 0 && (
          <div className="text-muted-foreground">No availability slots for this day.</div>
        )}
        {slotsForDate.map(slot => (
          <Card key={slot.id} className="border-l-4 border-l-green-500 bg-green-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  {slot.start_time} - {slot.end_time} {slot.is_recurring ? "(Recurring)" : ""}
                </span>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                  onClick={() => openEditSlotDialog(slot)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600"
                  onClick={() => handleDeleteSlot(slot)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue-light to-white pb-24">
      {/* Header */}
      <div className="bg-white shadow-card p-4 sm:p-6 pt-12 sm:pt-16">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-foreground mb-2">
              My Schedule
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant={timeRange === 'today' ? 'default' : 'outline'}
              onClick={() => setTimeRange('today')}
            >
              Today
            </Button>
            <Button 
              size="sm" 
              variant={timeRange === 'week' ? 'default' : 'outline'}
              onClick={() => setTimeRange('week')}
            >
              Week
            </Button>
            <Button 
              size="sm" 
              variant={timeRange === 'month' ? 'default' : 'outline'}
              onClick={() => setTimeRange('month')}
            >
              Month
            </Button>
          </div>
        </div>
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button className="bg-medical-green hover:bg-medical-green/90" onClick={openAddSlotDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Availability
          </Button>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
            <Button 
              size="sm" 
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              onClick={() => setViewMode('calendar')}
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              Calendar
            </Button>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        {/* Notifications */}
        {pendingCount > 0 && (
          <Card className="mb-4 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-orange-800">
                    {pendingCount} Pending Request{pendingCount > 1 ? 's' : ''} – Respond Now
                  </span>
                </div>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  Review
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Search by patient name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {BOOKING_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        {/* Main Content */}
        {viewMode === 'list' ? renderListView() : renderCalendarView()}
      </div>
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-premium p-3 sm:p-4">
        <div className="flex justify-around max-w-md mx-auto">
          {navigationItems.map((item) => (
            <div 
              key={item.id} 
              className="flex flex-col items-center gap-1 cursor-pointer min-w-0 flex-1 py-1"
              onClick={() => {
                setActiveTab(item.id);
                if (item.id === 'home') {
                  navigate('/provider-dashboard');
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

export default ProviderSchedulePage;