import { useState, useMemo, useEffect, useRef } from 'react';
import type { Event } from '../types/Events';

// Calculate distance between two coordinates in miles
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

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
    const [mileRange, setMileRange] = useState(25);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const locationWrapperRef = useRef<HTMLDivElement>(null);

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

            // Location/distance filter
            const matchesLocation = !locationCoords || 
                calculateDistance(
                    locationCoords[0],
                    locationCoords[1],
                    event.position[0],
                    event.position[1]
                ) <= mileRange;

            return matchesText && matchesTags && matchesDateRange && matchesLocation;
        });
    }, [events, searchText, selectedTags, startDate, endDate, locationCoords, mileRange]);

    // Notify parent of filter changes
    useEffect(() => {
        onFilterChange?.(filteredEvents);
    }, [filteredEvents, onFilterChange]);

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
            const newTag = tagInput.trim();
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
                
                // Reverse geocode to get address
                let addressName = `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}`
                    );
                    const data = await response.json();
                    if (data.display_name) {
                        addressName = data.display_name.split(',').slice(0, 3).join(',');
                    }
                } catch (e) {
                    console.error('Failed to reverse geocode:', e);
                }
                
                setLocationAddress(addressName);
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
        if (!trimmedAddress) {
            console.log('No address to search');
            return;
        }

        setIsLoadingLocation(true);
        console.log('Searching for location:', trimmedAddress);

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmedAddress)}&limit=1`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Geocoding response:', data);
            
            if (data.length > 0) {
                const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                setLocationCoords(coords);
                setShowSuggestions(false);
                console.log('Location set to:', coords);
            } else {
                alert('Location not found. Please try a different address.');
            }
        } catch (error) {
            console.error('Error geocoding address:', error);
            alert('Error finding location. Please try again.');
        } finally {
            setIsLoadingLocation(false);
        }
    };

    const handleLocationAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocationAddress(value);

        if (value.length > 2) {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`
                );
                const data = await response.json();
                setSuggestions(data);
                setShowSuggestions(true);
            } catch (error) {
                console.error('Autocomplete failed', error);
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const selectSuggestion = (suggestion: any) => {
        setLocationAddress(suggestion.display_name);
        setLocationCoords([parseFloat(suggestion.lat), parseFloat(suggestion.lon)]);
        setShowSuggestions(false);
    };

    const resetFilters = () => {
        setSearchText('');
        setSelectedTags([]);
        setTagInput('');
        setStartDate('');
        setEndDate('');
        setLocationAddress('');
        setLocationCoords(null);
        setMileRange(25);
        setIsLoadingLocation(false);
        setSuggestions([]);
        setShowSuggestions(false);
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
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleLocationSearch();
                                        }
                                    }}
                                    disabled={isLoadingLocation}
                                    placeholder="Enter address..."
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white px-3 py-2 rounded-md text-sm focus:outline-none focus:border-sky-500 transition disabled:opacity-50"
                                />
                                {showSuggestions && suggestions.length > 0 && (
                                    <ul className="absolute z-50 w-full bg-zinc-800 border border-zinc-700 rounded-md mt-1 shadow-lg max-h-48 overflow-y-auto">
                                        {suggestions.map((suggestion, index) => (
                                            <li
                                                key={index}
                                                onClick={() => selectSuggestion(suggestion)}
                                                className="px-3 py-2 hover:bg-zinc-700 cursor-pointer text-sm text-zinc-300"
                                            >
                                                {suggestion.display_name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={handleLocationSearch}
                                disabled={isLoadingLocation || !locationAddress.trim()}
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-md text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Search"
                            >
                                {isLoadingLocation ? '⏳' : '🔍'}
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={handleUseCurrentLocation}
                            disabled={isLoadingLocation}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-md text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoadingLocation ? '⏳ Getting location...' : '📍 Use Current Location'}
                        </button>
                    </div>
                </div>

                {/* Mile Range */}
                {locationCoords && (
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Range: {mileRange} mile{mileRange !== 1 ? 's' : ''}
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={mileRange}
                            onChange={(e) => setMileRange(parseInt(e.target.value))}
                            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-zinc-500 mt-1">
                            <span>1 mi</span>
                            <span>50 mi</span>
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
                                        className={`text-xs px-2 py-1 rounded-full transition ${
                                            selectedTags.includes(tag)
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
