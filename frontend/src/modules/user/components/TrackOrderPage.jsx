import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader, Polyline } from '@react-google-maps/api';
import { motion } from 'framer-motion';
import socketClient from '../../shared/utils/socketClient';
import { orderAPI } from '../../shared/utils/api';
import { useAuth } from '../../shared/context/AuthContext';
import { FaPhone, FaComment, FaArrowLeft, FaMapMarkerAlt, FaTruck } from 'react-icons/fa';

// Map Styles (Clean Silver Theme)
const mapStyles = [
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
];

const mapContainerStyle = {
    width: '100%',
    height: '100%'
};

const defaultCenter = {
    lat: 19.0760,
    lng: 72.8777
};

// Icons (reused from scrapper module or simplified)
const truckIcon = {
    path: 'M17 8h3a3 3 0 0 1 3 3v8h-3a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H3V9a3 3 0 0 1 3-3h11zm-1-5a2 2 0 0 1 2 2v3h-2V3zm-2 0h-4v3h4V3zm-6 2v3H6V5a2 2 0 0 1 2-2z',
    fillColor: '#64946e',
    fillOpacity: 1,
    strokeWeight: 1,
    strokeColor: '#ffffff',
    scale: 1.5,
    anchor: { x: 12, y: 12 } // approximate center
};

const TrackOrderPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [order, setOrder] = useState(null);
    const [scrapperLocation, setScrapperLocation] = useState(null);
    const [userLocation, setUserLocation] = useState(defaultCenter);
    const [heading, setHeading] = useState(0);
    const [directions, setDirections] = useState(null);
    const [eta, setEta] = useState(null);
    const [distance, setDistance] = useState(null);

    const mapRef = useRef(null);
    const animationRef = useRef(null);

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: ['places', 'geometry']
    });

    // Load initial order data
    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await orderAPI.getById(orderId);
                if (response.success && response.data?.order) {
                    const data = response.data.order;
                    setOrder(data);

                    if (data.pickupAddress?.coordinates) {
                        const coords = data.pickupAddress.coordinates;
                        // Handle both {lat, lng} object and [lng, lat] array formats
                        const lat = typeof coords.lat === 'number' ? coords.lat : (Array.isArray(coords) ? coords[1] : null);
                        const lng = typeof coords.lng === 'number' ? coords.lng : (Array.isArray(coords) ? coords[0] : null);

                        if (lat && lng) {
                            setUserLocation({ lat, lng });
                        }
                    }

                    // Set Scrapper Location if available
                    if (data.scrapper?.liveLocation?.coordinates) {
                        const [lng, lat] = data.scrapper.liveLocation.coordinates;
                        if (lat && lng) {
                            setScrapperLocation({ lat, lng });
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to load order:", error);
            }
        };
        fetchOrder();
    }, [orderId]);

    // Socket Connection
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && orderId) {
            // Socket connection logic...
            if (!socketClient.getConnectionStatus()) {
                socketClient.connect(token);
            }

            socketClient.joinTracking(orderId);

            socketClient.onLocationUpdate((data) => {
                // data: { orderId, location, heading }
                if (data.orderId === orderId && data.location && data.location.lat && data.location.lng) {
                    setScrapperLocation(data.location);
                    setHeading(data.heading || 0);
                }
            });

            return () => {
                socketClient.leaveTracking(orderId);
                socketClient.offLocationUpdate();
            };
        }
    }, [orderId]);

    // Calculate Route
    useEffect(() => {
        if (isLoaded && scrapperLocation && userLocation && scrapperLocation.lat && userLocation.lat) {
            const directionsService = new window.google.maps.DirectionsService();
            directionsService.route({
                origin: scrapperLocation,
                destination: userLocation,
                travelMode: window.google.maps.TravelMode.DRIVING
            }, (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK) {
                    setDirections(result);
                    const leg = result.routes[0].legs[0];
                    setEta(leg.duration.text);
                    setDistance(leg.distance.text);
                }
            });
        }
    }, [isLoaded, scrapperLocation, userLocation]);

    // Fit Bounds - unchanged ...

    const onLoad = useCallback((map) => {
        mapRef.current = map;
    }, []);

    const onUnmount = useCallback(() => {
        mapRef.current = null;
    }, []);

    if (loadError) return <div className="p-4 text-center">Error loading map</div>;
    if (!isLoaded || !order) return <div className="p-4 text-center">Loading...</div>;

    return (
        <div className="relative h-screen w-full bg-gray-50 flex flex-col">
            {/* Header - unchanged ... */}
            <div className="absolute top-0 left-0 right-0 z-10 p-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700"
                    >
                        <FaArrowLeft />
                    </button>
                    <div className="bg-white px-4 py-2 rounded-full shadow-lg">
                        <h1 className="font-bold text-gray-800">
                            {eta ? `Arriving in ${eta}` : 'Tracking Order'}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Map */}
            <div className="flex-1">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    zoom={15}
                    center={scrapperLocation || userLocation}
                    options={{
                        styles: mapStyles,
                        disableDefaultUI: true,
                        zoomControl: true,
                    }}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                >
                    {/* User Home Marker */}
                    <Marker
                        position={userLocation}
                        icon={{
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                <svg width="40" height="48" viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
                                    <ellipse cx="20" cy="46" rx="10" ry="2" fill="rgba(0,0,0,0.2)"/>
                                    <path d="M20 4 C12 4 6 10 6 18 C6 28 20 44 20 44 C20 44 34 28 34 18 C34 10 28 4 20 4 Z" 
                                          fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
                                    <circle cx="20" cy="18" r="6" fill="#ffffff"/>
                                    <circle cx="20" cy="16" r="2.5" fill="#ef4444"/>
                                    <path d="M16 22 Q20 20 24 22" stroke="#ef4444" stroke-width="1.5" fill="none"/>
                                </svg>
                            `),
                            scaledSize: new window.google.maps.Size(40, 48),
                            anchor: new window.google.maps.Point(20, 46)
                        }}
                        animation={window.google.maps.Animation.BOUNCE}
                    />

                    {/* Scrapper Truck Marker */}
                    {scrapperLocation && (
                        <Marker
                            position={scrapperLocation}
                            icon={{
                                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                    <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                        <ellipse cx="24" cy="44" rx="12" ry="3" fill="rgba(0,0,0,0.2)"/>
                                        <path d="M8 20 L8 32 L32 32 L32 20 Z" fill="#64946e" stroke="#ffffff" stroke-width="2"/>
                                        <path d="M8 16 L8 20 L20 20 L20 16 Z" fill="#4a7356" stroke="#ffffff" stroke-width="2"/>
                                        <circle cx="14" cy="32" r="4" fill="#2d3748" stroke="#ffffff" stroke-width="2"/>
                                        <circle cx="26" cy="32" r="4" fill="#2d3748" stroke="#ffffff" stroke-width="2"/>
                                        <rect x="10" y="17" width="8" height="2" fill="#87ceeb" opacity="0.7"/>
                                        <text x="20" y="28" font-size="10" fill="white" font-weight="bold">♻</text>
                                    </svg>
                                `),
                                scaledSize: new window.google.maps.Size(48, 48),
                                anchor: new window.google.maps.Point(24, 44)
                            }}
                            zIndex={2}
                        />
                    )}

                    {/* Route */}
                    {directions && (
                        <DirectionsRenderer
                            directions={directions}
                            options={{
                                suppressMarkers: true,
                                polylineOptions: {
                                    strokeColor: "#4285F4",
                                    strokeOpacity: 0.9,
                                    strokeWeight: 6,
                                    geodesic: true,
                                }
                            }}
                        />
                    )}
                </GoogleMap>
            </div>

            {/* Bottom Card */}
            <div className="bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-6 z-10 -mt-6 relative">
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xl">
                            {order.scrapper?.name?.[0] || 'S'}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">{order.scrapper?.name || 'Assigned Scrapper'}</h3>
                            <p className="text-sm text-gray-500">{order.scrapper?.vehicleNumber || 'Scrapto Partner'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(`/chat`, { state: { orderId: order._id } })}
                            className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors"
                        >
                            <FaComment />
                        </button>
                        {order.scrapper?.phone && (
                            <a
                                href={`tel:${order.scrapper.phone}`}
                                className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors"
                            >
                                <FaPhone />
                            </a>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl mb-4">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-sm text-gray-600 font-medium">
                        {eta ? `Arriving in ${eta} (${distance})` : 'Calculating ETA...'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TrackOrderPage;
