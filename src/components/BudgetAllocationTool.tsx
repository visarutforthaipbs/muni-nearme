import React, { useState, useEffect } from "react";
import { BudgetCategory, Municipality } from "../types";
import {
  mockMunicipalBudget,
  recalculateAmounts,
  recalculatePercentages,
} from "../data/mockBudgetData";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Label,
} from "recharts";

interface BudgetAllocationToolProps {
  municipality: Municipality | null;
}

const BudgetAllocationTool: React.FC<BudgetAllocationToolProps> = ({
  municipality,
}) => {
  const [userAllocation, setUserAllocation] = useState<BudgetCategory[]>([]);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);
  const [totalAllocated, setTotalAllocated] = useState<number>(0);

  // Use mock data for now, can be replaced with actual data later
  const municipalBudget = mockMunicipalBudget;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);

    // Initialize with the current municipal budget percentages
    setUserAllocation(municipalBudget.categories);
    setTotalAllocated(100); // Start with 100% allocated

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [municipalBudget]);

  const handleSliderChange = (id: string, newPercentage: number) => {
    // Find the category that was changed
    const updatedAllocation = userAllocation.map((category) => {
      if (category.id === id) {
        return {
          ...category,
          percentage: newPercentage,
        };
      }
      return category;
    });

    // Calculate the new total
    const newTotal = updatedAllocation.reduce(
      (sum, category) => sum + category.percentage,
      0
    );
    setTotalAllocated(newTotal);

    // Update amounts based on new percentages
    const updatedWithAmounts = recalculateAmounts(
      updatedAllocation,
      municipalBudget.totalBudget
    );
    setUserAllocation(updatedWithAmounts);
  };

  const formatBudget = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)} ล้านบาท`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)} พันบาท`;
    }
    return `${amount.toFixed(2)} บาท`;
  };

  const getComparisonData = () => {
    return municipalBudget.categories.map((category, index) => {
      const userCategory = userAllocation.find((c) => c.id === category.id);
      return {
        name: category.name,
        current: category.percentage,
        user: userCategory?.percentage || 0,
        color: category.color,
      };
    });
  };

  const renderBudgetAllocator = () => {
    return (
      <div className="budget-allocator">
        <div className="budget-header">
          <h3>จัดสรรงบประมาณตามความสำคัญของคุณ</h3>
          <div className="budget-total">
            <div
              className={`budget-remaining ${
                totalAllocated > 100 ? "over-budget" : ""
              }`}
            >
              {totalAllocated > 100 ? "เกินงบประมาณ!" : "งบประมาณที่จัดสรร"}:{" "}
              {totalAllocated.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="budget-sliders">
          {userAllocation.map((category) => (
            <div key={category.id} className="budget-category">
              <div className="category-header">
                <span
                  className="category-color"
                  style={{ backgroundColor: category.color }}
                ></span>
                <span className="category-name">{category.name}</span>
                <span className="category-percentage">
                  {category.percentage.toFixed(1)}%
                </span>
                <span className="category-amount">
                  {formatBudget(category.amount)}
                </span>
              </div>
              <div className="slider-container">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.5"
                  value={category.percentage}
                  onChange={(e) =>
                    handleSliderChange(category.id, parseFloat(e.target.value))
                  }
                  className="budget-slider"
                  style={{
                    background: `linear-gradient(to right, ${category.color} 0%, ${category.color} ${category.percentage}%, #e0e0e0 ${category.percentage}%, #e0e0e0 100%)`,
                  }}
                />
              </div>
              <div className="category-description">{category.description}</div>
            </div>
          ))}
        </div>

        <div className="budget-actions">
          <button
            className="budget-button"
            onClick={() => setShowComparison(!showComparison)}
          >
            {showComparison ? "กลับไปแก้ไข" : "เปรียบเทียบกับงบปัจจุบัน"}
          </button>
        </div>
      </div>
    );
  };

  const renderComparison = () => {
    const comparisonData = getComparisonData();

    return (
      <div className="budget-comparison">
        <h3>เปรียบเทียบการจัดสรรงบประมาณ</h3>
        <p className="comparison-subtitle">
          การจัดสรรของคุณเทียบกับงบประมาณปัจจุบัน
        </p>

        <div className="comparison-chart">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={comparisonData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              >
                <Label
                  value="เปอร์เซ็นต์ของงบประมาณ"
                  offset={-5}
                  position="insideBottom"
                />
              </XAxis>
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Bar dataKey="current" name="งบประมาณปัจจุบัน" fill="#8884d8" />
              <Bar dataKey="user" name="การจัดสรรของคุณ" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="comparison-insights">
          <h4>ข้อสังเกตจากการจัดสรรของคุณ</h4>
          <ul>
            {comparisonData
              .map((item) => {
                const diff = item.user - item.current;
                if (Math.abs(diff) >= 5) {
                  return (
                    <li
                      key={item.name}
                      className={
                        diff > 0 ? "positive-change" : "negative-change"
                      }
                    >
                      คุณจัดสรรงบให้ <strong>{item.name}</strong>{" "}
                      {diff > 0 ? "มากกว่า" : "น้อยกว่า"}
                      งบปัจจุบัน <strong>{Math.abs(diff).toFixed(1)}%</strong>
                    </li>
                  );
                }
                return null;
              })
              .filter(Boolean)}
          </ul>
        </div>

        <div className="budget-actions">
          <button
            className="budget-button"
            onClick={() => setShowComparison(false)}
          >
            กลับไปแก้ไข
          </button>
        </div>
      </div>
    );
  };

  if (!municipality) {
    return (
      <div className="budget-allocation-tool">
        <div className="tool-placeholder">
          <h3>การจัดสรรงบประมาณแบบมีส่วนร่วม</h3>
          <p>กรุณาเลือกเทศบาลบนแผนที่เพื่อทดลองจัดสรรงบประมาณ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="budget-allocation-tool">
      <div className="tool-header">
        <h2>งบประมาณเทศบาล{municipality.name}</h2>
        <div className="budget-info">
          <p className="budget-year">ปีงบประมาณ {mockMunicipalBudget.year}</p>
          <p className="budget-total-amount">
            งบประมาณทั้งหมด: {formatBudget(mockMunicipalBudget.totalBudget)}
          </p>
          <p className="budget-disclaimer">
            * ข้อมูลงบประมาณเป็นข้อมูลจำลองเพื่อการทดสอบระบบ
          </p>
        </div>
      </div>

      {showComparison ? renderComparison() : renderBudgetAllocator()}
    </div>
  );
};

export default BudgetAllocationTool;
