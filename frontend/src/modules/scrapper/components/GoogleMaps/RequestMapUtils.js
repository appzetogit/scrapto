import { useLoadScript } from '@react-google-maps/api';

// Include additional libraries for 3D features and advanced functionality
const LIBRARIES = ['places', 'geometry', 'drawing', 'visualization'];

export const useGoogleMaps = () => {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries: LIBRARIES,
        // Enable 3D features
        version: 'weekly',
    });

    return { isLoaded, loadError };
};

// Map default styles and config
export const mapContainerStyle = {
    width: '100%',
    height: '100%',
};

export const defaultCenter = {
    lat: 19.0760, // Mumbai
    lng: 72.8777,
};

export const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    clickableIcons: false,
    // Custom Scrapto green theme
    styles: [
        {
            "featureType": "landscape.natural",
            "elementType": "geometry.fill",
            "stylers": [{ "visibility": "on" }, { "color": "#e0efef" }]
        },
        {
            "featureType": "poi",
            "elementType": "geometry.fill",
            "stylers": [{ "visibility": "on" }, { "hue": "#1900ff" }, { "color": "#c0e8e8" }]
        },
        {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [{ "lightness": 100 }, { "visibility": "simplified" }]
        },
        {
            "featureType": "road",
            "elementType": "labels",
            "stylers": [{ "visibility": "off" }]
        },
        {
            "featureType": "transit.line",
            "elementType": "geometry",
            "stylers": [{ "visibility": "on" }, { "lightness": 700 }]
        },
        {
            "featureType": "water",
            "elementType": "all",
            "stylers": [{ "color": "#7dcdcd" }]
        }
    ],
};
