export interface Island {
  points: number[][];
}

// Convert GeoJSON FeatureCollection to Simulator Island polygons
export function parseGeoJSONToIslands(
  geoJSON: any,
  refLat: number,
  refLon: number,
  scaleMeters: number = 1.0
): Island[] {
  const islands: Island[] = [];
  if (!geoJSON || !geoJSON.features) return islands;

  // Projection formula from GPS coordinates to relative simulator coordinates in meters.
  // Positive X is East, Positive Y is South (canvas Y coordinate is inverted: south is positive)
  const gpsToSimulator = (lon: number, lat: number): number[] => {
    const rEarth = 6378137; // Earth's radius in meters (WGS-84)
    const latRad = (lat * Math.PI) / 180;
    const refLatRad = (refLat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;
    const refLonRad = (refLon * Math.PI) / 180;

    // Local flat-earth projection centered at (refLat, refLon)
    const x = rEarth * (lonRad - refLonRad) * Math.cos(refLatRad) * scaleMeters;
    const y = -rEarth * (latRad - refLatRad) * scaleMeters;
    
    return [x, y];
  };

  geoJSON.features.forEach((feature: any) => {
    const geom = feature.geometry;
    if (!geom) return;

    const addPolygon = (coords: number[][][]) => {
      if (!coords || coords.length === 0) return;
      // coords[0] is the outer ring, coords[1..n] are holes.
      // We map the outer ring to create the island boundary points.
      const points = coords[0].map((coord: number[]) => {
        // OSM GeoJSON coords are [longitude, latitude]
        return gpsToSimulator(coord[0], coord[1]);
      });
      if (points.length > 2) {
        islands.push({ points });
      }
    };

    if (geom.type === 'Polygon') {
      addPolygon(geom.coordinates);
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach((polyCoords: number[][][]) => {
        addPolygon(polyCoords);
      });
    }
  });

  return islands;
}
