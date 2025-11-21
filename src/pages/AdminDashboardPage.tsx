import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserCog,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalProviders: 0,
    pendingProviders: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    newUsersToday: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch patients count
      const { count: patientsCount } = await supabase
        .from("patient_profiles")
        .select("*", { count: "exact", head: true });

      // Fetch providers count
      const { count: providersCount } = await supabase
        .from("provider_profiles")
        .select("*", { count: "exact", head: true });

      // Fetch pending providers
      const { count: pendingProvidersCount } = await supabase
        .from("provider_profiles")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Fetch bookings count
      const { count: bookingsCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true });

      // Fetch pending bookings
      const { count: pendingBookingsCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .in("status", ["requested", "pending_provider"]);

      // Fetch completed bookings
      const { count: completedBookingsCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");

      // Fetch recent providers for activity feed
      const { data: recentProviders } = await supabase
        .from("provider_profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      setStats({
        totalPatients: patientsCount || 0,
        totalProviders: providersCount || 0,
        pendingProviders: pendingProvidersCount || 0,
        totalBookings: bookingsCount || 0,
        pendingBookings: pendingBookingsCount || 0,
        completedBookings: completedBookingsCount || 0,
        totalRevenue: completedBookingsCount ? completedBookingsCount * 2000 : 0,
        newUsersToday: 0
      });

      setRecentActivity(recentProviders || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "Total Patients",
      value: stats.totalPatients,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+12%",
      changeType: "positive"
    },
    {
      title: "Total Providers",
      value: stats.totalProviders,
      icon: UserCog,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+8%",
      changeType: "positive"
    },
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "+15%",
      changeType: "positive"
    },
    {
      title: "Total Revenue",
      value: `₦${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: "+20%",
      changeType: "positive"
    }
  ];

  const alertCards = [
    {
      title: "Pending Provider Verifications",
      value: stats.pendingProviders,
      icon: AlertCircle,
      color: "text-yellow-600",
      action: "Review Now",
      path: "/admin/providers"
    },
    {
      title: "Pending Bookings",
      value: stats.pendingBookings,
      icon: Clock,
      color: "text-blue-600",
      action: "View All",
      path: "/admin/bookings"
    },
    {
      title: "Completed Bookings",
      value: stats.completedBookings,
      icon: CheckCircle,
      color: "text-green-600",
      action: "View Details",
      path: "/admin/bookings"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's what's happening with Care Nexus Africa today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-xs text-green-600">{stat.change}</span>
                  </div>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-full`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {alertCards.map((alert, index) => (
          <Card key={index} className="border-l-4 border-l-blue-600">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <alert.icon className={`w-5 h-5 ${alert.color} mt-1`} />
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-3xl font-bold mt-2">{alert.value}</p>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => navigate(alert.path)}
              >
                {alert.action}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Provider Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((provider) => (
                <div
                  key={provider.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserCog className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{provider.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {provider.specialty || "Healthcare Provider"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        provider.status === "verified"
                          ? "default"
                          : provider.status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {provider.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/providers`)}
                    >
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardPage;