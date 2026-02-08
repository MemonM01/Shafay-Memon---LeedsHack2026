// Calculate distance between two coordinates in kilometers or miles
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number, unit: 'km' | 'miles' = 'km'): number => {
    const R = unit === 'km' ? 6371 : 3959; // Earth's radius
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const MILE_TO_METERS = 1609.34;
export const DEFAULT_SEARCH_RADIUS_MILES = 10;
export const DEFAULT_SEARCH_RADIUS_KM = DEFAULT_SEARCH_RADIUS_MILES * 1.60934;
