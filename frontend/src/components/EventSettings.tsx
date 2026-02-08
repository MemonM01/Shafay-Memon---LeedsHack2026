/// <reference types="@types/google.maps" />
import { useState, useMemo, useEffect, useRef } from 'react';
import type { Event } from '../types/Events';
import { calculateDistance, DEFAULT_SEARCH_RADIUS_KM } from '../lib/geoUtils';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

// Google Maps API Key - Replace with your own key or use environment variable
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE';

// Set Google Maps API options
setOptions({
    key: GOOGLE_MAPS_API_KEY,
    v: 'weekly'
});


// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

type EventSettingsProps = {
    events: Event[];
    onFilterChange?: (filteredEvents: Event[]) => void;
};

export default function EventSettings({ events, onFilterChange }: EventSettingsProps) {
    const [searchText, setSearchText] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [locationAddress, setLocationAddress] = useState('');
    const [locationCoords, setLocationCoords] = useState<[number, number] | null>(null);
    const [rangeKm, setRangeKm] = useState(Math.round(DEFAULT_SEARCH_RADIUS_KM)); // Default local range
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const locationWrapperRef = useRef<HTMLDivElement>(null);
    const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
    const geocoderRef = useRef<google.maps.Geocoder | null>(null);
    const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

    // Debounced search text for autocomplete
    const debouncedLocationAddress = useDebounce(locationAddress, 300);

    // Get all unique tags from events
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        events.forEach(event => {
            event.tags?.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }, [events]);

    // Filter events based on criteria
    const filteredEvents = useMemo(() => {
        console.log('Filtering events:', events.length, 'events, locationCoords:', locationCoords, 'rangeKm:', rangeKm);

        return events.filter(event => {
            // Text search
            const matchesText = searchText === '' ||
                event.title.toLowerCase().includes(searchText.toLowerCase()) ||
                event.description.toLowerCase().includes(searchText.toLowerCase());

            // Tags filter
            const matchesTags = selectedTags.length === 0 ||
                selectedTags.some(tag => event.tags?.includes(tag));

            // Date range filter
            const eventDate = new Date(event.date);
            const matchesDateRange =
                (!startDate || eventDate >= new Date(startDate)) &&
                (!endDate || eventDate <= new Date(endDate));

            // Location/distance filter - only apply if we have coordinates
            let matchesLocation = true;
            if (locationCoords && event.position) {
                const distance = calculateDistance(
                    locationCoords[0],
                    locationCoords[1],
                    event.position[0],
                    event.position[1]
                );
                matchesLocation = distance <= rangeKm;

                // Debug: log distance for each event
                console.log(`Event "${event.title}" at [${event.position[0]}, ${event.position[1]}] is ${distance.toFixed(2)} km away. Match: ${matchesLocation}`);
            }

            return matchesText && matchesTags && matchesDateRange && matchesLocation;
        });
    }, [events, searchText, selectedTags, startDate, endDate, locationCoords, rangeKm]);

    // Notify parent of filter changes
    useEffect(() => {
        onFilterChange?.(filteredEvents);
    }, [filteredEvents, onFilterChange]);

    // Initialize Google Maps services
    useEffect(() => {
        const initGoogleMaps = async () => {
            try {
                // Import Places library
                await importLibrary('places');
                
                autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
                geocoderRef.current = new google.maps.Geocoder();
                // Create a dummy div for PlacesService (it requires a div)
                const div = document.createElement('div');
                placesServiceRef.current = new google.maps.places.PlacesService(div);
                console.log('Google Maps services initialized');
            } catch (error) {
                console.error('Error loading Google Maps:', error);
            }
        };
        
        initGoogleMaps();
    }, []);

    // Debounced autocomplete search using Google Places API
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (debouncedLocationAddress.length > 2 && autocompleteServiceRef.current) {
                console.log('Fetching suggestions for:', debouncedLocationAddress);
                setIsSearching(true);
                try {
                    autocompleteServiceRef.current.getPlacePredictions(
                        {
                            input: debouncedLocationAddress,
                            componentRestrictions: { country: 'uk' },
                        },
                        (predictions: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
                            console.log('Autocomplete status:', status, 'Predictions:', predictions);
                            setIsSearching(false);
                            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                                console.log('Setting suggestions:', predictions.length);
                                setSuggestions(predictions);
                                setShowSuggestions(true);
                            } else if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
                                console.error('Google Maps API request denied. Check your API key and billing.');
                                setSuggestions([]);
                                setShowSuggestions(false);
                            } else {
                                console.log('No suggestions found or other status:', status);
                                setSuggestions([]);
                                setShowSuggestions(false);
                            }
                        }
                    );
                } catch (error) {
                    console.error('Autocomplete failed', error);
                    setSuggestions([]);
                    setShowSuggestions(false);
                    setIsSearching(false);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        };
        fetchSuggestions();
    }, [debouncedLocationAddress]);

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (locationWrapperRef.current && !locationWrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [locationWrapperRef]);

    // Get current location on mount
    useEffect(() => {
        handleUseCurrentLocation();
    }, []);

    const handleTagToggle = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newTag = tagInput.trim().toLowerCase();
            if (newTag && !selectedTags.includes(newTag)) {
                setSelectedTags(prev => [...prev, newTag]);
                setTagInput('');
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        setSelectedTags(prev => prev.filter(tag => tag !== tagToRemove));
    };

    const handleUseCurrentLocation = async () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        // Check permission status first if available
        if ('permissions' in navigator) {
            try {
                const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
                console.log('Geolocation permission status:', permissionStatus.state);

                if (permissionStatus.state === 'denied') {
                    alert('Location access is blocked. Please enable it in your browser settings:\n\n1. Click the lock icon in the address bar\n2. Allow location access\n3. Refresh the page');
                    return;
                }
            } catch (e) {
                console.log('Could not check permission status:', e);
            }
        }

        setIsLoadingLocation(true);
        console.log('Requesting geolocation...');

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                console.log('Location obtained:', pos.coords);
                const coords: [number, number] = [
                    pos.coords.latitude,
                    pos.coords.longitude,
                ];
                setLocationCoords(coords);

                // Reverse geocode to get address using Google Maps Geocoding API
                let addressName = `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
                if (geocoderRef.current) {
                    try {
                        geocoderRef.current.geocode(
                            { location: { lat: coords[0], lng: coords[1] } },
                            (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
                                if (status === 'OK' && results && results.length > 0) {
                                    setLocationAddress(results[0].formatted_address);
                                } else {
                                    setLocationAddress(addressName);
                                }
                            }
                        );
                    } catch (e) {
                        console.error('Failed to reverse geocode:', e);
                        setLocationAddress(addressName);
                    }
                } else {
                    setLocationAddress(addressName);
                }

                // Only set address if geocoder didn't (for the coordinates fallback)
                if (!geocoderRef.current) {
                    setLocationAddress(addressName);
                }
                setIsLoadingLocation(false);
            },
            (err) => {
                console.error('Geolocation error:', err);
                setIsLoadingLocation(false);

                let message = 'Unable to get your location.\n\n';
                if (err.code === 1) {
                    message += 'Location access was denied. Please:\n1. Click the lock icon in the address bar\n2. Allow location access\n3. Try again';
                } else if (err.code === 2) {
                    message += 'Location information is unavailable.';
                } else if (err.code === 3) {
                    message += 'Location request timed out. Please try again.';
                } else {
                    message += err.message || 'Unknown error occurred.';
                }

                alert(message);
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    };

    const handleLocationSearch = async () => {
        const trimmedAddress = locationAddress.trim();
        if (!trimmedAddress || !geocoderRef.current) {
            console.log('No address to search or geocoder not ready');
            return;
        }

        setIsLoadingLocation(true);
        console.log('Searching for location:', trimmedAddress);

        try {
            geocoderRef.current.geocode(
                { address: trimmedAddress },
                (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
                    if (status === 'OK' && results && results.length > 0) {
                        const location = results[0].geometry.location;
                        const coords: [number, number] = [location.lat(), location.lng()];
                        setLocationCoords(coords);
                        setLocationAddress(results[0].formatted_address);
                        setShowSuggestions(false);
                        console.log('Location set to:', coords);
                    } else if (status === 'REQUEST_DENIED') {
                        alert('Google Maps API request denied. Please check your API key and billing settings.');
                    } else {
                        alert('Location not found. Please try a different address.');
                    }
                    setIsLoadingLocation(false);
                }
            );
        } catch (error) {
            console.error('Error geocoding address:', error);
            alert('Error finding location. Please try again.');
            setIsLoadingLocation(false);
        }
    };

    const handleLocationAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocationAddress(e.target.value);
        // Clear coordinates when user starts typing a new location
        // This ensures the filter updates when they select a new suggestion
    };

    const selectSuggestion = async (suggestion: google.maps.places.AutocompletePrediction) => {
        // Google Places API returns place_id, need to fetch details to get coordinates
        setLocationAddress(suggestion.description);
        setShowSuggestions(false);
        setIsLoadingLocation(true);

        if (!placesServiceRef.current) {
            console.error('Places service not initialized');
            setIsLoadingLocation(false);
            return;
        }

        try {
            placesServiceRef.current.getDetails(
                {
                    placeId: suggestion.place_id,
                    fields: ['geometry', 'formatted_address']
                },
                (place: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
                        const coords: [number, number] = [
                            place.geometry.location.lat(),
                            place.geometry.location.lng()
                        ];
                        setLocationCoords(coords);
                        setLocationAddress(place.formatted_address || suggestion.description);
                        console.log('Location set to:', coords);
                    } else {
                        console.error('Failed to get place details:', status);
                    }
                    setSuggestions([]);
                    setIsLoadingLocation(false);
                }
            );
        } catch (error) {
            console.error('Error fetching place details:', error);
            setSuggestions([]);
            setIsLoadingLocation(false);
        }
    };

    const clearLocation = () => {
        setLocationAddress('');
        setLocationCoords(null);
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const resetFilters = () => {
        setSearchText('');
        setSelectedTags([]);
        setTagInput('');
        setStartDate('');
        setEndDate('');
        setRangeKm(Math.round(DEFAULT_SEARCH_RADIUS_KM));
        setSuggestions([]);
        setShowSuggestions(false);
        // Reset to current location
        handleUseCurrentLocation();
    };

    return (
        <div className="h-full w-full bg-zinc-950 border-r border-zinc-800 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex-shrink-0">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                    Filters
                </h2>
                <p className="text-zinc-500 text-sm mt-1">
                    Customize your search
                </p>
            </div>

            {/* Filters */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Search */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Search</label>
                    <input
                        type="text"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Event title or description..."
                        className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-md text-sm focus:outline-none focus:border-sky-500 transition"
                    />
                </div>

                {/* Location */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Location</label>
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <div className="relative flex-1" ref={locationWrapperRef}>
                                <input
                                    type="text"
                                    value={locationAddress}
                                    onChange={handleLocationAddressChange}
                                    onFocus={() => locationAddress.length > 2 && suggestions.length > 0 && setShowSuggestions(true)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleLocationSearch();
                                        }
                                        if (e.key === 'Escape') {
                                            setShowSuggestions(false);
                                        }
                                    }}
                                    disabled={isLoadingLocation}
                                    placeholder="Search for a city or address..."
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 pr-8 rounded-md text-sm focus:outline-none focus:border-sky-500 transition disabled:opacity-50"
                                />
                                {/* Clear button */}
                                {locationAddress && (
                                    <button
                                        type="button"
                                        onClick={clearLocation}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                                        title="Clear location"
                                    >
                                        ✕
                                    </button>
                                )}
                                {/* Suggestions dropdown */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <ul className="absolute z-50 w-full bg-zinc-800 border border-zinc-700 rounded-md mt-1 shadow-xl max-h-60 overflow-y-auto">
                                        {isSearching && (
                                            <li className="px-3 py-2 text-xs text-zinc-500 flex items-center gap-2">
                                                <span className="animate-spin">⏳</span> Searching...
                                            </li>
                                        )}
                                        {suggestions.map((suggestion, index) => (
                                            <li
                                                key={suggestion.place_id || index}
                                                onClick={() => selectSuggestion(suggestion)}
                                                className="px-3 py-2.5 hover:bg-sky-600/20 cursor-pointer text-sm text-zinc-300 border-b border-zinc-700/50 last:border-0 flex items-start gap-2"
                                            >
                                                <span className="text-sky-400 mt-0.5">📍</span>
                                                <span className="line-clamp-2">{suggestion.description}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={handleLocationSearch}
                                disabled={isLoadingLocation || !locationAddress.trim()}
                                className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-2 rounded-md text-sm transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-zinc-800"
                                title="Search"
                            >
                                {isLoadingLocation ? 'loading...' : '🔍'}
                            </button>
                        </div>
                        {/* Current location indicator */}
                        {locationCoords && (
                            <div className="text-xs text-sky-400 bg-sky-500/10 px-3 py-2 rounded-md flex items-center gap-2">
                                <span>📍</span>
                                <span className="truncate">Filtering from: {locationAddress || `${locationCoords[0].toFixed(4)}, ${locationCoords[1].toFixed(4)}`}</span>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={handleUseCurrentLocation}
                            disabled={isLoadingLocation}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-md text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoadingLocation ? 'Getting location...' : 'Use Current Location'}
                        </button>
                    </div>
                </div>

                {/* Range in km */}
                {locationCoords && (
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Range: {rangeKm} km
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={rangeKm}
                            onChange={(e) => setRangeKm(parseInt(e.target.value))}
                            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-zinc-500 mt-1">
                            <span>1 km</span>
                            <span>100 km</span>
                        </div>
                    </div>
                )}

                {/* Date Range */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Date Range</label>
                    <div className="space-y-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-md text-sm focus:outline-none focus:border-sky-500 transition"
                        />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-md text-sm focus:outline-none focus:border-sky-500 transition"
                        />
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Tags</label>

                    {/* Selected Tags */}
                    {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {selectedTags.map(tag => (
                                <span key={tag} className="bg-sky-500/20 text-sky-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                    {tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="hover:text-white"
                                    >
                                        &times;
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Tag Input */}
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder="Type and press Enter to add tag"
                        className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-md text-sm focus:outline-none focus:border-sky-500 transition mb-3"
                    />

                    {/* Suggested Tags from Events */}
                    {allTags.length > 0 && (
                        <>
                            <p className="text-xs text-zinc-500 mb-2">Suggested tags:</p>
                            <div className="flex flex-wrap gap-2">
                                {allTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => handleTagToggle(tag)}
                                        className={`text-xs px-2 py-1 rounded-full transition ${selectedTags.includes(tag)
                                            ? 'bg-sky-500 text-white'
                                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Results Count */}
                <div className="pt-4 border-t border-zinc-800 text-xs text-zinc-400">
                    {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                </div>
            </div>

            {/* Reset Button */}
            <div className="p-4 border-t border-zinc-800 flex-shrink-0">
                <button
                    onClick={resetFilters}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                    Reset Filters
                </button>
            </div>
        </div>
    );
}

