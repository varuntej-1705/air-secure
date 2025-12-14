import { memo, useState } from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
    ZoomableGroup,
} from "react-simple-maps";
import { CityData, getAQIStatus } from "@/lib/mockData";

// India GeoJSON URL (TopoJSON format)
const INDIA_TOPO_JSON = "https://cdn.jsdelivr.net/npm/india-topojson@1.0.0/india.json";

// City coordinates for markers
const CITY_COORDINATES: Record<string, [number, number]> = {
    "new delhi": [77.209, 28.6139],
    "delhi": [77.209, 28.6139],
    "mumbai": [72.8777, 19.076],
    "bengaluru": [77.5946, 12.9716],
    "kolkata": [88.3639, 22.5726],
    "chennai": [80.2707, 13.0827],
    "hyderabad": [78.4867, 17.385],
    "pune": [73.8567, 18.5204],
    "ahmedabad": [72.5714, 23.0225],
    "jaipur": [75.7873, 26.9124],
    "lucknow": [80.9462, 26.8467],
    "chandigarh": [76.7794, 30.7333],
    "bhopal": [77.4126, 23.2599],
    "coimbatore": [76.9558, 11.0168],
    "vizag": [83.2185, 17.6868],
    "patna": [85.1376, 25.5941],
    "kochi": [76.2673, 9.9312],
    "nagpur": [79.0882, 21.1458],
    "indore": [75.8577, 22.7196],
    "surat": [72.8311, 21.1702],
};

interface IndiaMapProps {
    cities: CityData[];
    onCityClick?: (cityId: string) => void;
}

const IndiaMap = memo(({ cities, onCityClick }: IndiaMapProps) => {
    const [tooltipContent, setTooltipContent] = useState<{ city: CityData; x: number; y: number } | null>(null);

    const getMarkerColor = (aqi: number) => {
        if (aqi <= 50) return "#22c55e"; // green
        if (aqi <= 100) return "#eab308"; // yellow
        if (aqi <= 150) return "#f97316"; // orange
        if (aqi <= 200) return "#ef4444"; // red
        return "#7c2d12"; // dark red for hazardous
    };

    const getMarkerSize = (aqi: number) => {
        if (aqi <= 50) return 8;
        if (aqi <= 100) return 10;
        if (aqi <= 150) return 12;
        return 14;
    };

    return (
        <div
            className="relative w-full h-full bg-slate-950 rounded-xl overflow-hidden shadow-2xl border border-slate-800"
            style={{ minHeight: '600px' }}
        >
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 850,
                    center: [80, 22],
                }}
                style={{ width: "100%", height: "100%" }}
            >
                <ZoomableGroup center={[80, 22]} zoom={1} minZoom={0.8} maxZoom={4}>
                    <Geographies geography={INDIA_TOPO_JSON}>
                        {({ geographies }) =>
                            geographies.map((geo) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill="#1e293b"
                                    stroke="#475569"
                                    strokeWidth={0.8}
                                    style={{
                                        default: { outline: "none", fill: "#1e293b", transition: "all 250ms" },
                                        hover: { fill: "#334155", outline: "none", cursor: "pointer" },
                                        pressed: { outline: "none" },
                                    }}
                                />
                            ))
                        }
                    </Geographies>

                    {/* City Markers */}
                    {cities.map((city) => {
                        const coords = CITY_COORDINATES[city.name.toLowerCase()];
                        if (!coords) return null;

                        const status = getAQIStatus(city.aqi);
                        const markerColor = getMarkerColor(city.aqi);
                        const markerSize = getMarkerSize(city.aqi);

                        return (
                            <Marker
                                key={city.id}
                                coordinates={coords}
                                onClick={() => onCityClick?.(city.id)}
                                style={{ cursor: "pointer" }}
                            >
                                {/* Pulsing effect for high AQI */}
                                {city.aqi > 150 && (
                                    <circle
                                        r={markerSize + 4}
                                        fill={markerColor}
                                        opacity={0.3}
                                        className="animate-ping"
                                    />
                                )}
                                {/* Main marker */}
                                <circle
                                    r={markerSize}
                                    fill={markerColor}
                                    stroke="#fff"
                                    strokeWidth={2}
                                    className="drop-shadow-lg hover:scale-125 transition-transform"
                                />
                                {/* City label */}
                                <text
                                    textAnchor="middle"
                                    y={-markerSize - 8}
                                    style={{
                                        fontFamily: "system-ui",
                                        fontSize: "10px",
                                        fontWeight: "bold",
                                        fill: "#fff",
                                        textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                                    }}
                                >
                                    {city.name}
                                </text>
                                {/* AQI value */}
                                <text
                                    textAnchor="middle"
                                    y={4}
                                    style={{
                                        fontFamily: "system-ui",
                                        fontSize: "8px",
                                        fontWeight: "bold",
                                        fill: "#fff",
                                    }}
                                >
                                    {city.aqi}
                                </text>
                            </Marker>
                        );
                    })}
                </ZoomableGroup>
            </ComposableMap>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-xs z-10">
                <div className="font-bold mb-2">Air Quality Index</div>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span>Good (0-50)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span>Moderate (51-100)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span>Unhealthy for Sensitive (101-150)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span>Unhealthy (151-200)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-900" />
                        <span>Hazardous (200+)</span>
                    </div>
                </div>
            </div>

            {/* Zoom hint */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-xs z-10">
                🖱️ Scroll to zoom • Drag to pan
            </div>
        </div>
    );
});

IndiaMap.displayName = "IndiaMap";

export default IndiaMap;

