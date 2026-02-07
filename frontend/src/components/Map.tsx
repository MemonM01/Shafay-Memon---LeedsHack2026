import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

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

type MapProps = {
    center: [number, number]
    events: Event[]
    userLocation?: [number, number] | null
    activeEvent?: Event | null
    isSelectingLocation?: boolean
    onLocationSelect?: (lat: number, lng: number) => void
    pendingLocation?: [number, number] | null
}

const MILE_TO_METERS = 1609.34;

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

// Component to handle marker interactions requiring map instance
const EventMarker = ({ event }: { event: Event }) => {
    const map = useMap();

    return (
        <Marker
            position={event.position}
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
                <EventCard event={event} />
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

const Map = ({ center, events, userLocation, activeEvent, isSelectingLocation, onLocationSelect, pendingLocation }: MapProps) => {
    return (
        <MapContainer center={center} zoom={13} scrollWheelZoom={true} className={`h-full w-full ${isSelectingLocation ? 'cursor-crosshair' : ''}`}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController activeEvent={activeEvent} />
            <LocationSelector isSelectingLocation={isSelectingLocation} onLocationSelect={onLocationSelect} />

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
            {events.map((event) => (
                <EventMarker
                    key={event.id}
                    event={event}
                />
            ))}
        </MapContainer>
    )
}

export default Map
