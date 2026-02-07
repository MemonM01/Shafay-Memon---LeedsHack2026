import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
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
}

const MILE_TO_METERS = 1609.34;

const userIcon = L.divIcon({
    className: '',
    html: '<div class="user-location-marker"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10]
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

// Handler for external map movements (e.g. from sidebar)
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

const Map = ({ center, events, userLocation, activeEvent }: MapProps) => {
    return (
        <MapContainer center={center} zoom={13} scrollWheelZoom={true} className="h-full w-full">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController activeEvent={activeEvent} />

            {userLocation && (
                <>

                    <Circle
                        center={userLocation}
                        radius={5 * MILE_TO_METERS}
                        pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.05 }}
                    />
                    <Circle
                        center={userLocation}
                        radius={3 * MILE_TO_METERS}
                        pathOptions={{ color: 'yellow', fillColor: 'yellow', fillOpacity: 0.05 }}
                    />
                    <Circle
                        center={userLocation}
                        radius={1 * MILE_TO_METERS}
                        pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.05 }}
                    />
                    <Marker position={userLocation} icon={userIcon}>
                        <Popup>
                            You are here
                        </Popup>
                    </Marker>
                </>
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