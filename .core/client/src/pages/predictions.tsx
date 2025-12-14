import { Layout } from "@/components/layout";
import { useAllCitiesWeather } from "@/hooks/use-weather";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis,
    Tooltip, ResponsiveContainer, Legend, ComposedChart
} from "recharts";
import {
    Loader2, TrendingUp, AlertTriangle, Heart, Thermometer, Wind,
    Droplets, Shield, Activity, Calendar, MapPin
} from "lucide-react";
import { getAQIStatus, CITY_CONFIG } from "@/lib/mockData";
import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

// Generate 7-day forecast data based on current AQI
function generateForecast(baseAqi: number, cityName: string) {
    const days = ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
    const weatherConditions = ['Clear', 'Cloudy', 'Partly Cloudy', 'Rain'];

    return days.map((day, index) => {
        // Add some realistic variance - AQI tends to vary day to day
        const variance = Math.sin(index * 0.8) * 30 + (Math.random() - 0.5) * 40;
        const predictedAqi = Math.max(20, Math.min(500, Math.round(baseAqi + variance)));
        const confidence = Math.max(60, 95 - index * 5); // Confidence decreases over time

        return {
            day,
            date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            }),
            predictedAqi,
            confidence,
            pm25: Math.round(predictedAqi * 0.4 + Math.random() * 20),
            pm10: Math.round(predictedAqi * 0.6 + Math.random() * 30),
            no2: Math.round(20 + Math.random() * 40),
            so2: Math.round(10 + Math.random() * 30),
            o3: Math.round(30 + Math.random() * 50),
            temp: Math.round(22 + Math.random() * 12),
            humidity: Math.round(40 + Math.random() * 40),
            windSpeed: Math.round(5 + Math.random() * 20),
            condition: weatherConditions[Math.floor(Math.random() * weatherConditions.length)]
        };
    });
}

// Get health recommendations based on AQI
function getHealthRecommendations(aqi: number) {
    if (aqi <= 50) {
        return [
            { icon: Activity, text: "Air quality is ideal for outdoor activities", type: "success" },
            { icon: Heart, text: "Perfect conditions for jogging and cycling", type: "success" },
            { icon: Shield, text: "No precautions needed", type: "success" }
        ];
    } else if (aqi <= 100) {
        return [
            { icon: Activity, text: "Outdoor activities are generally safe", type: "warning" },
            { icon: Heart, text: "Sensitive individuals should monitor symptoms", type: "warning" },
            { icon: Shield, text: "Consider reducing prolonged outdoor exertion", type: "info" }
        ];
    } else if (aqi <= 150) {
        return [
            { icon: AlertTriangle, text: "Limit prolonged outdoor exertion", type: "warning" },
            { icon: Heart, text: "People with respiratory issues should stay indoors", type: "warning" },
            { icon: Shield, text: "Consider wearing N95 masks outdoors", type: "warning" }
        ];
    } else if (aqi <= 200) {
        return [
            { icon: AlertTriangle, text: "Avoid outdoor activities", type: "error" },
            { icon: Heart, text: "Keep windows closed, use air purifiers", type: "error" },
            { icon: Shield, text: "N95 masks required if going outside", type: "error" }
        ];
    } else {
        return [
            { icon: AlertTriangle, text: "Stay indoors - hazardous conditions", type: "error" },
            { icon: Heart, text: "Seek medical attention if experiencing symptoms", type: "error" },
            { icon: Shield, text: "Avoid all outdoor activities", type: "error" }
        ];
    }
}

export default function Predictions() {
    const { cities, isLoading } = useAllCitiesWeather();
    const [selectedCity, setSelectedCity] = useState<string>("all");

    const forecasts = useMemo(() => {
        if (!cities.length) return [];

        if (selectedCity === "all") {
            // Aggregate forecast for all cities
            const allForecasts = cities.map(city => ({
                cityName: city.name,
                data: generateForecast(city.aqi, city.name)
            }));
            return allForecasts;
        } else {
            const city = cities.find(c => c.id === selectedCity);
            if (!city) return [];
            return [{ cityName: city.name, data: generateForecast(city.aqi, city.name) }];
        }
    }, [cities, selectedCity]);

    const selectedCityData = selectedCity !== "all"
        ? cities.find(c => c.id === selectedCity)
        : cities[0];

    const avgForecastAqi = forecasts.length > 0 && forecasts[0].data.length > 0
        ? Math.round(forecasts.flatMap(f => f.data).reduce((acc, d) => acc + d.predictedAqi, 0) / (forecasts.flatMap(f => f.data).length))
        : 0;

    // Chart data for combined view
    const combinedChartData = useMemo(() => {
        if (forecasts.length === 0) return [];

        const days = forecasts[0].data.map(d => d.day);
        return days.map((day, index) => {
            const dataPoint: any = { day };
            forecasts.forEach(f => {
                dataPoint[f.cityName] = f.data[index].predictedAqi;
            });
            return dataPoint;
        });
    }, [forecasts]);

    // Colors for cities
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

    const recommendations = getHealthRecommendations(avgForecastAqi);
    const worstDay = forecasts.length > 0
        ? forecasts.flatMap(f => f.data).reduce((max, d) => d.predictedAqi > max.predictedAqi ? d : max, forecasts[0].data[0])
        : null;

    return (
        <Layout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
                            <TrendingUp className="h-8 w-8 text-primary" />
                            AQI Predictions
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            7-day air quality forecast with health recommendations
                        </p>
                    </div>

                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                        <SelectTrigger className="w-[200px]">
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

                {/* Alert Banner */}
                {worstDay && worstDay.predictedAqi > 150 && (
                    <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Air Quality Warning</AlertTitle>
                        <AlertDescription>
                            {worstDay.day} ({worstDay.date}) is expected to have unhealthy air quality with AQI of {worstDay.predictedAqi}.
                            Plan indoor activities and take necessary precautions.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="glass-panel">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-xl ${getAQIStatus(avgForecastAqi).bg}`}>
                                    <Activity className={`h-6 w-6 ${getAQIStatus(avgForecastAqi).color}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Avg. Predicted AQI</p>
                                    <p className="text-2xl font-bold">{avgForecastAqi}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-panel">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-blue-100">
                                    <Thermometer className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Avg. Temperature</p>
                                    <p className="text-2xl font-bold">{forecasts[0]?.data[0]?.temp || 0}°C</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-panel">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-cyan-100">
                                    <Droplets className="h-6 w-6 text-cyan-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Avg. Humidity</p>
                                    <p className="text-2xl font-bold">{forecasts[0]?.data[0]?.humidity || 0}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-panel">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-green-100">
                                    <Wind className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Avg. Wind Speed</p>
                                    <p className="text-2xl font-bold">{forecasts[0]?.data[0]?.windSpeed || 0} km/h</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 7-Day AQI Forecast Chart */}
                    <Card className="glass-panel lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                7-Day AQI Forecast
                            </CardTitle>
                            <CardDescription>
                                Predicted Air Quality Index for {selectedCity === "all" ? "all cities" : selectedCityData?.name}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={combinedChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <defs>
                                            {forecasts.map((f, i) => (
                                                <linearGradient key={f.cityName} id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={cityColors[i % cityColors.length]} stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor={cityColors[i % cityColors.length]} stopOpacity={0} />
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
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
                                        {forecasts.slice(0, 6).map((f, i) => (
                                            <Area
                                                key={f.cityName}
                                                type="monotone"
                                                dataKey={f.cityName}
                                                stroke={cityColors[i % cityColors.length]}
                                                fill={`url(#gradient-${i})`}
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Health Recommendations */}
                    <Card className="glass-panel">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Heart className="h-5 w-5 text-red-500" />
                                Health Recommendations
                            </CardTitle>
                            <CardDescription>Based on predicted AQI levels</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                                <Badge variant={avgForecastAqi <= 50 ? "default" : avgForecastAqi <= 100 ? "secondary" : "destructive"}>
                                    {getAQIStatus(avgForecastAqi).label}
                                </Badge>
                                <span className="text-sm text-muted-foreground">Avg. AQI: {avgForecastAqi}</span>
                            </div>

                            {recommendations.map((rec, index) => (
                                <div
                                    key={index}
                                    className={`flex items-start gap-3 p-3 rounded-lg ${rec.type === 'success' ? 'bg-green-50 dark:bg-green-950/30' :
                                        rec.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-950/30' :
                                            rec.type === 'error' ? 'bg-red-50 dark:bg-red-950/30' :
                                                'bg-blue-50 dark:bg-blue-950/30'
                                        }`}
                                >
                                    <rec.icon className={`h-5 w-5 mt-0.5 ${rec.type === 'success' ? 'text-green-600' :
                                        rec.type === 'warning' ? 'text-yellow-600' :
                                            rec.type === 'error' ? 'text-red-600' :
                                                'text-blue-600'
                                        }`} />
                                    <span className="text-sm">{rec.text}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Pollutant Trends */}
                <Card className="glass-panel">
                    <CardHeader>
                        <CardTitle>Pollutant Trend Predictions</CardTitle>
                        <CardDescription>Expected pollutant levels over the next 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={forecasts[0]?.data || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="pm25Gradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="pm10Gradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="no2Gradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="so2Gradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis label={{ value: 'μg/m³', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="pm25" name="PM2.5" stroke="#ef4444" fill="url(#pm25Gradient)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="pm10" name="PM10" stroke="#f59e0b" fill="url(#pm10Gradient)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="no2" name="NO₂" stroke="#8b5cf6" fill="url(#no2Gradient)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="so2" name="SO₂" stroke="#06b6d4" fill="url(#so2Gradient)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Weather Forecast */}
                <Card className="glass-panel">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Thermometer className="h-5 w-5" />
                            Weather Forecast Impact
                        </CardTitle>
                        <CardDescription>Temperature, humidity, and wind affecting air quality</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={forecasts[0]?.data || []} margin={{ top: 20, right: 60, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis yAxisId="left" label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft' }} />
                                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Humidity (%)', angle: 90, position: 'insideRight' }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="temp" name="Temperature" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    <Line yAxisId="right" type="monotone" dataKey="humidity" name="Humidity" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                                    <Line yAxisId="left" type="monotone" dataKey="windSpeed" name="Wind Speed" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Daily Breakdown Cards */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">Daily Breakdown</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                        {(forecasts[0]?.data || []).map((day, index) => (
                            <Card key={index} className={`glass-panel transition-all hover:scale-105 ${day.predictedAqi > 200 ? 'border-red-500/50' :
                                day.predictedAqi > 150 ? 'border-orange-500/50' :
                                    day.predictedAqi > 100 ? 'border-yellow-500/50' :
                                        'border-green-500/50'
                                }`}>
                                <CardContent className="pt-4 text-center">
                                    <p className="text-xs text-muted-foreground">{day.date}</p>
                                    <p className="font-semibold">{day.day}</p>
                                    <div className={`text-3xl font-bold my-2 ${getAQIStatus(day.predictedAqi).color}`}>
                                        {day.predictedAqi}
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {getAQIStatus(day.predictedAqi).label}
                                    </Badge>
                                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                                        <div className="flex justify-between">
                                            <span>🌡️ {day.temp}°C</span>
                                            <span>💧 {day.humidity}%</span>
                                        </div>
                                        <div className="flex justify-center">
                                            <span>💨 {day.windSpeed} km/h</span>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                                        <Progress value={day.confidence} className="h-1.5" />
                                        <p className="text-xs mt-1">{day.confidence}%</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
