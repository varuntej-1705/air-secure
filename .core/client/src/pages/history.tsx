import { Layout } from "@/components/layout";
import { useAllCitiesWeather } from "@/hooks/use-weather";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis,
    Tooltip, ResponsiveContainer, Legend, ComposedChart, Cell
} from "recharts";
import {
    Loader2, History, TrendingDown, TrendingUp, Calendar, MapPin,
    Activity, BarChart3, Clock, ArrowUpRight, ArrowDownRight, Minus
} from "lucide-react";
import { getAQIStatus, CITY_CONFIG } from "@/lib/mockData";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Generate historical data for past 30 days
function generateHistoricalData(baseAqi: number, cityName: string, days: number = 30) {
    const data = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Create realistic variation with weekly patterns (weekends often have better air)
        const dayOfWeek = date.getDay();
        const weekendBonus = (dayOfWeek === 0 || dayOfWeek === 6) ? -15 : 0;
        const seasonalFactor = Math.sin((date.getMonth() + 1) * 0.5) * 20;
        const randomVariance = (Math.random() - 0.5) * 60;

        const aqi = Math.max(20, Math.min(500, Math.round(baseAqi + weekendBonus + seasonalFactor + randomVariance)));

        data.push({
            date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
            fullDate: date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
            dayOfWeek: date.toLocaleDateString('en-IN', { weekday: 'short' }),
            aqi,
            pm25: Math.round(aqi * 0.4 + Math.random() * 15),
            pm10: Math.round(aqi * 0.6 + Math.random() * 25),
            no2: Math.round(18 + Math.random() * 35),
            so2: Math.round(8 + Math.random() * 20),
            o3: Math.round(25 + Math.random() * 45),
            co: Math.round(400 + Math.random() * 400),
            temp: Math.round(18 + Math.random() * 15),
            humidity: Math.round(35 + Math.random() * 45),
        });
    }

    return data;
}

// Calculate statistics
function calculateStats(data: any[]) {
    if (data.length === 0) return { avg: 0, max: 0, min: 0, trend: 0 };

    const aqiValues = data.map(d => d.aqi);
    const avg = Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length);
    const max = Math.max(...aqiValues);
    const min = Math.min(...aqiValues);

    // Calculate trend (compare last 7 days vs previous 7 days)
    const last7 = aqiValues.slice(-7);
    const prev7 = aqiValues.slice(-14, -7);
    const last7Avg = last7.reduce((a, b) => a + b, 0) / last7.length;
    const prev7Avg = prev7.length > 0 ? prev7.reduce((a, b) => a + b, 0) / prev7.length : last7Avg;
    const trend = Math.round(((last7Avg - prev7Avg) / prev7Avg) * 100);

    return { avg, max, min, trend };
}

export default function HistoryDashboard() {
    const { cities, isLoading } = useAllCitiesWeather();
    const [selectedCity, setSelectedCity] = useState<string>("all");
    const [timeRange, setTimeRange] = useState<string>("30");

    const historicalData = useMemo(() => {
        if (!cities.length) return [];

        const days = parseInt(timeRange);

        if (selectedCity === "all") {
            return cities.map(city => ({
                cityName: city.name,
                cityId: city.id,
                data: generateHistoricalData(city.aqi, city.name, days),
                currentAqi: city.aqi
            }));
        } else {
            const city = cities.find(c => c.id === selectedCity);
            if (!city) return [];
            return [{
                cityName: city.name,
                cityId: city.id,
                data: generateHistoricalData(city.aqi, city.name, days),
                currentAqi: city.aqi
            }];
        }
    }, [cities, selectedCity, timeRange]);

    // Combined chart data
    const combinedChartData = useMemo(() => {
        if (historicalData.length === 0) return [];

        const dates = historicalData[0].data.map(d => d.date);
        return dates.map((date, index) => {
            const dataPoint: any = { date };
            historicalData.forEach(h => {
                dataPoint[h.cityName] = h.data[index]?.aqi || 0;
            });
            return dataPoint;
        });
    }, [historicalData]);

    // Statistics for all cities
    const cityStats = useMemo(() => {
        return historicalData.map(h => ({
            name: h.cityName,
            id: h.cityId,
            currentAqi: h.currentAqi,
            ...calculateStats(h.data)
        }));
    }, [historicalData]);

    // Day of week analysis
    const dayOfWeekAnalysis = useMemo(() => {
        if (historicalData.length === 0) return [];

        const allData = historicalData.flatMap(h => h.data);
        const dayGroups: { [key: string]: number[] } = {};

        allData.forEach(d => {
            if (!dayGroups[d.dayOfWeek]) dayGroups[d.dayOfWeek] = [];
            dayGroups[d.dayOfWeek].push(d.aqi);
        });

        const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return dayOrder.map(day => ({
            day,
            avgAqi: dayGroups[day] ? Math.round(dayGroups[day].reduce((a, b) => a + b, 0) / dayGroups[day].length) : 0
        }));
    }, [historicalData]);

    const cityColors = [
        "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6",
        "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
        "#14b8a6", "#a855f7"
    ];

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-[50vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    const overallStats = calculateStats(historicalData.flatMap(h => h.data));

    return (
        <Layout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
                            <History className="h-8 w-8 text-primary" />
                            Historical Data
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Past air quality trends and pollutant analysis
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-[140px]">
                                <Clock className="h-4 w-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">Last 7 days</SelectItem>
                                <SelectItem value="14">Last 14 days</SelectItem>
                                <SelectItem value="30">Last 30 days</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={selectedCity} onValueChange={setSelectedCity}>
                            <SelectTrigger className="w-[180px]">
                                <MapPin className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Cities</SelectItem>
                                {CITY_CONFIG.map(city => (
                                    <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="glass-panel">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-xl ${getAQIStatus(overallStats.avg).bg}`}>
                                    <Activity className={`h-6 w-6 ${getAQIStatus(overallStats.avg).color}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Average AQI</p>
                                    <p className="text-2xl font-bold">{overallStats.avg}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-panel">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-red-100">
                                    <TrendingUp className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Peak AQI</p>
                                    <p className="text-2xl font-bold">{overallStats.max}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-panel">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-green-100">
                                    <TrendingDown className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Lowest AQI</p>
                                    <p className="text-2xl font-bold">{overallStats.min}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-panel">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-xl ${overallStats.trend > 0 ? 'bg-red-100' : overallStats.trend < 0 ? 'bg-green-100' : 'bg-gray-100'}`}>
                                    {overallStats.trend > 0 ? (
                                        <ArrowUpRight className="h-6 w-6 text-red-600" />
                                    ) : overallStats.trend < 0 ? (
                                        <ArrowDownRight className="h-6 w-6 text-green-600" />
                                    ) : (
                                        <Minus className="h-6 w-6 text-gray-600" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">7-Day Trend</p>
                                    <p className="text-2xl font-bold">{overallStats.trend > 0 ? '+' : ''}{overallStats.trend}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Charts */}
                <Tabs defaultValue="timeline" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="timeline">Timeline View</TabsTrigger>
                        <TabsTrigger value="comparison">City Comparison</TabsTrigger>
                        <TabsTrigger value="pollutants">Pollutants</TabsTrigger>
                        <TabsTrigger value="patterns">Patterns</TabsTrigger>
                    </TabsList>

                    <TabsContent value="timeline">
                        <Card className="glass-panel">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    AQI Timeline
                                </CardTitle>
                                <CardDescription>
                                    Historical air quality index over the past {timeRange} days
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={combinedChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <defs>
                                                {historicalData.slice(0, 6).map((h, i) => (
                                                    <linearGradient key={h.cityName} id={`histGradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={cityColors[i]} stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor={cityColors[i]} stopOpacity={0} />
                                                    </linearGradient>
                                                ))}
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                                            <YAxis label={{ value: 'AQI', angle: -90, position: 'insideLeft' }} />
                                            <Tooltip
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                    backgroundColor: 'rgba(255,255,255,0.95)'
                                                }}
                                            />
                                            <Legend />
                                            {historicalData.slice(0, 6).map((h, i) => (
                                                <Area
                                                    key={h.cityName}
                                                    type="monotone"
                                                    dataKey={h.cityName}
                                                    stroke={cityColors[i]}
                                                    fill={`url(#histGradient-${i})`}
                                                    strokeWidth={2}
                                                />
                                            ))}
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="comparison">
                        <Card className="glass-panel">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    City Comparison
                                </CardTitle>
                                <CardDescription>Average AQI comparison across cities</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={cityStats} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" interval={0} />
                                            <YAxis label={{ value: 'AQI', angle: -90, position: 'insideLeft' }} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                                                formatter={(value: number, name: string) => [value, name === 'avg' ? 'Average AQI' : name]}
                                            />
                                            <Bar dataKey="avg" name="Average AQI" radius={[4, 4, 0, 0]}>
                                                {cityStats.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={getAQIStatus(entry.avg).var === 'good' ? '#22c55e' :
                                                            getAQIStatus(entry.avg).var === 'moderate' ? '#f59e0b' :
                                                                getAQIStatus(entry.avg).var === 'unhealthy' ? '#ef4444' : '#7c2d12'}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="pollutants">
                        <Card className="glass-panel">
                            <CardHeader>
                                <CardTitle>Pollutant Breakdown</CardTitle>
                                <CardDescription>Historical pollutant levels over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={historicalData[0]?.data || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <defs>
                                                <linearGradient id="histPm25" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="histPm10" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="histNo2" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="histO3" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                                            <YAxis label={{ value: 'μg/m³', angle: -90, position: 'insideLeft' }} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
                                            <Legend />
                                            <Area type="monotone" dataKey="pm25" name="PM2.5" stroke="#ef4444" fill="url(#histPm25)" strokeWidth={2} />
                                            <Area type="monotone" dataKey="pm10" name="PM10" stroke="#f59e0b" fill="url(#histPm10)" strokeWidth={2} />
                                            <Area type="monotone" dataKey="no2" name="NO₂" stroke="#8b5cf6" fill="url(#histNo2)" strokeWidth={2} />
                                            <Area type="monotone" dataKey="o3" name="O₃" stroke="#06b6d4" fill="url(#histO3)" strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="patterns">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="glass-panel">
                                <CardHeader>
                                    <CardTitle>Day of Week Pattern</CardTitle>
                                    <CardDescription>Average AQI by day of the week</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={dayOfWeekAnalysis} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                                <XAxis dataKey="day" />
                                                <YAxis label={{ value: 'AQI', angle: -90, position: 'insideLeft' }} />
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
                                                <Bar dataKey="avgAqi" name="Average AQI" radius={[4, 4, 0, 0]}>
                                                    {dayOfWeekAnalysis.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.day === 'Sat' || entry.day === 'Sun' ? '#22c55e' : '#3b82f6'}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2 text-center">
                                        🌿 Weekend days typically show better air quality due to reduced traffic
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="glass-panel">
                                <CardHeader>
                                    <CardTitle>City Rankings</CardTitle>
                                    <CardDescription>Based on average historical AQI</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Rank</TableHead>
                                                <TableHead>City</TableHead>
                                                <TableHead>Avg AQI</TableHead>
                                                <TableHead>Trend</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cityStats
                                                .sort((a, b) => a.avg - b.avg)
                                                .slice(0, 10)
                                                .map((city, index) => (
                                                    <TableRow key={city.id}>
                                                        <TableCell>
                                                            <Badge variant={index < 3 ? "default" : "secondary"}>
                                                                #{index + 1}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-medium">{city.name}</TableCell>
                                                        <TableCell>
                                                            <span className={getAQIStatus(city.avg).color}>{city.avg}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                {city.trend > 0 ? (
                                                                    <ArrowUpRight className="h-4 w-4 text-red-500" />
                                                                ) : city.trend < 0 ? (
                                                                    <ArrowDownRight className="h-4 w-4 text-green-500" />
                                                                ) : (
                                                                    <Minus className="h-4 w-4 text-gray-500" />
                                                                )}
                                                                <span className={city.trend > 0 ? 'text-red-500' : city.trend < 0 ? 'text-green-500' : ''}>
                                                                    {city.trend > 0 ? '+' : ''}{city.trend}%
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Detailed Data Table */}
                <Card className="glass-panel">
                    <CardHeader>
                        <CardTitle>Detailed Historical Records</CardTitle>
                        <CardDescription>Complete daily records for {selectedCity === "all" ? "all cities" : historicalData[0]?.cityName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-[400px] overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="sticky top-0 bg-background">Date</TableHead>
                                        <TableHead className="sticky top-0 bg-background">AQI</TableHead>
                                        <TableHead className="sticky top-0 bg-background">Status</TableHead>
                                        <TableHead className="sticky top-0 bg-background">PM2.5</TableHead>
                                        <TableHead className="sticky top-0 bg-background">PM10</TableHead>
                                        <TableHead className="sticky top-0 bg-background">NO₂</TableHead>
                                        <TableHead className="sticky top-0 bg-background">O₃</TableHead>
                                        <TableHead className="sticky top-0 bg-background">Temp</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(historicalData[0]?.data || []).slice().reverse().map((day, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{day.fullDate}</TableCell>
                                            <TableCell className={`font-bold ${getAQIStatus(day.aqi).color}`}>{day.aqi}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getAQIStatus(day.aqi).color}>
                                                    {getAQIStatus(day.aqi).label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{day.pm25}</TableCell>
                                            <TableCell>{day.pm10}</TableCell>
                                            <TableCell>{day.no2}</TableCell>
                                            <TableCell>{day.o3}</TableCell>
                                            <TableCell>{day.temp}°C</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
