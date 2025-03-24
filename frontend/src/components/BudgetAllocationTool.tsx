import React, { useState, useEffect } from "react";
import { BudgetCategory, Municipality } from "../types";
import { saveBudgetAllocation } from "../services/budgetService";

// Define budget categories directly in this file
const budgetCategories: BudgetCategory[] = [
  {
    id: "health-env",
    name: "สาธารณะสุขและสิ่งแวดล้อม", // Public Health & Environment
    description: "การดูแลสุขภาพประชาชน การจัดการขยะ และการรักษาสิ่งแวดล้อม",
    amount: 0,
    percentage: 25,
    color: "#4DB6AC", // teal
  },
  {
    id: "innovation-edu",
    name: "นวัตกรรมและการศึกษา", // Innovation & Education
    description: "การพัฒนาการศึกษา เทคโนโลยี และนวัตกรรมในพื้นที่",
    amount: 0,
    percentage: 15,
    color: "#5C48F6", // purple
  },
  {
    id: "disaster",
    name: "สาธารณะภัย", // Disaster Prevention/Management
    description: "การป้องกันและจัดการภัยพิบัติ ความปลอดภัยสาธารณะ",
    amount: 0,
    percentage: 10,
    color: "#FF5062", // red
  },
  {
    id: "infrastructure",
    name: "โครงสร้างพื้นฐาน", // Infrastructure
    description: "การสร้างและบำรุงรักษาถนน ไฟฟ้า และสาธารณูปโภคพื้นฐาน",
    amount: 0,
    percentage: 30,
    color: "#FF8A65", // orange
  },
  {
    id: "water",
    name: "บริหารจัดการน้ำ", // Water Management
    description: "การจัดการน้ำประปา การระบายน้ำ และการป้องกันน้ำท่วม",
    amount: 0,
    percentage: 5,
    color: "#42A5F5", // blue
  },
  {
    id: "governance",
    name: "การจัดการภายในและธรรมาภิบาล", // Internal Management & Good Governance
    description:
      "การบริหารจัดการภายในองค์กร การให้บริการประชาชน และความโปร่งใส",
    amount: 0,
    percentage: 6,
    color: "#9575CD", // indigo
  },
  {
    id: "culture",
    name: "สังคม ศาสนา วัฒนธรรม", // Society, Religion & Culture
    description: "กิจกรรมทางสังคม ศาสนา และการส่งเสริมวัฒนธรรมท้องถิ่น",
    amount: 0,
    percentage: 4,
    color: "#FFCA28", // amber
  },
  {
    id: "economy",
    name: "เศรษฐกิจและแหล่งท่องเที่ยว", // Economy & Tourism
    description: "การส่งเสริมเศรษฐกิจท้องถิ่น การพัฒนาแหล่งท่องเที่ยว",
    amount: 0,
    percentage: 5,
    color: "#66BB6A", // green
  },
];

// Helper function to recalculate amounts based on percentages
const recalculateAmounts = (
  categories: BudgetCategory[],
  totalBudget: number
): BudgetCategory[] => {
  return categories.map((category) => ({
    ...category,
    amount: (category.percentage / 100) * totalBudget,
  }));
};

interface BudgetAllocationToolProps {
  municipality: Municipality | null;
}

const BudgetAllocationTool: React.FC<BudgetAllocationToolProps> = ({
  municipality,
}) => {
  const [userAllocation, setUserAllocation] = useState<BudgetCategory[]>([]);
  const [totalAllocated, setTotalAllocated] = useState<number>(0);
  const [overBudgetIdeas, setOverBudgetIdeas] = useState<string>("");
  const [showOverBudgetInput, setShowOverBudgetInput] =
    useState<boolean>(false);
  const [allocationSubmitted, setAllocationSubmitted] =
    useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveResult, setSaveResult] = useState<{
    success?: boolean;
    message?: string;
  }>({});

  // Municipality's budget
  const municipalBudget = municipality?.budget || 300000000;

  useEffect(() => {
    // Reset the allocation when a new municipality is selected
    if (municipality) {
      // Initialize with the default budget percentages, but with the actual municipality budget
      const initialAllocation = budgetCategories.map((category) => ({
        ...category,
        amount:
          (category.percentage / 100) * (municipality.budget || 300000000),
      }));

      setUserAllocation(initialAllocation);
      setTotalAllocated(100); // Start with 100% allocated
      setOverBudgetIdeas("");
      setShowOverBudgetInput(false);
      setAllocationSubmitted(false);
      setSaveResult({});
    }
  }, [municipality]);

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
      municipalBudget
    );
    setUserAllocation(updatedWithAmounts);

    // Check if they've exceeded the budget and need to show the ideas input
    setShowOverBudgetInput(newTotal > 100);
  };

  const formatBudget = (amount: number) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(2)} พันล้านบาท`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)} ล้านบาท`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)} พันบาท`;
    }
    return `${amount.toFixed(2)} บาท`;
  };

  const handleOverBudgetIdeasChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setOverBudgetIdeas(e.target.value);
  };

  const handleSubmitAllocation = async () => {
    if (!municipality) return;

    setIsSaving(true);

    try {
      const result = await saveBudgetAllocation(
        municipality,
        userAllocation,
        totalAllocated > 100,
        overBudgetIdeas
      );

      setSaveResult({
        success: result.success,
        message: result.success
          ? "ขอบคุณสำหรับการจัดสรรงบประมาณของคุณ"
          : `เกิดข้อผิดพลาด: ${result.message}`,
      });

      // Mark as submitted if successful
      if (result.success) {
        setAllocationSubmitted(true);
      }
    } catch (error) {
      console.error("Error saving budget allocation:", error);
      setSaveResult({
        success: false,
        message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const renderBudgetAllocator = () => {
    if (allocationSubmitted) {
      return (
        <div className="budget-allocator">
          <div className="budget-header">
            <h3>ขอบคุณสำหรับการจัดสรรงบประมาณ</h3>
            <p>ความคิดเห็นของคุณมีค่าต่อการพัฒนาของเทศบาล</p>
          </div>

          <div className="budget-summary">
            <h4>สรุปการจัดสรรงบประมาณของคุณ</h4>
            <div className="budget-summary-items">
              {userAllocation.map((category) => (
                <div key={category.id} className="summary-item">
                  <div className="summary-item-header">
                    <span
                      className="category-color"
                      style={{ backgroundColor: category.color }}
                    ></span>
                    <span className="category-name">{category.name}</span>
                    <span className="category-percentage">
                      {category.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="category-amount">
                    {formatBudget(category.amount)}
                  </div>
                </div>
              ))}
            </div>

            {totalAllocated > 100 && overBudgetIdeas && (
              <div className="over-budget-ideas-display">
                <h4>แนวคิดการหารายได้เพิ่มเติมของคุณ</h4>
                <p>{overBudgetIdeas}</p>
              </div>
            )}

            <div className="budget-actions">
              <button
                className="budget-button"
                onClick={() => setAllocationSubmitted(false)}
              >
                จัดสรรงบประมาณใหม่
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="budget-allocator">
        <div className="budget-header">
          <h3>จัดสรรงบประมาณในฐานะนายกเทศมนตรี</h3>
          <div className="budget-total">
            <div className="municipality-budget">
              งบประมาณทั้งหมด: {formatBudget(municipalBudget)}
            </div>
            <div
              className={`budget-remaining ${
                totalAllocated > 100 ? "over-budget" : ""
              }`}
            >
              {totalAllocated > 100 ? "เกินงบประมาณ!" : "การจัดสรรงบประมาณ"}:{" "}
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

        {showOverBudgetInput && (
          <div className="over-budget-ideas">
            <h4>คุณได้จัดสรรงบเกินกว่าที่มีอยู่ในปัจจุบัน</h4>
            <p>
              กรุณาแชร์ไอเดียว่าเทศบาลควรหารายได้เพิ่มอย่างไรเพื่อจัดสรรตามที่คุณต้องการ
            </p>
            <textarea
              value={overBudgetIdeas}
              onChange={handleOverBudgetIdeasChange}
              placeholder="เช่น เพิ่มการจัดเก็บภาษีท้องถิ่น, จัดกิจกรรมส่งเสริมการท่องเที่ยว, ขอรับเงินอุดหนุนเพิ่มเติม..."
              rows={4}
              className="over-budget-textarea"
            />
          </div>
        )}

        {saveResult.message && (
          <div
            className={`save-result ${
              saveResult.success ? "success" : "error"
            }`}
          >
            {saveResult.message}
          </div>
        )}

        <div className="budget-actions">
          <button
            className="budget-button"
            onClick={handleSubmitAllocation}
            disabled={isSaving}
          >
            {isSaving ? "กำลังบันทึก..." : "ส่งการจัดสรรงบประมาณ"}
          </button>
        </div>
      </div>
    );
  };

  if (!municipality) {
    return (
      <div className="budget-allocation-tool">
        <div className="tool-placeholder">
          <h3>จำลองเป็นนายกเทศมนตรี</h3>
          <p>
            กรุณาเลือกเทศบาลบนแผนที่เพื่อทดลองจัดสรรงบประมาณในฐานะนายกเทศมนตรี
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="budget-allocation-tool">{renderBudgetAllocator()}</div>
  );
};

export default BudgetAllocationTool;
