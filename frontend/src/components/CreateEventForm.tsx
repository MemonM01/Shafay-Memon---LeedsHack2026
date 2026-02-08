/// <reference types="@types/google.maps" />
import React, { useState, useRef, useEffect } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

// Google Maps API Key
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

interface CreateEventFormProps {
    initialData: any; // Using any for now, will refine
    onSubmit: (data: any) => void;
    onSelectLocation: (currentData: any) => void;
    locationName?: string;
}

const CreateEventForm: React.FC<CreateEventFormProps> = ({ initialData, onSubmit, onSelectLocation, locationName }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [date, setDate] = useState(initialData?.date || '');
    const [time, setTime] = useState(initialData?.time || '');
    const [tags, setTags] = useState<string[]>(initialData?.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image || null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [locationInput, setLocationInput] = useState(locationName || initialData?.location || '');
    const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [geocodedPosition, setGeocodedPosition] = useState<[number, number] | null>(initialData?.position || null);
    const [isSearching, setIsSearching] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
    const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

    const debouncedLocationInput = useDebounce(locationInput, 300);

    // Initialize Google Maps services
    useEffect(() => {
        const initGoogleMaps = async () => {
            try {
                await importLibrary('places');
                autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
                const div = document.createElement('div');
                placesServiceRef.current = new google.maps.places.PlacesService(div);
                console.log('Google Maps services initialized in CreateEventForm');
            } catch (error) {
                console.error('Error loading Google Maps:', error);
            }
        };
        initGoogleMaps();
    }, []);

    // Sync prop with local state if it changes externally
    useEffect(() => {
        if (locationName) {
            setLocationInput(locationName);
        }
    }, [locationName]);

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    // Debounced autocomplete search using Google Places API
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (debouncedLocationInput.length > 2 && autocompleteServiceRef.current) {
                setIsSearching(true);
                try {
                    autocompleteServiceRef.current.getPlacePredictions(
                        {
                            input: debouncedLocationInput,
                            componentRestrictions: { country: 'uk' },
                        },
                        (predictions: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
                            setIsSearching(false);
                            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                                setSuggestions(predictions);
                                setShowSuggestions(true);
                            } else {
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
    }, [debouncedLocationInput]);

    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocationInput(value);
        // Autocomplete is handled by the debounced useEffect
    };

    const selectSuggestion = async (suggestion: google.maps.places.AutocompletePrediction) => {
        setLocationInput(suggestion.description);
        setShowSuggestions(false);
        setIsSearching(true);

        if (!placesServiceRef.current) {
            console.error('Places service not initialized');
            setIsSearching(false);
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
                        setGeocodedPosition(coords);
                        setLocationInput(place.formatted_address || suggestion.description);
                        console.log('Location set to:', coords);
                    } else {
                        console.error('Failed to get place details:', status);
                    }
                    setSuggestions([]);
                    setIsSearching(false);
                }
            );
        } catch (error) {
            console.error('Error fetching place details:', error);
            setSuggestions([]);
            setIsSearching(false);
        }
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newTag = tagInput.trim().toLowerCase();
            if (newTag && tags.length < 8 && !tags.includes(newTag)) {
                setTags([...tags, newTag]);
                setTagInput('');
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            title,
            description,
            date,
            time,
            tags,
            image: imagePreview,
            imageFile,
            location: locationInput,
            position: geocodedPosition
        });
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-4">
            <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Event Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="e.g. Summer Music Festival"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Describe your event..."
                    required
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Time</label>
                    <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Tags <span className="text-zinc-500 text-xs">({tags.length}/8)</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map(tag => (
                        <span key={tag} className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
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
                <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    disabled={tags.length >= 8}
                    className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={tags.length >= 8 ? "Max tags reached" : "Type and press Enter to add tag"}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Location</label>
                <div className="flex flex-col sm:flex-row gap-2 relative">
                    <div className="relative flex-1" ref={wrapperRef}>
                        <input
                            type="text"
                            value={locationInput}
                            onChange={handleLocationChange}
                            className="w-full bg-zinc-800 border-zinc-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Type address or select on map"
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <ul className="absolute z-50 w-full bg-zinc-800 border border-zinc-700 rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
                                {isSearching && (
                                    <li className="px-3 py-2 text-xs text-zinc-500 flex items-center gap-2">
                                        <span className="animate-spin">⏳</span> Searching...
                                    </li>
                                )}
                                {suggestions.map((suggestion) => (
                                    <li
                                        key={suggestion.place_id}
                                        onClick={() => selectSuggestion(suggestion)}
                                        className="px-3 py-2 hover:bg-zinc-700 cursor-pointer text-sm text-zinc-300 border-b border-zinc-700/50 last:border-0 flex items-start gap-2"
                                    >
                                        <span className="text-blue-400 mt-0.5">📍</span>
                                        <span className="line-clamp-2">{suggestion.description}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => onSelectLocation({ title, description, date, time, tags, image: imagePreview, location: locationInput })}
                        className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap w-full sm:w-auto"
                    >
                        Pick on Map
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Event Image</label>
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-700 rounded-lg p-4 text-center cursor-pointer hover:border-zinc-500 transition-colors"
                >
                    {imagePreview ? (
                        <div className="relative h-40 w-full">
                            <img src={imagePreview} alt="Preview" className="h-full w-full object-cover rounded-md" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-md">
                                <span className="text-white">Change Image</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-zinc-500 py-8">
                            <p>Click to upload image</p>
                            <p className="text-xs mt-1">JPG, PNG up to 5MB</p>
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                    />
                </div>
            </div>

            <button
                type="submit"
                className="w-full bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
                Create Event
            </button>
        </form>
    );
};

export default CreateEventForm;
