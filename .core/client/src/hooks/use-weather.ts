import { useQuery } from "@tanstack/react-query";
import { CityData } from "@/lib/mockData";
import { API_ENDPOINTS } from "@/config";

export function useAllCitiesWeather() {
    const { data: cities, isLoading, error } = useQuery<CityData[]>({
        queryKey: ["cities-weather"],
        queryFn: async () => {
            const res = await fetch(API_ENDPOINTS.cities);
            if (!res.ok) {
                throw new Error("Failed to fetch cities data");
            }
            return res.json();
        },
        // Refresh every 5 minutes
        refetchInterval: 5 * 60 * 1000,
    });

    return {
        cities: cities || [],
        isLoading,
        error,
    };
}

export function useCityWeather(id: string | undefined) {
    const { data, isLoading, error } = useQuery<CityData>({
        queryKey: ["city-weather", id],
        queryFn: async () => {
            if (!id) throw new Error("City ID is required");
            const res = await fetch(`${API_ENDPOINTS.weather}/${encodeURIComponent(id)}`);
            if (!res.ok) {
                throw new Error("Failed to fetch city data");
            }
            return res.json();
        },
        enabled: !!id,
    });

    return {
        data,
        isLoading,
        isError: !!error,
        error,
    };
}
