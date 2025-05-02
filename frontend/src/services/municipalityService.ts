import axios from "axios";
import { Municipality, GeoJsonData, GeoJsonFeature } from "../types";
import * as topojson from "topojson-client";

// Cache to store the fetched data
let municipalitiesCache: Municipality[] | null = null;
let geoJsonDataCache: GeoJsonData | null = null;

// Function to load GeoJSON data from TopoJSON file
export const loadGeoJsonData = async (): Promise<GeoJsonData> => {
  if (geoJsonDataCache) {
    return geoJsonDataCache;
  }

  try {
    // Use topo-data.json which exists in the data directory
    const response = await axios.get(
      `${process.env.PUBLIC_URL}/data/topo-data.json`
    );

    // Check if the data is a valid TopoJSON structure
    if (response.data.type !== "Topology") {
      console.error("Data is not a valid TopoJSON structure");
      throw new Error("Invalid data format: not a TopoJSON");
    }

    // Find the object in topology
    const topologyObject = response.data;
    const objectKeys = Object.keys(topologyObject.objects || {});

    if (!objectKeys.length) {
      throw new Error("No objects found in TopoJSON");
    }

    // Use the first object in the topology
    const objectName = objectKeys[0];

    // Convert TopoJSON to GeoJSON
    const convertedData = topojson.feature(
      topologyObject,
      topologyObject.objects[objectName]
    );

    // Cast the data to the expected type
    const typedData: GeoJsonData = {
      type: "FeatureCollection",
      features: convertedData.features as unknown as GeoJsonFeature[],
    };

    geoJsonDataCache = typedData;
    return typedData;
  } catch (error) {
    console.error("Error loading GeoJSON data:", error);
    throw new Error("Failed to load municipality data");
  }
};

// Function to extract municipality data from GeoJSON features
export const extractMunicipalitiesFromGeoJson = (
  geoJsonData: GeoJsonData
): Municipality[] => {
  if (!geoJsonData || !geoJsonData.features) {
    return [];
  }

  return geoJsonData.features
    .filter(
      (feature) =>
        feature.properties &&
        (feature.properties.name || feature.properties.mun_name)
    )
    .map((feature) => {
      const properties = feature.properties;
      const name = properties.name || properties.mun_name || "Unknown";
      const province = properties.cwt_name || properties.province || "Unknown";
      const district = properties.amp_name || properties.district || "Unknown";
      const type =
        properties.type ||
        properties["check-extracted-data - all-muni-nso-thai_type"] ||
        "เทศบาลตำบล";

      // Parse budget from properties if available
      let budget = 0;
      if (properties["1- clean-extracted_46_to_235_total"]) {
        const budgetStr = properties[
          "1- clean-extracted_46_to_235_total"
        ].replace(/,/g, "");
        budget = parseFloat(budgetStr) * 1000000; // Convert to full number
      } else {
        budget = getDefaultBudgetByType(properties);
      }

      // Parse population and area if available
      let population = undefined;
      if (properties["1- clean-extracted_46_to_235_poppu"]) {
        const popStr = properties["1- clean-extracted_46_to_235_poppu"].replace(
          /,/g,
          ""
        );
        population = parseInt(popStr, 10);
      }

      let area = undefined;
      if (properties["1- clean-extracted_46_to_235_land-sque-km"]) {
        const areaStr = properties[
          "1- clean-extracted_46_to_235_land-sque-km"
        ].replace(/,/g, "");
        area = parseFloat(areaStr);
      }

      return {
        id:
          properties.muni_code ||
          properties.id ||
          `muni-${name}-${Math.random().toString(36).substring(2, 9)}`,
        name,
        budget,
        province,
        district,
        population,
        area,
        type,
        budgetSources: calculateBudgetSources(properties, budget),
      };
    });
};

// Function to get default budget based on municipality type
const getDefaultBudgetByType = (properties: any): number => {
  const type =
    properties.type ||
    properties["check-extracted-data - all-muni-nso-thai_type"] ||
    "";

  if (type.includes("นคร") || type.toLowerCase().includes("nakhon")) {
    // City municipality (เทศบาลนคร) default
    return 1200000000; // 1.2 billion
  } else if (type.includes("เมือง") || type.toLowerCase().includes("mueang")) {
    // Town municipality (เทศบาลเมือง) default
    return 400000000; // 400 million
  } else {
    // Subdistrict municipality (เทศบาลตำบล) default
    return 80000000; // 80 million
  }
};

// Function to calculate budget sources
const calculateBudgetSources = (properties: any, totalBudget: number) => {
  // Default percentages based on municipality type
  const type =
    properties.type ||
    properties["check-extracted-data - all-muni-nso-thai_type"] ||
    "";

  let selfCollectedPercent = 0.15; // 15% default
  let stateAllocatedPercent = 0.3; // 30% default
  let subsidiesPercent = 0.55; // 55% default

  if (type.includes("นคร") || type.toLowerCase().includes("nakhon")) {
    // City municipalities collect more of their own taxes
    selfCollectedPercent = 0.3; // 30%
    stateAllocatedPercent = 0.25; // 25%
    subsidiesPercent = 0.45; // 45%
  } else if (type.includes("เมือง") || type.toLowerCase().includes("mueang")) {
    // Town municipalities
    selfCollectedPercent = 0.2; // 20%
    stateAllocatedPercent = 0.3; // 30%
    subsidiesPercent = 0.5; // 50%
  }

  // Convert to millions for display
  const totalBudgetMillion = totalBudget / 1000000;

  return {
    selfCollected: totalBudgetMillion * selfCollectedPercent,
    stateAllocated: totalBudgetMillion * stateAllocatedPercent,
    subsidies: totalBudgetMillion * subsidiesPercent,
  };
};

// Function to get all municipalities
export const getAllMunicipalities = async (): Promise<Municipality[]> => {
  if (municipalitiesCache) {
    return municipalitiesCache;
  }

  try {
    const geoJsonData = await loadGeoJsonData();
    const municipalities = extractMunicipalitiesFromGeoJson(geoJsonData);
    municipalitiesCache = municipalities;
    return municipalities;
  } catch (error) {
    console.error("Error getting municipalities:", error);
    throw new Error("Failed to get municipalities");
  }
};

// Function to search municipalities by name, province, or district
export const searchMunicipalities = async (
  query: string
): Promise<Municipality[]> => {
  try {
    const municipalities = await getAllMunicipalities();

    if (!query.trim()) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();

    return municipalities.filter(
      (municipality) =>
        municipality.name.toLowerCase().includes(normalizedQuery) ||
        municipality.province.toLowerCase().includes(normalizedQuery) ||
        municipality.district.toLowerCase().includes(normalizedQuery)
    );
  } catch (error) {
    console.error("Error searching municipalities:", error);
    throw new Error("Failed to search municipalities");
  }
};

// Function to get municipality by ID
export const getMunicipalityById = async (
  id: string
): Promise<Municipality | null> => {
  try {
    const municipalities = await getAllMunicipalities();
    return (
      municipalities.find((municipality) => municipality.id === id) || null
    );
  } catch (error) {
    console.error("Error getting municipality by ID:", error);
    throw new Error("Failed to get municipality");
  }
};

// Function to get municipality with its GeoJSON feature
export const getMunicipalityWithFeature = async (
  id: string
): Promise<{ municipality: Municipality; feature: GeoJsonFeature } | null> => {
  try {
    const municipalities = await getAllMunicipalities();
    const geoJsonData = await loadGeoJsonData();

    const municipality = municipalities.find((m) => m.id === id);
    if (!municipality) return null;

    const feature = geoJsonData.features.find(
      (f) =>
        (f.properties.muni_code && f.properties.muni_code === id) ||
        (f.properties.name && f.properties.name === municipality.name)
    );

    if (!feature) return null;

    return { municipality, feature };
  } catch (error) {
    console.error("Error getting municipality with feature:", error);
    throw new Error("Failed to get municipality with feature");
  }
};
