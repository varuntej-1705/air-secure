import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// City configurations for detection
const CITY_CONFIG = [
    { id: "delhi", name: "New Delhi", state: "Delhi" },
    { id: "mumbai", name: "Mumbai", state: "Maharashtra" },
    { id: "bengaluru", name: "Bengaluru", state: "Karnataka" },
    { id: "kolkata", name: "Kolkata", state: "West Bengal" },
    { id: "chennai", name: "Chennai", state: "Tamil Nadu" },
    { id: "hyderabad", name: "Hyderabad", state: "Telangana" },
    { id: "pune", name: "Pune", state: "Maharashtra" },
    { id: "ahmedabad", name: "Ahmedabad", state: "Gujarat" },
    { id: "jaipur", name: "Jaipur", state: "Rajasthan" },
    { id: "lucknow", name: "Lucknow", state: "Uttar Pradesh" },
    { id: "chandigarh", name: "Chandigarh", state: "Punjab" },
    { id: "bhopal", name: "Bhopal", state: "Madhya Pradesh" },
];

const ADDITIONAL_CITIES = [
    "Patna", "Indore", "Nagpur", "Surat", "Gurgaon", "Gurugram", "Noida",
    "Ghaziabad", "Faridabad", "Kanpur", "Varanasi", "Agra", "Amritsar",
    "Jodhpur", "Kochi", "Coimbatore", "Visakhapatnam", "Vadodara", "Thane"
];

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

function extractCityFromMessage(message: string): string | null {
    const lowerMessage = message.toLowerCase();

    for (const city of CITY_CONFIG) {
        if (lowerMessage.includes(city.name.toLowerCase()) ||
            lowerMessage.includes(city.id.toLowerCase())) {
            return city.name;
        }
    }

    for (const city of ADDITIONAL_CITIES) {
        if (lowerMessage.includes(city.toLowerCase())) {
            return city;
        }
    }

    if (lowerMessage.includes("bangalore")) return "Bengaluru";
    if (lowerMessage.includes("bombay")) return "Mumbai";
    if (lowerMessage.includes("calcutta")) return "Kolkata";
    if (lowerMessage.includes("madras")) return "Chennai";

    return null;
}

function getAQICategory(aqi: number): string {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Unhealthy for Sensitive Groups";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very Unhealthy";
    return "Hazardous";
}

async function fetchWeatherFromAPI(city: string) {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) throw new Error("Weather API key not found");

    const url = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(city)}&days=1&aqi=yes`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`WeatherAPI error: ${res.statusText}`);
    const data = await res.json();

    const current = data.current;
    const aqiData = current.air_quality;
    const calculatedAqi = calculateAQI(aqiData.pm2_5);

    return {
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
            condition: current.condition.text,
        }
    };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: "Message is required" });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ message: "Gemini API key not configured" });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Detect city and fetch real-time data
        const detectedCity = extractCityFromMessage(message);
        let contextData = "";

        if (detectedCity) {
            try {
                const cityData = await fetchWeatherFromAPI(detectedCity);
                contextData = `
REAL-TIME DATA for ${detectedCity}:
- Current AQI: ${cityData.aqi} (${getAQICategory(cityData.aqi)})
- PM2.5: ${cityData.pollutants.pm25} µg/m³
- PM10: ${cityData.pollutants.pm10} µg/m³
- Temperature: ${cityData.weather.temp}°C
- Humidity: ${cityData.weather.humidity}%
- Weather: ${cityData.weather.condition}
`;
            } catch (error) {
                console.error("Failed to fetch city data:", error);
            }
        }

        const prompt = `You are an Air Quality and Weather Assistant for India. You provide accurate, helpful information about air quality, pollution levels, and weather conditions.

${contextData ? `USE THIS REAL-TIME DATA:\n${contextData}` : ""}

User question: ${message}

${contextData ? "Use the exact numbers from the real-time data above." : "If the user asks about a specific city, let them know you can provide real-time data for major Indian cities."}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ message: text });
    } catch (error: any) {
        console.error('Chat error:', error);
        return res.status(500).json({
            message: "Sorry, I'm having trouble processing your request. Please try again."
        });
    }
}
