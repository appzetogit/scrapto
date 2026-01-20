import { GoogleMap, Marker, DirectionsRenderer, Polyline } from '@react-google-maps/api';
import { useGoogleMaps, mapContainerStyle, defaultCenter, mapOptions } from './RequestMapUtils';
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePageTranslation } from '../../../../hooks/usePageTranslation';
import socketClient from '../../../../modules/shared/utils/socketClient';

// Custom 3D-style marker icons (Lazy created to avoid window.google access on module load)
const getScrapperIcon = () => ({
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <!-- Shadow -->
            <ellipse cx="24" cy="44" rx="12" ry="3" fill="rgba(0,0,0,0.2)"/>
            <!-- Truck body -->
            <path d="M8 20 L8 32 L32 32 L32 20 Z" fill="#64946e" stroke="#ffffff" stroke-width="2"/>
            <!-- Truck cabin -->
            <path d="M8 16 L8 20 L20 20 L20 16 Z" fill="#4a7356" stroke="#ffffff" stroke-width="2"/>
            <!-- Wheels -->
            <circle cx="14" cy="32" r="4" fill="#2d3748" stroke="#ffffff" stroke-width="2"/>
            <circle cx="26" cy="32" r="4" fill="#2d3748" stroke="#ffffff" stroke-width="2"/>
            <!-- Window -->
            <rect x="10" y="17" width="8" height="2" fill="#87ceeb" opacity="0.7"/>
            <!-- Recycling symbol -->
            <text x="20" y="28" font-size="10" fill="white" font-weight="bold">♻</text>
        </svg>
    `),
    scaledSize: window.google ? new window.google.maps.Size(48, 48) : null,
    anchor: window.google ? new window.google.maps.Point(24, 44) : null,
});

const getUserIcon = () => ({
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg width="40" height="48" viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
            <!-- Shadow -->
            <ellipse cx="20" cy="46" rx="10" ry="2" fill="rgba(0,0,0,0.2)"/>
            <!-- Pin body -->
            <path d="M20 4 C12 4 6 10 6 18 C6 28 20 44 20 44 C20 44 34 28 34 18 C34 10 28 4 20 4 Z" 
                  fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
            <!-- Inner circle -->
            <circle cx="20" cy="18" r="6" fill="#ffffff"/>
            <!-- User icon -->
            <circle cx="20" cy="16" r="2.5" fill="#ef4444"/>
            <path d="M16 22 Q20 20 24 22" stroke="#ef4444" stroke-width="1.5" fill="none"/>
        </svg>
    `),
    scaledSize: window.google ? new window.google.maps.Size(40, 48) : null,
    anchor: window.google ? new window.google.maps.Point(20, 46) : null,
});

const ScrapperMap = ({
    orderId,
    userLocation,
    scrapperLocation,
    stage, // 'request' | 'pickup' | 'arrived'
    userName,
    enableTracking = true,
    showTrail = true
}) => {
    const staticTexts = [
        "Error loading map",
        "Please check your internet connection",
        "Loading 3D Map...",
        "Preparing your route",
        "Pickup Location",
        "Scrapper (You)",
        "Arrived! 🎉"
    ];
    const { getTranslatedText } = usePageTranslation(staticTexts);
    const { isLoaded, loadError } = useGoogleMaps();
    const [directions, setDirections] = useState(null);
    const [map, setMap] = useState(null);
    const [animatedPosition, setAnimatedPosition] = useState(scrapperLocation);
    const [trail, setTrail] = useState([]);
    const [heading, setHeading] = useState(0);
    const [routeStats, setRouteStats] = useState(null);
    const animationRef = useRef(null);
    const lastPositionRef = useRef(scrapperLocation);

    const onLoad = useCallback((map) => {
        setMap(map);
        // Enable 3D buildings and tilt
        map.setTilt(45);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
    }, []);

    // Smooth animation for scrapper movement
    useEffect(() => {
        if (!scrapperLocation || !enableTracking) {
            setAnimatedPosition(scrapperLocation);
            return;
        }

        const lastPos = lastPositionRef.current;
        if (!lastPos || (lastPos.lat === scrapperLocation.lat && lastPos.lng === scrapperLocation.lng)) {
            setAnimatedPosition(scrapperLocation);
            return;
        }

        // Calculate heading (direction)
        const deltaLat = scrapperLocation.lat - lastPos.lat;
        const deltaLng = scrapperLocation.lng - lastPos.lng;
        const newHeading = Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);
        setHeading(newHeading);

        // Smooth animation
        const steps = 60; // 60 frames for smooth animation
        let currentStep = 0;

        const animate = () => {
            if (currentStep < steps) {
                const progress = currentStep / steps;
                const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic

                const newLat = lastPos.lat + (scrapperLocation.lat - lastPos.lat) * easedProgress;
                const newLng = lastPos.lng + (scrapperLocation.lng - lastPos.lng) * easedProgress;

                setAnimatedPosition({ lat: newLat, lng: newLng });

                // Add to trail
                if (showTrail && currentStep % 5 === 0) {
                    setTrail(prev => [...prev.slice(-50), { lat: newLat, lng: newLng }]);
                }

                // Broadcast location update if pickup stage
                if (stage === 'pickup' && orderId && currentStep % 10 === 0) {
                    socketClient.sendLocationUpdate({
                        orderId,
                        location: { lat: newLat, lng: newLng },
                        heading: newHeading
                    });
                }

                currentStep++;
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setAnimatedPosition(scrapperLocation);
                lastPositionRef.current = scrapperLocation;

                // Final update
                if (stage === 'pickup' && orderId) {
                    socketClient.sendLocationUpdate({
                        orderId,
                        location: scrapperLocation,
                        heading: heading
                    });
                }
            }
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [scrapperLocation, enableTracking, showTrail, stage, orderId]);

    // Calculate Route when in pickup stage
    useEffect(() => {
        if (stage === 'pickup' && isLoaded && scrapperLocation && userLocation) {
            const directionsService = new window.google.maps.DirectionsService();

            directionsService.route(
                {
                    origin: scrapperLocation,
                    destination: userLocation,
                    travelMode: window.google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (status === window.google.maps.DirectionsStatus.OK) {
                        setDirections(result);
                        // Extract stats
                        if (result.routes[0]?.legs[0]) {
                            const leg = result.routes[0].legs[0];
                            setRouteStats({
                                distance: leg.distance.text,
                                duration: leg.duration.text
                            });
                        }
                    } else {
                        console.error(`Error fetching directions ${result}`);
                    }
                }
            );
        }
    }, [stage, isLoaded, scrapperLocation, userLocation]);

    // Adjust bounds to fit markers with padding
    useEffect(() => {
        if (map && isLoaded) {
            const bounds = new window.google.maps.LatLngBounds();
            let hasPoints = false;

            if (userLocation) {
                bounds.extend(userLocation);
                hasPoints = true;
            }

            if (animatedPosition) {
                bounds.extend(animatedPosition);
                hasPoints = true;
            }

            if (hasPoints) {
                map.fitBounds(bounds, {
                    top: 100,
                    bottom: 100,
                    left: 100,
                    right: 100
                });

                // Limit max zoom
                const listener = window.google.maps.event.addListener(map, 'idle', () => {
                    if (map.getZoom() > 16) map.setZoom(16);
                    window.google.maps.event.removeListener(listener);
                });
            }
        }
    }, [map, isLoaded, userLocation, animatedPosition]);

    if (loadError) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-xl">
                <div className="text-center p-6">
                    <p className="text-red-500 font-semibold mb-2">{getTranslatedText("Error loading map")}</p>
                    <p className="text-sm text-gray-600">{getTranslatedText("Please check your internet connection")}</p>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 rounded-xl">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-700 font-semibold">{getTranslatedText("Loading 3D Map...")}</p>
                    <p className="text-sm text-gray-500 mt-2">{getTranslatedText("Preparing your route")}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={14}
                center={animatedPosition || userLocation || defaultCenter}
                options={{
                    ...mapOptions,
                    tilt: 45, // 3D view
                    heading: heading,
                    mapTypeId: 'roadmap',
                    gestureHandling: 'greedy',
                }}
                onLoad={onLoad}
                onUnmount={onUnmount}
            >
                {/* Trail/Path (breadcrumb) */}
                {showTrail && trail.length > 1 && (
                    <Polyline
                        path={trail}
                        options={{
                            strokeColor: '#64946e',
                            strokeOpacity: 0.4,
                            strokeWeight: 4,
                            geodesic: true,
                            icons: [{
                                icon: {
                                    path: window.google.maps.SymbolPath.CIRCLE,
                                    scale: 2,
                                    fillColor: '#64946e',
                                    fillOpacity: 0.6,
                                    strokeColor: '#ffffff',
                                    strokeWeight: 1,
                                },
                                offset: '0',
                                repeat: '20px'
                            }]
                        }}
                    />
                )}

                {/* Request Stage: Show User Marker only */}
                {stage === 'request' && userLocation && (
                    <Marker
                        position={userLocation}
                        title={userName || getTranslatedText("Pickup Location")}
                        icon={getUserIcon()}
                        animation={window.google.maps.Animation.DROP}
                    />
                )}

                {/* Pickup Stage: Show both + Route */}
                {stage === 'pickup' && (
                    <>
                        {/* Animated Scrapper Marker with 3D truck icon */}
                        {animatedPosition && (
                            <Marker
                                position={animatedPosition}
                                title={getTranslatedText("Scrapper (You)")}
                                icon={getScrapperIcon()}
                                zIndex={1000}
                            />
                        )}

                        {/* User Marker with 3D pin */}
                        {userLocation && (
                            <Marker
                                position={userLocation}
                                title={userName || getTranslatedText("Pickup Location")}
                                icon={getUserIcon()}
                                animation={window.google.maps.Animation.BOUNCE}
                            />
                        )}

                        {/* Route Line with premium opaque style */}
                        {directions && (
                            <DirectionsRenderer
                                directions={directions}
                                options={{
                                    suppressMarkers: true,
                                    polylineOptions: {
                                        strokeColor: "#1e1e1e", // Dark grey/black for premium look
                                        strokeOpacity: 0.9,
                                        strokeWeight: 6,
                                        geodesic: true,
                                    },
                                }}
                            />
                        )}
                    </>
                )}

                {/* Arrived Stage: Show celebration */}
                {stage === 'arrived' && userLocation && (
                    <Marker
                        position={userLocation}
                        title={getTranslatedText("Arrived! 🎉")}
                        icon={{
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="30" cy="30" r="28" fill="#10b981" stroke="#ffffff" stroke-width="3"/>
                                <text x="30" y="40" font-size="30" text-anchor="middle" fill="white">✓</text>
                            </svg>
                        `),
                            scaledSize: new window.google.maps.Size(60, 60),
                            anchor: new window.google.maps.Point(30, 30),
                        }}
                        animation={window.google.maps.Animation.BOUNCE}
                    />
                )}
            </GoogleMap>

            {/* Stats Overlay for Pickup Status */}
            {stage === 'pickup' && routeStats && (
                <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md px-4 py-3 rounded-xl shadow-lg border border-gray-100/50">
                    <div className="flex items-center gap-4">
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Distance</p>
                            <p className="text-lg font-bold text-gray-800">{routeStats.distance}</p>
                        </div>
                        <div className="w-[1px] h-8 bg-gray-200"></div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Est. Time</p>
                            <p className="text-lg font-bold text-green-600">{routeStats.duration}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScrapperMap;
