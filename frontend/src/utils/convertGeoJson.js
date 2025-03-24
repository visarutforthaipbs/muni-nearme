/**
 * Utility script to convert the large GeoJSON file to a smaller one for web use
 * This should be run server-side or as a build step
 */
const fs = require("fs");
const path = require("path");

// Path to the original large GeoJSON file
const SOURCE_FILE = path.join(__dirname, "../../../test-31.geojson");
// Output path for the processed file
const OUTPUT_FILE = path.join(
  __dirname,
  "../../public/data/municipalities.geojson"
);
// Path for the budget data (assuming you'll create a JSON file with budget data)
const BUDGET_FILE = path.join(__dirname, "../../public/data/budgets2566.json");

// Sample budget data (replace with actual data)
// In production, you'd load this from your database or JSON file
const sampleBudgets = {
  เทศบาลเมืองกระบี่: 350000000,
  เทศบาลตำบลเกาะลันตาใหญ่: 120000000,
  // Add more municipalities here...
};

// Ensure output directory exists
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Simplify polygon/multipolygon coordinates by reducing precision and removing points
function simplifyGeometry(geometry, tolerance = 0.001) {
  if (!geometry || !geometry.coordinates) return geometry;

  // Function to simplify a polygon
  const simplifyPolygon = (polygon) => {
    return polygon.map((ring) => {
      // Keep fewer points (every nth point) to reduce size
      // This is a simple approach; a better one would use algorithms like Douglas-Peucker
      const simplified = ring.filter((_, index) => index % 3 === 0);
      return simplified.length >= 4 ? simplified : ring; // Ensure it remains a valid polygon
    });
  };

  const simplifiedCoordinates =
    geometry.type === "Polygon"
      ? simplifyPolygon(geometry.coordinates)
      : geometry.coordinates.map(simplifyPolygon);

  return {
    ...geometry,
    coordinates: simplifiedCoordinates,
  };
}

// Process the GeoJSON file in chunks to avoid memory issues
async function processGeoJson() {
  try {
    console.log("Starting to process GeoJSON file...");
    console.log(`Source file: ${SOURCE_FILE}`);

    if (!fs.existsSync(SOURCE_FILE)) {
      console.error(`Error: Source file does not exist: ${SOURCE_FILE}`);
      return;
    }

    // Read the file as a string
    const data = fs.readFileSync(SOURCE_FILE, "utf8");
    console.log("File read successfully, parsing JSON...");

    // Parse the JSON
    const geoJson = JSON.parse(data);
    console.log(`Original GeoJSON has ${geoJson.features.length} features`);

    // Process features - simplify geometries and add budget data
    const simplifiedFeatures = geoJson.features.map((feature, index) => {
      // Log progress for large files
      if (index % 100 === 0) {
        console.log(`Processing feature ${index}/${geoJson.features.length}`);
      }

      try {
        // Get municipality name from properties
        const name = feature.properties.name || "Unknown";

        // Add sample budget data (replace with actual data in production)
        const budget =
          sampleBudgets[name] || Math.floor(Math.random() * 500000000);

        // Simplify the geometry to reduce file size
        const simplifiedGeometry = simplifyGeometry(feature.geometry);

        // Add budget to properties
        return {
          ...feature,
          geometry: simplifiedGeometry,
          properties: {
            ...feature.properties,
            budget,
            // Add other properties as needed
          },
        };
      } catch (err) {
        console.error(`Error processing feature ${index}:`, err);
        return feature; // Return original feature if there's an error
      }
    });

    console.log("All features processed, creating output file...");

    const outputGeoJson = {
      type: "FeatureCollection",
      features: simplifiedFeatures,
    };

    // Write to output file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputGeoJson));
    console.log(`Processed GeoJSON saved to ${OUTPUT_FILE}`);

    // Create a simple budget data file
    const budgetData = {};
    simplifiedFeatures.forEach((feature) => {
      const name = feature.properties.name;
      if (name) {
        budgetData[name] = feature.properties.budget;
      }
    });

    fs.writeFileSync(BUDGET_FILE, JSON.stringify(budgetData, null, 2));
    console.log(`Budget data saved to ${BUDGET_FILE}`);
  } catch (error) {
    console.error("Error processing GeoJSON:", error);
  }
}

// Run the process
processGeoJson();
