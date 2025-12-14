import { getAQIStatus } from "@/lib/mockData";
import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation } from "wouter";
import { useState, Suspense, lazy } from "react";
import { Search, ArrowUpDown, List, Map as MapIcon, Loader2 } from "lucide-react";
import { useAllCitiesWeather } from "@/hooks/use-weather";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load the map component for better performance
const IndiaMap = lazy(() => import("@/components/india-map"));

export default function CityList() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"aqi" | "name">("aqi");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [, setLocation] = useLocation();

  const { cities, isLoading } = useAllCitiesWeather();

  const filteredCities = cities
    .filter(city =>
      city.name.toLowerCase().includes(search.toLowerCase()) ||
      city.state.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "aqi") {
        return order === "asc" ? a.aqi - b.aqi : b.aqi - a.aqi;
      } else {
        return order === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
    });

  const toggleSort = (key: "aqi" | "name") => {
    if (sort === key) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(key);
      setOrder("desc");
    }
  };

  const handleCityClick = (cityId: string) => {
    setLocation(`/city/${cityId}`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">All Cities</h1>
          <p className="text-muted-foreground">Detailed air quality report for major Indian cities.</p>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-border w-full md:w-auto flex-1">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Filter by city or state..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 focus-visible:ring-0 px-0 h-auto text-lg"
            />
          </div>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" /> List View
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapIcon className="h-4 w-4" /> Map View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <div className="rounded-xl border border-border overflow-hidden bg-white dark:bg-slate-900">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead
                      className="cursor-pointer hover:text-foreground"
                      onClick={() => toggleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        City
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>State</TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground text-right"
                      onClick={() => toggleSort("aqi")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        AQI
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Temp</TableHead>
                    <TableHead>Weather</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6}><Skeleton className="h-12 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    filteredCities.map((city) => {
                      const status = getAQIStatus(city.aqi);
                      return (
                        <TableRow key={city.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <Link href={`/city/${city.id}`} className="block w-full h-full">
                              {city.name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/city/${city.id}`} className="block w-full h-full">
                              {city.state}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/city/${city.id}`} className="block w-full h-full font-bold">
                              {city.aqi}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/city/${city.id}`}>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                {status.label}
                              </span>
                            </Link>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/city/${city.id}`} className="block w-full h-full">
                              {city.weather.temp}°C
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/city/${city.id}`} className="block w-full h-full text-muted-foreground">
                              {city.weather.condition}
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="map">
            <div className="relative w-full h-[600px] rounded-xl overflow-hidden border border-border">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              ) : (
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center bg-slate-900">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                }>
                  <IndiaMap cities={filteredCities} onCityClick={handleCityClick} />
                </Suspense>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
