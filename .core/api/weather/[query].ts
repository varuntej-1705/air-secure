import type { VercelRequest, VercelResponse } from '@vercel/node';

// Helper to calculate US AQI from PM2.5
function calculateAQI(pm25: number): number {
    const c = pm25;
    if (c <= 12.0) return Math.round(((50 - 0) / (12.0 - 0)) * (c - 0) + 0);
    if (c <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (c - 12.1) + 51);
    if (c <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (c - 35.5) + 101);
    if (c <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (c - 55.5) + 151);
    if (c <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (c - 150.5) + 201);
    if (c <= 350.4) return Math.round(((400 - 301) / (350.4 - 250.5)) * (c - 250.5) + 301);
    if (c <= 500.4) return Math.round(((500 - 401) / (500.4 - 350.5)) * (c - 350.5) + 401);
    return 500;
}

async function fetchWeatherFromAPI(city: string) {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) throw new Error("Weather API key not found");

    const url = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(city)}&days=1&aqi=yes`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`WeatherAPI error: ${res.statusText}`);
        const data = await res.json();

        const location = data.location;
        const current = data.current;
        const weatherCond = current.condition.text;
        const aqiData = current.air_quality;

        const calculatedAqi = calculateAQI(aqiData.pm2_5);

        let condition = "Clear";
        const lowerCond = weatherCond.toLowerCase();
        if (lowerCond.includes("rain") || lowerCond.includes("drizzle")) condition = "Rain";
        else if (lowerCond.includes("cloud") || lowerCond.includes("overcast")) condition = "Cloudy";
        else if (lowerCond.includes("mist") || lowerCond.includes("fog")) condition = "Partly Cloudy";
        else if (lowerCond.includes("sunny") || lowerCond.includes("clear")) condition = "Clear";
        else condition = "Partly Cloudy";

        const history = data.forecast?.forecastday[0]?.hour?.map((h: any) => ({
            time: h.time.split(" ")[1],
            aqi: calculateAQI(h.air_quality?.pm2_5 || aqiData.pm2_5)
        })).filter((_: any, i: number) => i % 2 === 0) || [];

        return {
            id: city.toLowerCase().replace(/\s+/g, '-'),
            name: location.name,
            state: location.region || "Unknown State",
            aqi: calculatedAqi,
            mainPollutant: "PM2.5",
            pollutants: {
                pm25: Math.round(aqiData.pm2_5),
                pm10: Math.round(aqiData.pm10),
                no2: Math.round(aqiData.no2),
                so2: Math.round(aqiData.so2),
                co: Math.round(aqiData.co),
                o3: Math.round(aqiData.o3),
            },
            weather: {
                temp: Math.round(current.temp_c),
                humidity: current.humidity,
                windSpeed: Math.round(current.wind_kph),
                condition: condition,
            },
            history: history.length > 0 ? history : [],
            dataSource: "WeatherAPI.com"
        };
    } catch (error) {
        console.error(`Failed to fetch data for ${city}:`, error);
        return {
            id: city.toLowerCase().replace(/\s+/g, '-'),
            name: city,
            state: "Unknown",
            aqi: 0,
            mainPollutant: "N/A",
            pollutants: { pm25: 0, pm10: 0, no2: 0, so2: 0, co: 0, o3: 0 },
            weather: { temp: 0, humidity: 0, windSpeed: 0, condition: "Clear" },
            history: [],
            isError: true
        };
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { query } = req.query;

    if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'City query is required' });
    }

    try {
        const data = await fetchWeatherFromAPI(query);
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching weather:', error);
        return res.status(500).json({ error: 'Failed to fetch weather data' });
    }
}
