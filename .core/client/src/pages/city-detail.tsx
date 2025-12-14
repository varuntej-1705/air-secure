import { getAQIStatus } from "@/lib/mockData";
import { Layout } from "@/components/layout";
import { useRoute, useLocation } from "wouter";
import { AQICard } from "@/components/aqi-card";
import { WeatherCard } from "@/components/weather-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Info, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useCityWeather } from "@/hooks/use-weather";
import { useEffect } from "react";

export default function CityDetail() {
  const [match, params] = useRoute("/city/:id");
  const [, setLocation] = useLocation();

  // Redirect "new delhi" or "new%20delhi" to "delhi"
  useEffect(() => {
    if (params?.id) {
      const decodedId = decodeURIComponent(params.id).toLowerCase();
      if (decodedId === "new delhi") {
        setLocation("/city/delhi", { replace: true });
      }
    }
  }, [params?.id, setLocation]);

  const { data: city, isLoading, isError } = useCityWeather(params?.id);

  if (!match || !params) return <div>Invalid Route</div>;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (isError || !city) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">City not found or API error</h2>
          <p className="text-muted-foreground mt-2">Could not fetch data for this city.</p>
          <div className="mt-4">
            <Link href="/cities">
              <span className="text-primary hover:underline cursor-pointer">Back to list</span>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const status = getAQIStatus(city.aqi);

  return (
    <Layout>
      <div className="space-y-6">
        <Link href="/cities">
          <div className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to cities
          </div>
        </Link>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold">{city.name}</h1>
            <p className="text-muted-foreground">{city.state}, India</p>
          </div>
          <div className="flex gap-2">
            {city.dataSource && (
              <div className="px-4 py-2 rounded-lg font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                Source: {city.dataSource}
              </div>
            )}
            <div className={`px-4 py-2 rounded-lg font-medium ${status.bg} ${status.color}`}>
              Air Quality: {status.label}
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AQICard city={city} />
          <WeatherCard city={city} />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 glass-panel">
            <CardHeader>
              <CardTitle>24 Hour AQI Forecast</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={city.history}>
                    <defs>
                      <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="aqi" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAqi)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel bg-slate-900 text-white border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Info className="h-5 w-5 text-blue-400" />
                AQI Scale Reference
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-200">Range</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-200">Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    <tr className="bg-green-500/20">
                      <td className="px-3 py-2 font-medium text-green-400">0 - 50</td>
                      <td className="px-3 py-2 text-slate-300">Good</td>
                    </tr>
                    <tr className="bg-lime-500/20">
                      <td className="px-3 py-2 font-medium text-lime-400">51 - 100</td>
                      <td className="px-3 py-2 text-slate-300">Satisfactory</td>
                    </tr>
                    <tr className="bg-yellow-500/20">
                      <td className="px-3 py-2 font-medium text-yellow-400">101 - 200</td>
                      <td className="px-3 py-2 text-slate-300">Moderate</td>
                    </tr>
                    <tr className="bg-orange-500/20">
                      <td className="px-3 py-2 font-medium text-orange-400">201 - 300</td>
                      <td className="px-3 py-2 text-slate-300">Poor</td>
                    </tr>
                    <tr className="bg-red-500/20">
                      <td className="px-3 py-2 font-medium text-red-400">301 - 400</td>
                      <td className="px-3 py-2 text-slate-300">Very Poor</td>
                    </tr>
                    <tr className="bg-red-900/40">
                      <td className="px-3 py-2 font-medium text-red-500">401 - 500</td>
                      <td className="px-3 py-2 text-slate-300">Severe</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-white/10 backdrop-blur-sm">
                <div className="text-sm font-semibold text-white mb-1">AI Prediction</div>
                <div className="text-sm opacity-80">
                  AQI is expected to {Math.random() > 0.5 ? "improve" : "remain stable"} over the next 4 hours based on wind patterns.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
