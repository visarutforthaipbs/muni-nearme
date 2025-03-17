import React from "react";
import { Municipality } from "../types";

interface MunicipalityInfoProps {
  municipality: Municipality | null;
}

const MunicipalityInfo: React.FC<MunicipalityInfoProps> = ({
  municipality,
}) => {
  if (!municipality) {
    return null;
  }

  // Format budget to display in Thai baht with commas
  const formatBudget = (budget: number) => {
    return budget.toLocaleString("th-TH", {
      style: "currency",
      currency: "THB",
    });
  };

  return (
    <div className="municipality-info">
      <h2>{municipality.name}</h2>
      <div className="info-grid">
        <div className="info-item">
          <span className="label">ประเภท:</span>
          <span className="value">{municipality.type}</span>
        </div>
        <div className="info-item">
          <span className="label">จังหวัด:</span>
          <span className="value">{municipality.province}</span>
        </div>
        <div className="info-item">
          <span className="label">อำเภอ:</span>
          <span className="value">{municipality.district}</span>
        </div>
        <div className="info-item">
          <span className="label">งบประมาณปี 2566:</span>
          <span className="value highlight">
            {formatBudget(municipality.budget)}
          </span>
        </div>
        {municipality.population && (
          <div className="info-item">
            <span className="label">ประชากร:</span>
            <span className="value">
              {municipality.population.toLocaleString("th-TH")} คน
            </span>
          </div>
        )}
        {municipality.area && (
          <div className="info-item">
            <span className="label">พื้นที่:</span>
            <span className="value">
              {municipality.area.toLocaleString("th-TH")} ตร.กม.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MunicipalityInfo;
