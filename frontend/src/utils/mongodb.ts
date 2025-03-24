import { MongoClient, ServerApiVersion } from "mongodb";
import { BudgetCategory } from "../types";

// MongoDB connection URL - should be in environment variables for security
const uri =
  process.env.REACT_APP_MONGODB_URI ||
  "mongodb://localhost:27017/municipality-budget";

// Create a MongoClient with appropriate options
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let connected = false;

// Function to connect to MongoDB
async function connectToDatabase() {
  if (!connected) {
    try {
      await client.connect();
      connected = true;
      console.log("Connected to MongoDB successfully");
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      throw error;
    }
  }
  return client.db();
}

// Interface for the budget allocation data stored in MongoDB
interface BudgetAllocationData {
  municipalityId: string;
  municipalityName: string;
  totalBudget: number;
  timestamp: Date;
  categories: BudgetCategory[];
  overBudget: boolean;
  overBudgetIdeas?: string;
  userInfo?: {
    ipAddress?: string;
    userAgent?: string;
    // Add any additional user info you want to collect
  };
}

// Store budget allocation in MongoDB
export async function storeBudgetAllocation(
  data: BudgetAllocationData
): Promise<boolean> {
  try {
    const db = await connectToDatabase();
    const result = await db.collection("budget-allocations").insertOne(data);
    console.log(`Stored budget allocation with id: ${result.insertedId}`);
    return true;
  } catch (error) {
    console.error("Error storing budget allocation:", error);
    return false;
  }
}

// Close the MongoDB connection when the application is shutting down
export async function closeMongoConnection() {
  if (connected) {
    await client.close();
    connected = false;
    console.log("MongoDB connection closed");
  }
}

export default {
  storeBudgetAllocation,
  closeMongoConnection,
};
