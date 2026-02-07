import { useEffect, useState } from "react";

export default function useUserLocation() {
    const [location, setLocation] = useState<[number, number] | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation([
                    pos.coords.latitude,
                    pos.coords.longitude,
                ]);
            },
            (err) => {
                console.error(err);
            }
        );
    }, []);

    return location;
}
