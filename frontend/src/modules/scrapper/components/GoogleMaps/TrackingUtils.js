/**
 * Location Tracking & Simulation Utilities for Scrapto
 * Provides real-time tracking simulation and helper functions
 */

/**
 * Simulate scrapper movement along a route
 * @param {Array} routePoints - Array of {lat, lng} points from DirectionsService
 * @param {Function} onPositionUpdate - Callback function to update position
 * @param {Number} speedKmh - Speed in km/h (default: 30)
 * @param {Number} updateIntervalMs - Update interval in milliseconds (default: 1000)
 * @returns {Object} - Control object with start, pause, resume, stop methods
 */
export const simulateMovement = (routePoints, onPositionUpdate, speedKmh = 30, updateIntervalMs = 1000) => {
    if (!routePoints || routePoints.length < 2) {
        console.error('Need at least 2 points for simulation');
        return null;
    }

    let currentIndex = 0;
    let progress = 0;
    let intervalId = null;
    let isPaused = false;

    // Calculate distance between two points (Haversine formula)
    const calculateDistance = (point1, point2) => {
        const R = 6371; // Earth radius in km
        const dLat = (point2.lat - point1.lat) * Math.PI / 180;
        const dLon = (point2.lng - point1.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Interpolate between two points
    const interpolate = (point1, point2, fraction) => {
        return {
            lat: point1.lat + (point2.lat - point1.lat) * fraction,
            lng: point1.lng + (point2.lng - point1.lng) * fraction
        };
    };

    const updatePosition = () => {
        if (isPaused || currentIndex >= routePoints.length - 1) {
            return;
        }

        const currentPoint = routePoints[currentIndex];
        const nextPoint = routePoints[currentIndex + 1];
        const segmentDistance = calculateDistance(currentPoint, nextPoint);

        // Distance covered in this update (km)
        const distancePerUpdate = (speedKmh / 3600) * (updateIntervalMs / 1000);

        // Progress increment for this segment
        const progressIncrement = distancePerUpdate / segmentDistance;
        progress += progressIncrement;

        if (progress >= 1) {
            // Move to next segment
            currentIndex++;
            progress = 0;

            if (currentIndex >= routePoints.length - 1) {
                // Reached destination
                onPositionUpdate(routePoints[routePoints.length - 1], true);
                stop();
                return;
            }
        }

        const newPosition = interpolate(
            routePoints[currentIndex],
            routePoints[currentIndex + 1],
            progress
        );

        onPositionUpdate(newPosition, false);
    };

    const start = () => {
        if (intervalId) return;
        intervalId = setInterval(updatePosition, updateIntervalMs);
    };

    const pause = () => {
        isPaused = true;
    };

    const resume = () => {
        isPaused = false;
    };

    const stop = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };

    return { start, pause, resume, stop };
};

/**
 * Get current geolocation
 * @returns {Promise<{lat, lng}>}
 */
export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
};

/**
 * Watch position changes in real-time
 * @param {Function} onPositionChange - Callback with {lat, lng}
 * @returns {Number} - Watch ID to clear later
 */
export const watchPosition = (onPositionChange) => {
    if (!navigator.geolocation) {
        console.error('Geolocation not supported');
        return null;
    }

    return navigator.geolocation.watchPosition(
        (position) => {
            onPositionChange({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                heading: position.coords.heading,
                speed: position.coords.speed
            });
        },
        (error) => {
            console.error('Position watch error:', error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
};

/**
 * Clear position watch
 * @param {Number} watchId
 */
export const clearWatch = (watchId) => {
    if (watchId && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
    }
};

/**
 * Calculate ETA based on distance and speed
 * @param {Number} distanceKm - Distance in kilometers
 * @param {Number} speedKmh - Speed in km/h
 * @returns {String} - Formatted ETA (e.g., "15 mins")
 */
export const calculateETA = (distanceKm, speedKmh = 30) => {
    const hours = distanceKm / speedKmh;
    const minutes = Math.round(hours * 60);

    if (minutes < 1) return 'Less than 1 min';
    if (minutes === 1) return '1 min';
    if (minutes < 60) return `${minutes} mins`;

    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
};

/**
 * Format distance for display
 * @param {Number} distanceKm - Distance in kilometers
 * @returns {String} - Formatted distance
 */
export const formatDistance = (distanceKm) => {
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
};

/**
 * Extract route points from Google Directions result
 * @param {Object} directionsResult - Result from DirectionsService
 * @returns {Array} - Array of {lat, lng} points
 */
export const extractRoutePoints = (directionsResult) => {
    if (!directionsResult || !directionsResult.routes || !directionsResult.routes[0]) {
        return [];
    }

    const route = directionsResult.routes[0];
    const points = [];

    route.legs.forEach(leg => {
        leg.steps.forEach(step => {
            // Add start point
            points.push({
                lat: step.start_location.lat(),
                lng: step.start_location.lng()
            });

            // Add path points if available
            if (step.path) {
                step.path.forEach(point => {
                    points.push({
                        lat: point.lat(),
                        lng: point.lng()
                    });
                });
            }
        });
    });

    // Add final destination
    const lastLeg = route.legs[route.legs.length - 1];
    points.push({
        lat: lastLeg.end_location.lat(),
        lng: lastLeg.end_location.lng()
    });

    return points;
};

/**
 * Demo: Simulate a journey from point A to B
 * Usage in component:
 * 
 * const startSimulation = async () => {
 *   const directionsService = new google.maps.DirectionsService();
 *   const result = await directionsService.route({
 *     origin: startPoint,
 *     destination: endPoint,
 *     travelMode: google.maps.TravelMode.DRIVING
 *   });
 *   
 *   const routePoints = extractRoutePoints(result);
 *   const simulation = simulateMovement(
 *     routePoints,
 *     (position, isComplete) => {
 *       setScrapperLocation(position);
 *       if (isComplete) {
 *         console.log('Journey complete!');
 *       }
 *     },
 *     40, // 40 km/h speed
 *     1000 // Update every second
 *   );
 *   
 *   simulation.start();
 *   return simulation; // Save to stop later
 * };
 */

export default {
    simulateMovement,
    getCurrentLocation,
    watchPosition,
    clearWatch,
    calculateETA,
    formatDistance,
    extractRoutePoints
};
