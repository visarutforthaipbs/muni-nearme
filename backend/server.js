const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const uri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/municipality-budget";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully");
    return client.db();
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

// API endpoint to store budget allocation
app.post("/api/budget-allocations", async (req, res) => {
  try {
    const db = client.db();
    const data = {
      ...req.body,
      timestamp: new Date(),
      userInfo: {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    };

    const result = await db.collection("budget-allocations").insertOne(data);
    console.log(`Budget allocation stored with ID: ${result.insertedId}`);

    res.status(201).json({
      success: true,
      id: result.insertedId,
      message: "Budget allocation stored successfully",
    });
  } catch (error) {
    console.error("Error storing budget allocation:", error);
    res.status(500).json({
      success: false,
      message: "Error storing budget allocation",
      error: error.message,
    });
  }
});

// Test endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Get all budget allocations - for admin use
app.get("/api/budget-allocations", async (req, res) => {
  try {
    const db = client.db();
    const allocations = await db
      .collection("budget-allocations")
      .find({})
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    res.status(200).json({
      success: true,
      count: allocations.length,
      data: allocations,
    });
  } catch (error) {
    console.error("Error fetching budget allocations:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching budget allocations",
      error: error.message,
    });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  console.log("Running in production mode");

  // Serve static files from the React app build directory in the new frontend structure
  const buildPath = path.join(__dirname, "../frontend/build");
  app.use(express.static(buildPath));

  // Handle React routing, return all requests to React app
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(buildPath, "index.html"));
    }
  });
} else {
  console.log("Running in development mode");
}

// Start server
async function startServer() {
  await connectToMongoDB();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(
      `MongoDB URI: ${uri.replace(
        /mongodb\+srv:\/\/([^:]+):([^@]+)@/,
        "mongodb+srv://****:****@"
      )}`
    );
  });

  // Handle server shutdown
  process.on("SIGINT", async () => {
    await client.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  });
}

startServer().catch(console.error);
