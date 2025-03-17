import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface BudgetSourcesProps {
  budgetSources: {
    selfCollected?: number;
    stateAllocated?: number;
    subsidies?: number;
  };
}

const BudgetPieChart: React.FC<BudgetSourcesProps> = ({ budgetSources }) => {
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (!budgetSources) return null;

  const {
    selfCollected = 0,
    stateAllocated = 0,
    subsidies = 0,
  } = budgetSources;

  // Skip if all values are 0
  if (selfCollected === 0 && stateAllocated === 0 && subsidies === 0) {
    return <div className="no-data-message">ไม่มีข้อมูลรายละเอียดงบประมาณ</div>;
  }

  const data = [
    { name: "จัดเก็บเอง", value: selfCollected, color: "#FF8A65" },
    { name: "รัฐจัดสรร", value: stateAllocated, color: "#5C48F6" },
    { name: "เงินอุดหนุน", value: subsidies, color: "#4DB6AC" },
  ];

  // Format for tooltip
  const formatTooltip = (value: number) => {
    return `${value.toFixed(2)} ล้านบาท`;
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="custom-legend">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="custom-legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: entry.color }}
            ></span>
            <span className="legend-text">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="budget-chart">
      <ResponsiveContainer width="100%" height={isMobile ? 180 : 230}>
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={isMobile ? 55 : 70}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={formatTooltip} />
          <Legend
            layout={isMobile ? "horizontal" : "vertical"}
            verticalAlign={isMobile ? "bottom" : "middle"}
            align={isMobile ? "center" : "right"}
            iconSize={10}
            wrapperStyle={{
              fontSize: isMobile ? "11px" : "13px",
              paddingLeft: 0,
              marginLeft: 0,
            }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BudgetPieChart;
