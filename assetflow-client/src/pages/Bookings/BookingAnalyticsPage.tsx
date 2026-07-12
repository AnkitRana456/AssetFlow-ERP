import { useMemo } from 'react';
import { useBookings } from '../../hooks/bookingHooks';

import { useAssets } from '../../hooks/assetHooks';
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  CalendarDays, TrendingUp, Building, 
  Award, BarChart3, ChevronLeft,
  Clock, Sparkles, MonitorSmartphone
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';


export function BookingAnalyticsPage() {
  const navigate = useNavigate();

  // Load bookings list (load a larger sample for analytical fidelity)
  const { data: bookingsData, isLoading: bookingsLoading } = useBookings({ limit: 1000 });
  const { data: assetsData, isLoading: assetsLoading } = useAssets({ limit: 100 });

  const bookings = bookingsData?.bookings || [];
  const assets = assetsData?.data || [];

  // Compute Dashboard Metrics
  const metrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    let todayBookings = 0;
    let upcoming = 0;
    let ongoing = 0;
    let cancelled = 0;
    const resourceCounts: Record<string, number> = {};

    bookings.forEach((b: any) => {
      const bDate = new Date(b.startTime).toISOString().split('T')[0];
      if (bDate === todayStr) {
        todayBookings++;
      }

      if (b.status === 'UPCOMING') upcoming++;
      else if (b.status === 'ONGOING') ongoing++;
      else if (b.status === 'CANCELLED') cancelled++;

      if (b.resource?.name) {
        resourceCounts[b.resource.name] = (resourceCounts[b.resource.name] || 0) + 1;
      }
    });

    // Find Most Booked Resource
    let mostBookedResource = 'N/A';
    let maxCount = 0;
    Object.entries(resourceCounts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostBookedResource = name;
      }
    });

    // Resource utilization rate: Bookable resources that have at least one booking
    const bookableAssets = assets.filter((a: any) => a.bookable);
    const uniqueBookedResources = new Set(bookings.map((b: any) => b.resource?._id?.toString()));
    const utilizedCount = bookableAssets.filter((a: any) => uniqueBookedResources.has(a._id.toString())).length;
    const utilizationRate = bookableAssets.length > 0 
      ? Math.round((utilizedCount / bookableAssets.length) * 100) 
      : 0;

    return {
      todayBookings,
      upcoming,
      ongoing,
      cancelled,
      mostBookedResource,
      utilizationRate,
      totalBookable: bookableAssets.length
    };
  }, [bookings, assets]);

  // Chart 1: Daily Booking Trend (Last 7 Days)
  const dailyTrendData = useMemo(() => {
    const counts: Record<string, number> = {};
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    last7Days.forEach(date => {
      counts[date] = 0;
    });

    bookings.forEach((b: any) => {
      const bDate = new Date(b.startTime).toISOString().split('T')[0];
      if (counts[bDate] !== undefined && b.status !== 'CANCELLED') {
        counts[bDate]++;
      }
    });

    return last7Days.map(date => ({
      date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      Bookings: counts[date]
    }));
  }, [bookings]);

  // Chart 2: Department Usage Distribution (Pie Chart)
  const departmentUsageData = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach((b: any) => {
      if (b.status !== 'CANCELLED') {
        const deptName = b.department?.code || 'Other';
        counts[deptName] = (counts[deptName] || 0) + 1;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [bookings]);

  // Chart 3: Peak Hours analysis
  const peakHoursData = useMemo(() => {
    const hourlyCounts = Array.from({ length: 12 }).map((_, idx) => ({
      hour: `${idx + 8}:00`,
      Bookings: 0
    }));

    bookings.forEach((b: any) => {
      if (b.status !== 'CANCELLED') {
        const startHour = new Date(b.startTime).getHours();
        if (startHour >= 8 && startHour < 20) {
          hourlyCounts[startHour - 8].Bookings++;
        }
      }
    });

    return hourlyCounts;
  }, [bookings]);

  // Chart 4: Most and Least Used Resources (Bar Chart)
  const resourceRankings = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach((b: any) => {
      if (b.status !== 'CANCELLED' && b.resource?.name) {
        counts[b.resource.name] = (counts[b.resource.name] || 0) + 1;
      }
    });

    const sorted = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      mostUsed: sorted.slice(0, 5),
      leastUsed: sorted.slice(-5).reverse()
    };
  }, [bookings]);

  // Heatmap Distribution Data: Days of the week vs hours of day
  const heatmapData = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const grid = days.map(day => ({
      day: day.slice(0, 3),
      'Morning (8am-12pm)': 0,
      'Afternoon (12pm-4pm)': 0,
      'Evening (4pm-8pm)': 0
    }));

    bookings.forEach((b: any) => {
      if (b.status !== 'CANCELLED') {
        const start = new Date(b.startTime);
        const dayIdx = start.getDay();
        const hour = start.getHours();

        if (hour >= 8 && hour < 12) {
          grid[dayIdx]['Morning (8am-12pm)']++;
        } else if (hour >= 12 && hour < 16) {
          grid[dayIdx]['Afternoon (12pm-4pm)']++;
        } else if (hour >= 16 && hour < 20) {
          grid[dayIdx]['Evening (4pm-8pm)']++;
        }
      }
    });

    return grid;
  }, [bookings]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

  if (bookingsLoading || assetsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-semibold font-mono">Loading data engines...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/bookings')}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-4.5 w-4.5" />
          Back to Bookings Workspace
        </button>

        <span className="flex items-center gap-1 text-xs text-indigo-500 font-bold bg-indigo-500/5 px-3 py-1 rounded-full border border-indigo-500/10">
          <Sparkles className="h-4 w-4 animate-pulse" />
          Live Analytics Engine
        </span>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's bookings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Today's Bookings</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{metrics.todayBookings}</span>
            <p className="text-[9px] text-slate-500">Scheduled events for today</p>
          </div>
          <div className="h-10 w-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform">
            <CalendarDays className="h-5 w-5" />
          </div>
        </div>

        {/* Active ongoing */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Active Sequences</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{metrics.upcoming + metrics.ongoing}</span>
            <p className="text-[9px] text-slate-500">{metrics.ongoing} ongoing, {metrics.upcoming} pending</p>
          </div>
          <div className="h-10 w-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* Utilization */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Resources Utilized</span>
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{metrics.utilizationRate}%</span>
            <p className="text-[9px] text-slate-500">{metrics.totalBookable} bookable resources total</p>
          </div>
          <div className="h-10 w-10 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center border border-blue-500/20 group-hover:scale-105 transition-transform">
            <MonitorSmartphone className="h-5 w-5" />
          </div>
        </div>

        {/* Most Booked */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Most Booked Resource</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 truncate max-w-[150px] block">{metrics.mostBookedResource}</span>
            <p className="text-[9px] text-slate-550">Top occupied shared resource</p>
          </div>
          <div className="h-10 w-10 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center border border-purple-500/20 group-hover:scale-105 transition-transform">
            <Award className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Daily Booking Trend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-4.5 w-4.5 text-indigo-500" />
              Daily Booking Trend (Last 7 Days)
            </h3>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="Bookings" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorBookings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Peak Hours of Day */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-4.5 w-4.5 text-indigo-500" />
            Peak Scheduling Hours (Daily Timeline)
          </h3>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="Bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Department Usage */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <Building className="h-4.5 w-4.5 text-indigo-500" />
            Department Booking Frequency
          </h3>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs">
            {departmentUsageData.length === 0 ? (
              <p className="text-slate-450 italic">No departmental booking records registered.</p>
            ) : (
              <>
                <div className="h-full w-full sm:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentUsageData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {departmentUsageData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 flex flex-col gap-2">
                  {departmentUsageData.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="font-semibold text-slate-650 dark:text-slate-350">{entry.name}</span>
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-100">{entry.value} Bookings</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chart 4: Resource Occupancy Rankings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="h-4.5 w-4.5 text-indigo-500" />
            Resource Occupancy Rankings
          </h3>
          <div className="h-64 flex flex-col justify-center divide-y divide-slate-100 dark:divide-slate-850">
            {resourceRankings.mostUsed.length === 0 ? (
              <p className="text-xs text-slate-450 italic text-center">No resource records computed yet.</p>
            ) : (
              resourceRankings.mostUsed.map((row, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-400 w-4">#{idx + 1}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{row.name}</span>
                  </div>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-550/5 dark:bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/10">
                    {row.count} Occupations
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Grid Heatmap Distribution */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <CalendarDays className="h-4.5 w-4.5 text-indigo-500" />
            Booking Distribution Heatmap (Days vs Time Window)
          </h3>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatmapData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Morning (8am-12pm)" fill="#60a5fa" stackId="a" />
                <Bar dataKey="Afternoon (12pm-4pm)" fill="#818cf8" stackId="a" />
                <Bar dataKey="Evening (4pm-8pm)" fill="#a78bfa" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
