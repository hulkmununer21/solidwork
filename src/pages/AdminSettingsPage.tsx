import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
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
  Settings,
  DollarSign,
  CreditCard,
  Palette,
  Bell,
  Save,
  Upload,
  AlertCircle,
  Shield,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AdminSettings {
  id: string;
  platform_name: string;
  platform_description: string;
  support_email: string;
  support_phone: string;
  platform_commission_rate: number;
  booking_fee: number;
  cancellation_fee: number;
  paystack_public_key: string;
  paystack_secret_key: string;
  flutterwave_public_key: string;
  flutterwave_secret_key: string;
  minimum_withdrawal_amount: number;
  payment_gateway: string;
  auto_release_escrow: boolean;
  escrow_hold_days: number;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  notification_email_from: string;
  booking_confirmation_template: string;
  payment_received_template: string;
  appointment_reminder_template: string;
  maintenance_mode: boolean;
  allow_new_registrations: boolean;
  require_email_verification: boolean;
  require_phone_verification: boolean;
}

const AdminSettingsPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);

    try {
      // Upload logo if changed
      let logoUrl = settings.logo_url;
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("platform-assets")
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("platform-assets")
          .getPublicUrl(fileName);
        
        logoUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("admin_settings")
        .update({
          ...settings,
          logo_url: logoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings.id);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Platform settings have been updated successfully.",
      });

      fetchSettings();
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load settings</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Platform Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure platform behavior, fees, and branding
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="fees">
            <DollarSign className="w-4 h-4 mr-2" />
            Fees & Commission
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="w-4 h-4 mr-2" />
            Payment Settings
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="w-4 h-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Configuration</CardTitle>
              <CardDescription>Basic platform information and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platform_name">Platform Name</Label>
                  <Input
                    id="platform_name"
                    value={settings.platform_name}
                    onChange={(e) =>
                      setSettings({ ...settings, platform_name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support_email">Support Email</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value={settings.support_email}
                    onChange={(e) =>
                      setSettings({ ...settings, support_email: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support_phone">Support Phone</Label>
                  <Input
                    id="support_phone"
                    value={settings.support_phone}
                    onChange={(e) =>
                      setSettings({ ...settings, support_phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform_description">Platform Description</Label>
                <Textarea
                  id="platform_description"
                  value={settings.platform_description}
                  onChange={(e) =>
                    setSettings({ ...settings, platform_description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  System Security
                </h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Disable access for non-admin users
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenance_mode}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, maintenance_mode: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow New Registrations</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable new user sign-ups
                    </p>
                  </div>
                  <Switch
                    checked={settings.allow_new_registrations}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, allow_new_registrations: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Email Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      Users must verify email to access platform
                    </p>
                  </div>
                  <Switch
                    checked={settings.require_email_verification}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, require_email_verification: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Phone Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      Users must verify phone number
                    </p>
                  </div>
                  <Switch
                    checked={settings.require_phone_verification}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, require_phone_verification: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fees & Commission Tab */}
        <TabsContent value="fees" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Fees & Commission Rates</CardTitle>
              <CardDescription>
                Configure platform fees and provider commission rates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platform_commission_rate">
                    Platform Commission Rate (%)
                  </Label>
                  <Input
                    id="platform_commission_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.platform_commission_rate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        platform_commission_rate: parseFloat(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Platform takes this percentage from each completed booking
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="booking_fee">Booking Fee (₦)</Label>
                  <Input
                    id="booking_fee"
                    type="number"
                    min="0"
                    step="100"
                    value={settings.booking_fee}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        booking_fee: parseFloat(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Fixed fee per booking transaction
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cancellation_fee">Cancellation Fee (₦)</Label>
                  <Input
                    id="cancellation_fee"
                    type="number"
                    min="0"
                    step="100"
                    value={settings.cancellation_fee}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        cancellation_fee: parseFloat(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Fee charged for booking cancellations
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Fee Calculation Example</h4>
                <div className="space-y-1 text-sm">
                  <p>Booking Amount: ₦10,000</p>
                  <p>
                    Platform Commission ({settings.platform_commission_rate}%): ₦
                    {(10000 * (settings.platform_commission_rate / 100)).toLocaleString()}
                  </p>
                  <p>Booking Fee: ₦{settings.booking_fee.toLocaleString()}</p>
                  <p className="font-semibold pt-2 border-t">
                    Provider Receives: ₦
                    {(
                      10000 -
                      10000 * (settings.platform_commission_rate / 100) -
                      settings.booking_fee
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings Tab */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Gateway Configuration</CardTitle>
              <CardDescription>Configure payment processing settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Payment Gateway</Label>
                <Select
                  value={settings.payment_gateway}
                  onValueChange={(value) =>
                    setSettings({ ...settings, payment_gateway: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paystack">Paystack</SelectItem>
                    <SelectItem value="flutterwave">Flutterwave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.payment_gateway === "paystack" && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-semibold">Paystack Configuration</h4>
                  <div className="space-y-2">
                    <Label htmlFor="paystack_public_key">Public Key</Label>
                    <Input
                      id="paystack_public_key"
                      type="text"
                      value={settings.paystack_public_key}
                      onChange={(e) =>
                        setSettings({ ...settings, paystack_public_key: e.target.value })
                      }
                      placeholder="pk_test_..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paystack_secret_key">Secret Key</Label>
                    <Input
                      id="paystack_secret_key"
                      type="password"
                      value={settings.paystack_secret_key}
                      onChange={(e) =>
                        setSettings({ ...settings, paystack_secret_key: e.target.value })
                      }
                      placeholder="sk_test_..."
                    />
                  </div>
                </div>
              )}

              {settings.payment_gateway === "flutterwave" && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-semibold">Flutterwave Configuration</h4>
                  <div className="space-y-2">
                    <Label htmlFor="flutterwave_public_key">Public Key</Label>
                    <Input
                      id="flutterwave_public_key"
                      type="text"
                      value={settings.flutterwave_public_key}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          flutterwave_public_key: e.target.value,
                        })
                      }
                      placeholder="FLWPUBK_TEST-..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flutterwave_secret_key">Secret Key</Label>
                    <Input
                      id="flutterwave_secret_key"
                      type="password"
                      value={settings.flutterwave_secret_key}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          flutterwave_secret_key: e.target.value,
                        })
                      }
                      placeholder="FLWSECK_TEST-..."
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold">Escrow Settings</h4>

                <div className="space-y-2">
                  <Label htmlFor="minimum_withdrawal_amount">
                    Minimum Withdrawal Amount (₦)
                  </Label>
                  <Input
                    id="minimum_withdrawal_amount"
                    type="number"
                    min="0"
                    step="1000"
                    value={settings.minimum_withdrawal_amount}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        minimum_withdrawal_amount: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="escrow_hold_days">Escrow Hold Period (days)</Label>
                  <Input
                    id="escrow_hold_days"
                    type="number"
                    min="1"
                    max="30"
                    value={settings.escrow_hold_days}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        escrow_hold_days: parseInt(e.target.value),
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of days to hold payment before auto-release
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Release Escrow</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically release payments after hold period
                    </p>
                  </div>
                  <Switch
                    checked={settings.auto_release_escrow}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, auto_release_escrow: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Branding</CardTitle>
              <CardDescription>Customize logo and color scheme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Platform Logo</Label>
                {settings.logo_url && (
                  <div className="mb-4">
                    <img
                      src={settings.logo_url}
                      alt="Platform Logo"
                      className="h-20 object-contain"
                    />
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) =>
                        setSettings({ ...settings, primary_color: e.target.value })
                      }
                      className="w-20"
                    />
                    <Input
                      type="text"
                      value={settings.primary_color}
                      onChange={(e) =>
                        setSettings({ ...settings, primary_color: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) =>
                        setSettings({ ...settings, secondary_color: e.target.value })
                      }
                      className="w-20"
                    />
                    <Input
                      type="text"
                      value={settings.secondary_color}
                      onChange={(e) =>
                        setSettings({ ...settings, secondary_color: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent_color">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent_color"
                      type="color"
                      value={settings.accent_color}
                      onChange={(e) =>
                        setSettings({ ...settings, accent_color: e.target.value })
                      }
                      className="w-20"
                    />
                    <Input
                      type="text"
                      value={settings.accent_color}
                      onChange={(e) =>
                        setSettings({ ...settings, accent_color: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="font-semibold mb-4">Color Preview</h4>
                <div className="flex gap-4">
                  <div
                    className="w-20 h-20 rounded-lg shadow"
                    style={{ backgroundColor: settings.primary_color }}
                  />
                  <div
                    className="w-20 h-20 rounded-lg shadow"
                    style={{ backgroundColor: settings.secondary_color }}
                  />
                  <div
                    className="w-20 h-20 rounded-lg shadow"
                    style={{ backgroundColor: settings.accent_color }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure notification channels and templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Notification Channels</h4>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.email_notifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, email_notifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via SMS
                    </p>
                  </div>
                  <Switch
                    checked={settings.sms_notifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, sms_notifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send in-app push notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.push_notifications}
                    onCheckedChange={(checked) =>
                      setSettings({ ...settings, push_notifications: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notification_email_from">Notification From Email</Label>
                  <Input
                    id="notification_email_from"
                    type="email"
                    value={settings.notification_email_from}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        notification_email_from: e.target.value,
                      })
                    }
                    placeholder="noreply@carenexus.com"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold">Email Templates</h4>

                <div className="space-y-2">
                  <Label htmlFor="booking_confirmation_template">
                    Booking Confirmation Template
                  </Label>
                  <Textarea
                    id="booking_confirmation_template"
                    value={settings.booking_confirmation_template}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        booking_confirmation_template: e.target.value,
                      })
                    }
                    rows={4}
                    placeholder="Hi {patient_name}, your booking with {provider_name} on {date} has been confirmed..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_received_template">
                    Payment Received Template
                  </Label>
                  <Textarea
                    id="payment_received_template"
                    value={settings.payment_received_template}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment_received_template: e.target.value,
                      })
                    }
                    rows={4}
                    placeholder="Payment of {amount} received for booking #{booking_id}..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointment_reminder_template">
                    Appointment Reminder Template
                  </Label>
                  <Textarea
                    id="appointment_reminder_template"
                    value={settings.appointment_reminder_template}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        appointment_reminder_template: e.target.value,
                      })
                    }
                    rows={4}
                    placeholder="Reminder: You have an appointment with {provider_name} tomorrow at {time}..."
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Available variables: {"{patient_name}"}, {"{provider_name}"},{" "}
                    {"{date}"}, {"{time}"}, {"{amount}"}, {"{booking_id}"}
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettingsPage;