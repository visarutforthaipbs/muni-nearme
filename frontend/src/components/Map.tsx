import React, {
  useEffect,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useRef,
} from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L, { PathOptions } from "leaflet";
import { GeoJsonData, Municipality, GeoJsonFeature } from "../types";
import axios from "axios";
import * as topojson from "topojson-client";

// Convert coordinates from Web Mercator (EPSG:3857) to WGS84 (EPSG:4326)
function convertToLatLng(x: number, y: number): [number, number] {
  // Convert from Web Mercator (EPSG:3857) to WGS84 (EPSG:4326)
  const lon = (x * 180) / 20037508.34;
  const lat =
    (Math.atan(Math.exp((y * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;
  return [lon, lat];
}

// Fix for Leaflet marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

interface MapProps {
  onMunicipalitySelect: (municipality: Municipality | null) => void;
}

// Export interface for map ref methods
export interface MapRef {
  focusOnMunicipality: (municipalityId: string) => void;
}

// Component to handle map recenter when location changes
const LocationMarker: React.FC<{ position: [number, number] }> = ({
  position,
}) => {
  const map = useMap();

  useEffect(() => {
    map.flyTo(position, 13);
  }, [position, map]);

  // Using a custom location marker with pulsing effect
  return (
    <Marker
      position={position}
      icon={L.divIcon({
        className: "custom-marker-icon",
        html: '<div class="marker-pin"></div><div class="pulse"></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      })}
    >
      <Popup className="custom-popup">
        <div className="popup-content">
          <strong>คุณอยู่ที่นี่</strong>
          <p>นี่คือตำแหน่งปัจจุบันของคุณ</p>
        </div>
      </Popup>
    </Marker>
  );
};

// Function to get default budget based on municipality type
const getDefaultBudgetByType = (properties: any): number => {
  const type =
    properties.type ||
    properties["check-extracted-data - all-muni-nso-thai_type"] ||
    "";

  console.log("Determining default budget for type:", type);

  if (type.includes("นคร") || type.toLowerCase().includes("nakhon")) {
    // City municipality (เทศบาลนคร) default
    console.log("Using city municipality default budget: 1.2 billion");
    return 1200000000; // 1.2 billion
  } else if (type.includes("เมือง") || type.toLowerCase().includes("mueang")) {
    // Town municipality (เทศบาลเมือง) default
    console.log("Using town municipality default budget: 400 million");
    return 400000000; // 400 million
  } else {
    // Subdistrict municipality (เทศบาลตำบล) default
    console.log("Using subdistrict municipality default budget: 80 million");
    return 80000000; // 80 million
  }
};

const Map = forwardRef<MapRef, MapProps>(({ onMunicipalitySelect }, ref) => {
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonData | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMunicipality, setSelectedMunicipality] =
    useState<GeoJsonFeature | null>(null);
  const [mapLayers, setMapLayers] = useState<{ [key: string]: L.Layer }>({});
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const layersRef = useRef<{ [key: string]: L.Layer }>({});

  // Default center coordinates for Thailand
  const defaultCenter: [number, number] = [13.7563, 100.5018]; // Bangkok coordinates

  // Helper function to calculate budget based on municipality properties
  const calculateBudget = (properties: any): number => {
    const municipalityName = properties.name || properties.mun_name || "";
    const rawBudgetValue = properties["1- clean-extracted_46_to_235_total"];

    // Standard budget calculation logic
    let calculatedBudget = 0;

    // Check if we have a valid budget value
    if (rawBudgetValue) {
      // Remove commas and spaces before parsing
      const cleanBudgetValue = rawBudgetValue.toString().replace(/[\s,]/g, "");
      const budgetValue = parseFloat(cleanBudgetValue);

      if (!isNaN(budgetValue)) {
        // Determine the magnitude of the budget and apply appropriate scaling
        if (budgetValue >= 1000) {
          // If value is already very large (like 1,755.97), it's likely in millions
          calculatedBudget = budgetValue * 1000000;

          // Special case for a few municipalities we know have incorrect data
          if (
            municipalityName === "เทศบาลนครเชียงใหม่" ||
            (municipalityName &&
              municipalityName.includes("เชียงใหม่") &&
              properties[
                "check-extracted-data - all-muni-nso-thai_type"
              ]?.includes("นคร"))
          ) {
            console.log("Fixing Chiang Mai City Municipality budget");
            calculatedBudget = 1755970000; // Explicitly set to 1.75597 billion
          } else if (
            municipalityName === "เทศบาลนครแหลมฉบัง" ||
            (municipalityName &&
              municipalityName.includes("แหลมฉบัง") &&
              properties[
                "check-extracted-data - all-muni-nso-thai_type"
              ]?.includes("นคร"))
          ) {
            console.log("Fixing Laem Chabang City Municipality budget");
            calculatedBudget = 1423500000; // Explicitly set to 1.4235 billion
          }
        } else if (budgetValue >= 100) {
          // Medium range values might be in hundreds of millions
          calculatedBudget = budgetValue * 1000000;
        } else if (budgetValue > 0) {
          // Small values might be in millions directly
          calculatedBudget = budgetValue * 1000000;
        } else {
          // Zero or negative values - use defaults based on municipality type
          calculatedBudget = getDefaultBudgetByType(properties);
        }
      }
    } else {
      // No valid budget - use defaults based on municipality type
      calculatedBudget = getDefaultBudgetByType(properties);
    }

    return calculatedBudget;
  };

  // Helper function to calculate budget sources based on municipality type
  const calculateBudgetSources = (properties: any, totalBudget: number) => {
    const type =
      properties.type ||
      properties["check-extracted-data - all-muni-nso-thai_type"] ||
      "";

    // Get actual budget sources data if available
    let selfCollected = parseFloat(
      properties["จัดเก็บเอง (ล้านบาท)"]?.replace(/[\s,]/g, "") || "0"
    );
    let stateAllocated = parseFloat(
      properties["รัฐจัดสรร (ล้านบาท)"]?.replace(/[\s,]/g, "") || "0"
    );
    let subsidies = parseFloat(
      properties["เงินอุดหนุน (ล้านบาท)"]?.replace(/[\s,]/g, "") || "0"
    );

    // If we don't have real data, estimate based on municipality type
    if (selfCollected === 0 && stateAllocated === 0 && subsidies === 0) {
      if (type.includes("นคร") || type.toLowerCase().includes("nakhon")) {
        // City municipality (เทศบาลนคร) typical breakdown
        selfCollected = (totalBudget * 0.3) / 1000000; // 30% self-collected
        stateAllocated = (totalBudget * 0.45) / 1000000; // 45% state allocated
        subsidies = (totalBudget * 0.25) / 1000000; // 25% subsidies
      } else if (
        type.includes("เมือง") ||
        type.toLowerCase().includes("mueang")
      ) {
        // Town municipality (เทศบาลเมือง) typical breakdown
        selfCollected = (totalBudget * 0.25) / 1000000; // 25% self-collected
        stateAllocated = (totalBudget * 0.45) / 1000000; // 45% state allocated
        subsidies = (totalBudget * 0.3) / 1000000; // 30% subsidies
      } else {
        // Subdistrict municipality (เทศบาลตำบล) typical breakdown
        selfCollected = (totalBudget * 0.15) / 1000000; // 15% self-collected
        stateAllocated = (totalBudget * 0.4) / 1000000; // 40% state allocated
        subsidies = (totalBudget * 0.45) / 1000000; // 45% subsidies
      }
    } else {
      // If we have real data but it's in text format with "ล้านบาท"
      // Convert to numerical values in millions (ล้านบาท)
      selfCollected = parseFloat(
        selfCollected.toString().replace(/[^0-9.]/g, "")
      );
      stateAllocated = parseFloat(
        stateAllocated.toString().replace(/[^0-9.]/g, "")
      );
      subsidies = parseFloat(subsidies.toString().replace(/[^0-9.]/g, ""));
    }

    return {
      selfCollected,
      stateAllocated,
      subsidies,
    };
  };

  // Style function for GeoJSON features
  const style = (feature: any) => {
    const properties = feature.properties;
    let fillColor = "#00D2CA"; // default color (subdistrict/ตำบล)

    // Determine color based on municipality type
    const municipalityType =
      properties?.type ||
      properties?.["check-extracted-data - all-muni-nso-thai_type"] ||
      "";

    if (municipalityType && typeof municipalityType === "string") {
      const type = municipalityType.toLowerCase();
      if (
        type.includes("นคร") ||
        type.includes("city") ||
        type.includes("nakhon")
      ) {
        fillColor = "#FF5062"; // city
      } else if (
        type.includes("เมือง") ||
        type.includes("town") ||
        type.includes("mueang")
      ) {
        fillColor = "#5C48F6"; // town
      }
    }

    return {
      fillColor: fillColor,
      weight: 2,
      opacity: 0.9,
      color: "#FFFFFF",
      dashArray: "",
      fillOpacity: 0.7,
    };
  };

  // Store layer references without triggering re-renders
  const storeLayerRef = useCallback((id: string, layer: L.Layer) => {
    layersRef.current[id] = layer;
  }, []);

  // Once GeoJSON data is loaded and rendered, update the mapLayers state
  useEffect(() => {
    if (geoJsonData && Object.keys(layersRef.current).length > 0) {
      setMapLayers(layersRef.current);
    }
  }, [geoJsonData]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    focusOnMunicipality: (municipalityId: string) => {
      // Find the layer for the municipality ID
      const layer =
        layersRef.current[municipalityId] || mapLayers[municipalityId];
      if (layer && mapInstance) {
        // Since TypeScript doesn't recognize getBounds on all layer types,
        // we need to use type assertions to access the method
        try {
          // Try to access getBounds and fit bounds
          if ("getBounds" in layer) {
            const bounds = (layer as any).getBounds();
            mapInstance.fitBounds(bounds);
          }

          // Simulate click on the layer to update styles
          if ("fire" in layer) {
            (layer as any).fire("click");
          }
        } catch (error) {
          console.error("Error focusing on municipality:", error);
        }
      } else {
        console.warn(
          `Municipality with ID ${municipalityId} not found in map layers`
        );
      }
    },
  }));

  // Function to handle interaction with each GeoJSON feature
  const onEachFeature = useCallback(
    (feature: any, layer: L.Layer) => {
      if (feature.properties) {
        // Store reference to the layer with municipality ID as key
        const municipalityId =
          feature.properties.id ||
          feature.properties.muni_code ||
          feature.properties.name;

        // Store layer reference in ref instead of setState
        storeLayerRef(municipalityId, layer);

        // Style change on hover
        layer.on({
          mouseover: (e) => {
            const layer = e.target as L.Path;
            layer.setStyle({
              weight: 3,
              fillOpacity: 0.9,
            });
            if (layer.bringToFront) {
              layer.bringToFront();
            }
          },
          mouseout: (e) => {
            const layer = e.target as L.Path;
            layer.setStyle(style(feature));
          },
          click: (e) => {
            // Create municipality data object from feature properties
            const municipalityData: Municipality = {
              id: feature.properties.id || feature.properties.muni_code || "1",
              name:
                feature.properties.name ||
                feature.properties.mun_name ||
                "ไม่ทราบชื่อ",
              budget: calculateBudget(feature.properties),
              province:
                feature.properties.province ||
                feature.properties.cwt_name ||
                "ไม่ทราบจังหวัด",
              district:
                feature.properties.district ||
                feature.properties.amp_name ||
                "ไม่ทราบอำเภอ",
              type:
                feature.properties.type ||
                feature.properties[
                  "check-extracted-data - all-muni-nso-thai_type"
                ] ||
                "เทศบาลตำบล",
              population: parseInt(
                feature.properties[
                  "1- clean-extracted_46_to_235_poppu"
                ]?.replace(/[\s,]/g, "") || "0"
              ),
              area: parseFloat(
                feature.properties[
                  "1- clean-extracted_46_to_235_land-sque-km"
                ] || "0"
              ),
              budgetSources: calculateBudgetSources(
                feature.properties,
                calculateBudget(feature.properties)
              ),
            };

            // Send municipality data to parent component to show in sidebar
            onMunicipalitySelect(municipalityData);

            // Zoom to municipality bounds
            if (e.target.getBounds) {
              const bounds = e.target.getBounds();
              if (bounds) {
                const mapInstance = e.target._map;
                if (mapInstance) {
                  mapInstance.fitBounds(bounds);
                }
              }
            }
          },
        });
      }
    },
    [
      storeLayerRef,
      onMunicipalitySelect,
      style,
      calculateBudget,
      calculateBudgetSources,
    ]
  );

  // Get the map instance when it's ready
  const MapController = () => {
    const map = useMap();

    // Store map instance
    useEffect(() => {
      setMapInstance(map);
    }, [map]);

    return null;
  };

  // Load GeoJSON data when component mounts
  useEffect(() => {
    const loadGeoJsonData = async () => {
      try {
        setDataLoading(true);
        console.log("Loading TopoJSON data...");

        // Use the corrected file - add a timestamp query parameter to force reload
        const response = await axios.get(
          `${
            process.env.PUBLIC_URL
          }/data/topo-data.json?t=${new Date().getTime()}`
        );

        console.log("TopoJSON data loaded successfully");

        // Debugging the raw data structure
        console.log("Raw TopoJSON structure:", Object.keys(response.data));

        // Check if the data is a valid TopoJSON structure
        if (response.data.type !== "Topology") {
          console.error("Data is not a valid TopoJSON structure");
          setError("ข้อมูลไม่ถูกต้อง ไม่ใช่ TopoJSON ที่ถูกต้อง");
          setDataLoading(false);
          return;
        }

        // Find the object in topology
        const topologyObject = response.data;
        const objectKeys = Object.keys(topologyObject.objects || {});

        console.log("Object keys in topology:", objectKeys);

        if (!objectKeys.length) {
          throw new Error("No objects found in TopoJSON");
        }

        // Use the first object in the topology
        const objectName = objectKeys[0];
        console.log("Using object:", objectName);

        // Try to convert the TopoJSON to GeoJSON
        try {
          // Direct conversion using topojson.feature
          const convertedData = topojson.feature(
            topologyObject,
            topologyObject.objects[objectName]
          );

          console.log("Converted to GeoJSON:", convertedData);

          if (convertedData.features && convertedData.features.length > 0) {
            console.log("Number of features:", convertedData.features.length);
            console.log("First feature:", convertedData.features[0]);

            // Log the first feature's geometry type and coordinates
            const firstFeature = convertedData.features[0];
            if (firstFeature.geometry) {
              console.log(
                "First feature geometry type:",
                firstFeature.geometry.type
              );

              // Check if coordinates exist and log a sample
              if (firstFeature.geometry.coordinates) {
                console.log(
                  "First feature coordinates sample:",
                  JSON.stringify(firstFeature.geometry.coordinates).substring(
                    0,
                    100
                  ) + "..."
                );
              }
            } else {
              console.warn("First feature has null geometry");
            }

            // Transform the coordinates to WGS84 (latitude and longitude)
            const transformedFeatures = convertedData.features.map(
              (feature) => {
                const newFeature = { ...feature };

                // Skip transformation for features with null geometry
                if (!feature.geometry) {
                  console.warn("Feature has null geometry:", feature);
                  return newFeature;
                }

                if (feature.geometry.type === "Polygon") {
                  newFeature.geometry = {
                    ...feature.geometry,
                    coordinates: feature.geometry.coordinates.map(
                      (ring: any[]) => {
                        return ring.map((coord: number[]) =>
                          convertToLatLng(coord[0], coord[1])
                        );
                      }
                    ),
                  };
                } else if (feature.geometry.type === "MultiPolygon") {
                  newFeature.geometry = {
                    ...feature.geometry,
                    coordinates: feature.geometry.coordinates.map(
                      (polygon: any[][]) => {
                        return polygon.map((ring: any[]) => {
                          return ring.map((coord: number[]) =>
                            convertToLatLng(coord[0], coord[1])
                          );
                        });
                      }
                    ),
                  };
                }

                return newFeature;
              }
            );

            if (transformedFeatures[0]?.geometry?.coordinates) {
              console.log(
                "First transformed feature coordinates:",
                transformedFeatures[0].geometry.coordinates[0][0]
              );
            }

            // Set the GeoJSON data with transformed coordinates
            setGeoJsonData({
              type: "FeatureCollection",
              features: transformedFeatures,
            } as GeoJsonData);
            setDataLoading(false);
          } else {
            console.error("Converted data has no features");
            setError("ข้อมูลไม่มีลักษณะพื้นที่ (features)");
            setDataLoading(false);
          }
        } catch (conversionError) {
          console.error(
            "Error converting TopoJSON to GeoJSON:",
            conversionError
          );
          setError("เกิดข้อผิดพลาดในการแปลงข้อมูล");
          setDataLoading(false);
        }
      } catch (err) {
        console.error("Error loading TopoJSON data:", err);
        console.error("Error details:", {
          message: err instanceof Error ? err.message : "Unknown error",
          stack: err instanceof Error ? err.stack : undefined,
          response:
            err && (err as any).response
              ? (err as any).response.data
              : undefined,
        });
        setError("ไม่สามารถโหลดข้อมูลแผนที่ได้ กรุณาลองใหม่อีกครั้ง");
        setDataLoading(false);
      }
    };

    loadGeoJsonData();
  }, []);

  const findNearestMunicipality = useCallback(
    (location: [number, number]) => {
      if (
        !geoJsonData ||
        !geoJsonData.features ||
        !geoJsonData.features.length
      ) {
        setError("ไม่พบข้อมูลเทศบาล กรุณาลองใหม่อีกครั้ง");
        return;
      }

      // In a real application, you would implement a more efficient algorithm
      // This is a simplified version that checks if the point is within a municipality boundary

      console.log(
        `Searching for municipality at coordinates: ${location[0]},${location[1]}`
      );
      console.log(
        `Total municipalities to check: ${geoJsonData.features.length}`
      );

      let foundMunicipality = false;

      for (const feature of geoJsonData.features) {
        try {
          const geoJsonLayer = L.geoJSON(feature as any);
          const latLng = L.latLng(location[0], location[1]);

          // Check if the user's location is within this municipality
          if (geoJsonLayer.getBounds().contains(latLng)) {
            console.log(
              `Found municipality: ${
                feature.properties.name || feature.properties.mun_name
              }`
            );
            setSelectedMunicipality(feature);
            foundMunicipality = true;

            // Get the raw budget value
            const rawBudgetValue =
              feature.properties["1- clean-extracted_46_to_235_total"];
            console.log(
              "Raw budget value:",
              rawBudgetValue,
              "for",
              feature.properties.name || feature.properties.mun_name
            );

            // Standard budget calculation logic for all municipalities
            let calculatedBudget = 0;

            // Check if we have a valid budget value
            if (rawBudgetValue) {
              // Remove commas and spaces before parsing
              const cleanBudgetValue = rawBudgetValue
                .toString()
                .replace(/[\s,]/g, "");
              const budgetValue = parseFloat(cleanBudgetValue);
              console.log(
                `Cleaned budget value: ${cleanBudgetValue}, parsed: ${budgetValue}`
              );

              if (!isNaN(budgetValue)) {
                // Determine the magnitude of the budget and apply appropriate scaling
                if (budgetValue >= 1000) {
                  // If value is already very large (like 1,755.97), it's likely in millions
                  calculatedBudget = budgetValue * 1000000;
                  console.log(
                    `Large budget detected: ${rawBudgetValue} → ${calculatedBudget} baht`
                  );

                  // Special case for a few municipalities we know have incorrect data
                  const municipalityName =
                    feature.properties.name ||
                    feature.properties.mun_name ||
                    "";
                  if (
                    municipalityName === "เทศบาลนครเชียงใหม่" ||
                    (municipalityName &&
                      municipalityName.includes("เชียงใหม่") &&
                      feature.properties[
                        "check-extracted-data - all-muni-nso-thai_type"
                      ]?.includes("นคร"))
                  ) {
                    console.log("Fixing Chiang Mai City Municipality budget");
                    calculatedBudget = 1755970000; // Explicitly set to 1.75597 billion
                  } else if (
                    municipalityName === "เทศบาลนครแหลมฉบัง" ||
                    (municipalityName &&
                      municipalityName.includes("แหลมฉบัง") &&
                      feature.properties[
                        "check-extracted-data - all-muni-nso-thai_type"
                      ]?.includes("นคร"))
                  ) {
                    console.log("Fixing Laem Chabang City Municipality budget");
                    calculatedBudget = 1423500000; // Explicitly set to 1.4235 billion
                  }
                } else if (budgetValue >= 100) {
                  // Medium range values might be in hundreds of millions
                  calculatedBudget = budgetValue * 1000000;
                  console.log(
                    `Medium budget detected: ${rawBudgetValue} → ${calculatedBudget} baht`
                  );
                } else if (budgetValue > 0) {
                  // Small values might be in millions directly
                  calculatedBudget = budgetValue * 1000000;
                  console.log(
                    `Standard budget detected: ${rawBudgetValue} → ${calculatedBudget} baht`
                  );
                } else {
                  // Zero or negative values - use defaults based on municipality type
                  calculatedBudget = getDefaultBudgetByType(feature.properties);
                }
              }
            } else {
              // No valid budget - use defaults based on municipality type
              calculatedBudget = getDefaultBudgetByType(feature.properties);
            }

            console.log(
              "Final calculated budget:",
              calculatedBudget,
              "for",
              feature.properties.name || feature.properties.mun_name
            );

            const municipalityData: Municipality = {
              id: feature.properties.id || feature.properties.muni_code || "1",
              name:
                feature.properties.name ||
                feature.properties.mun_name ||
                "ไม่ทราบชื่อ",
              budget: calculatedBudget,
              province:
                feature.properties.province ||
                feature.properties.cwt_name ||
                "ไม่ทราบจังหวัด",
              district:
                feature.properties.district ||
                feature.properties.amp_name ||
                "ไม่ทราบอำเภอ",
              type:
                feature.properties.type ||
                feature.properties[
                  "check-extracted-data - all-muni-nso-thai_type"
                ] ||
                "เทศบาลตำบล",
              population: parseInt(
                feature.properties[
                  "1- clean-extracted_46_to_235_poppu"
                ]?.replace(/[\s,]/g, "") || "0"
              ),
              area: parseFloat(
                feature.properties[
                  "1- clean-extracted_46_to_235_land-sque-km"
                ] || "0"
              ),
              budgetSources: calculateBudgetSources(
                feature.properties,
                calculatedBudget
              ),
            };

            onMunicipalitySelect(municipalityData);
            return;
          }
        } catch (err) {
          console.error("Error checking municipality boundary:", err);
          // Continue to the next feature
        }
      }

      if (!foundMunicipality) {
        console.log("No municipality found at the given location");
        setError("ไม่พบเทศบาลในตำแหน่งของคุณ");
        onMunicipalitySelect(null);
      }
    },
    [geoJsonData, onMunicipalitySelect]
  );

  const handleGetLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        findNearestMunicipality([latitude, longitude]);
        setLoading(false);
      },
      (err) => {
        console.error("Error getting location:", err);
        setError("ไม่สามารถระบุตำแหน่งของคุณได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [findNearestMunicipality]);

  return (
    <div className="map-component">
      <div className="map-controls">
        <button onClick={handleGetLocation} disabled={loading || dataLoading}>
          {loading ? (
            <>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="loading-icon"
              >
                <path
                  d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 9.27455 20.9097 6.80375 19.1414 5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                />
              </svg>
              กำลังค้นหา...
            </>
          ) : dataLoading ? (
            <>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="loading-icon"
              >
                <path
                  d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 9.27455 20.9097 6.80375 19.1414 5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                />
              </svg>
              กำลังโหลดข้อมูล...
            </>
          ) : (
            <>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 12V21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M12 12L16.5 7.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M12 12L7.5 7.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle
                  cx="12"
                  cy="5"
                  r="3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              ค้นหาเทศบาลใกล้ฉัน
            </>
          )}
        </button>
        {error && (
          <div className="error-message">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M12 7V13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
            {error}
          </div>
        )}
        {dataLoading && (
          <div className="info-message">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M12 7V13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
            กำลังโหลดข้อมูลเทศบาล กรุณารอสักครู่...
          </div>
        )}
      </div>

      <div className="map-container">
        <MapContainer
          center={defaultCenter}
          zoom={6}
          zoomControl={false}
          minZoom={5}
          maxBounds={[
            [5, 96], // Southwest coordinates
            [21, 106], // Northeast coordinates
          ]}
          maxBoundsViscosity={1.0} // Prevents dragging outside of bounds
        >
          <MapController />
          <ZoomControl position="bottomright" />
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />
          {userLocation && <LocationMarker position={userLocation} />}
          {geoJsonData && (
            <GeoJSON
              key={`geojson-${Date.now()}`} // Add key to force re-render when data changes
              data={geoJsonData}
              style={style}
              onEachFeature={onEachFeature}
            />
          )}

          <div className="map-legend">
            <div className="map-legend-title">ประเภทเทศบาล</div>
            <div className="map-legend-item">
              <div
                className="map-legend-color"
                style={{ backgroundColor: "var(--city)" }}
              ></div>
              <span>เทศบาลนคร</span>
            </div>
            <div className="map-legend-item">
              <div
                className="map-legend-color"
                style={{ backgroundColor: "var(--town)" }}
              ></div>
              <span>เทศบาลเมือง</span>
            </div>
            <div className="map-legend-item">
              <div
                className="map-legend-color"
                style={{ backgroundColor: "var(--subdistrict)" }}
              ></div>
              <span>เทศบาลตำบล</span>
            </div>
          </div>
        </MapContainer>
      </div>
    </div>
  );
});

export default Map;
