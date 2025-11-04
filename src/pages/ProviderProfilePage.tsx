import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Calendar,
  MessageCircle,
  User,
  Home,
  Camera,
  Wallet,
  Settings,
  Phone,
  Mail,
  Lock,
  LogOut,
  Edit,
  Save,
  XCircle,
  Clock,
  Download,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const languagesList = [
  "English", "Hausa", "Yoruba", "Igbo", "Fulfulde", "Kanuri", "Tiv", "Ibibio", "Edo", "Ijaw", "Nupe", "Urhobo", "Gwari", "Efik", "Idoma", "Igala", "Isoko", "Ebira", "Berom", "French", "Arabic"
];

const specialties = [
  'General Practitioner', 'Internal Medicine', 'Pediatrics', 'Obstetrics & Gynecology', 'Surgery', 'Cardiology', 'Dermatology', 'Psychiatry', 'Orthopedics', 'Neurology'
];

const durationOptions = [10, 15, 20, 25, 30, 45, 60];

const documentTypes = [
  "License",
  "ID Card",
  "Certificate",
  "Other"
];

const ProviderProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [currentProfileTab, setCurrentProfileTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const profileImageRef = useRef<HTMLInputElement>(null);

  // Password dialog state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Toast
  const { toast } = useToast ? useToast() : { toast: () => {} };

  // Profile state matching DB types
  const [profileData, setProfileData] = useState({
    name: '',
    title: '',
    specialty: '',
    bio: '',
    languages: [] as string[], // text[] in DB
    phone: '',
    status: '',
    available: false,
    consultation_mode: { virtual: false, inPerson: false }, // JSON in DB
    years_experience: 0,
    base_fee: 0.0,
    duration: 30,
    profile_image: ''
  });

  // Document upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [documentType, setDocumentType] = useState("");

  // Fetch provider profile from Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("provider_profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (!error && data) {
        setProfileData({
          name: data.name || '',
          title: data.title || '',
          specialty: data.specialty || '',
          bio: data.bio || '',
          languages: Array.isArray(data.languages) ? data.languages : (data.languages ? data.languages.split(',').map((l: string) => l.trim()) : []),
          phone: data.phone || '',
          status: data.status || '',
          available: !!data.available,
          consultation_mode: data.consultation_mode || { virtual: false, inPerson: false },
          years_experience: typeof data.years_experience === "number" ? data.years_experience : 0,
          base_fee: typeof data.base_fee === "number" ? data.base_fee : 0.0,
          duration: typeof data.duration === "number" ? data.duration : 30,
          profile_image: data.profile_image || ''
        });
      }
    };
    fetchProfile();
  }, []);

  // Fetch documents from DB for this provider
  const fetchDocuments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("provider_id", user.id)
      .order("uploaded_at", { ascending: false });
    if (!error && data) setUploadedFiles(data);
  };
  useEffect(() => {
    if (currentProfileTab === "documents") fetchDocuments();
  }, [currentProfileTab]);

  // Save profile changes to Supabase
  const handleSaveProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const updateObj: any = {
      name: profileData.name,
      title: profileData.title,
      specialty: profileData.specialty,
      bio: profileData.bio,
      languages: profileData.languages, // send as array for text[]
      phone: profileData.phone,
      status: profileData.status,
      available: profileData.available,
      consultation_mode: profileData.consultation_mode,
      years_experience: profileData.years_experience,
      base_fee: profileData.base_fee,
      duration: profileData.duration,
      profile_image: profileData.profile_image
    };
    const { error } = await supabase
      .from("provider_profiles")
      .update(updateObj)
      .eq("id", user.id);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setIsEditing(false);
  };

  // Password change handler with old password verification
  const handleChangePassword = async () => {
    setPasswordLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      toast({ title: "Error", description: "User not found.", variant: "destructive" });
      setPasswordLoading(false);
      return;
    }
    // Step 1: Re-authenticate with old password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword
    });
    if (signInError) {
      toast({ title: "Old password incorrect", description: "Please enter your current password correctly.", variant: "destructive" });
      setPasswordLoading(false);
      return;
    }
    // Step 2: Update password
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password Changed", description: "Your password has been updated." });
      setShowPasswordDialog(false);
      setOldPassword("");
      setNewPassword("");
    }
  };

  // Handle profile image upload (stub, implement storage logic as needed)
  const handleImageUpload = () => {
    profileImageRef.current?.click();
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setProfileData({ ...profileData, profile_image: url });
    // You should upload to Supabase Storage and save the public URL in profile_image
  };

  // Document upload: to storage and record in DB
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError("");
    const file = e.target.files?.[0];
    if (!file || !documentType) {
      setUploadError("Select document type and file.");
      return;
    }
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUploadError("User not authenticated");
      setUploading(false);
      return;
    }
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("provider-documents")
      .upload(filePath, file);
    if (uploadError) {
      setUploadError(uploadError.message);
      setUploading(false);
      return;
    }
    // Get public URL (or signed URL for private bucket)
    const { data: urlData } = supabase.storage
      .from("provider-documents")
      .getPublicUrl(filePath);
    const fileUrl = urlData?.publicUrl || "";
    // Insert record in documents table
    const { error: dbError } = await supabase
      .from("documents")
      .insert([{
        provider_id: user.id,
        type: documentType,
        file_url: fileUrl,
        status: "not verified",
        uploaded_at: new Date().toISOString()
      }]);
    setUploading(false);
    if (dbError) {
      setUploadError(dbError.message);
      return;
    }
    setDocumentType("");
    fetchDocuments();
  };

  // Download document
  const handleDownload = (fileUrl: string) => {
    window.open(fileUrl, "_blank");
  };

  // Delete document: from storage and DB
  const handleDeleteDocument = async (doc: any) => {
    setUploading(true);
    // Remove from storage
    const filePath = doc.file_url.split("/provider-documents/")[1];
    if (filePath) {
      await supabase.storage.from("provider-documents").remove([filePath]);
    }
    // Remove from DB
    await supabase.from("documents").delete().eq("id", doc.id);
    setUploading(false);
    fetchDocuments();
  };

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('ahs_auth_token');
    navigate('/');
  };

  const navigationItems = [
    { icon: Home, label: 'Home', id: 'home' },
    { icon: Calendar, label: 'Schedule', id: 'schedule' },
    { icon: MessageCircle, label: 'Messages', id: 'messages' },
    { icon: User, label: 'Profile', id: 'profile' }
  ];

  // Languages CRUD UI
  const [languageInput, setLanguageInput] = useState("");
  const handleAddLanguage = () => {
    const lang = languageInput.trim();
    if (lang && !profileData.languages.includes(lang)) {
      setProfileData({ ...profileData, languages: [...profileData.languages, lang] });
      setLanguageInput("");
    }
  };
  const handleRemoveLanguage = (lang: string) => {
    setProfileData({ ...profileData, languages: profileData.languages.filter(l => l !== lang) });
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Picture */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileData.profile_image} />
                <AvatarFallback className="text-2xl">
                  {profileData.name ? profileData.name.split(' ').map(n => n[0]).join('') : ''}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="outline"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                onClick={handleImageUpload}
                disabled={!isEditing}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input
                ref={profileImageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfileImageChange}
              />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-semibold">{profileData.name}</h3>
              <p className="text-muted-foreground">{profileData.specialty}</p>
              <p className="text-sm text-muted-foreground">{profileData.years_experience} years experience</p>
              <p className="text-sm text-muted-foreground">{profileData.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Personal & Professional Info</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
            disabled={loading}
          >
            {isEditing ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Select
                value={profileData.title}
                onValueChange={(value) => setProfileData({...profileData, title: value})}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dr.">Dr.</SelectItem>
                  <SelectItem value="Nurse">Nurse</SelectItem>
                  <SelectItem value="Pharmacist">Pharmacist</SelectItem>
                  <SelectItem value="Prof.">Prof.</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="specialty">Specialty</Label>
              <Select
                value={profileData.specialty}
                onValueChange={(value) => setProfileData({...profileData, specialty: value})}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="years_experience">Years of Experience</Label>
              <Input
                id="years_experience"
                type="number"
                value={profileData.years_experience}
                onChange={(e) => setProfileData({...profileData, years_experience: parseInt(e.target.value) || 0})}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio / About Me</Label>
            <Textarea
              id="bio"
              value={profileData.bio}
              onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
              disabled={!isEditing}
              rows={3}
            />
          </div>

          <div>
            <Label>Languages Spoken</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {profileData.languages.map((lang) => (
                <Badge key={lang} variant="default" className="relative pr-6">
                  {lang}
                  {isEditing && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 text-red-500"
                      onClick={() => handleRemoveLanguage(lang)}
                    >
                      <XCircle className="h-3 w-3" />
                    </Button>
                  )}
                </Badge>
              ))}
            </div>
            {isEditing && (
              <div className="flex gap-2 mt-3">
                <Select
                  value={languageInput}
                  onValueChange={setLanguageInput}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Add Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languagesList
                      .filter(l => !profileData.languages.includes(l))
                      .map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={handleAddLanguage}
                  disabled={!languageInput}
                >
                  Add
                </Button>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Consultation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Consultation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-base font-medium">Consultation Modes</Label>
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={profileData.consultation_mode.virtual}
                  onCheckedChange={(checked) =>
                    setProfileData({
                      ...profileData,
                      consultation_mode: { ...profileData.consultation_mode, virtual: checked }
                    })
                  }
                  disabled={!isEditing}
                />
                <Label>Virtual Consultations</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={profileData.consultation_mode.inPerson}
                  onCheckedChange={(checked) =>
                    setProfileData({
                      ...profileData,
                      consultation_mode: { ...profileData.consultation_mode, inPerson: checked }
                    })
                  }
                  disabled={!isEditing}
                />
                <Label>In-Person Consultations</Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="base_fee">Base Fee (₦)</Label>
              <Input
                id="base_fee"
                type="number"
                step="0.01"
                value={profileData.base_fee}
                onChange={(e) => setProfileData({...profileData, base_fee: parseFloat(e.target.value) || 0.0})}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="duration">Default Duration (minutes)</Label>
              <Select
                value={profileData.duration.toString()}
                onValueChange={(value) => setProfileData({...profileData, duration: parseInt(value)})}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((option) => (
                    <SelectItem key={option} value={option.toString()}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Documents tab implementation
  const renderDocumentsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Verification Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <Select
                value={documentType}
                onValueChange={setDocumentType}
                disabled={uploading}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select Document Type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleDocumentUpload}
                disabled={uploading || !documentType}
              />
            </div>
            {uploadError && <p className="text-red-500">{uploadError}</p>}
            <div>
              <h4 className="font-medium mb-2">Your Uploaded Documents:</h4>
              <ul className="space-y-2">
                {uploadedFiles.length === 0 && (
                  <li className="text-muted-foreground">No documents uploaded yet.</li>
                )}
                {uploadedFiles.map(doc => (
                  <li key={doc.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                    <div>
                      <span className="font-medium">{doc.type}</span>{" "}
                      <span className="text-xs text-muted-foreground">({doc.status})</span>
                      <span className="ml-2 text-xs text-muted-foreground">{new Date(doc.uploaded_at).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDownload(doc.file_url)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteDocument(doc)}
                        title="Delete"
                        disabled={uploading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEarningsTab = () => (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-medical-green to-green-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="h-6 w-6" />
            <h3 className="text-xl font-bold">Monthly Earnings</h3>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold">₦48,000</p>
            <p className="text-lg opacity-90">24 consultations completed</p>
            <p className="text-sm opacity-75">This month • February 2024</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Earnings Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-medical-blue">24</p>
              <p className="text-sm text-muted-foreground">Total Consultations</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-medical-blue">₦2,000</p>
              <p className="text-sm text-muted-foreground">Average Per Session</p>
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-2">Recent Activity</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm">Virtual consultation - Sarah J.</span>
                <span className="text-sm font-medium">₦2,500</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm">In-person consultation - Michael C.</span>
                <span className="text-sm font-medium">₦3,000</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm">Virtual consultation - Fatima O.</span>
                <span className="text-sm font-medium">₦2,500</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-900">Pilot Phase</span>
          </div>
          <p className="text-sm text-yellow-800 mt-2">
            Payouts are currently handled manually by admin. Automated payments will be available soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <Input
                id="phone"
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                disabled={!isEditing}
              />
              <Button variant="outline" size="icon">
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowPasswordDialog(true)}
            >
              <Lock className="h-4 w-4 mr-2" />
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="old-password">Current Password</Label>
            <Input
              id="old-password"
              type="password"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              disabled={passwordLoading}
            />
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              disabled={passwordLoading}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={passwordLoading || !oldPassword || !newPassword}
            >
              {passwordLoading ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium text-muted-foreground mb-2">Payment Setup Coming Soon</h4>
            <p className="text-sm text-muted-foreground">
              Bank details and payout settings will be available once automated payments are enabled.
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="border-red-200">
        <CardContent className="p-6">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue-light to-white pb-24">
      {/* Header */}
      <div className="bg-white shadow-card p-4 sm:p-6 pt-12 sm:pt-16">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-foreground">
              Profile
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your professional information and settings
            </p>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="p-4 sm:p-6">
        <Tabs value={currentProfileTab} onValueChange={setCurrentProfileTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs sm:text-sm">Documents</TabsTrigger>
            <TabsTrigger value="earnings" className="text-xs sm:text-sm">Earnings</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="profile" className="mt-0">
              {renderProfileTab()}
            </TabsContent>
            <TabsContent value="documents" className="mt-0">
              {renderDocumentsTab()}
            </TabsContent>
            <TabsContent value="earnings" className="mt-0">
              {renderEarningsTab()}
            </TabsContent>
            <TabsContent value="settings" className="mt-0">
              {renderSettingsTab()}
            </TabsContent>
          </div>
        </Tabs>
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
                } else if (item.id === 'schedule') {
                  navigate('/provider-schedule');
                } else if (item.id === 'messages') {
                  navigate('/provider-messages');
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

export default ProviderProfilePage;