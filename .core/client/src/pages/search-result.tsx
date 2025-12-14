import { getAQIStatus, CityData } from "@/lib/mockData";
import { Layout } from "@/components/layout";
import { useRoute } from "wouter";
import { AQICard } from "@/components/aqi-card";
import { WeatherCard } from "@/components/weather-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Info, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config";

export default function SearchResult() {
    const [match, params] = useRoute("/search/:city");
    const cityName = params?.city ? decodeURIComponent(params.city) : "";

    const { data: city, isLoading, isError } = useQuery({
        queryKey: ["search-weather", cityName],
        queryFn: async () => {
            const res = await fetch(`${API_ENDPOINTS.weather}/${encodeURIComponent(cityName)}`);
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json() as Promise<CityData>;
        },
        enabled: !!cityName,
        staleTime: 5 * 60 * 1000,
    });

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
                    <h2 className="text-2xl font-bold">City not found</h2>
                    <p className="text-muted-foreground mt-2">Could not fetch weather data for "{cityName}".</p>
                    <div className="mt-4">
                        <Link href="/">
                            <span className="text-primary hover:underline cursor-pointer">Back to Home</span>
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
                <Link href="/">
                    <div className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground cursor-pointer mb-4">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </div>
                </Link>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-bold">{city.name}</h1>
                        <p className="text-muted-foreground">{city.state}</p>
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
                                Health Advice
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-slate-300">
                            {city.aqi > 150 ? (
                                <>
                                    <p>• Avoid prolonged outdoor exertion.</p>
                                    <p>• Wear a mask if you step outside.</p>
                                    <p>• Keep windows closed to avoid pollution entering indoors.</p>
                                    <p>• Use an air purifier if available.</p>
                                </>
                            ) : city.aqi > 100 ? (
                                <>
                                    <p>• Sensitive groups should reduce outdoor exercise.</p>
                                    <p>• It's okay to be outside, but take breaks.</p>
                                    <p>• Watch for symptoms like coughing or shortness of breath.</p>
                                </>
                            ) : (
                                <>
                                    <p>• Air quality is acceptable.</p>
                                    <p>• Perfect weather for outdoor activities.</p>
                                    <p>• Open windows to let fresh air in.</p>
                                </>
                            )}

                            <div className="mt-6 p-4 rounded-lg bg-white/10 backdrop-blur-sm">
                                <div className="text-sm font-semibold text-white mb-1">Real-Time Data</div>
                                <div className="text-sm opacity-80">
                                    This data is fetched live from WeatherAPI for {city.name}.
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
