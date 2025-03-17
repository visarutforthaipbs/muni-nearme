import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
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

// Sample GeoJSON representing a simple polygon
const sampleGeoJson = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: {
        name: "Test Polygon",
      },
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [100.5018, 13.7563],
            [100.5118, 13.7563],
            [100.5118, 13.7663],
            [100.5018, 13.7663],
            [100.5018, 13.7563],
          ],
        ],
      },
    },
  ],
};

const TestMap: React.FC = () => {
  const [convertedData, setConvertedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadTopoJSON = async () => {
      try {
        setLoading(true);
        console.log("Test: Loading TopoJSON data...");

        // Use the corrected file with timestamp to force reload
        const response = await axios.get(
          `/data/topo-test-31 (2).json?t=${new Date().getTime()}`
        );
        console.log("Test: TopoJSON data loaded successfully");

        // Log the keys of the loaded data
        console.log("Test: TopoJSON data keys:", Object.keys(response.data));

        // Check if it's a Topology with objects
        if (response.data.type !== "Topology" || !response.data.objects) {
          setError("Not a valid TopoJSON file");
          setLoading(false);
          return;
        }

        // Get the first object key
        const objectKeys = Object.keys(response.data.objects);
        if (objectKeys.length === 0) {
          setError("No objects found in TopoJSON");
          setLoading(false);
          return;
        }

        const firstObjectKey = objectKeys[0];
        console.log("Test: Using object key:", firstObjectKey);

        // Try to convert to GeoJSON
        try {
          const converted = topojson.feature(
            response.data,
            response.data.objects[firstObjectKey]
          );

          console.log("Test: Converted data type:", converted.type);
          console.log("Test: Features count:", converted.features?.length);

          if (!converted.features || converted.features.length === 0) {
            setError("Conversion resulted in empty features array");
            setLoading(false);
            return;
          }

          // Get information about the first feature
          const firstFeature = converted.features[0];
          if (firstFeature.geometry) {
            console.log(
              "Test: First feature geometry type:",
              firstFeature.geometry.type
            );

            // Log a sample of coordinates
            if (firstFeature.geometry.coordinates) {
              console.log(
                "Test: First feature coordinates sample:",
                JSON.stringify(firstFeature.geometry.coordinates).substring(
                  0,
                  100
                ) + "..."
              );
            }
          } else {
            console.warn("Test: First feature has null geometry");
          }

          // Transform the coordinates to WGS84 (latitude and longitude)
          const transformedFeatures = converted.features.map((feature) => {
            const newFeature = { ...feature };

            // Skip transformation for features with null geometry
            if (!feature.geometry) {
              console.warn("Test: Feature has null geometry:", feature);
              return newFeature;
            }

            if (feature.geometry.type === "Polygon") {
              newFeature.geometry = {
                ...feature.geometry,
                coordinates: feature.geometry.coordinates.map((ring: any[]) => {
                  return ring.map((coord: number[]) =>
                    convertToLatLng(coord[0], coord[1])
                  );
                }),
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
          });

          if (transformedFeatures[0]?.geometry?.coordinates) {
            console.log(
              "Test: First transformed feature coordinates:",
              transformedFeatures[0].geometry.coordinates[0][0]
            );
          }

          setConvertedData({
            type: "FeatureCollection",
            features: transformedFeatures,
          });
        } catch (e) {
          console.error("Test: Error converting TopoJSON:", e);
          setError(
            `Conversion error: ${
              e instanceof Error ? e.message : "Unknown error"
            }`
          );
        }

        setLoading(false);
      } catch (err) {
        console.error("Test: Error loading TopoJSON:", err);
        setError("Failed to load the data");
        setLoading(false);
      }
    };

    loadTopoJSON();
  }, []);

  return (
    <div className="test-map-component">
      <h2>Test Map Component</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {loading && <div>Loading TopoJSON...</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <h3>Sample GeoJSON Map (Should Always Work)</h3>
          <div style={{ height: "300px", width: "100%" }}>
            <MapContainer
              center={[13.7563, 100.5018]}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <GeoJSON
                data={sampleGeoJson}
                style={() => ({
                  fillColor: "#ff0000",
                  weight: 2,
                  opacity: 1,
                  color: "#ff0000",
                  fillOpacity: 0.3,
                })}
              />
            </MapContainer>
          </div>
        </div>

        {convertedData && (
          <div>
            <h3>Converted TopoJSON Map</h3>
            <div style={{ height: "300px", width: "100%" }}>
              <MapContainer
                center={[13.7563, 100.5018]}
                zoom={6}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <GeoJSON
                  key={`geojson-test-${Date.now()}`} // Force re-render when data changes
                  data={convertedData}
                  style={(feature?: any) => {
                    // Get municipality type
                    const municipalityType =
                      feature?.properties?.type ||
                      feature?.properties?.[
                        "check-extracted-data - all-muni-nso-thai_type"
                      ] ||
                      "";

                    // Apply different colors based on municipality type
                    if (
                      municipalityType.includes("นคร") ||
                      municipalityType.toLowerCase().includes("nakhon")
                    ) {
                      // City Municipality - Red
                      return {
                        fillColor: "#FF3B30",
                        weight: 2,
                        opacity: 1,
                        color: "#880000",
                        dashArray: "",
                        fillOpacity: 0.4,
                      };
                    } else if (
                      municipalityType.includes("เมือง") ||
                      municipalityType.toLowerCase().includes("mueang")
                    ) {
                      // Town Municipality - Blue
                      return {
                        fillColor: "#5AC8FA",
                        weight: 2,
                        opacity: 1,
                        color: "#0055A3",
                        dashArray: "",
                        fillOpacity: 0.4,
                      };
                    } else {
                      // Subdistrict Municipality (ตำบล/Tambon) - Green (default)
                      return {
                        fillColor: "#4CD964",
                        weight: 2,
                        opacity: 1,
                        color: "#007D1D",
                        dashArray: "",
                        fillOpacity: 0.4,
                      };
                    }
                  }}
                />

                {/* Map Legend */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "20px",
                    left: "10px",
                    zIndex: 1000,
                    backgroundColor: "white",
                    padding: "10px",
                    borderRadius: "5px",
                    boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
                    ประเภทเทศบาล
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "5px",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        backgroundColor: "#FF3B30",
                        marginRight: "5px",
                      }}
                    ></div>
                    <span>เทศบาลนคร (City)</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "5px",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        backgroundColor: "#5AC8FA",
                        marginRight: "5px",
                      }}
                    ></div>
                    <span>เทศบาลเมือง (Town)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        backgroundColor: "#4CD964",
                        marginRight: "5px",
                      }}
                    ></div>
                    <span>เทศบาลตำบล (Subdistrict)</span>
                  </div>
                </div>
              </MapContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestMap;
