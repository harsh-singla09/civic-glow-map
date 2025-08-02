/**
 * Utility functions for distance calculation and geospatial operations
 */

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Convert degrees to radians
 * @param {number} degrees 
 * @returns {number} Radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Convert kilometers to meters
 * @param {number} km - Distance in kilometers
 * @returns {number} Distance in meters
 */
function kmToMeters(km) {
  return km * 1000;
}

/**
 * Convert meters to kilometers
 * @param {number} meters - Distance in meters
 * @returns {number} Distance in kilometers
 */
function metersToKm(meters) {
  return meters / 1000;
}

/**
 * Create a MongoDB geospatial query for finding nearby points
 * @param {number} longitude - Center longitude
 * @param {number} latitude - Center latitude
 * @param {number} maxDistanceKm - Maximum distance in kilometers
 * @returns {Object} MongoDB geospatial query
 */
function createNearbyQuery(longitude, latitude, maxDistanceKm) {
  return {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: kmToMeters(maxDistanceKm)
      }
    }
  };
}

/**
 * Create a MongoDB geospatial query for finding points within a polygon
 * @param {Array} coordinates - Array of [lng, lat] coordinates defining the polygon
 * @returns {Object} MongoDB geospatial query
 */
function createWithinPolygonQuery(coordinates) {
  return {
    location: {
      $geoWithin: {
        $geometry: {
          type: 'Polygon',
          coordinates: [coordinates]
        }
      }
    }
  };
}

/**
 * Create a bounding box query
 * @param {number} minLng - Minimum longitude
 * @param {number} minLat - Minimum latitude
 * @param {number} maxLng - Maximum longitude
 * @param {number} maxLat - Maximum latitude
 * @returns {Object} MongoDB geospatial query
 */
function createBoundingBoxQuery(minLng, minLat, maxLng, maxLat) {
  return {
    location: {
      $geoWithin: {
        $box: [[minLng, minLat], [maxLng, maxLat]]
      }
    }
  };
}

/**
 * Validate longitude value
 * @param {number} lng - Longitude value
 * @returns {boolean} True if valid
 */
function isValidLongitude(lng) {
  return typeof lng === 'number' && lng >= -180 && lng <= 180;
}

/**
 * Validate latitude value
 * @param {number} lat - Latitude value
 * @returns {boolean} True if valid
 */
function isValidLatitude(lat) {
  return typeof lat === 'number' && lat >= -90 && lat <= 90;
}

/**
 * Validate coordinate pair
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 * @returns {boolean} True if both coordinates are valid
 */
function isValidCoordinates(lng, lat) {
  return isValidLongitude(lng) && isValidLatitude(lat);
}

/**
 * Create GeoJSON Point object
 * @param {number} longitude 
 * @param {number} latitude 
 * @returns {Object} GeoJSON Point
 */
function createGeoJSONPoint(longitude, latitude) {
  if (!isValidCoordinates(longitude, latitude)) {
    throw new Error('Invalid coordinates provided');
  }
  
  return {
    type: 'Point',
    coordinates: [longitude, latitude]
  };
}

/**
 * Get center point of multiple coordinates
 * @param {Array} coordinates - Array of [lng, lat] pairs
 * @returns {Array} Center coordinates [lng, lat]
 */
function getCenterPoint(coordinates) {
  if (!coordinates || coordinates.length === 0) {
    throw new Error('No coordinates provided');
  }
  
  const sum = coordinates.reduce(
    (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
    [0, 0]
  );
  
  return [sum[0] / coordinates.length, sum[1] / coordinates.length];
}

/**
 * Get bounding box for a set of coordinates
 * @param {Array} coordinates - Array of [lng, lat] pairs
 * @returns {Object} Bounding box {minLng, minLat, maxLng, maxLat}
 */
function getBoundingBox(coordinates) {
  if (!coordinates || coordinates.length === 0) {
    throw new Error('No coordinates provided');
  }
  
  let minLng = coordinates[0][0];
  let maxLng = coordinates[0][0];
  let minLat = coordinates[0][1];
  let maxLat = coordinates[0][1];
  
  coordinates.forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });
  
  return { minLng, minLat, maxLng, maxLat };
}

module.exports = {
  calculateDistance,
  toRadians,
  kmToMeters,
  metersToKm,
  createNearbyQuery,
  createWithinPolygonQuery,
  createBoundingBoxQuery,
  isValidLongitude,
  isValidLatitude,
  isValidCoordinates,
  createGeoJSONPoint,
  getCenterPoint,
  getBoundingBox
};