// This file handles configuration and environment variables.
// In a real deployment, these would be populated from .env files.

export const config = {
  aqiApiKey: import.meta.env.VITE_AQI_API_KEY || "mock_aqi_key",
  weatherApiKey: import.meta.env.VITE_WEATHER_API_KEY || "mock_weather_key",
  aiApiKey: import.meta.env.VITE_AI_API_KEY || "mock_ai_key",

  // Feature flags
  enablePrediction: true,
  enableChatbot: true,
};

export const API_ENDPOINTS = {
  cities: "/api/cities",
  aqi: "/api/aqi",
  weather: "/api/weather", // usage: /api/weather/:city
  chat: "/api/chat",
};
