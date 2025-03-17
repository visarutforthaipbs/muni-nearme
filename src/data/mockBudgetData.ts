import { MunicipalBudget, BudgetCategory } from "../types";

// Define budget categories with Thai names, English names are just for reference
const budgetCategories: BudgetCategory[] = [
  {
    id: "health-env",
    name: "สาธารณะสุขและสิ่งแวดล้อม", // Public Health & Environment
    description: "การดูแลสุขภาพประชาชน การจัดการขยะ และการรักษาสิ่งแวดล้อม",
    amount: 75000000, // 75 million baht
    percentage: 25,
    color: "#4DB6AC", // teal
  },
  {
    id: "innovation-edu",
    name: "นวัตกรรมและการศึกษา", // Innovation & Education
    description: "การพัฒนาการศึกษา เทคโนโลยี และนวัตกรรมในพื้นที่",
    amount: 45000000, // 45 million baht
    percentage: 15,
    color: "#5C48F6", // purple
  },
  {
    id: "disaster",
    name: "สาธารณะภัย", // Disaster Prevention/Management
    description: "การป้องกันและจัดการภัยพิบัติ ความปลอดภัยสาธารณะ",
    amount: 30000000, // 30 million baht
    percentage: 10,
    color: "#FF5062", // red
  },
  {
    id: "infrastructure",
    name: "โครงสร้างพื้นฐาน", // Infrastructure
    description: "การสร้างและบำรุงรักษาถนน ไฟฟ้า และสาธารณูปโภคพื้นฐาน",
    amount: 90000000, // 90 million baht
    percentage: 30,
    color: "#FF8A65", // orange
  },
  {
    id: "water",
    name: "บริหารจัดการน้ำ", // Water Management
    description: "การจัดการน้ำประปา การระบายน้ำ และการป้องกันน้ำท่วม",
    amount: 15000000, // 15 million baht
    percentage: 5,
    color: "#42A5F5", // blue
  },
  {
    id: "governance",
    name: "การจัดการภายในและธรรมาภิบาล", // Internal Management & Good Governance
    description:
      "การบริหารจัดการภายในองค์กร การให้บริการประชาชน และความโปร่งใส",
    amount: 18000000, // 18 million baht
    percentage: 6,
    color: "#9575CD", // indigo
  },
  {
    id: "culture",
    name: "สังคม ศาสนา วัฒนธรรม", // Society, Religion & Culture
    description: "กิจกรรมทางสังคม ศาสนา และการส่งเสริมวัฒนธรรมท้องถิ่น",
    amount: 12000000, // 12 million baht
    percentage: 4,
    color: "#FFCA28", // amber
  },
  {
    id: "economy",
    name: "เศรษฐกิจและแหล่งท่องเที่ยว", // Economy & Tourism
    description: "การส่งเสริมเศรษฐกิจท้องถิ่น การพัฒนาแหล่งท่องเที่ยว",
    amount: 15000000, // 15 million baht
    percentage: 5,
    color: "#66BB6A", // green
  },
];

// Create sample municipal budget data
export const mockMunicipalBudget: MunicipalBudget = {
  municipalityId: "sample-municipality",
  year: 2566, // Buddhist calendar year (2023)
  totalBudget: 300000000, // 300 million baht
  categories: budgetCategories,
  dataSource: "ข้อมูลจำลองเพื่อการพัฒนาระบบ",
  lastUpdated: "2023-11-15",
};

// Get an empty user allocation based on the municipal budget
export const getEmptyUserAllocation = (
  municipalityId: string
): BudgetCategory[] => {
  return budgetCategories.map((category) => ({
    ...category,
    amount: 0,
    percentage: 0,
  }));
};

// Helper function to recalculate percentages based on amounts
export const recalculatePercentages = (
  categories: BudgetCategory[],
  totalBudget: number
): BudgetCategory[] => {
  return categories.map((category) => ({
    ...category,
    percentage: totalBudget > 0 ? (category.amount / totalBudget) * 100 : 0,
  }));
};

// Helper function to recalculate amounts based on percentages
export const recalculateAmounts = (
  categories: BudgetCategory[],
  totalBudget: number
): BudgetCategory[] => {
  return categories.map((category) => ({
    ...category,
    amount: (category.percentage / 100) * totalBudget,
  }));
};
