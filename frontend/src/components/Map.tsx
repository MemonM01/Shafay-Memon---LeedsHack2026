import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon missing in Leaflet with React
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
}

const MILE_TO_METERS = 1609.34;

const userIcon = L.divIcon({
    className: '',
    html: '<div class="user-location-marker"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10]
});

const Map = ({ center, events, userLocation }: MapProps) => {
    return (
        <MapContainer center={center} zoom={13} scrollWheelZoom={true} className="h-full w-full">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
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
                <Marker position={event.position} key={event.id}>
                    <Popup maxWidth={300} minWidth={300} className="!m-0 !p-0 bg-transparent shadow-none border-none">
                        <EventCard event={event} />
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    )
}

export default Map