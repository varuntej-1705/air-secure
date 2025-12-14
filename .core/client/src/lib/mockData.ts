import { Cloud, CloudRain, CloudSun, Sun, Wind } from "lucide-react";

export type CityData = {
  id: string;
  name: string;
  state: string;
  aqi: number;
  mainPollutant: string;
  pollutants: {
    pm25: number;
    pm10: number;
    no2: number;
    so2: number;
    co: number;
    o3: number;
  };
  weather: {
    temp: number;
    humidity: number;
    windSpeed: number;
    condition: "Clear" | "Cloudy" | "Rain" | "Partly Cloudy";
  };
  dataSource?: string;
  history: { time: string; aqi: number }[];
};

export const CITY_CONFIG = [
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

// Fallback/Initial data structure helper if needed, 
// or we can strictly use API data.
// For now, I'll remove the big static array.

export const INDIAN_CITIES: CityData[] = []; // Deprecated, use CITY_CONFIG and fetch data

export const getAQIStatus = (aqi: number) => {
  if (aqi <= 50) return { label: "Good", color: "text-green-600", bg: "bg-green-100", var: "good" };
  if (aqi <= 100) return { label: "Moderate", color: "text-yellow-600", bg: "bg-yellow-100", var: "moderate" };
  if (aqi <= 150) return { label: "Unhealthy for Sensitive Groups", color: "text-orange-600", bg: "bg-orange-100", var: "unhealthy" };
  if (aqi <= 200) return { label: "Unhealthy", color: "text-red-600", bg: "bg-red-100", var: "unhealthy" };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "text-purple-600", bg: "bg-purple-100", var: "very-unhealthy" };
  return { label: "Hazardous", color: "text-red-900", bg: "bg-red-200", var: "hazardous" };
};

export const getWeatherIcon = (condition: string) => {
  switch (condition) {
    case "Clear": return Sun;
    case "Cloudy": return Cloud;
    case "Rain": return CloudRain;
    case "Partly Cloudy": return CloudSun;
    default: return Sun;
  }
};
