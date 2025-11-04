import {
  User,
  Settings,
  Shield,
  Heart,
  FileText,
  Bell,
  LogOut,
  ChevronRight,
  Edit3,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Home,
  MessageCircle,
  Camera,
  Plus,
  Pill,
  Activity,
  Save,
  X,
  Copy,
  Check,
  Upload,
  Trash2,
  AlertTriangle,
  Download,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/supabaseClient";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Profile state
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Auth email state
  const [userEmail, setUserEmail] = useState("");

  // Edit dialog state
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    name: "",
    phone: "",
    address: "",
    date_of_birth: ""
  });

  // Emergency contact dialog state
  const [isEditingEmergency, setIsEditingEmergency] = useState(false);
  const [editedEmergency, setEditedEmergency] = useState({
    name: "",
    relationship: "",
    phone: ""
  });

  // Medication dialog state
  const [isEditingMedication, setIsEditingMedication] = useState(false);
  const [medicationEditIndex, setMedicationEditIndex] = useState<number | null>(null);
  const [medicationForm, setMedicationForm] = useState({ name: "", dosage: "" });

  // Add allergy dialog state
  const [isAddingAllergy, setIsAddingAllergy] = useState(false);
  const [newAllergy, setNewAllergy] = useState("");

  // Add condition dialog state
  const [isAddingCondition, setIsAddingCondition] = useState(false);
  const [newCondition, setNewCondition] = useState("");

  // Add medication dialog state
  const [isAddingMedication, setIsAddingMedication] = useState(false);

  // Blood group dialog state
  const [isEditingBlood, setIsEditingBlood] = useState(false);
  const [bloodType, setBloodType] = useState("");

  // Copy health id state
  const [copiedHealthId, setCopiedHealthId] = useState(false);

  // Fetch profile and email from Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        setUserEmail("");
        setLoading(false);
        return;
      }
      setUserEmail(user.email || "");
      const { data, error } = await supabase
        .from("patient_profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error || !data) {
        setProfile(null);
      } else {
        setProfile({
          ...data,
          emergency_contact: data.emergency_contact ? JSON.parse(data.emergency_contact) : { name: "", relationship: "", phone: "" },
          allergies: data.allergies ? data.allergies.split(",").map((a: string) => a.trim()).filter((a: string) => a) : [],
          conditions: data.conditions ? data.conditions.split(",").map((c: string) => c.trim()).filter((c: string) => c) : [],
          current_medication: data.current_medication ? JSON.parse(data.current_medication) : [],
        });
        setBloodType(data.blood_type || "");
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  // Helper: calculate age from YYYY-MM or YYYY-MM-DD
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

  // CRUD: Save profile edits (now includes date_of_birth)
  const handleSaveProfile = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("patient_profiles")
      .update({
        name: editedData.name,
        phone: editedData.phone,
        address: editedData.address,
        date_of_birth: editedData.date_of_birth
      })
      .eq("id", profile.id);
    setLoading(false);
    if (!error) {
      setIsEditing(false);
      setProfile({ ...profile, ...editedData });
      toast({ title: "Profile updated", description: "Your profile information has been updated successfully." });
    } else {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    }
  };

  // CRUD: Emergency contact
  const handleSaveEmergencyContact = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("patient_profiles")
      .update({
        emergency_contact: JSON.stringify(editedEmergency)
      })
      .eq("id", profile.id);
    setLoading(false);
    if (!error) {
      setIsEditingEmergency(false);
      setProfile({ ...profile, emergency_contact: editedEmergency });
      toast({ title: "Emergency contact updated" });
    } else {
      toast({ title: "Error", description: "Failed to update emergency contact.", variant: "destructive" });
    }
  };

  // CRUD: Allergies
  const handleAddAllergy = async () => {
    if (!newAllergy.trim()) return;
    const updatedAllergies = [...profile.allergies, newAllergy.trim()];
    const { error } = await supabase
      .from("patient_profiles")
      .update({
        allergies: updatedAllergies.join(",")
      })
      .eq("id", profile.id);
    if (!error) {
      setProfile({ ...profile, allergies: updatedAllergies });
      setIsAddingAllergy(false);
      setNewAllergy("");
      toast({ title: "Allergy added" });
    }
  };

  const handleRemoveAllergy = async (allergy: string) => {
    const updatedAllergies = profile.allergies.filter((a: string) => a !== allergy);
    const { error } = await supabase
      .from("patient_profiles")
      .update({
        allergies: updatedAllergies.join(",")
      })
      .eq("id", profile.id);
    if (!error) {
      setProfile({ ...profile, allergies: updatedAllergies });
      toast({ title: "Allergy removed" });
    }
  };

  // CRUD: Conditions
  const handleAddCondition = async () => {
    if (!newCondition.trim()) return;
    const updatedConditions = [...profile.conditions, newCondition.trim()];
    const { error } = await supabase
      .from("patient_profiles")
      .update({
        conditions: updatedConditions.join(",")
      })
      .eq("id", profile.id);
    if (!error) {
      setProfile({ ...profile, conditions: updatedConditions });
      setIsAddingCondition(false);
      setNewCondition("");
      toast({ title: "Condition added" });
    }
  };

  const handleRemoveCondition = async (condition: string) => {
    const updatedConditions = profile.conditions.filter((c: string) => c !== condition);
    const { error } = await supabase
      .from("patient_profiles")
      .update({
        conditions: updatedConditions.join(",")
      })
      .eq("id", profile.id);
    if (!error) {
      setProfile({ ...profile, conditions: updatedConditions });
      toast({ title: "Condition removed" });
    }
  };

  // CRUD: Medications
  const handleAddMedication = async () => {
    if (!medicationForm.name.trim() || !medicationForm.dosage.trim()) return;
    const updatedMeds = [...profile.current_medication, { ...medicationForm }];
    const { error } = await supabase
      .from("patient_profiles")
      .update({
        current_medication: JSON.stringify(updatedMeds)
      })
      .eq("id", profile.id);
    if (!error) {
      setProfile({ ...profile, current_medication: updatedMeds });
      setIsAddingMedication(false);
      setMedicationForm({ name: "", dosage: "" });
      toast({ title: "Medication added" });
    }
  };

  const handleRemoveMedication = async (index: number) => {
    const updatedMeds = profile.current_medication.filter((_: any, i: number) => i !== index);
    const { error } = await supabase
      .from("patient_profiles")
      .update({
        current_medication: JSON.stringify(updatedMeds)
      })
      .eq("id", profile.id);
    if (!error) {
      setProfile({ ...profile, current_medication: updatedMeds });
      toast({ title: "Medication removed" });
    }
  };

  const handleEditMedication = (index: number) => {
    setMedicationEditIndex(index);
    setMedicationForm(profile.current_medication[index]);
    setIsEditingMedication(true);
  };

  const handleSaveMedicationEdit = async () => {
    if (medicationEditIndex === null) return;
    const updatedMeds = profile.current_medication.map((med: any, i: number) =>
      i === medicationEditIndex ? { ...medicationForm } : med
    );
    const { error } = await supabase
      .from("patient_profiles")
      .update({
        current_medication: JSON.stringify(updatedMeds)
      })
      .eq("id", profile.id);
    if (!error) {
      setProfile({ ...profile, current_medication: updatedMeds });
      setIsEditingMedication(false);
      setMedicationEditIndex(null);
      setMedicationForm({ name: "", dosage: "" });
      toast({ title: "Medication updated" });
    }
  };

  // CRUD: Blood group
  const handleSaveBloodType = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("patient_profiles")
      .update({ blood_type: bloodType })
      .eq("id", profile.id);
    setLoading(false);
    if (!error) {
      setProfile({ ...profile, blood_type: bloodType });
      setIsEditingBlood(false);
      toast({ title: "Blood group updated" });
    } else {
      toast({ title: "Error", description: "Failed to update blood group.", variant: "destructive" });
    }
  };

  // Copy health id
  const handleCopyHealthId = async () => {
    try {
      await navigator.clipboard.writeText(profile?.health_id || "");
      setCopiedHealthId(true);
      setTimeout(() => setCopiedHealthId(false), 2000);
      toast({ title: "Health ID copied", description: "Your Health ID has been copied to clipboard." });
    } catch (err) {
      toast({ title: "Failed to copy", description: "Could not copy Health ID to clipboard.", variant: "destructive" });
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('ahs_auth_token');
    localStorage.removeItem('ahs_user_type');
    navigate('/splash');
    toast({ title: "Signed out successfully", description: "You have been logged out of your account." });
  };

  // Settings options
  const settingsOptions = [
    { icon: Bell, title: "Notifications", description: "Manage your notification preferences", action: "notifications" },
    { icon: Shield, title: "Privacy & Security", description: "Password, biometrics, and data privacy", action: "privacy" },
    { icon: FileText, title: "Medical Records", description: "View and manage your health records", action: "records" },
    { icon: Heart, title: "Health Preferences", description: "Set health goals and preferences", action: "health" }
  ];

  // UI
  return (
    <div className="min-h-screen bg-gradient-subtle pb-20">
      {/* Header */}
      <div className="gradient-hero text-white p-6 rounded-b-3xl shadow-premium">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold font-display">Profile</h1>
            <p className="text-white/90 text-sm font-body">Manage your account and health information</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={() => {
              setEditedData({
                name: profile?.name || "",
                phone: profile?.phone || "",
                address: profile?.address || "",
                date_of_birth: profile?.date_of_birth || ""
              });
              setIsEditing(true);
            }}
            disabled={loading || !profile}
          >
            <Edit3 className="w-4 h-4" />
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="w-20 h-20 border-2 border-white/30">
                <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
                  {profile?.name ? profile.name.split(' ').map((n: string) => n[0]).join('') : "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white font-display">{profile?.name || "Not Set"}</h2>
              <div className="flex items-center space-x-2 mb-2">
                <p className="text-white/90 text-sm">ID: {profile?.health_id || "Not Set"}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-white hover:bg-white/20"
                  onClick={handleCopyHealthId}
                  disabled={!profile?.health_id}
                >
                  {copiedHealthId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  Active Patient
                </Badge>
                <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                  Verified
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="p-6 space-y-6">
        {/* Personal Information */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground font-display">Personal Information</h2>
          </div>
          <Card className="p-4 space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 text-left">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{userEmail || "Not Set"}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 text-left">
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground">{profile?.phone || "Not Set"}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 text-left">
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium text-foreground">{profile?.date_of_birth || "Not Set"} ({calculateAge(profile?.date_of_birth) !== "Not Set" ? `${calculateAge(profile?.date_of_birth)} years` : "Not Set"})</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1 text-left">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium text-foreground">{profile?.address || "Not Set"}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Medical Information */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground font-display">Medical Information</h2>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => setIsAddingCondition(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Condition
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsAddingAllergy(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Allergy
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsAddingMedication(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Medication
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsEditingBlood(true)}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Blood Group
              </Button>
            </div>
          </div>
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <Activity className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Blood Type</p>
                <p className="font-semibold text-foreground">{profile?.blood_type || "Not Set"}</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <Heart className="w-6 h-6 text-destructive mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Allergies</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {profile?.allergies?.length
                    ? profile.allergies.map((allergy: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="bg-medical-warning/10 text-medical-warning border-medical-warning pr-8 relative group">
                          {allergy}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute -top-1 -right-1 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-white hover:bg-destructive/90"
                            onClick={() => handleRemoveAllergy(allergy)}
                          >
                            <X className="w-2 h-2" />
                          </Button>
                        </Badge>
                      ))
                    : <span className="text-muted-foreground">None</span>
                  }
                </div>
              </div>
            </div>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Current Conditions</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile?.conditions?.length
                  ? profile.conditions.map((condition: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="bg-medical-warning/10 text-medical-warning border-medical-warning pr-8 relative group">
                        {condition}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute -top-1 -right-1 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-white hover:bg-destructive/90"
                          onClick={() => handleRemoveCondition(condition)}
                        >
                          <X className="w-2 h-2" />
                        </Button>
                      </Badge>
                    ))
                  : <span className="text-muted-foreground">None</span>
                }
              </div>
            </div>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Current Medications</p>
              </div>
              <div className="space-y-2">
                {profile?.current_medication?.length
                  ? profile.current_medication.map((med: any, idx: number) => (
                      <div key={idx} className="flex items-center space-x-3 p-2 bg-muted/30 rounded-lg">
                        <Pill className="w-4 h-4 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground text-sm">{med.name}</p>
                          <p className="text-xs text-muted-foreground">{med.dosage}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditMedication(idx)}>
                              <Edit3 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRemoveMedication(idx)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))
                  : <span className="text-muted-foreground">None</span>
                }
              </div>
            </div>
          </Card>
        </div>

        {/* Emergency Contact */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground font-display">Emergency Contact</h2>
            <Button variant="outline" size="sm" onClick={() => {
              setEditedEmergency({
                name: profile?.emergency_contact?.name || "",
                relationship: profile?.emergency_contact?.relationship || "",
                phone: profile?.emergency_contact?.phone || ""
              });
              setIsEditingEmergency(true);
            }}>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-destructive/10 rounded-full p-3">
                <Phone className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{profile?.emergency_contact?.name || "Not Set"}</p>
                <p className="text-sm text-muted-foreground">{profile?.emergency_contact?.relationship || "Not Set"}</p>
                <p className="text-sm text-foreground">{profile?.emergency_contact?.phone || "Not Set"}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Settings */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4 font-display">Settings</h2>
          <Card className="divide-y divide-border">
            {settingsOptions.map((option, index) => (
              <button
                key={index}
                className="w-full p-4 hover:bg-muted/30 transition-colors cursor-pointer text-left"
                onClick={() => toast({ title: "Opening settings", description: `Navigating to ${option.action} settings.` })}
              >
                <div className="flex items-center space-x-4">
                  <div className="bg-primary/10 rounded-full p-2">
                    <option.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{option.title}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </Card>
        </div>

        {/* Logout */}
        <Card className="p-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will be logged out of your account and redirected to the login screen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>Sign Out</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Card>

        {/* Edit Profile Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile information here.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">Name</Label>
                <Input
                  id="edit-name"
                  value={editedData.name}
                  onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">Email</Label>
                <Input
                  id="edit-email"
                  value={userEmail || ""}
                  className="col-span-3"
                  readOnly
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone" className="text-right">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editedData.phone}
                  onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-address" className="text-right">Address</Label>
                <Input
                  id="edit-address"
                  value={editedData.address}
                  onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-dob" className="text-right">Date of Birth</Label>
                <Input
                  id="edit-dob"
                  type="date"
                  value={editedData.date_of_birth}
                  onChange={(e) => setEditedData({ ...editedData, date_of_birth: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveProfile}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Emergency Contact Dialog */}
        <Dialog open={isEditingEmergency} onOpenChange={setIsEditingEmergency}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Emergency Contact</DialogTitle>
              <DialogDescription>
                Update your emergency contact details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="em-name" className="text-right">Name</Label>
                <Input
                  id="em-name"
                  value={editedEmergency.name}
                  onChange={(e) => setEditedEmergency({ ...editedEmergency, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="em-rel" className="text-right">Relationship</Label>
                <Input
                  id="em-rel"
                  value={editedEmergency.relationship}
                  onChange={(e) => setEditedEmergency({ ...editedEmergency, relationship: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="em-phone" className="text-right">Phone</Label>
                <Input
                  id="em-phone"
                  value={editedEmergency.phone}
                  onChange={(e) => setEditedEmergency({ ...editedEmergency, phone: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditingEmergency(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveEmergencyContact}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Allergy Dialog */}
        <Dialog open={isAddingAllergy} onOpenChange={setIsAddingAllergy}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Allergy</DialogTitle>
              <DialogDescription>
                Add a new allergy to your profile.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Allergy name"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingAllergy(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleAddAllergy}>
                <Save className="w-4 h-4 mr-2" />
                Add Allergy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Condition Dialog */}
        <Dialog open={isAddingCondition} onOpenChange={setIsAddingCondition}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Condition</DialogTitle>
              <DialogDescription>
                Add a new medical condition to your profile.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Condition name"
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingCondition(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleAddCondition}>
                <Save className="w-4 h-4 mr-2" />
                Add Condition
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Medication Dialog */}
        <Dialog open={isAddingMedication} onOpenChange={setIsAddingMedication}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Medication</DialogTitle>
              <DialogDescription>
                Add a new medication to your profile.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                placeholder="Medication name"
                value={medicationForm.name}
                onChange={(e) => setMedicationForm({ ...medicationForm, name: e.target.value })}
              />
              <Input
                placeholder="Dosage"
                value={medicationForm.dosage}
                onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingMedication(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleAddMedication}>
                <Save className="w-4 h-4 mr-2" />
                Add Medication
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Medication Dialog */}
        <Dialog open={isEditingMedication} onOpenChange={setIsEditingMedication}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Medication</DialogTitle>
              <DialogDescription>
                Edit medication details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                placeholder="Medication name"
                value={medicationForm.name}
                onChange={(e) => setMedicationForm({ ...medicationForm, name: e.target.value })}
              />
              <Input
                placeholder="Dosage"
                value={medicationForm.dosage}
                onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditingMedication(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveMedicationEdit}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Blood Group Dialog */}
        <Dialog open={isEditingBlood} onOpenChange={setIsEditingBlood}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Blood Group</DialogTitle>
              <DialogDescription>
                Update your blood group information.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Blood Group (e.g. A+, O-, B+)"
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditingBlood(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSaveBloodType}>
                <Save className="w-4 h-4 mr-2" />
                Save Blood Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border shadow-premium">
        <div className="flex justify-around py-3">
          {[
            { icon: Home, label: 'Home', active: false, route: '/dashboard' },
            { icon: Calendar, label: 'Bookings', active: false, route: '/bookings' },
            { icon: MessageCircle, label: 'Messages', active: false, route: '/messages' },
            { icon: User, label: 'Profile', active: true, route: '/profile' }
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

export default ProfilePage;