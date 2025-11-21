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
  Users,
  Search,
  Eye,
  Ban,
  CheckCircle,
  Filter,
  Download,
  Calendar,
  UserCog,
  Activity
} from "lucide-react";
import { Label } from "@/components/ui/label";

interface Patient {
  id: string;
  health_id: string;
  date_of_birth: string;
  gender: string;
  allergies: string;
  conditions: string;
  lifestyle_notes: string;
  insurance_info: any;
  address: string;
  image_path: string;
  emergency_contact: any;
  name: string;
  phone: string;
  status: string;
  blood_type: string;
  current_medication: any;
  created_at: string;
  email?: string;
}

interface Provider {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  status: string;
  years_experience: number;
  base_fee: number;
  created_at: string;
  email?: string;
}

interface Booking {
  id: string;
  patient_id: string;
  provider_id: string;
  date_time: string;
  mode: string;
  status: string;
  reason: string;
  payment_status: string;
  price_snapshot: number;
}

type User = Patient | Provider;

const AdminUserManagementPage = () => {
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "patient" | "provider">("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserBookings, setSelectedUserBookings] = useState<Booking[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("patients");

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, roleFilter, statusFilter, patients, providers, activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch patients
      const { data: patientsData, error: patientsError } = await supabase
        .from("patient_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (patientsError) throw patientsError;

      // Fetch providers
      const { data: providersData, error: providersError } = await supabase
        .from("provider_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (providersError) throw providersError;

      // Fetch emails from auth.users
      const patientsWithEmail = await Promise.all(
        (patientsData || []).map(async (patient) => {
          const { data: userData } = await supabase.auth.admin.getUserById(patient.id);
          return {
            ...patient,
            email: userData?.user?.email || "N/A",
          };
        })
      );

      const providersWithEmail = await Promise.all(
        (providersData || []).map(async (provider) => {
          const { data: userData } = await supabase.auth.admin.getUserById(provider.id);
          return {
            ...provider,
            email: userData?.user?.email || "N/A",
          };
        })
      );

      setPatients(patientsWithEmail);
      setProviders(providersWithEmail);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBookings = async (userId: string, role: "patient" | "provider") => {
    try {
      let query = supabase
        .from("bookings")
        .select("*")
        .order("date_time", { ascending: false });

      if (role === "patient") {
        query = query.eq("patient_id", userId);
      } else {
        query = query.eq("provider_id", userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSelectedUserBookings(data || []);
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch user bookings",
        variant: "destructive",
      });
    }
  };

  const filterUsers = () => {
    let allUsers: User[] = [];

    if (activeTab === "patients") {
      allUsers = patients;
    } else if (activeTab === "providers") {
      allUsers = providers;
    } else {
      allUsers = [...patients, ...providers];
    }

    let filtered = [...allUsers];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.phone?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((u) => u.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleViewDetails = async (user: User) => {
    setSelectedUser(user);
    const isPatient = "health_id" in user;
    await fetchUserBookings(user.id, isPatient ? "patient" : "provider");
    setDetailsOpen(true);
  };

  const handleSuspend = async () => {
    if (!selectedUser) return;
    setActionLoading(true);

    try {
      const isPatient = "health_id" in selectedUser;
      const table = isPatient ? "patient_profiles" : "provider_profiles";

      const { error } = await supabase
        .from(table)
        .update({ status: "suspended" })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast({
        title: "User Suspended",
        description: `${selectedUser.name} has been suspended.`,
      });

      setDetailsOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to suspend user",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!selectedUser) return;
    setActionLoading(true);

    try {
      const isPatient = "health_id" in selectedUser;
      const table = isPatient ? "patient_profiles" : "provider_profiles";

      const { error } = await supabase
        .from(table)
        .update({ status: "active" })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast({
        title: "User Activated",
        description: `${selectedUser.name} has been activated.`,
      });

      setDetailsOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to activate user",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportUsers = () => {
    const csvData = filteredUsers.map((user) => ({
      Name: user.name,
      Email: user.email,
      Phone: user.phone,
      Status: user.status,
      Type: "health_id" in user ? "Patient" : "Provider",
      Created: new Date(user.created_at).toLocaleDateString(),
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    toast({
      title: "Export Successful",
      description: "User data has been exported to CSV.",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: "default",
      suspended: "destructive",
      pending: "secondary",
      verified: "default",
    };

    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    );
  };

  const getBookingStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: "default",
      cancelled: "destructive",
      requested: "secondary",
      confirmed: "default",
    };

    return (
      <Badge variant={variants[status] || "outline"} className="capitalize text-xs">
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage patients and providers on the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-4 py-2">
            Patients: {patients.length}
          </Badge>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            Providers: {providers.length}
          </Badge>
          <Button variant="outline" onClick={handleExportUsers}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="patients">Patients ({patients.length})</TabsTrigger>
          <TabsTrigger value="providers">Providers ({providers.length})</TabsTrigger>
          <TabsTrigger value="all">All Users ({patients.length + providers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Users List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredUsers.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No users found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== "all"
                      ? "Try adjusting your filters"
                      : "No users in this category yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredUsers.map((user) => {
                const isPatient = "health_id" in user;
                return (
                  <Card key={user.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {isPatient && (user as Patient).image_path ? (
                              <img
                                src={(user as Patient).image_path}
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Users className="w-6 h-6 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{user.name}</h3>
                              {getStatusBadge(user.status)}
                              <Badge variant="outline" className="text-xs">
                                {isPatient ? "Patient" : "Provider"}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span>📧 {user.email}</span>
                              <span>📞 {user.phone}</span>
                              {isPatient && (user as Patient).health_id && (
                                <span>🆔 {(user as Patient).health_id}</span>
                              )}
                              {!isPatient && (user as Provider).specialty && (
                                <span>🏥 {(user as Provider).specialty}</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Joined: {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(user)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* User Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details & Activity</DialogTitle>
            <DialogDescription>
              View user information and booking history
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Full Name</Label>
                    <p className="font-medium">{selectedUser.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">{selectedUser.phone}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">User Type</Label>
                    <p className="font-medium">
                      {"health_id" in selectedUser ? "Patient" : "Provider"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Joined</Label>
                    <p className="font-medium">
                      {new Date(selectedUser.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Patient-specific info */}
              {"health_id" in selectedUser && (
                <div>
                  <h3 className="font-semibold mb-3">Patient Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Health ID</Label>
                      <p className="font-medium">
                        {(selectedUser as Patient).health_id || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Blood Type</Label>
                      <p className="font-medium">
                        {(selectedUser as Patient).blood_type || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Date of Birth</Label>
                      <p className="font-medium">
                        {(selectedUser as Patient).date_of_birth
                          ? new Date((selectedUser as Patient).date_of_birth).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Gender</Label>
                      <p className="font-medium capitalize">
                        {(selectedUser as Patient).gender || "N/A"}
                      </p>
                    </div>
                    {(selectedUser as Patient).address && (
                      <div className="col-span-2">
                        <Label className="text-muted-foreground">Address</Label>
                        <p className="font-medium">{(selectedUser as Patient).address}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Provider-specific info */}
              {"specialty" in selectedUser && (
                <div>
                  <h3 className="font-semibold mb-3">Provider Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Specialty</Label>
                      <p className="font-medium">
                        {(selectedUser as Provider).specialty || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Experience</Label>
                      <p className="font-medium">
                        {(selectedUser as Provider).years_experience || 0} years
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Base Fee</Label>
                      <p className="font-medium">
                        ₦{(selectedUser as Provider).base_fee?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking History */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Booking History ({selectedUserBookings.length})
                </h3>
                {selectedUserBookings.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg bg-gray-50">
                    <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No booking history</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedUserBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">
                              {new Date(booking.date_time).toLocaleString()}
                            </span>
                            {getBookingStatusBadge(booking.status)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Mode: {booking.mode} • Reason: {booking.reason || "N/A"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Payment: {booking.payment_status} • Amount: ₦
                            {booking.price_snapshot?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {selectedUser?.status === "suspended" ? (
              <Button onClick={handleActivate} disabled={actionLoading}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Activate User
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleSuspend}
                disabled={actionLoading}
              >
                <Ban className="w-4 h-4 mr-2" />
                Suspend User
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagementPage;