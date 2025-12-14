import type { Express } from "express";
import { type Server } from "http";
import { randomInt } from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Data cache to ensure consistency
const cityDataCache = new Map<string, any>();
let cacheGeneratedAt: number = 0;
const CACHE_DURATION = 1; // Temporarily set to 1ms to force fresh data

// Mock data generator helper
// Helper to calculate US AQI from PM2.5 (simplified standard formula)
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

        // We calculate a real-ish AQI from PM2.5 because WeatherAPI gives raw values
        // 'us-epa-index' is 1-6, not 0-500. 
        const calculatedAqi = calculateAQI(aqiData.pm2_5);

        // Normalize condition string to match our types
        let condition = "Clear";
        const lowerCond = weatherCond.toLowerCase();
        if (lowerCond.includes("rain") || lowerCond.includes("drizzle")) condition = "Rain";
        else if (lowerCond.includes("cloud") || lowerCond.includes("overcast")) condition = "Cloudy";
        else if (lowerCond.includes("mist") || lowerCond.includes("fog")) condition = "Partly Cloudy"; // Approximation
        else if (lowerCond.includes("sunny") || lowerCond.includes("clear")) condition = "Clear";
        else condition = "Partly Cloudy"; // Default fallback

        // Map history from forecast (hourly data for today)
        const history = data.forecast?.forecastday[0]?.hour?.map((h: any) => ({
            time: h.time.split(" ")[1], // Extract "HH:MM"
            aqi: calculateAQI(h.air_quality?.pm2_5 || aqiData.pm2_5) // approximate history aqi
        })).filter((_: any, i: number) => i % 2 === 0) || []; // Take every 2nd hour to reduce size

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
                condition: condition,
            },
            history: history.length > 0 ? history : [],
            dataSource: "WeatherAPI.com",
            // Return location details from API
            extractedName: location.name,
            extractedState: location.region || "Unknown State"
        };

        console.log(`[API Response] City: ${location.name}, Region: ${location.region || 'NOT_PROVIDED'}`);

    } catch (error) {
        console.error(`Failed to fetch data for ${city}:`, error);
        // Fallback to basic mock if API fails to prevent app crash
        return {
            aqi: 0,
            mainPollutant: "N/A",
            pollutants: { pm25: 0, pm10: 0, no2: 0, so2: 0, co: 0, o3: 0 },
            weather: { temp: 0, humidity: 0, windSpeed: 0, condition: "Clear" },
            history: [],
            isError: true  // Flag to indicate this is fallback data
        }
    }
}

// Get or generate cached city data
async function getCachedCityData(id: string, name: string, state: string) {
    const now = Date.now();

    // Refresh cache if it's expired
    if (now - cacheGeneratedAt > CACHE_DURATION) {
        cityDataCache.clear();
        cacheGeneratedAt = now;
    }

    // Return cached data if available
    if (cityDataCache.has(id)) {
        return cityDataCache.get(id);
    }

    // Fetch real data
    console.log(`[Cache Miss] Fetching fresh data for: ${name}`);
    const apiData = await fetchWeatherFromAPI(name);
    console.log(`[Cache Miss] Received state: ${apiData.extractedState}`);

    const finalData = {
        id,
        name: apiData.extractedName || name, // Prefer API name if available
        state: apiData.extractedState || state, // Prefer API state if available
        ...apiData
    };
    console.log(`[Final Data] City: ${finalData.name}, State: ${finalData.state}`);

    cityDataCache.set(id, finalData);
    return finalData;
}

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

// Additional cities for chatbot detection
const ADDITIONAL_CITIES = [
    "Patna", "Indore", "Nagpur", "Surat", "Gurgaon", "Gurugram", "Noida",
    "Ghaziabad", "Faridabad", "Kanpur", "Varanasi", "Agra", "Amritsar",
    "Jodhpur", "Kochi", "Coimbatore", "Visakhapatnam", "Vadodara", "Thane"
];

// Helper to extract city from user message
function extractCityFromMessage(message: string): string | null {
    const lowerMessage = message.toLowerCase();

    // Check main cities first
    for (const city of CITY_CONFIG) {
        if (lowerMessage.includes(city.name.toLowerCase()) ||
            lowerMessage.includes(city.id.toLowerCase())) {
            return city.name;
        }
    }

    // Check additional cities
    for (const city of ADDITIONAL_CITIES) {
        if (lowerMessage.includes(city.toLowerCase())) {
            return city;
        }
    }

    // Special cases
    if (lowerMessage.includes("bangalore")) return "Bengaluru";
    if (lowerMessage.includes("bombay")) return "Mumbai";
    if (lowerMessage.includes("calcutta")) return "Kolkata";
    if (lowerMessage.includes("madras")) return "Chennai";

    // Try to extract any potential city name from the message
    // Look for patterns like "in <city>", "of <city>", "for <city>", "about <city>"
    const cityPatterns = [
        /(?:in|of|for|about|at)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/gi,
        /(?:aqi|weather|pollution|air quality)\s+(?:in|of|for|at)?\s*([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/gi,
        /([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(?:aqi|weather|pollution|air quality)/gi
    ];

    for (const pattern of cityPatterns) {
        const matches = message.matchAll(pattern);
        for (const match of matches) {
            const potentialCity = match[1]?.trim();
            // Filter out common words that aren't cities
            const excludeWords = ['the', 'a', 'an', 'my', 'your', 'this', 'that', 'today', 'now', 'current', 'india', 'good', 'bad', 'air', 'quality'];
            if (potentialCity && potentialCity.length > 2 && !excludeWords.includes(potentialCity.toLowerCase())) {
                return potentialCity.charAt(0).toUpperCase() + potentialCity.slice(1).toLowerCase();
            }
        }
    }

    return null;
}

// Helper to get AQI category
function getAQICategory(aqi: number): string {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Unhealthy for Sensitive Groups";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very Unhealthy";
    return "Hazardous";
}

export async function registerRoutes(server: Server, app: Express) {
    // GET all cities data
    app.get("/api/cities", async (_req, res) => {
        // Fetch all sequentially or parallel - parallel is better but careful with rate limits
        // WeatherAPI free tier has limits, but 12 requests is usually fine.
        const promises = CITY_CONFIG.map(city => getCachedCityData(city.id, city.name, city.state));
        const citiesData = await Promise.all(promises);
        res.json(citiesData);
    });

    // GET weather/AQI for a specific query (city name or lat,long)
    app.get("/api/weather/:query", async (req, res) => {
        const query = req.params.query;

        // Check if query is coordinates
        if (query.includes(",")) {
            // Mock latitude/longitude lookup
            // In real implementation you would pass lat,lon to WeatherAPI
            // For now, let's treat it as a direct query to WeatherAPI if possible, or just "New Delhi" as fallback?
            // Actually WeatherAPI accepts "lat,lon" as 'q' parameter!
            const data = await getCachedCityData("current", query, "Your Location");
            return res.json(data);
        }

        // Search by name
        const city = CITY_CONFIG.find(c =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.id.toLowerCase() === query.toLowerCase()
        );

        if (city) {
            res.json(await getCachedCityData(city.id, city.name, city.state));
        } else {
            // For unknown cities, fetch directly
            const data = await getCachedCityData(`custom_${query.toLowerCase()}`, query, "Unknown State");
            res.json(data);
        }
    });

    // Chat endpoint - Powered by Google Gemini AI
    app.post("/api/chat", async (req, res) => {
        try {
            const { message } = req.body;

            if (!message) {
                return res.status(400).json({ message: "Message is required" });
            }

            const apiKey = process.env.GEMINI_API_KEY;
            console.log("[CHAT] Starting chat request");
            console.log("[CHAT] API Key exists:", !!apiKey);
            console.log("[CHAT] API Key length:", apiKey?.length);

            if (!apiKey) {
                console.error("[CHAT] No API key found!");
                return res.status(500).json({ message: "Gemini API key not configured" });
            }

            try {
                console.log("[CHAT] Creating Gemini AI instance...");
                const genAI = new GoogleGenerativeAI(apiKey);

                console.log("[CHAT] Getting model...");
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

                // Detect if user is asking about a specific city
                const detectedCity = extractCityFromMessage(message);
                let contextData = "";
                let cityNotFound = false;

                if (detectedCity) {
                    console.log(`[CHAT] Detected city: ${detectedCity}, fetching real data...`);
                    try {
                        const cityData = await fetchWeatherFromAPI(detectedCity);

                        // Check if we got valid data (not error fallback)
                        if (!cityData.isError && cityData.aqi > 0) {
                            contextData = `
REAL-TIME DATA for ${detectedCity} (just fetched from Weather API):
- Current AQI: ${cityData.aqi} (${getAQICategory(cityData.aqi)})
- Main Pollutant: ${cityData.mainPollutant}
- PM2.5: ${cityData.pollutants.pm25} µg/m³
- PM10: ${cityData.pollutants.pm10} µg/m³
- NO₂: ${cityData.pollutants.no2} µg/m³
- SO₂: ${cityData.pollutants.so2} µg/m³
- CO: ${cityData.pollutants.co} µg/m³
- O₃: ${cityData.pollutants.o3} µg/m³
- Temperature: ${cityData.weather.temp}°C
- Humidity: ${cityData.weather.humidity}%
- Wind Speed: ${cityData.weather.windSpeed} km/h
- Weather Condition: ${cityData.weather.condition}
`;
                            console.log("[CHAT] Successfully fetched city data");
                        } else {
                            console.log("[CHAT] API returned error/empty data for city");
                            cityNotFound = true;
                        }
                    } catch (dataError) {
                        console.error("[CHAT] Failed to fetch city data:", dataError);
                        cityNotFound = true;
                    }
                }

                console.log("[CHAT] Generating content...");

                // Build the prompt based on what data we have
                let promptSuffix = "";
                if (contextData) {
                    promptSuffix = "IMPORTANT: Use the exact numbers from the real-time data above. Do not make up or estimate values. Format the response clearly with the actual AQI number, pollutant values, and weather conditions.";
                } else if (cityNotFound && detectedCity) {
                    promptSuffix = `Note: I tried to fetch real-time data for "${detectedCity}" but the Weather API doesn't have data for this location. Please let the user know we couldn't get real-time data for this specific city, and provide general air quality information or suggest they try a nearby major city.`;
                } else {
                    promptSuffix = "If the user asks about a specific city's current AQI, let them know you can provide real-time data for major Indian cities.";
                }

                const prompt = `You are an Air Quality and Weather Assistant for India. You provide accurate, helpful information about air quality, pollution levels, and weather conditions.

${contextData ? `USE THIS REAL-TIME DATA IN YOUR RESPONSE (this is live data, not estimates):\n${contextData}` : ""}

User question: ${message}

${promptSuffix}`;

                const result = await model.generateContent(prompt);
                console.log("[CHAT] Got result from API");

                const response = await result.response;
                console.log("[CHAT] Got response object");

                const text = response.text();
                console.log("[CHAT] Successfully got text response");
                console.log("[CHAT] Response preview:", text.substring(0, 100));

                res.json({ message: text });
            } catch (geminiError: any) {
                console.error("[CHAT] Gemini API Error occurred!");
                console.error("[CHAT] Error message:", geminiError?.message);
                console.error("[CHAT] Error name:", geminiError?.name);
                console.error("[CHAT] Error constructor:", geminiError?.constructor?.name);
                console.error("[CHAT] Error status:", geminiError?.status);
                console.error("[CHAT] Error statusText:", geminiError?.statusText);
                console.error("[CHAT] Error details:", geminiError?.errorDetails);
                console.error("[CHAT] Full error object:", geminiError);
                console.error("[CHAT] Full error JSON:", JSON.stringify(geminiError, null, 2));

                return res.status(500).json({
                    message: "Sorry, I'm having trouble processing your request. Please try again.",
                    error: process.env.NODE_ENV === 'development' ? geminiError?.message : undefined
                });
            }
        } catch (outerError: any) {
            console.error("[CHAT] Outer Error occurred!");
            console.error("[CHAT] Outer error message:", outerError?.message);
            console.error("[CHAT] Outer error:", outerError);

            res.status(500).json({
                message: "Sorry, I'm having trouble processing your request. Please try again."
            });
        }
    });
}
