import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAQIStatus, CityData } from "@/lib/mockData";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Search, Loader2, MapPin, Navigation, AlertCircle } from "lucide-react";
import { useAllCitiesWeather } from "@/hooks/use-weather";
import { Skeleton } from "@/components/ui/skeleton";
import { API_ENDPOINTS } from "@/config";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Home() {
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<CityData | null>(null);
  const [searchError, setSearchError] = useState("");
  const [, setLocation] = useLocation();

  // Location-based state
  const [isLocating, setIsLocating] = useState(false);
  const [locationData, setLocationData] = useState<CityData | null>(null);
  const [locationError, setLocationError] = useState("");
  const [locationCity, setLocationCity] = useState("");

  const { cities, isLoading } = useAllCitiesWeather();

  const topPolluted = [...cities].sort((a, b) => b.aqi - a.aqi).slice(0, 4);
  // Exclude cities that are already in topPolluted from the cleanest list
  const topPollutedIds = new Set(topPolluted.map(city => city.id));
  const cleanest = [...cities]
    .filter(city => !topPollutedIds.has(city.id))
    .sort((a, b) => a.aqi - b.aqi)
    .slice(0, 4);

  // Use geolocation to get user's location and fetch AQI
  const useMyLocation = async () => {
    setIsLocating(true);
    setLocationError("");
    setLocationData(null);
    setLocationCity("");

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setIsLocating(false);
      return;
    }

    // Try to get location - first with low accuracy (faster), then retry with high accuracy if needed
    const getPosition = (highAccuracy: boolean): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 15000 : 30000, // More time for high accuracy
          maximumAge: 60000 // 1 minute cache
        });
      });
    };

    try {
      let position: GeolocationPosition;

      try {
        // First try with low accuracy (faster, works better on desktop)
        position = await getPosition(false);
      } catch (lowAccuracyError) {
        // If low accuracy fails, try high accuracy
        position = await getPosition(true);
      }

      const { latitude, longitude } = position.coords;

      // Check if coordinates are roughly within India's bounding box
      // India: Lat 6.5° to 35.5°, Long 68° to 97.5°
      const isInIndia = latitude >= 6.5 && latitude <= 35.5 && longitude >= 68 && longitude <= 97.5;

      if (!isInIndia) {
        setLocationError(
          `Your browser returned coordinates outside India (${latitude.toFixed(2)}, ${longitude.toFixed(2)}). ` +
          `This often happens on desktop due to IP-based location. Please search for your city manually (e.g., "Poonamallee" or "Chennai").`
        );
        setIsLocating(false);
        return;
      }

      // Fetch weather data for these coordinates
      const res = await fetch(`${API_ENDPOINTS.weather}/${latitude},${longitude}`);
      if (!res.ok) throw new Error("Could not fetch weather data");

      const data = await res.json();
      setLocationData(data);
      setLocationCity(data.name || "Your Location");
    } catch (error: any) {
      if (error.code === 1) {
        setLocationError("Location permission denied. Please enable location access in your browser settings and try again.");
      } else if (error.code === 2) {
        setLocationError("Location unavailable. Please check if location services are enabled on your device.");
      } else if (error.code === 3) {
        setLocationError("Location request timed out. Please ensure location services are enabled and try again.");
      } else {
        setLocationError("Could not get your location. Please try searching for your city instead.");
      }
    } finally {
      setIsLocating(false);
    }
  };

  // Search for any city dynamically
  const handleSearch = async () => {
    if (!search.trim()) return;

    setIsSearching(true);
    setSearchError("");
    setSearchResult(null);

    try {
      const res = await fetch(`${API_ENDPOINTS.weather}/${encodeURIComponent(search.trim())}`);
      if (!res.ok) throw new Error("City not found");

      const data = await res.json();
      setSearchResult(data);
    } catch (err) {
      setSearchError("Could not find weather data for this city. Try another name.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const goToSearchedCity = () => {
    if (searchResult) {
      // Navigate to a dynamic route with the city name
      setLocation(`/search/${encodeURIComponent(search.trim())}`);
    }
  };

  const goToLocationCity = () => {
    if (locationData) {
      setLocation(`/search/${encodeURIComponent(locationCity)}`);
    }
  };

  return (
    <Layout>
      <div className="space-y-10">
        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 via-teal-500/30 to-emerald-600/40" />
          <div className="relative z-10 px-8 py-16 md:px-12 md:py-20 max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                Air Quality in Real-Time.
              </span>
            </h1>
            <p className="text-lg text-slate-200 mb-8 max-w-xl">
              Get instant insights into Air Quality Index (AQI), pollutants, and weather conditions for <strong>any city in India</strong>. Powered by WeatherAPI.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Enter any city name..."
                  className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-slate-300 backdrop-blur-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching || !search.trim()}
                className="h-12 px-6 bg-primary hover:bg-primary/90 text-white font-medium"
              >
                {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
              </Button>
            </div>

            {/* Use My Location Button */}
            <div className="mt-4">
              <Button
                onClick={useMyLocation}
                disabled={isLocating}
                variant="outline"
                className="h-10 px-4 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Detecting location...
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4 mr-2" />
                    Use My Location
                  </>
                )}
              </Button>
            </div>

            {/* Location Error */}
            {locationError && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-200 text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {locationError}
              </div>
            )}

            {/* Location Result Card */}
            {locationData && (
              <div
                onClick={goToLocationCity}
                className="mt-6 p-4 bg-gradient-to-r from-blue-500/20 to-teal-500/20 backdrop-blur-sm rounded-xl border border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
              >
                <div className="flex items-center gap-2 text-sm text-blue-300 mb-2">
                  <MapPin className="h-4 w-4" />
                  Your Current Location
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg">{locationData.name}</div>
                    <div className="text-sm text-slate-300">{locationData.state}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getAQIStatus(locationData.aqi).color.replace('text-', 'text-')}`}>
                      AQI {locationData.aqi}
                    </div>
                    <div className="text-sm text-slate-300">{locationData.weather.temp}°C • {locationData.weather.condition}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAQIStatus(locationData.aqi).bg} ${getAQIStatus(locationData.aqi).color}`}>
                    {getAQIStatus(locationData.aqi).label}
                  </span>
                  <div className="text-xs text-slate-400 flex items-center gap-1">
                    View details <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            )}

            {/* Search Result Card */}
            {searchResult && (
              <div
                onClick={goToSearchedCity}
                className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg">{searchResult.name}</div>
                    <div className="text-sm text-slate-300">{searchResult.state}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getAQIStatus(searchResult.aqi).color.replace('text-', 'text-')}`}>
                      AQI {searchResult.aqi}
                    </div>
                    <div className="text-sm text-slate-300">{searchResult.weather.temp}°C • {searchResult.weather.condition}</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                  Click to view details <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            )}

            {searchError && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-200 text-sm">
                {searchError}
              </div>
            )}
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Most Polluted */}
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0">
              <CardTitle className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                Most Polluted Cities Now
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 grid gap-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))
              ) : (
                topPolluted.map((city) => (
                  <Link key={city.id} href={`/city/${city.id}`}>
                    <div className="group flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-border hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center font-bold text-red-700 text-sm">
                          {city.aqi}
                        </div>
                        <div>
                          <div className="font-semibold">{city.name}</div>
                          <div className="text-xs text-muted-foreground">{city.state}</div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Cleanest */}
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0">
              <CardTitle className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                Cleanest Air Right Now
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 grid gap-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))
              ) : (
                cleanest.map((city) => (
                  <Link key={city.id} href={`/city/${city.id}`}>
                    <div className="group flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-border hover:border-green-500/50 transition-all cursor-pointer shadow-sm hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 text-sm">
                          {city.aqi}
                        </div>
                        <div>
                          <div className="font-semibold">{city.name}</div>
                          <div className="text-xs text-muted-foreground">{city.state}</div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

