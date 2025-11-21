import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Search,
  Eye,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Users,
  Ban
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Booking {
  id: string;
  patient_id: string;
  provider_id: string;
  date_time: string;
  mode: string;
  status: string;
  consent_granted: boolean;
  price_snapshot: number;
  payment_status: string;
  created_at: string;
  updated_at: string;
  reason: string;
}

interface BookingWithDetails extends Booking {
  patient_name?: string;
  patient_email?: string;
  patient_phone?: string;
  provider_name?: string;
  provider_email?: string;
  provider_specialty?: string;
}

const AdminBookingsPage = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [disputeNotes, setDisputeNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");

  // Analytics state
  const [analytics, setAnalytics] = useState({
    total: 0,
    completed: 0,
    cancelled: 0,
    pending: 0,
    confirmed: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
    calculateAnalytics();
  }, [searchQuery, statusFilter, paymentFilter, dateFilter, bookings]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // Fetch all bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .order("date_time", { ascending: false });

      if (bookingsError) throw bookingsError;

      // Fetch patient and provider details for each booking
      const bookingsWithDetails = await Promise.all(
        (bookingsData || []).map(async (booking) => {
          // Fetch patient details
          const { data: patientData } = await supabase
            .from("patient_profiles")
            .select("name, phone")
            .eq("id", booking.patient_id)
            .single();

          const { data: patientAuth } = await supabase.auth.admin.getUserById(
            booking.patient_id
          );

          // Fetch provider details
          const { data: providerData } = await supabase
            .from("provider_profiles")
            .select("name, specialty")
            .eq("id", booking.provider_id)
            .single();

          const { data: providerAuth } = await supabase.auth.admin.getUserById(
            booking.provider_id
          );

          return {
            ...booking,
            patient_name: patientData?.name || "Unknown Patient",
            patient_email: patientAuth?.user?.email || "N/A",
            patient_phone: patientData?.phone || "N/A",
            provider_name: providerData?.name || "Unknown Provider",
            provider_email: providerAuth?.user?.email || "N/A",
            provider_specialty: providerData?.specialty || "N/A",
          };
        })
      );

      setBookings(bookingsWithDetails);
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (b) =>
          b.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.provider_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    // Filter by payment status
    if (paymentFilter !== "all") {
      filtered = filtered.filter((b) => b.payment_status === paymentFilter);
    }

    // Filter by date
    if (dateFilter) {
      const filterDate = new Date(dateFilter).toDateString();
      filtered = filtered.filter(
        (b) => new Date(b.date_time).toDateString() === filterDate
      );
    }

    setFilteredBookings(filtered);
  };

  const calculateAnalytics = () => {
    const total = bookings.length;
    const completed = bookings.filter((b) => b.status === "completed").length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;
    const pending = bookings.filter((b) => b.status === "requested" || b.status === "pending_provider").length;
    const confirmed = bookings.filter((b) => b.status === "confirmed").length;
    const totalRevenue = bookings
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + (b.price_snapshot || 0), 0);

    setAnalytics({
      total,
      completed,
      cancelled,
      pending,
      confirmed,
      totalRevenue,
    });
  };

  const handleViewDetails = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setNewStatus(booking.status);
    setDisputeNotes("");
    setDetailsOpen(true);
  };

  const handleStatusOverride = async () => {
    if (!selectedBooking || !newStatus) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedBooking.id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Booking status changed to ${newStatus}`,
      });

      setDetailsOpen(false);
      fetchBookings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportBookings = () => {
    const csvData = filteredBookings.map((booking) => ({
      "Booking ID": booking.id,
      "Patient Name": booking.patient_name,
      "Patient Email": booking.patient_email,
      "Provider Name": booking.provider_name,
      "Provider Specialty": booking.provider_specialty,
      "Date & Time": new Date(booking.date_time).toLocaleString(),
      Mode: booking.mode,
      Status: booking.status,
      "Payment Status": booking.payment_status,
      Amount: booking.price_snapshot || 0,
      Reason: booking.reason || "N/A",
      "Created At": new Date(booking.created_at).toLocaleString(),
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) =>
        Object.values(row)
          .map((val) => `"${val}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    toast({
      title: "Export Successful",
      description: "Booking data has been exported to CSV.",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      completed: { variant: "default", icon: CheckCircle },
      cancelled: { variant: "destructive", icon: XCircle },
      confirmed: { variant: "default", icon: CheckCircle },
      requested: { variant: "secondary", icon: Clock },
      pending_provider: { variant: "secondary", icon: Clock },
      in_progress: { variant: "default", icon: Clock },
    };

    const config = variants[status] || { variant: "outline", icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="capitalize">
        <Icon className="w-3 h-3 mr-1" />
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getPaymentBadge = (paymentStatus: string) => {
    const variants: Record<string, any> = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      refunded: "outline",
    };

    return (
      <Badge variant={variants[paymentStatus] || "outline"} className="capitalize text-xs">
        {paymentStatus}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bookings Management</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all consultation bookings
          </p>
        </div>
        <Button variant="outline" onClick={handleExportBookings}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold mt-1">{analytics.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {analytics.completed}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold mt-1 text-yellow-600">
                  {analytics.pending}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold mt-1 text-red-600">
                  {analytics.cancelled}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">
                  ₦{analytics.totalRevenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient, provider, or booking ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="requested">Requested</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <DollarSign className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              placeholder="Filter by date"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No bookings found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" || paymentFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No bookings in the system yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-blue-600 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {new Date(booking.date_time).toLocaleString()}
                          </h3>
                          {getStatusBadge(booking.status)}
                          {getPaymentBadge(booking.payment_status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Patient:</span>
                            <span className="ml-2 font-medium">
                              {booking.patient_name}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Provider:</span>
                            <span className="ml-2 font-medium">
                              {booking.provider_name}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Mode:</span>
                            <span className="ml-2 font-medium capitalize">
                              {booking.mode}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Amount:</span>
                            <span className="ml-2 font-medium">
                              ₦{booking.price_snapshot?.toLocaleString() || 0}
                            </span>
                          </div>
                        </div>

                        {booking.reason && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <span className="font-medium">Reason:</span> {booking.reason}
                          </p>
                        )}

                        <p className="text-xs text-muted-foreground mt-2">
                          Booking ID: {booking.id.slice(0, 8)}... • Created:{" "}
                          {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(booking)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details & Management</DialogTitle>
            <DialogDescription>
              View details, override status, and manage disputes
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6">
              {/* Booking Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Booking Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Booking ID</Label>
                    <p className="font-medium">{selectedBooking.id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date & Time</Label>
                    <p className="font-medium">
                      {new Date(selectedBooking.date_time).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Consultation Mode</Label>
                    <p className="font-medium capitalize">{selectedBooking.mode}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Payment Status</Label>
                    <div className="mt-1">
                      {getPaymentBadge(selectedBooking.payment_status)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Amount</Label>
                    <p className="font-medium">
                      ₦{selectedBooking.price_snapshot?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Consent Granted</Label>
                    <p className="font-medium">
                      {selectedBooking.consent_granted ? "Yes" : "No"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p className="font-medium">
                      {new Date(selectedBooking.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Patient Details */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Patient Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">{selectedBooking.patient_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedBooking.patient_email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{selectedBooking.patient_phone}</p>
                  </div>
                </div>
              </div>

              {/* Provider Details */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Provider Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p className="font-medium">{selectedBooking.provider_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Specialty</Label>
                    <p className="font-medium">{selectedBooking.provider_specialty}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedBooking.provider_email}</p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              {selectedBooking.reason && (
                <div>
                  <Label className="text-muted-foreground">Consultation Reason</Label>
                  <p className="text-sm mt-1 p-3 bg-gray-50 rounded">
                    {selectedBooking.reason}
                  </p>
                </div>
              )}

              {/* Status Override */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Override Booking Status
                </h3>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="requested">Requested</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dispute Management */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Dispute / Complaint Notes
                </h3>
                <Textarea
                  placeholder="Add notes about disputes, complaints, or issues..."
                  value={disputeNotes}
                  onChange={(e) => setDisputeNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDetailsOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusOverride}
              disabled={actionLoading || newStatus === selectedBooking?.status}
            >
              {actionLoading ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBookingsPage;