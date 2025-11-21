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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Wallet,
  Search,
  Eye,
  Filter,
  Download,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Users,
  CreditCard
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Payment {
  id: string;
  booking_id: string;
  patient_id: string;
  provider_id: string;
  amount: number;
  currency: string;
  reference: string;
  status: string;
  escrow_status: string;
  released_at: string;
  created_at: string;
  updated_at: string;
}

interface PaymentWithDetails extends Payment {
  patient_name?: string;
  patient_email?: string;
  provider_name?: string;
  provider_email?: string;
  booking_date?: string;
  booking_mode?: string;
}

interface ProviderPayout {
  provider_id: string;
  provider_name: string;
  provider_email: string;
  total_held: number;
  payment_count: number;
  payments: PaymentWithDetails[];
}

const AdminPaymentsPage = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentWithDetails[]>([]);
  const [providerPayouts, setProviderPayouts] = useState<ProviderPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [escrowFilter, setEscrowFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithDetails | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [refundNotes, setRefundNotes] = useState("");
  const [activeTab, setActiveTab] = useState("all-transactions");

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    platformEarnings: 0,
    escrowHeld: 0,
    escrowReleased: 0,
    refunded: 0,
    pendingPayouts: 0,
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
    calculateAnalytics();
    calculateProviderPayouts();
  }, [searchQuery, statusFilter, escrowFilter, payments]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      // Fetch all payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch related booking, patient, and provider details
      const paymentsWithDetails = await Promise.all(
        (paymentsData || []).map(async (payment) => {
          // Fetch booking details
          const { data: bookingData } = await supabase
            .from("bookings")
            .select("date_time, mode")
            .eq("id", payment.booking_id)
            .single();

          // Fetch patient details
          const { data: patientData } = await supabase
            .from("patient_profiles")
            .select("name")
            .eq("id", payment.patient_id)
            .single();

          const { data: patientAuth } = await supabase.auth.admin.getUserById(
            payment.patient_id
          );

          // Fetch provider details
          const { data: providerData } = await supabase
            .from("provider_profiles")
            .select("name")
            .eq("id", payment.provider_id)
            .single();

          const { data: providerAuth } = await supabase.auth.admin.getUserById(
            payment.provider_id
          );

          return {
            ...payment,
            patient_name: patientData?.name || "Unknown Patient",
            patient_email: patientAuth?.user?.email || "N/A",
            provider_name: providerData?.name || "Unknown Provider",
            provider_email: providerAuth?.user?.email || "N/A",
            booking_date: bookingData?.date_time || null,
            booking_mode: bookingData?.mode || "N/A",
          };
        })
      );

      setPayments(paymentsWithDetails);
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      toast({
        title: "Error",
        description: "Failed to fetch payment data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (p) =>
          p.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.provider_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by payment status
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Filter by escrow status
    if (escrowFilter !== "all") {
      filtered = filtered.filter((p) => p.escrow_status === escrowFilter);
    }

    setFilteredPayments(filtered);
  };

  const calculateAnalytics = () => {
    const totalTransactions = payments.length;
    const totalRevenue = payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // Platform takes 10% commission
    const platformEarnings = totalRevenue * 0.1;
    
    const escrowHeld = payments
      .filter((p) => p.escrow_status === "held")
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const escrowReleased = payments
      .filter((p) => p.escrow_status === "released")
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const refunded = payments
      .filter((p) => p.status === "refunded")
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    const pendingPayouts = payments.filter(
      (p) => p.escrow_status === "held" && p.status === "paid"
    ).length;

    setAnalytics({
      totalTransactions,
      totalRevenue,
      platformEarnings,
      escrowHeld,
      escrowReleased,
      refunded,
      pendingPayouts,
    });
  };

  const calculateProviderPayouts = () => {
    const providerMap = new Map<string, ProviderPayout>();

    payments
      .filter((p) => p.escrow_status === "held" && p.status === "paid")
      .forEach((payment) => {
        if (!providerMap.has(payment.provider_id)) {
          providerMap.set(payment.provider_id, {
            provider_id: payment.provider_id,
            provider_name: payment.provider_name || "Unknown",
            provider_email: payment.provider_email || "N/A",
            total_held: 0,
            payment_count: 0,
            payments: [],
          });
        }

        const payout = providerMap.get(payment.provider_id)!;
        payout.total_held += payment.amount || 0;
        payout.payment_count += 1;
        payout.payments.push(payment);
      });

    setProviderPayouts(Array.from(providerMap.values()));
  };

  const handleViewDetails = (payment: PaymentWithDetails) => {
    setSelectedPayment(payment);
    setRefundNotes("");
    setDetailsOpen(true);
  };

  const handleReleasePayment = async (paymentId: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("payments")
        .update({
          escrow_status: "released",
          released_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      if (error) throw error;

      toast({
        title: "Payment Released",
        description: "Payment has been released to provider.",
      });

      fetchPayments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to release payment",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseProviderPayout = async (providerId: string) => {
    setActionLoading(true);
    try {
      const providerPayments = payments.filter(
        (p) =>
          p.provider_id === providerId &&
          p.escrow_status === "held" &&
          p.status === "paid"
      );

      // Release all held payments for this provider
      const updatePromises = providerPayments.map((payment) =>
        supabase
          .from("payments")
          .update({
            escrow_status: "released",
            released_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.id)
      );

      await Promise.all(updatePromises);

      toast({
        title: "Payout Released",
        description: `All held payments released to provider.`,
      });

      fetchPayments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to release provider payout",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedPayment) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from("payments")
        .update({
          status: "refunded",
          escrow_status: "refunded",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedPayment.id);

      if (error) throw error;

      toast({
        title: "Refund Processed",
        description: "Payment has been refunded successfully.",
      });

      setDetailsOpen(false);
      fetchPayments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to process refund",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportTransactions = () => {
    const csvData = filteredPayments.map((payment) => ({
      "Payment ID": payment.id,
      Reference: payment.reference || "N/A",
      "Patient Name": payment.patient_name,
      "Patient Email": payment.patient_email,
      "Provider Name": payment.provider_name,
      "Provider Email": payment.provider_email,
      Amount: payment.amount,
      Currency: payment.currency,
      Status: payment.status,
      "Escrow Status": payment.escrow_status,
      "Booking Date": payment.booking_date
        ? new Date(payment.booking_date).toLocaleString()
        : "N/A",
      "Payment Date": new Date(payment.created_at).toLocaleString(),
      "Released Date": payment.released_at
        ? new Date(payment.released_at).toLocaleString()
        : "N/A",
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
    a.download = `financial_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    toast({
      title: "Export Successful",
      description: "Financial report has been exported to CSV.",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      paid: { variant: "default", icon: CheckCircle },
      initiated: { variant: "secondary", icon: Clock },
      failed: { variant: "destructive", icon: XCircle },
      refunded: { variant: "outline", icon: RefreshCw },
      settled: { variant: "default", icon: CheckCircle },
    };

    const config = variants[status] || { variant: "outline", icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="capitalize">
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getEscrowBadge = (escrowStatus: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      held: { variant: "secondary", icon: Clock },
      released: { variant: "default", icon: CheckCircle },
      refunded: { variant: "destructive", icon: RefreshCw },
      locked: { variant: "outline", icon: AlertCircle },
    };

    const config = variants[escrowStatus] || {
      variant: "outline",
      icon: AlertCircle,
    };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="capitalize text-xs">
        <Icon className="w-3 h-3 mr-1" />
        {escrowStatus}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payments & Financials</h1>
          <p className="text-muted-foreground mt-1">
            Monitor transactions, manage payouts, and view financial reports
          </p>
        </div>
        <Button variant="outline" onClick={handleExportTransactions}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">
                  ₦{analytics.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {analytics.totalTransactions} transactions
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Platform Earnings (10%)</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">
                  ₦{analytics.platformEarnings.toLocaleString()}
                </p>
              </div>
              <Wallet className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Escrow Held</p>
                <p className="text-2xl font-bold mt-1 text-yellow-600">
                  ₦{analytics.escrowHeld.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.pendingPayouts} pending payouts
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
                <p className="text-xs text-muted-foreground">Refunded</p>
                <p className="text-2xl font-bold mt-1 text-red-600">
                  ₦{analytics.refunded.toLocaleString()}
                </p>
              </div>
              <RefreshCw className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all-transactions">
            All Transactions ({payments.length})
          </TabsTrigger>
          <TabsTrigger value="provider-payouts">
            Provider Payouts ({providerPayouts.length})
          </TabsTrigger>
        </TabsList>

        {/* All Transactions Tab */}
        <TabsContent value="all-transactions" className="mt-6 space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by patient, provider, reference..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="initiated">Initiated</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                    <SelectItem value="settled">Settled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={escrowFilter} onValueChange={setEscrowFilter}>
                  <SelectTrigger>
                    <Wallet className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Escrow status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Escrow</SelectItem>
                    <SelectItem value="held">Held</SelectItem>
                    <SelectItem value="released">Released</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                    <SelectItem value="locked">Locked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredPayments.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No transactions found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== "all" || escrowFilter !== "all"
                      ? "Try adjusting your filters"
                      : "No payment transactions yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredPayments.map((payment) => (
                <Card key={payment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-blue-600" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">
                                ₦{payment.amount?.toLocaleString()} {payment.currency}
                              </h3>
                              {getStatusBadge(payment.status)}
                              {getEscrowBadge(payment.escrow_status)}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Patient:</span>
                                <span className="ml-2 font-medium">
                                  {payment.patient_name}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Provider:</span>
                                <span className="ml-2 font-medium">
                                  {payment.provider_name}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Reference:</span>
                                <span className="ml-2 font-medium">
                                  {payment.reference || "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Booking:</span>
                                <span className="ml-2 font-medium capitalize">
                                  {payment.booking_mode}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-muted-foreground mt-2">
                              Payment Date:{" "}
                              {new Date(payment.created_at).toLocaleString()}
                              {payment.released_at &&
                                ` • Released: ${new Date(
                                  payment.released_at
                                ).toLocaleString()}`}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(payment)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Details
                        </Button>
                        {payment.escrow_status === "held" &&
                          payment.status === "paid" && (
                            <Button
                              size="sm"
                              onClick={() => handleReleasePayment(payment.id)}
                              disabled={actionLoading}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Release
                            </Button>
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Provider Payouts Tab */}
        <TabsContent value="provider-payouts" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Provider Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              {providerPayouts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No pending payouts</h3>
                  <p className="text-muted-foreground">
                    All provider payments have been released
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {providerPayouts.map((payout) => (
                    <Card key={payout.provider_id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold">{payout.provider_name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {payout.provider_email}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <Label className="text-muted-foreground">Total Held</Label>
                                <p className="font-bold text-lg">
                                  ₦{payout.total_held.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">
                                  Payment Count
                                </Label>
                                <p className="font-bold text-lg">
                                  {payout.payment_count}
                                </p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">
                                  Provider Earnings (90%)
                                </Label>
                                <p className="font-bold text-lg text-green-600">
                                  ₦{(payout.total_held * 0.9).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={() =>
                              handleReleaseProviderPayout(payout.provider_id)
                            }
                            disabled={actionLoading}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Release Payout
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              View transaction details and manage refunds
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              {/* Payment Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Payment ID</Label>
                    <p className="font-medium">{selectedPayment.id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Reference</Label>
                    <p className="font-medium">{selectedPayment.reference || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Amount</Label>
                    <p className="font-medium text-lg">
                      ₦{selectedPayment.amount?.toLocaleString()}{" "}
                      {selectedPayment.currency}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Payment Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Escrow Status</Label>
                    <div className="mt-1">
                      {getEscrowBadge(selectedPayment.escrow_status)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Payment Date</Label>
                    <p className="font-medium">
                      {new Date(selectedPayment.created_at).toLocaleString()}
                    </p>
                  </div>
                  {selectedPayment.released_at && (
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Released Date</Label>
                      <p className="font-medium">
                        {new Date(selectedPayment.released_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Patient & Provider Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Patient</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="font-medium">{selectedPayment.patient_name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{selectedPayment.patient_email}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Provider</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="font-medium">{selectedPayment.provider_name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{selectedPayment.provider_email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Revenue Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-medium">
                      ₦{selectedPayment.amount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform Fee (10%):</span>
                    <span className="font-medium text-blue-600">
                      ₦{((selectedPayment.amount || 0) * 0.1).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Provider Earnings (90%):</span>
                    <span className="font-bold text-green-600">
                      ₦{((selectedPayment.amount || 0) * 0.9).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Refund Section */}
              {selectedPayment.status === "paid" &&
                selectedPayment.escrow_status !== "refunded" && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <RefreshCw className="w-5 h-5" />
                      Process Refund
                    </h3>
                    <Textarea
                      placeholder="Add refund notes (reason, dispute details, etc.)..."
                      value={refundNotes}
                      onChange={(e) => setRefundNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {selectedPayment?.status === "paid" &&
              selectedPayment?.escrow_status === "held" && (
                <Button
                  onClick={() =>
                    selectedPayment && handleReleasePayment(selectedPayment.id)
                  }
                  disabled={actionLoading}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Release to Provider
                </Button>
              )}
            {selectedPayment?.status === "paid" &&
              selectedPayment?.escrow_status !== "refunded" && (
                <Button
                  variant="destructive"
                  onClick={handleRefund}
                  disabled={actionLoading}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Process Refund
                </Button>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPaymentsPage;