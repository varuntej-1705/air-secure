import { Layout } from "@/components/layout";
import { useAllCitiesWeather } from "@/hooks/use-weather";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
    Cell, PieChart, Pie, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ScatterChart, Scatter, ZAxis
} from "recharts";
import { Loader2 } from "lucide-react";
import { getAQIStatus } from "@/lib/mockData";

export default function Dashboard() {
    const { cities, isLoading } = useAllCitiesWeather();

    if (isLoading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-[50vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    // 1. AQI Comparison Data (Top 10 Polluted)
    const aqiData = [...cities]
        .sort((a, b) => b.aqi - a.aqi)
        .slice(0, 10)
        .map(c => ({
            name: c.name,
            aqi: c.aqi,
            fill: getAQIStatus(c.aqi).var === 'good' ? '#16a34a' :
                getAQIStatus(c.aqi).var === 'moderate' ? '#ca8a04' :
                    getAQIStatus(c.aqi).var === 'unhealthy' ? '#dc2626' : '#7f1d1d'
        }));

    // 2. Weather Condition Distribution
    const conditionCounts = cities.reduce((acc, city) => {
        const condition = city.weather.condition;
        acc[condition] = (acc[condition] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const conditionData = Object.entries(conditionCounts).map(([name, value]) => ({ name, value }));
    const COLORS = ['#0ea5e9', '#64748b', '#3b82f6', '#f59e0b'];

    // 3. Pollutants of Worst City
    const worstCity = [...cities].sort((a, b) => b.aqi - a.aqi)[0];
    const pollutantData = worstCity ? [
        { subject: 'PM2.5', A: worstCity.pollutants.pm25, fullMark: 500 },
        { subject: 'PM10', A: worstCity.pollutants.pm10, fullMark: 500 },
        { subject: 'NO2', A: worstCity.pollutants.no2, fullMark: 200 },
        { subject: 'SO2', A: worstCity.pollutants.so2, fullMark: 200 },
        { subject: 'O3', A: worstCity.pollutants.o3, fullMark: 200 },
    ] : [];

    // 4. Temp vs AQI Correlation
    const scatterData = cities.map(c => ({
        x: c.weather.temp,
        y: c.aqi,
        z: 1,
        name: c.name
    }));

    return (
        <Layout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-heading font-bold">Analytics Dashboard</h1>
                    <p className="text-muted-foreground">Deep dive into air quality trends and weather patterns.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* AQI Bar Chart */}
                    <Card className="glass-panel col-span-1 lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Top 10 Most Polluted Cities</CardTitle>
                            <CardDescription>Comparison of Air Quality Index (Higher is worse)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={aqiData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis label={{ value: 'AQI', angle: -90, position: 'insideLeft' }} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="aqi" radius={[4, 4, 0, 0]}>
                                            {aqiData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Radar Chart */}
                    <Card className="glass-panel">
                        <CardHeader>
                            <CardTitle>Pollutant Breakdown: {worstCity?.name}</CardTitle>
                            <CardDescription>Detailed composition of pollutants for the most polluted city.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={pollutantData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                                        <Radar
                                            name={worstCity?.name}
                                            dataKey="A"
                                            stroke="#ef4444"
                                            fill="#ea4242ff"
                                            fillOpacity={0.4}
                                        />
                                        <Tooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pie Chart */}
                    <Card className="glass-panel">
                        <CardHeader>
                            <CardTitle>Weather Conditions</CardTitle>
                            <CardDescription>Distribution of weather patterns across tracked cities.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={conditionData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                            label
                                        >
                                            {conditionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Scatter Chart */}
                    <Card className="glass-panel col-span-1 lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Temperature vs AQI</CardTitle>
                            <CardDescription>Correlation between temperature (X-axis) and Air Quality (Y-axis).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" dataKey="x" name="Temperature" unit="°C" label={{ value: "Temp (°C)", position: "insideBottom", offset: -10 }} />
                                        <YAxis type="number" dataKey="y" name="AQI" label={{ value: "AQI", angle: -90, position: "insideLeft" }} />
                                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                        <Scatter name="Cities" data={scatterData} fill="#8884d8">
                                            {scatterData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill="#3b82f6" />
                                            ))}
                                        </Scatter>
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </Layout>
    );
}
