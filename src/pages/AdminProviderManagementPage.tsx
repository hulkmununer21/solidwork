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
  UserCog,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Ban,
  FileText,
  Download,
  Filter,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Globe,
  Award,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Provider {
  id: string;
  specialty: string;
  bio: string;
  years_experience: number;
  languages: string;
  base_fee: number;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  title: string;
  profile_image: string | null;
  duration: number;
  name: string;
  phone: string;
  available: string;
  consultation_mode: any;
  status: string;
}

interface Document {
  id: string;
  provider_id: string;
  type: string;
  file_url: string;
  status: string;
  uploaded_at: string;
  reviewed_at: string | null;
  reviewed_by?: string | null;
  rejection_reason?: string | null;
  updated_at?: string;
}

interface ProviderWithAuth extends Provider {
  email?: string;
}

const AdminProviderManagementPage = () => {
  const { toast } = useToast();
  const [providers, setProviders] = useState<ProviderWithAuth[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<ProviderWithAuth[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProvider, setSelectedProvider] = useState<ProviderWithAuth | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedDocForReject, setSelectedDocForReject] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    filterProviders();
  }, [searchQuery, statusFilter, providers]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const { data: providersData, error: providersError } = await supabase
        .from("provider_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (providersError) throw providersError;

      // Fetch email from auth.users for each provider
      const providersWithEmail = await Promise.all(
        (providersData || []).map(async (provider) => {
          const { data: userData } = await supabase.auth.admin.getUserById(provider.id);
          return {
            ...provider,
            email: userData?.user?.email || "N/A"
          };
        })
      );

      setProviders(providersWithEmail);
    } catch (error: any) {
      console.error("Error fetching providers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch providers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderDocuments = async (providerId: string) => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("provider_id", providerId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setSelectedDocuments(data || []);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "Failed to fetch provider documents",
        variant: "destructive",
      });
    }
  };

  const filterProviders = () => {
    let filtered = [...providers];

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.phone?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    setFilteredProviders(filtered);
  };

  const handleViewDetails = async (provider: ProviderWithAuth) => {
    setSelectedProvider(provider);
    setVerificationNotes("");
    await fetchProviderDocuments(provider.id);
    setDetailsOpen(true);
  };

  const handleApproveDocument = async (documentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("documents")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", documentId);

      if (error) throw error;

      toast({
        title: "Document Approved",
        description: "Document has been approved successfully.",
      });

      if (selectedProvider) {
        await fetchProviderDocuments(selectedProvider.id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to approve document",
        variant: "destructive",
      });
    }
  };

  const handleRejectDocument = async () => {
    if (!selectedDocForReject) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("documents")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          rejection_reason: rejectionReason || "Document does not meet requirements",
        })
        .eq("id", selectedDocForReject);

      if (error) throw error;

      toast({
        title: "Document Rejected",
        description: "Document has been rejected with reason provided.",
      });

      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedDocForReject(null);

      if (selectedProvider) {
        await fetchProviderDocuments(selectedProvider.id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to reject document",
        variant: "destructive",
      });
    }
  };

  const handleApproveProvider = async () => {
    if (!selectedProvider) return;
    setActionLoading(true);

    try {
      // Check if all documents are approved
      const pendingDocs = selectedDocuments.filter(
        (doc) => doc.status === "pending" || doc.status === "rejected"
      );

      if (pendingDocs.length > 0) {
        toast({
          title: "Cannot Approve",
          description: "Please review all documents before approving the provider.",
          variant: "destructive",
        });
        setActionLoading(false);
        return;
      }

      const { error } = await supabase
        .from("provider_profiles")
        .update({
          status: "verified",
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedProvider.id);

      if (error) throw error;

      toast({
        title: "Provider Approved",
        description: `${selectedProvider.name} has been verified successfully.`,
      });

      setDetailsOpen(false);
      fetchProviders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to approve provider",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectProvider = async () => {
    if (!selectedProvider) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from("provider_profiles")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedProvider.id);

      if (error) throw error;

      toast({
        title: "Provider Rejected",
        description: `${selectedProvider.name}'s application has been rejected.`,
      });

      setDetailsOpen(false);
      fetchProviders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to reject provider",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!selectedProvider) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from("provider_profiles")
        .update({
          status: "suspended",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedProvider.id);

      if (error) throw error;

      toast({
        title: "Provider Suspended",
        description: `${selectedProvider.name} has been suspended.`,
      });

      setDetailsOpen(false);
      fetchProviders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to suspend provider",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!selectedProvider) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from("provider_profiles")
        .update({
          status: "verified",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedProvider.id);

      if (error) throw error;

      toast({
        title: "Provider Activated",
        description: `${selectedProvider.name} has been activated.`,
      });

      setDetailsOpen(false);
      fetchProviders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to activate provider",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; color: string }> = {
      verified: { variant: "default", icon: CheckCircle, color: "text-green-600" },
      pending: { variant: "secondary", icon: Clock, color: "text-yellow-600" },
      rejected: { variant: "destructive", icon: XCircle, color: "text-red-600" },
      suspended: { variant: "outline", icon: Ban, color: "text-gray-600" },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="capitalize">
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getDocumentStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      approved: { variant: "default", icon: CheckCircle },
      pending: { variant: "secondary", icon: Clock },
      rejected: { variant: "destructive", icon: XCircle },
      under_review: { variant: "outline", icon: Eye },
      expired: { variant: "destructive", icon: AlertCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="capitalize text-xs">
        <Icon className="w-3 h-3 mr-1" />
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getDocumentTypeName = (type: string) => {
    const typeNames: Record<string, string> = {
      medical_license: "Medical License",
      professional_certificate: "Professional Certificate",
      identity_document: "Identity Document",
      proof_of_address: "Proof of Address",
      tax_certificate: "Tax Certificate",
      insurance_certificate: "Insurance Certificate",
      specialty_certificate: "Specialty Certificate",
      cv_resume: "CV/Resume",
      other: "Other Document",
    };
    return typeNames[type] || type.replace(/_/g, " ");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Provider Management</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage healthcare provider applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-base px-3 py-1.5">
            <UserCog className="w-4 h-4 mr-1" />
            Total: {providers.length}
          </Badge>
          <Badge variant="secondary" className="text-base px-3 py-1.5">
            <Clock className="w-4 h-4 mr-1" />
            Pending: {providers.filter((p) => p.status === "pending").length}
          </Badge>
          <Badge className="text-base px-3 py-1.5">
            <CheckCircle className="w-4 h-4 mr-1" />
            Verified: {providers.filter((p) => p.status === "verified").length}
          </Badge>
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
                  placeholder="Search by name, email, specialty, or phone..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Providers List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredProviders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <UserCog className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No providers found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No provider applications yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredProviders.map((provider) => (
            <Card key={provider.id} className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {provider.profile_image ? (
                        <img
                          src={provider.profile_image}
                          alt={provider.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserCog className="w-8 h-8 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-lg">
                          {provider.title} {provider.name}
                        </h3>
                        {getStatusBadge(provider.status)}
                        {provider.verified_at && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified {new Date(provider.verified_at).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm font-medium text-blue-600 mb-2">
                        {provider.specialty || "Healthcare Provider"}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate">{provider.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{provider.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" />
                          <span>{provider.years_experience || 0} years experience</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>₦{provider.base_fee?.toLocaleString() || 0} base fee</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{provider.duration || 30} min sessions</span>
                        </div>
                        {provider.languages && (
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5" />
                            <span className="truncate">{provider.languages}</span>
                          </div>
                        )}
                      </div>

                      {provider.bio && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {provider.bio}
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Applied: {new Date(provider.created_at).toLocaleDateString()} • 
                        Updated: {new Date(provider.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 lg:flex-col lg:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(provider)}
                      className="flex-1 lg:flex-none"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Provider Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Provider Review Dashboard</DialogTitle>
            <DialogDescription>
              Complete provider information and document verification
            </DialogDescription>
          </DialogHeader>

          {selectedProvider && (
            <div className="space-y-6">
              {/* Provider Header Card */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
                      {selectedProvider.profile_image ? (
                        <img
                          src={selectedProvider.profile_image}
                          alt={selectedProvider.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserCog className="w-10 h-10 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold">
                          {selectedProvider.title} {selectedProvider.name}
                        </h3>
                        {getStatusBadge(selectedProvider.status)}
                      </div>
                      <p className="text-blue-600 font-medium mb-1">
                        {selectedProvider.specialty}
                      </p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {selectedProvider.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {selectedProvider.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCog className="w-5 h-5" />
                    Professional Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label className="text-muted-foreground text-xs">Experience</Label>
                      <p className="font-medium text-lg mt-1">
                        {selectedProvider.years_experience || 0} years
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Base Fee</Label>
                      <p className="font-medium text-lg mt-1">
                        ₦{selectedProvider.base_fee?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Session Duration</Label>
                      <p className="font-medium text-lg mt-1">
                        {selectedProvider.duration || 30} minutes
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Languages</Label>
                      <p className="font-medium mt-1">
                        {selectedProvider.languages || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Availability</Label>
                      <p className="font-medium mt-1">
                        {selectedProvider.available || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Consultation Modes</Label>
                      <p className="font-medium mt-1">
                        {selectedProvider.consultation_mode
                          ? Object.keys(selectedProvider.consultation_mode)
                              .filter((key) => selectedProvider.consultation_mode[key])
                              .join(", ")
                          : "Not specified"}
                      </p>
                    </div>
                  </div>

                  {selectedProvider.bio && (
                    <div className="mt-6">
                      <Label className="text-muted-foreground text-xs">Biography</Label>
                      <p className="text-sm mt-2 p-4 bg-gray-50 rounded-lg leading-relaxed">
                        {selectedProvider.bio}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground text-xs">Application Date</Label>
                      <p className="font-medium mt-1">
                        {new Date(selectedProvider.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Last Updated</Label>
                      <p className="font-medium mt-1">
                        {new Date(selectedProvider.updated_at).toLocaleString()}
                      </p>
                    </div>
                    {selectedProvider.verified_at && (
                      <div className="col-span-2">
                        <Label className="text-muted-foreground text-xs">Verified Date</Label>
                        <p className="font-medium mt-1 text-green-600">
                          {new Date(selectedProvider.verified_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Documents Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Uploaded Documents
                    </span>
                    <Badge variant="secondary">
                      {selectedDocuments.length} document{selectedDocuments.length !== 1 ? "s" : ""}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDocuments.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50">
                      <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h4 className="font-medium text-lg mb-2">No Documents Uploaded</h4>
                      <p className="text-sm text-muted-foreground">
                        Provider hasn't uploaded any documents yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200 bg-white"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <span className="font-medium">
                                {getDocumentTypeName(doc.type)}
                              </span>
                              {getDocumentStatusBadge(doc.status)}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Uploaded: {new Date(doc.uploaded_at).toLocaleString()}
                              </p>
                              {doc.reviewed_at && (
                                <p className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Reviewed: {new Date(doc.reviewed_at).toLocaleString()}
                                </p>
                              )}
                              {doc.rejection_reason && (
                                <p className="text-red-600 flex items-center gap-1 mt-2">
                                  <AlertCircle className="w-3 h-3" />
                                  Reason: {doc.rejection_reason}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button variant="outline" size="sm" asChild>
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4 mr-2" />
                                View
                              </a>
                            </Button>
                            {doc.status === "pending" && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleApproveDocument(doc.id)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedDocForReject(doc.id);
                                    setShowRejectDialog(true);
                                  }}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedDocuments.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-900">Document Status Summary</p>
                          <div className="mt-2 space-y-1 text-blue-800">
                            <p>
                              ✓ Approved:{" "}
                              {selectedDocuments.filter((d) => d.status === "approved").length}
                            </p>
                            <p>
                              ⏳ Pending:{" "}
                              {selectedDocuments.filter((d) => d.status === "pending").length}
                            </p>
                            <p>
                              ✗ Rejected:{" "}
                              {selectedDocuments.filter((d) => d.status === "rejected").length}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Admin Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Internal Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add internal notes about this provider review (optional)..."
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
            {selectedProvider?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={handleRejectProvider}
                  disabled={actionLoading}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Application
                </Button>
                <Button onClick={handleApproveProvider} disabled={actionLoading}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {actionLoading ? "Approving..." : "Approve Provider"}
                </Button>
              </>
            )}
            {selectedProvider?.status === "verified" && (
              <Button
                variant="destructive"
                onClick={handleSuspend}
                disabled={actionLoading}
              >
                <Ban className="w-4 h-4 mr-2" />
                Suspend Provider
              </Button>
            )}
            {selectedProvider?.status === "suspended" && (
              <Button onClick={handleActivate} disabled={actionLoading}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Reactivate Provider
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Document Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this document
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
                setSelectedDocForReject(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectDocument}
              disabled={!rejectionReason.trim()}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProviderManagementPage;