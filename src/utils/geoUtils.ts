import { GeoJsonData, Municipality, GeoJsonFeature } from "../types";

/**
 * Process the original large GeoJSON file
 * This is a placeholder. In production, you'd run this server-side
 * to avoid loading the full file to the client
 */
export const processGeoJsonData = (
  data: GeoJsonData,
  municipalitiesData: Municipality[]
): GeoJsonData => {
  // In production, you'd have a mapping of GeoJSON features to municipality data
  // This is a placeholder implementation
  const processedFeatures = data.features.map((feature) => {
    // Find corresponding municipality data
    const municipality = municipalitiesData.find(
      (m) => m.name === feature.properties.name
    );

    if (municipality) {
      // Add municipality data to GeoJSON properties
      return {
        ...feature,
        properties: {
          ...feature.properties,
          id: municipality.id,
          budget: municipality.budget,
          province: municipality.province,
          district: municipality.district,
          type: municipality.type,
          population: municipality.population,
          area: municipality.area,
        },
      };
    }

    return feature;
  });

  return {
    ...data,
    features: processedFeatures,
  };
};

/**
 * Find the nearest municipality to a given point
 * This is a simplified implementation
 */
export const findNearestPoint = (
  point: [number, number],
  geojsonData: GeoJsonData
): string | null => {
  // In production, you'd use a spatial index or other optimization
  // This is just a placeholder function
  return geojsonData.features[0]?.properties.name || null;
};

/**
 * Split a large GeoJSON file into smaller chunks for efficient loading
 * This would typically be done server-side
 */
export const splitGeoJsonByProvince = (
  data: GeoJsonData
): Record<string, GeoJsonData> => {
  // Group features by province
  const provinceMap: Record<string, GeoJsonFeature[]> = {};

  data.features.forEach((feature) => {
    const province = feature.properties.province || "unknown";
    if (!provinceMap[province]) {
      provinceMap[province] = [];
    }
    provinceMap[province].push(feature);
  });

  // Create a GeoJSON file for each province
  const result: Record<string, GeoJsonData> = {};

  Object.entries(provinceMap).forEach(([province, features]) => {
    result[province] = {
      type: "FeatureCollection",
      features,
    };
  });

  return result;
};
