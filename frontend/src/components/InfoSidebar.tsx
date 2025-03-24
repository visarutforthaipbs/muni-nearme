import React, { useState, useEffect } from "react";
import { Municipality } from "../types";
import BudgetPieChart from "./BudgetPieChart";
import BudgetAllocationTool from "./BudgetAllocationTool";

interface InfoSidebarProps {
  municipality: Municipality | null;
}

const InfoSidebar: React.FC<InfoSidebarProps> = ({ municipality }) => {
  const [showBudgetBreakdown, setShowBudgetBreakdown] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [currentLogoIndex, setCurrentLogoIndex] = useState<number>(0);

  // Array of logo images to rotate
  const logoImages = ["/1.png", "/2.png", "/3.png"];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Logo rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLogoIndex((prevIndex) => (prevIndex + 1) % logoImages.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Display different badge classes based on municipality type
  const getBadgeClass = () => {
    if (!municipality) return "";

    const type = municipality.type.toLowerCase();
    if (type.includes("นคร") || type.includes("nakhon")) {
      return "city";
    } else if (type.includes("เมือง") || type.includes("mueang")) {
      return "town";
    } else {
      return "subdistrict";
    }
  };

  // Function to format budget to Thai Baht in millions or billions
  const formatBudget = (budget: number | undefined) => {
    if (!budget) return "ไม่ระบุ";

    if (budget >= 1000000000) {
      // Convert to billions
      return `฿${(budget / 1000000000).toFixed(2)} พันล้านบาท`;
    } else {
      // Convert to millions
      return `฿${(budget / 1000000).toFixed(2)} ล้านบาท`;
    }
  };

  // Function to format population with commas
  const formatPopulation = (population: number | undefined) => {
    if (!population) return "ไม่ระบุ";
    return population.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Format area with comma and units
  const formatArea = (area: number | undefined) => {
    if (!area) return "ไม่ระบุ";
    return `${area.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ตร.กม.`;
  };

  const renderMunicipalityInfo = () => {
    if (!municipality) {
      return (
        <div className="placeholder-content">
          <img
            src="/logo-1.gif"
            alt="เทศบาลใกล้ฉัน"
            className="logo-image"
            style={{
              maxWidth: "200px",
              margin: "0 auto 15px",
              display: "block",
            }}
          />
          <p>เลือกเทศบาลบนแผนที่เพื่อดูข้อมูล</p>
          <div className="placeholder-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
        </div>
      );
    }

    return (
      <div className="sidebar-content">
        <h2>{municipality.name}</h2>

        <div className="municipality-type">
          <span className={`type-badge ${getBadgeClass()}`}>
            {municipality.type}
          </span>
        </div>

        <div className="info-row">
          <strong>จังหวัด</strong>
          <span>{municipality.province}</span>
        </div>

        <div className="info-row">
          <strong>อำเภอ</strong>
          <span>{municipality.district}</span>
        </div>

        <div className="info-row budget">
          <strong>งบประมาณประจำปี 2566</strong>
          <div className="budget-row">
            <span>{formatBudget(municipality.budget)}</span>
            <button
              className="budget-allocate-button"
              onClick={() => setShowBudgetModal(true)}
              title="ร่วมจัดสรรงบประมาณ"
            >
              <div className="budget-icon-container">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                <span className="budget-tooltip">ลองจัดสรรงบประมาณ</span>
              </div>
            </button>
          </div>
        </div>

        {municipality.budgetSources && (
          <div className="info-row budget-breakdown">
            <button
              className="toggle-button"
              onClick={() => setShowBudgetBreakdown(!showBudgetBreakdown)}
            >
              <strong>
                รายละเอียดงบประมาณ{" "}
                <span className="toggle-icon">
                  {showBudgetBreakdown ? "▼" : "►"}
                </span>
              </strong>
            </button>

            {showBudgetBreakdown && (
              <div className="budget-details">
                <BudgetPieChart budgetSources={municipality.budgetSources} />
                <div className="budget-breakdown-text">
                  <div className="budget-item">
                    <span className="budget-label">จัดเก็บเอง:</span>
                    <span className="budget-value">
                      {municipality.budgetSources.selfCollected?.toFixed(2) ||
                        0}{" "}
                      ล้านบาท
                    </span>
                  </div>
                  <div className="budget-item">
                    <span className="budget-label">รัฐจัดสรร:</span>
                    <span className="budget-value">
                      {municipality.budgetSources.stateAllocated?.toFixed(2) ||
                        0}{" "}
                      ล้านบาท
                    </span>
                  </div>
                  <div className="budget-item">
                    <span className="budget-label">เงินอุดหนุน:</span>
                    <span className="budget-value">
                      {municipality.budgetSources.subsidies?.toFixed(2) || 0}{" "}
                      ล้านบาท
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="stats-container">
          <div className="stat">
            <div className="stat-label">ประชากร</div>
            <div className="stat-value">
              {formatPopulation(municipality.population)}
            </div>
          </div>

          <div className="stat">
            <div className="stat-label">พื้นที่</div>
            <div className="stat-value">{formatArea(municipality.area)}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="info-sidebar">
      {isMobile && (
        <div className="mobile-sidebar-handle">
          <div className="handle-indicator"></div>
        </div>
      )}
      {renderMunicipalityInfo()}

      {/* Simplified Modal without CSSTransition */}
      {showBudgetModal && (
        <div
          className="budget-modal-overlay"
          onClick={() => setShowBudgetModal(false)}
        >
          <div
            className="budget-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="budget-modal-header">
              <h3>ถ้าเป็นคุณจะจัดสรรงบประมาณ{municipality?.name}อย่างไร?</h3>
              <button
                className="modal-close-button"
                onClick={() => setShowBudgetModal(false)}
              >
                ×
              </button>
            </div>
            <div className="budget-modal-body">
              <BudgetAllocationTool municipality={municipality} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoSidebar;
