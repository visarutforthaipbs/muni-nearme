import { BudgetCategory, Municipality } from "../types";

interface BudgetAllocationData {
  municipalityId: string;
  municipalityName: string;
  totalBudget: number;
  categories: BudgetCategory[];
  overBudget: boolean;
  overBudgetIdeas?: string;
}

// Get the API URL from environment variables or use a relative path in production
const API_URL =
  process.env.NODE_ENV === "production"
    ? "/api"
    : process.env.REACT_APP_API_URL || "http://localhost:3001/api";

/**
 * Store a user's budget allocation in the database
 */
export async function saveBudgetAllocation(
  municipality: Municipality,
  categories: BudgetCategory[],
  overBudget: boolean,
  overBudgetIdeas?: string
): Promise<{ success: boolean; message: string; id?: string }> {
  try {
    // Calculate total allocated percentage
    const totalAllocated = categories.reduce(
      (sum, cat) => sum + cat.percentage,
      0
    );

    const data: BudgetAllocationData = {
      municipalityId: municipality.id,
      municipalityName: municipality.name,
      totalBudget: municipality.budget,
      categories,
      overBudget: totalAllocated > 100,
      overBudgetIdeas: overBudget ? overBudgetIdeas : undefined,
    };

    const response = await fetch(`${API_URL}/budget-allocations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to save budget allocation");
    }

    return {
      success: result.success,
      message: result.message,
      id: result.id,
    };
  } catch (error) {
    console.error("Error saving budget allocation:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
