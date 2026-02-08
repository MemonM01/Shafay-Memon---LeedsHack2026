import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo } from 'react';

// Fix for default marker icon missing in Leaflet with React
// ... (imports remain)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

import type { Event } from '../types/Events';
import EventCard from './EventCard';
import { MILE_TO_METERS, DEFAULT_SEARCH_RADIUS_MILES } from '../lib/geoUtils';

type MapProps = {
    center: [number, number]
    events: Event[]
    userLocation?: [number, number] | null
    activeEvent?: Event | null
    isSelectingLocation?: boolean
    onLocationSelect?: (lat: number, lng: number) => void
    pendingLocation?: [number, number] | null
    onEdit?: (event: Event) => void
}


const LocationSelector = ({ isSelectingLocation, onLocationSelect }: { isSelectingLocation?: boolean, onLocationSelect?: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            if (isSelectingLocation && onLocationSelect) {
                onLocationSelect(e.latlng.lat, e.latlng.lng);
            }
        },
    })
    return null
}

const userIcon = L.divIcon({
    className: '',
    html: '<div style="display: flex; align-items: center; justify-content: center; width: 64px; height: 64px;"><div class="user-location-marker"></div></div>',
    iconSize: [64, 64],
    iconAnchor: [32, 32],
    popupAnchor: [0, -30]
});

const suggestedIcon = (score: number = 0) => {
    // scale between 1.0 and 2.5 based on score (0 to 1)
    // This makes highly recommended events jump out!
    const scale = 1.0 + (score * 1.5);

    return L.divIcon({
        className: '',
        html: `
            <div style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4)); animation: marker-pulse 2s infinite;">
                <svg width="${30 * scale}" height="${42 * scale}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 21C16 17.5 19 14.4087 19 11.2C19 7.22355 15.866 4 12 4C8.13401 4 5 7.22355 5 11.2C5 14.4087 8 17.5 12 21Z" fill="#ef4444" stroke="white" stroke-width="${1.5 / scale}"/>
                    <circle cx="12" cy="11" r="3" fill="white"/>
                </svg>
            </div>
        `,
        iconSize: [30 * scale, 42 * scale],
        iconAnchor: [(30 * scale) / 2, 42 * scale],
        popupAnchor: [0, -42 * scale]
    });
};

const localIcon = L.divIcon({
    className: '',
    html: `
        <div style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
            <svg width="30" height="42" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21C16 17.5 19 14.4087 19 11.2C19 7.22355 15.866 4 12 4C8.13401 4 5 7.22355 5 11.2C5 14.4087 8 17.5 12 21Z" fill="#3b82f6" stroke="white" stroke-width="1.5"/>
                <circle cx="12" cy="11" r="3" fill="white"/>
            </svg>
        </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -40]
});

// Component to handle marker interactions requiring map instance
const EventMarker = ({ event, onEdit }: { event: Event, onEdit?: (event: Event) => void }) => {
    const map = useMap();
    const isSuggested = event.score !== undefined;

    return (
        <Marker
            position={event.position}
            icon={isSuggested ? suggestedIcon(event.score) : localIcon}
            eventHandlers={{
                click: () => {
                    map.flyTo(event.position, 16, {
                        duration: 1.5,
                        easeLinearity: 0.25
                    });
                }
            }}
        >
            <Popup maxWidth={300} minWidth={300} className="m-0! p-0! bg-transparent shadow-none border-none">
                <EventCard event={event} onEdit={onEdit} />
            </Popup>
        </Marker>
    )
}

const MapController = ({ activeEvent }: { activeEvent?: Event | null }) => {
    const map = useMap();

    useEffect(() => {
        if (activeEvent) {
            map.flyTo(activeEvent.position, 16, {
                duration: 1.5,
                easeLinearity: 0.25
            });
        }
    }, [activeEvent, map]);

    return null;
}

const Map = ({ center, events, userLocation, activeEvent, isSelectingLocation, onLocationSelect, pendingLocation, onEdit }: MapProps) => {
    const uniqueEvents = useMemo(() => {
        const m = new window.Map<string, Event>();
        events.forEach(e => {
            const existing = m.get(e.id);
            if (!existing || (e.score !== undefined && existing.score === undefined)) {
                m.set(e.id, e);
            }
        });
        return Array.from(m.values());
    }, [events]);

    return (
        <MapContainer center={center} zoom={13} scrollWheelZoom={true} className={`h-full w-full ${isSelectingLocation ? 'cursor-crosshair' : ''}`}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController activeEvent={activeEvent} />
            <LocationSelector isSelectingLocation={isSelectingLocation} onLocationSelect={onLocationSelect} />
            <Circle center={center} radius={MILE_TO_METERS * DEFAULT_SEARCH_RADIUS_MILES} color="#3b82f6" fillColor="#3b82f6" fillOpacity={0.1} />
            {userLocation && (
                <>


                    <Marker position={userLocation} icon={userIcon}>
                        <Popup>
                            <div className="flex flex-col gap-2 bg-white border border-zinc-800 rounded-xl p-2">
                                <h3 className="text-lg font-semibold">You are here</h3>
                            </div>
                        </Popup>
                    </Marker>
                </>
            )}
            {pendingLocation && (
                <Marker position={pendingLocation}
                    icon={L.divIcon({
                        className: '',
                        html: '<div class="pending-location-marker"></div>',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10],
                    })}
                    ref={(ref) => {
                        if (ref) {
                            ref.openPopup();
                        }
                    }}
                >
                    <Popup autoClose={false} closeOnClick={false} className="font-bold text-center">
                        Selected Location
                        <div className="text-xs font-normal text-gray-500 mt-1"> Event will be created here</div>
                    </Popup>
                </Marker>
            )}
            {uniqueEvents.map((event) => (
                <EventMarker
                    key={event.id}
                    event={event}
                    onEdit={onEdit}
                />
            ))}
        </MapContainer>
    )
}

export default Map
