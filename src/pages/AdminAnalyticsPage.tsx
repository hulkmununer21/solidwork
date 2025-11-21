import { useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Activity,
  MapPin,
  Download,
  BarChart3,
  PieChart,
  LineChart,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsData {
  userGrowth: {
    date: string;
    patients: number;
    providers: number;
  }[];
  bookingTrends: {
    date: string;
    bookings: number;
    completed: number;
    cancelled: number;
  }[];
  revenueData: {
    date: string;
    revenue: number;
    platformEarnings: number;
  }[];
  providerPerformance: {
    provider_name: string;
    total_bookings: number;
    completed_bookings: number;
    revenue: number;
    rating: number;
  }[];
  popularServices: {
    specialty: string;
    count: number;
  }[];
  geographicData: {
    location: string;
    patients: number;
    providers: number;
  }[];
  systemHealth: {
    totalUsers: number;
    activeUsers: number;
    totalBookings: number;
    completionRate: number;
    averageBookingValue: number;
    paymentSuccessRate: number;
  };
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF6B9D",
];

const AdminAnalyticsPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userGrowth: [],
    bookingTrends: [],
    revenueData: [],
    providerPerformance: [],
    popularServices: [],
    geographicData: [],
    systemHealth: {
      totalUsers: 0,
      activeUsers: 0,
      totalBookings: 0,
      completionRate: 0,
      averageBookingValue: 0,
      paymentSuccessRate: 0,
    },
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const daysAgo = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Fetch user growth data
      const userGrowth = await fetchUserGrowth(startDate);

      // Fetch booking trends
      const bookingTrends = await fetchBookingTrends(startDate);

      // Fetch revenue data
      const revenueData = await fetchRevenueData(startDate);

      // Fetch provider performance
      const providerPerformance = await fetchProviderPerformance();

      // Fetch popular services
      const popularServices = await fetchPopularServices();

      // Fetch geographic distribution
      const geographicData = await fetchGeographicData();

      // Fetch system health metrics
      const systemHealth = await fetchSystemHealth();

      setAnalytics({
        userGrowth,
        bookingTrends,
        revenueData,
        providerPerformance,
        popularServices,
        geographicData,
        systemHealth,
      });
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserGrowth = async (startDate: Date) => {
    try {
      const { data: patients } = await supabase
        .from("patient_profiles")
        .select("created_at")
        .gte("created_at", startDate.toISOString());

      const { data: providers } = await supabase
        .from("provider_profiles")
        .select("created_at")
        .gte("created_at", startDate.toISOString());

      // Group by date
      const dateMap = new Map<string, { patients: number; providers: number }>();

      patients?.forEach((p) => {
        const date = new Date(p.created_at).toLocaleDateString();
        const current = dateMap.get(date) || { patients: 0, providers: 0 };
        dateMap.set(date, { ...current, patients: current.patients + 1 });
      });

      providers?.forEach((p) => {
        const date = new Date(p.created_at).toLocaleDateString();
        const current = dateMap.get(date) || { patients: 0, providers: 0 };
        dateMap.set(date, { ...current, providers: current.providers + 1 });
      });

      return Array.from(dateMap.entries())
        .map(([date, counts]) => ({
          date,
          patients: counts.patients,
          providers: counts.providers,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error("Error fetching user growth:", error);
      return [];
    }
  };

  const fetchBookingTrends = async (startDate: Date) => {
    try {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("created_at, status")
        .gte("created_at", startDate.toISOString());

      const dateMap = new Map<
        string,
        { bookings: number; completed: number; cancelled: number }
      >();

      bookings?.forEach((b) => {
        const date = new Date(b.created_at).toLocaleDateString();
        const current = dateMap.get(date) || {
          bookings: 0,
          completed: 0,
          cancelled: 0,
        };
        dateMap.set(date, {
          bookings: current.bookings + 1,
          completed:
            current.completed + (b.status === "completed" ? 1 : 0),
          cancelled:
            current.cancelled + (b.status === "cancelled" ? 1 : 0),
        });
      });

      return Array.from(dateMap.entries())
        .map(([date, counts]) => ({
          date,
          ...counts,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error("Error fetching booking trends:", error);
      return [];
    }
  };

  const fetchRevenueData = async (startDate: Date) => {
    try {
      const { data: payments } = await supabase
        .from("payments")
        .select("created_at, amount, status")
        .gte("created_at", startDate.toISOString())
        .eq("status", "paid");

      const dateMap = new Map<string, { revenue: number; platformEarnings: number }>();

      payments?.forEach((p) => {
        const date = new Date(p.created_at).toLocaleDateString();
        const current = dateMap.get(date) || { revenue: 0, platformEarnings: 0 };
        const revenue = p.amount || 0;
        dateMap.set(date, {
          revenue: current.revenue + revenue,
          platformEarnings: current.platformEarnings + revenue * 0.1,
        });
      });

      return Array.from(dateMap.entries())
        .map(([date, amounts]) => ({
          date,
          ...amounts,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      return [];
    }
  };

  const fetchProviderPerformance = async () => {
    try {
      const { data: providers } = await supabase
        .from("provider_profiles")
        .select("id, name");

      if (!providers) return [];

      const performanceData = await Promise.all(
        providers.map(async (provider) => {
          const { data: bookings } = await supabase
            .from("bookings")
            .select("status")
            .eq("provider_id", provider.id);

          const { data: payments } = await supabase
            .from("payments")
            .select("amount")
            .eq("provider_id", provider.id)
            .eq("status", "paid");

          const totalBookings = bookings?.length || 0;
          const completedBookings =
            bookings?.filter((b) => b.status === "completed").length || 0;
          const revenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

          return {
            provider_name: provider.name || "Unknown",
            total_bookings: totalBookings,
            completed_bookings: completedBookings,
            revenue,
            rating: completedBookings > 0 ? (completedBookings / totalBookings) * 5 : 0,
          };
        })
      );

      return performanceData
        .filter((p) => p.total_bookings > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
    } catch (error) {
      console.error("Error fetching provider performance:", error);
      return [];
    }
  };

  const fetchPopularServices = async () => {
    try {
      const { data: providers } = await supabase
        .from("provider_profiles")
        .select("specialty");

      if (!providers) return [];

      const specialtyCount = new Map<string, number>();

      providers.forEach((p) => {
        if (p.specialty) {
          const current = specialtyCount.get(p.specialty) || 0;
          specialtyCount.set(p.specialty, current + 1);
        }
      });

      return Array.from(specialtyCount.entries())
        .map(([specialty, count]) => ({ specialty, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    } catch (error) {
      console.error("Error fetching popular services:", error);
      return [];
    }
  };

  const fetchGeographicData = async () => {
    try {
      const { data: patients } = await supabase
        .from("patient_profiles")
        .select("address");

      const { data: providers } = await supabase
        .from("provider_profiles")
        .select("id");

      // Extract location from address (simplified - get first word/city)
      const locationMap = new Map<string, { patients: number; providers: number }>();

      patients?.forEach((p) => {
        if (p.address) {
          const location = p.address.split(",")[0].trim() || "Unknown";
          const current = locationMap.get(location) || { patients: 0, providers: 0 };
          locationMap.set(location, { ...current, patients: current.patients + 1 });
        }
      });

      // For demo purposes, distribute providers across top locations
      const topLocations = Array.from(locationMap.entries())
        .sort((a, b) => b[1].patients - a[1].patients)
        .slice(0, 10);

      return topLocations.map(([location, counts]) => ({
        location,
        patients: counts.patients,
        providers: Math.floor(Math.random() * 10) + 1, // Mock data
      }));
    } catch (error) {
      console.error("Error fetching geographic data:", error);
      return [];
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const { data: patients } = await supabase
        .from("patient_profiles")
        .select("id, status");

      const { data: providers } = await supabase
        .from("provider_profiles")
        .select("id, status");

      const { data: bookings } = await supabase.from("bookings").select("status");

      const { data: payments } = await supabase.from("payments").select("status, amount");

      const totalUsers = (patients?.length || 0) + (providers?.length || 0);
      const activeUsers =
        (patients?.filter((p) => p.status === "active").length || 0) +
        (providers?.filter((p) => p.status === "verified").length || 0);

      const totalBookings = bookings?.length || 0;
      const completedBookings =
        bookings?.filter((b) => b.status === "completed").length || 0;
      const completionRate =
        totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

      const paidPayments = payments?.filter((p) => p.status === "paid") || [];
      const averageBookingValue =
        paidPayments.length > 0
          ? paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0) /
            paidPayments.length
          : 0;

      const paymentSuccessRate =
        payments && payments.length > 0
          ? (paidPayments.length / payments.length) * 100
          : 0;

      return {
        totalUsers,
        activeUsers,
        totalBookings,
        completionRate,
        averageBookingValue,
        paymentSuccessRate,
      };
    } catch (error) {
      console.error("Error fetching system health:", error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalBookings: 0,
        completionRate: 0,
        averageBookingValue: 0,
        paymentSuccessRate: 0,
      };
    }
  };

  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeRange: `${timeRange} days`,
      systemHealth: analytics.systemHealth,
      topProviders: analytics.providerPerformance.slice(0, 5),
      popularServices: analytics.popularServices,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics_report_${new Date().toISOString().split("T")[0]}.json`;
    a.click();

    toast({
      title: "Report Exported",
      description: "Analytics report has been downloaded.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics & Insights</h1>
          <p className="text-muted-foreground mt-1">
            Platform performance and business intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* System Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold mt-1">
                  {analytics.systemHealth.totalUsers.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {analytics.systemHealth.activeUsers} active
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold mt-1">
                  {analytics.systemHealth.totalBookings.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {analytics.systemHealth.completionRate.toFixed(1)}% completion
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Booking Value</p>
                <p className="text-2xl font-bold mt-1">
                  ₦{analytics.systemHealth.averageBookingValue.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {analytics.systemHealth.paymentSuccessRate.toFixed(1)}% success rate
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="w-5 h-5" />
            User Growth Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={analytics.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="patients"
                stroke="#0088FE"
                name="Patients"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="providers"
                stroke="#00C49F"
                name="Providers"
                strokeWidth={2}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Booking Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Booking Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.bookingTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="bookings" fill="#8884D8" name="Total Bookings" />
              <Bar dataKey="completed" fill="#82CA9D" name="Completed" />
              <Bar dataKey="cancelled" fill="#FF8042" name="Cancelled" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Revenue Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={analytics.revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#82CA9D"
                name="Total Revenue"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="platformEarnings"
                stroke="#0088FE"
                name="Platform Earnings"
                strokeWidth={2}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Popular Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={analytics.popularServices}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.specialty}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.popularServices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Geographic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.geographicData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="location" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="patients" fill="#0088FE" name="Patients" />
                <Bar dataKey="providers" fill="#00C49F" name="Providers" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Provider Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Top Provider Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Provider</th>
                  <th className="text-right p-3">Total Bookings</th>
                  <th className="text-right p-3">Completed</th>
                  <th className="text-right p-3">Revenue</th>
                  <th className="text-right p-3">Rating</th>
                </tr>
              </thead>
              <tbody>
                {analytics.providerPerformance.map((provider, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{provider.provider_name}</td>
                    <td className="text-right p-3">{provider.total_bookings}</td>
                    <td className="text-right p-3">{provider.completed_bookings}</td>
                    <td className="text-right p-3">
                      ₦{provider.revenue.toLocaleString()}
                    </td>
                    <td className="text-right p-3">
                      <span className="text-yellow-600">
                        {provider.rating.toFixed(1)} ⭐
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalyticsPage;