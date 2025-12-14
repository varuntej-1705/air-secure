import { CityData, getWeatherIcon } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, Wind } from "lucide-react";

export function WeatherCard({ city }: { city: CityData }) {
  const WeatherIcon = getWeatherIcon(city.weather.condition);

  return (
    <Card className="glass-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-muted-foreground">Current Weather</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <WeatherIcon className="h-16 w-16 text-orange-400" />
            <div>
              <div className="text-4xl font-bold">{city.weather.temp}°C</div>
              <div className="text-muted-foreground">{city.weather.condition}</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
            <Droplets className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-sm text-muted-foreground">Humidity</div>
              <div className="font-semibold">{city.weather.humidity}%</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
            <Wind className="h-5 w-5 text-teal-500" />
            <div>
              <div className="text-sm text-muted-foreground">Wind</div>
              <div className="font-semibold">{city.weather.windSpeed} km/h</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
