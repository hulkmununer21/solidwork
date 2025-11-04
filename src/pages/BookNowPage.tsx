import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Home, Calendar, MessageCircle, User, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Helper: generate time slots in hh:mm format between start and end time
function generateTimeSlots(start: string, end: string, interval = 30) {
    const slots: string[] = [];
    let [startH, startM] = start.split(":").map(Number);
    let [endH, endM] = end.split(":").map(Number);
    let startMinutes = startH * 60 + startM;
    let endMinutes = endH * 60 + endM;
    for (let mins = startMinutes; mins < endMinutes; mins += interval) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    }
    return slots;
}

const BookNowPage = () => {
    const navigate = useNavigate();
    const [providers, setProviders] = useState<any[]>([]);
    const [providerAvailability, setProviderAvailability] = useState<{ [providerId: string]: any[] }>({});
    const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal state for booking
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [reason, setReason] = useState("");
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingError, setBookingError] = useState("");

    // Get logged-in patient id
    const [patientId, setPatientId] = useState<string | null>(null);
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setPatientId(data.user?.id || null);
        });
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: providersData } = await supabase
                .from("provider_profiles")
                .select("*");
            setProviders(providersData || []);
            // Fetch all availabilities for all providers
            const { data: availData } = await supabase
                .from("provider_availability")
                .select("*")
                .eq("is_active", true);
            // Group by provider_id
            const grouped: { [providerId: string]: any[] } = {};
            (availData || []).forEach((slot) => {
                if (!grouped[slot.provider_id]) grouped[slot.provider_id] = [];
                grouped[slot.provider_id].push(slot);
            });
            setProviderAvailability(grouped);
            setLoading(false);
        };
        fetchData();
    }, []);

    // Helper to display consultation mode from JSON
    const renderConsultationMode = (mode: any) => {
        if (!mode || typeof mode !== "object") return "N/A";
        return [
            mode.virtual ? "Virtual" : null,
            mode.inPerson ? "In Person" : null
        ].filter(Boolean).join(", ") || "N/A";
    };

    // Helper to render availability
    const renderAvailability = (slots: any[]) => {
        if (!slots || slots.length === 0) return <span className="text-muted-foreground text-xs">No availability set.</span>;
        const recurring = slots.filter(s => s.is_recurring);
        const oneOff = slots.filter(s => !s.is_recurring);
        return (
            <div className="space-y-2 mt-2">
                {recurring.length > 0 && (
                    <div>
                        <span className="font-semibold text-xs text-medical-blue">Weekly Availability:</span>
                        <ul className="ml-3 mt-1 text-xs">
                            {recurring.map((slot, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-medical-blue" />
                                    {dayNames[slot.day_of_week]}: {slot.start_time} - {slot.end_time}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {oneOff.length > 0 && (
                    <div>
                        <span className="font-semibold text-xs text-medical-green">One-off Availability:</span>
                        <ul className="ml-3 mt-1 text-xs">
                            {oneOff.map((slot, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-medical-green" />
                                    {slot.date}: {slot.start_time} - {slot.end_time}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    // Get available dates for provider (from recurring and one-off slots)
    const getAvailableDates = (slots: any[]) => {
        const today = new Date();
        const dates: string[] = [];
        // One-off slots
        slots.filter(s => !s.is_recurring && s.date).forEach(s => {
            dates.push(s.date);
        });
        // Recurring slots (next 14 days)
        for (let i = 0; i < 14; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const dow = d.getDay();
            if (slots.some(s => s.is_recurring && s.day_of_week === dow)) {
                dates.push(d.toISOString().slice(0, 10));
            }
        }
        // Remove duplicates
        return Array.from(new Set(dates)).sort();
    };

    // Get available times for selected date (returns array of hh:mm slots)
    const getAvailableTimes = (slots: any[], date: string) => {
        const d = new Date(date);
        const dow = d.getDay();
        // One-off slots for this date
        const oneOff = slots.filter(s => !s.is_recurring && s.date === date);
        // Recurring slots for this day of week
        const recurring = slots.filter(s => s.is_recurring && s.day_of_week === dow);
        const allSlots = [...oneOff, ...recurring];
        let timeSlots: string[] = [];
        allSlots.forEach(s => {
            timeSlots = timeSlots.concat(generateTimeSlots(s.start_time, s.end_time));
        });
        // Remove duplicates and sort
        return Array.from(new Set(timeSlots)).sort();
    };

    // Handle booking
    const handleBookAppointment = async () => {
        setBookingLoading(true);
        setBookingError("");
        setBookingSuccess(false);
        if (!patientId || !selectedProvider || !selectedDate || !selectedTime) {
            setBookingError("Please fill all fields.");
            setBookingLoading(false);
            return;
        }
        const price_snapshot = selectedProvider.base_fee || 0;
        const date_time = `${selectedDate}T${selectedTime}:00`; // e.g. 2025-11-03T10:30:00
        const mode = selectedProvider.consultation_mode?.virtual ? "virtual" : "in_person";
        const { error } = await supabase
            .from("bookings")
            .insert([{
                patient_id: patientId,
                provider_id: selectedProvider.id,
                date_time,
                mode,
                status: "requested",
                consent_granted: false,
                price_snapshot,
                payment_status: "pending",
                reason
            }]);
        if (error) {
            setBookingError("Booking failed. Please try again.");
        } else {
            setBookingSuccess(true);
        }
        setBookingLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-subtle pb-20">
            {/* Header */}
            <div className="gradient-hero text-white p-6 rounded-b-3xl shadow-premium">
                <h1 className="text-2xl font-bold font-display">Book Appointment</h1>
                <p className="text-white/90 text-sm font-body">
                    Choose a provider to start your booking
                </p>
            </div>

            <div className="py-8 px-2">
                <h2 className="text-xl font-semibold mb-6 text-center">
                    Select a Provider
                </h2>
                {loading && (
                    <div className="text-center text-muted-foreground py-20">
                        Loading providers...
                    </div>
                )}
                {!loading && providers.length === 0 && (
                    <div className="text-center text-muted-foreground py-20">
                        No providers available.
                    </div>
                )}
                <div className="flex flex-col gap-6">
                    {providers.map((provider) => (
                        <Card
                            key={provider.id}
                            className="p-6 shadow-card w-full max-w-none mx-auto"
                            style={{ minHeight: "40vh" }}
                        >
                            <div className="flex flex-col gap-2 h-full justify-between">
                                <div>
                                    {/* Basic Details */}
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-semibold text-lg">
                                                {provider.title ? `${provider.title} ` : ""}{provider.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {provider.specialty}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {renderConsultationMode(provider.consultation_mode)}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <span className="text-xs text-muted-foreground">
                                                Experience:
                                            </span>
                                            <div className="text-sm">
                                                {provider.years_experience
                                                    ? `${provider.years_experience} years`
                                                    : "N/A"}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground">
                                                Fee:
                                            </span>
                                            <div className="text-sm">
                                                {provider.base_fee
                                                    ? `₦${provider.base_fee}`
                                                    : "N/A"}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground">
                                                Languages:
                                            </span>
                                            <div className="text-sm">
                                                {provider.languages}
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-2 w-fit"
                                        onClick={() =>
                                            setExpandedProviderId((prev) =>
                                                prev === provider.id ? null : provider.id
                                            )
                                        }
                                    >
                                        {expandedProviderId === provider.id ? (
                                            <>
                                                <ChevronUp className="w-4 h-4 mr-1" />
                                                Show Less
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="w-4 h-4 mr-1" />
                                                Show More
                                            </>
                                        )}
                                    </Button>
                                    {expandedProviderId === provider.id && (
                                        <div className="mt-3 border-t pt-3 space-y-2 animate-fade-in">
                                            <div>
                                                <span className="text-xs text-muted-foreground">
                                                    Bio:
                                                </span>
                                                <div className="text-sm">
                                                    {provider.bio || "No bio available."}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-xs text-muted-foreground">
                                                    Availability:
                                                </span>
                                                {renderAvailability(providerAvailability[provider.id])}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    className="mt-4 w-full"
                                    onClick={() => {
                                        setSelectedProvider(provider);
                                        setShowBookingModal(true);
                                        setSelectedDate("");
                                        setSelectedTime("");
                                        setReason("");
                                        setBookingSuccess(false);
                                        setBookingError("");
                                    }}
                                >
                                    Book Appointment
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Booking Modal */}
            <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
                <DialogContent className="max-w-md rounded-xl shadow-lg border bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            Book Appointment
                        </DialogTitle>
                    </DialogHeader>
                    {selectedProvider && (
                        <div className="space-y-4 py-2">
                            <div>
                                <h3 className="font-semibold text-base mb-1">{selectedProvider.title ? `${selectedProvider.title} ` : ""}{selectedProvider.name}</h3>
                                <div className="text-xs text-muted-foreground mb-1">{selectedProvider.specialty}</div>
                                <div className="flex gap-2 text-xs mb-1">
                                    <Badge variant="outline">{renderConsultationMode(selectedProvider.consultation_mode)}</Badge>
                                    <span>Fee: <b>₦{selectedProvider.base_fee}</b></span>
                                </div>
                                <div className="text-xs text-muted-foreground mb-1">
                                    Experience: {selectedProvider.years_experience} years
                                </div>
                                <div className="text-xs text-muted-foreground mb-1">
                                    Languages: {selectedProvider.languages}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Select Date</label>
                                <Select value={selectedDate} onValueChange={setSelectedDate}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose date" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {getAvailableDates(providerAvailability[selectedProvider.id] || []).map(date => (
                                            <SelectItem key={date} value={date}>{date}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {selectedDate && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Select Time</label>
                                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getAvailableTimes(providerAvailability[selectedProvider.id] || [], selectedDate).map((time, idx) => (
                                                <SelectItem key={idx} value={time}>
                                                    {time}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium mb-1">Reason for Appointment</label>
                                <Input
                                    type="text"
                                    placeholder="Describe your reason"
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                />
                            </div>
                            {bookingError && (
                                <div className="text-red-600 text-xs">{bookingError}</div>
                            )}
                            {bookingSuccess && (
                                <div className="text-green-600 text-xs">Booking successful!</div>
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
                            disabled={bookingLoading || !selectedDate || !selectedTime}
                            onClick={handleBookAppointment}
                        >
                            {bookingLoading ? "Booking..." : "Confirm Booking"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-premium">
                <div className="flex justify-around py-3">
                    {[
                        { icon: Home, label: "Home", route: "/dashboard" },
                        { icon: Calendar, label: "Bookings", route: "/bookings" },
                        { icon: MessageCircle, label: "Messages", route: "/messages" },
                        { icon: User, label: "Profile", route: "/profile" },
                    ].map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={index}
                                onClick={() => navigate(item.route)}
                                className="flex flex-col items-center py-2 px-4 transition-colors text-muted-foreground hover:text-foreground"
                            >
                                {Icon && <Icon className="w-6 h-6 mb-1" />}
                                <span className="text-xs font-body">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BookNowPage;