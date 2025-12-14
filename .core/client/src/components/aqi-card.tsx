import { CityData, getAQIStatus } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Wind, AlertTriangle } from "lucide-react";

export function AQICard({ city }: { city: CityData }) {
  const status = getAQIStatus(city.aqi);
  
  return (
    <Card className="glass-panel overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-muted-foreground">Air Quality Index</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div>
            <span className={cn("text-5xl font-bold tracking-tight", status.color)}>
              {city.aqi}
            </span>
            <div className={cn("mt-1 text-sm font-medium px-2 py-1 rounded-full inline-block", status.bg, status.color)}>
              {status.label}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Main Pollutant</div>
            <div className="text-xl font-semibold">{city.mainPollutant}</div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>PM2.5</span>
              <span>{city.pollutants.pm25} µg/m³</span>
            </div>
            <Progress value={(city.pollutants.pm25 / 300) * 100} className="h-1.5" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>PM10</span>
              <span>{city.pollutants.pm10} µg/m³</span>
            </div>
            <Progress value={(city.pollutants.pm10 / 400) * 100} className="h-1.5" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>NO₂</span>
              <span>{city.pollutants.no2} µg/m³</span>
            </div>
            <Progress value={(city.pollutants.no2 / 200) * 100} className="h-1.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
