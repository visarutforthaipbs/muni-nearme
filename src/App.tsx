import React, { useState } from "react";
import "./App.css";
import "leaflet/dist/leaflet.css";
import Map from "./components/Map";
import InfoSidebar from "./components/InfoSidebar";
import { Municipality } from "./types";

const App: React.FC = () => {
  const [selectedMunicipality, setSelectedMunicipality] =
    useState<Municipality | null>(null);
  const [activePage, setActivePage] = useState<"map" | "election">("map");
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const handleMunicipalitySelect = (municipality: Municipality | null) => {
    setSelectedMunicipality(municipality);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const navControls = document.querySelector(".nav-controls");
      if (menuOpen && navControls && !navControls.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="logo-container">
            <img
              src="/logo-1.gif"
              alt="เทศบาลใกล้ฉัน Logo"
              className="app-logo"
            />
          </div>

          <div className="nav-controls">
            <div
              className={`nav-container ${menuOpen ? "open" : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={`nav-button ${activePage === "map" ? "active" : ""}`}
                onClick={() => {
                  setActivePage("map");
                  setMenuOpen(false);
                }}
                aria-label="แผนที่เทศบาล"
              >
                แผนที่เทศบาล
              </button>
              <button
                className={`nav-button ${
                  activePage === "election" ? "active" : ""
                }`}
                onClick={() => {
                  setActivePage("election");
                  setMenuOpen(false);
                }}
                aria-label="ข้อมูลการเลือกตั้ง"
              >
                ข้อมูลการเลือกตั้ง
              </button>
            </div>

            <button
              className="menu-toggle"
              onClick={toggleMenu}
              onTouchStart={(e) => e.stopPropagation()}
              aria-label={menuOpen ? "ปิดเมนู" : "เปิดเมนู"}
              aria-expanded={menuOpen}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {activePage === "map" ? (
        <div className="app-container">
          <InfoSidebar municipality={selectedMunicipality} />
          <div className="main-content">
            <Map onMunicipalitySelect={handleMunicipalitySelect} />
          </div>
        </div>
      ) : (
        <div className="election-info-page">
          <div className="election-header">
            <h2>ข้อมูลการเลือกตั้ง</h2>
            <p className="election-tagline">
              เลือกตั้งเทศบาล 11 พฤษภาคม 2568 - การเลือกตั้งของท้องถิ่น คือ
              พลังของการพัฒนาชุมชน
            </p>
          </div>

          <div className="first-time-voter-section">
            <div className="first-voter-badge">
              สำหรับผู้มีสิทธิ์เลือกตั้งครั้งแรก
            </div>

            <div className="quick-guide">
              <h3>สิ่งที่ต้องรู้ใน 1 นาที</h3>
              <div className="quick-guide-items">
                <div className="guide-item">
                  <div className="guide-number">1</div>
                  <div className="guide-text">
                    <strong>ใครมีสิทธิ์?</strong> คนไทยอายุ 18+
                    ที่มีชื่อในทะเบียนบ้านเขตเทศบาลอย่างน้อย 1 ปี
                  </div>
                </div>

                <div className="guide-item">
                  <div className="guide-number">2</div>
                  <div className="guide-text">
                    <strong>เลือกใคร?</strong> นายกเทศมนตรี 1 คน
                    และสมาชิกสภาเทศบาลตามเขตของคุณ
                  </div>
                </div>

                <div className="guide-item">
                  <div className="guide-number">3</div>
                  <div className="guide-text">
                    <strong>เตรียมอะไร?</strong> บัตรประชาชน
                    และตรวจสอบหน่วยเลือกตั้งล่วงหน้าที่{" "}
                    <a
                      href="https://www.ect.go.th/ect_th/smartvote/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Smart Vote
                    </a>
                  </div>
                </div>

                <div className="guide-item">
                  <div className="guide-number">4</div>
                  <div className="guide-text">
                    <strong>ทำไมสำคัญ?</strong>{" "}
                    เพราะผู้นำที่คุณเลือกจะดูแลสิ่งใกล้ตัวคุณ (ถนน สวนสาธารณะ
                    ขยะ ฯลฯ)
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="election-explainer">
            <h3>เทศบาลและการเลือกตั้งคืออะไร?</h3>
            <div className="municipality-types">
              <div className="type-card">
                <div className="type-icon type-city"></div>
                <h4>เทศบาลนคร</h4>
                <p>เขตชุมชนใหญ่ มีประชากรตั้งแต่ 50,000 คนขึ้นไป</p>
                <div className="council-info">สมาชิกสภา 24 คน (4 เขต)</div>
              </div>

              <div className="type-card">
                <div className="type-icon type-town"></div>
                <h4>เทศบาลเมือง</h4>
                <p>เขตชุมชนขนาดกลาง มีประชากร 10,000-50,000 คน</p>
                <div className="council-info">สมาชิกสภา 18 คน (3 เขต)</div>
              </div>

              <div className="type-card">
                <div className="type-icon type-subdistrict"></div>
                <h4>เทศบาลตำบล</h4>
                <p>เขตชุมชนขนาดเล็ก มีประชากรน้อยกว่า 10,000 คน</p>
                <div className="council-info">สมาชิกสภา 12 คน (2 เขต)</div>
              </div>
            </div>
          </div>

          <div className="election-timeline-container">
            <h3>ไทม์ไลน์การเลือกตั้ง</h3>
            <div className="election-timeline">
              <div className="timeline-line"></div>

              <div className="timeline-event">
                <div className="timeline-dot"></div>
                <div className="timeline-date">ก่อนเลือกตั้ง 20 วัน</div>
                <div className="timeline-content">
                  ประกาศรายชื่อผู้มีสิทธิ์เลือกตั้ง และรายละเอียดหน่วยเลือกตั้ง
                </div>
              </div>

              <div className="timeline-event">
                <div className="timeline-dot"></div>
                <div className="timeline-date">วันอาทิตย์ที่ 11 พ.ค. 2568</div>
                <div className="timeline-content">
                  <div className="election-day">วันเลือกตั้ง</div>
                  เปิดให้ลงคะแนน 08.00-17.00 น. <br />
                  (ต้องเตรียมบัตรประชาชนไปด้วย!)
                </div>
              </div>

              <div className="timeline-event">
                <div className="timeline-dot"></div>
                <div className="timeline-date">หลังปิดหีบ</div>
                <div className="timeline-content">
                  เริ่มนับคะแนนทันที และประกาศผลอย่างไม่เป็นทางการ
                </div>
              </div>

              <div className="timeline-event">
                <div className="timeline-dot"></div>
                <div className="timeline-date">ภายใน 30 วัน</div>
                <div className="timeline-content">
                  กกต. รับรองผลการเลือกตั้งอย่างเป็นทางการ
                </div>
              </div>
            </div>
          </div>

          <div className="voting-process">
            <h3>วิธีลงคะแนนเลือกตั้ง</h3>
            <div className="process-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>ยืนยันตัวตน</h4>
                  <p>
                    แสดงบัตรประชาชนกับเจ้าหน้าที่ และลงลายมือชื่อในบัญชีรายชื่อ
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>รับบัตรเลือกตั้ง</h4>
                  <p>
                    คุณจะได้รับบัตร 2 ใบ:{" "}
                    <span className="highlight">สีชมพู</span> สำหรับเลือกนายกฯ
                    และ <span className="highlight">สีเขียว</span>{" "}
                    สำหรับเลือกสมาชิกสภา
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>ลงคะแนนเสียง</h4>
                  <p>
                    เข้าคูหาและทำเครื่องหมายกากบาทในบัตรแต่ละใบ (เลือกนายกฯ 1 คน
                    และ ส.ท. ตามจำนวนที่พึงมีในเขต)
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>หย่อนบัตร</h4>
                  <p>
                    นำบัตรที่พับเรียบร้อยแล้วหย่อนลงในหีบบัตรเลือกตั้งให้ถูกต้อง
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="why-vote-section">
            <h3>ทำไมการเลือกตั้งเทศบาลจึงสำคัญ?</h3>
            <div className="impact-areas">
              <div className="impact-item">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <h4>สุขภาพและความเป็นอยู่</h4>
                <p>เทศบาลดูแลศูนย์สุขภาพชุมชน สวนสาธารณะ และพื้นที่นันทนาการ</p>
              </div>

              <div className="impact-item">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z" />
                </svg>
                <h4>กิจกรรมท้องถิ่น</h4>
                <p>จัดเทศกาล งานประเพณี และโครงการส่งเสริมวัฒนธรรมท้องถิ่น</p>
              </div>

              <div className="impact-item">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
                </svg>
                <h4>การศึกษา</h4>
                <p>
                  ดูแลศูนย์พัฒนาเด็กเล็ก โรงเรียนอนุบาล
                  และสนับสนุนการศึกษาในท้องถิ่น
                </p>
              </div>

              <div className="impact-item">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                </svg>
                <h4>โครงสร้างพื้นฐาน</h4>
                <p>สร้างและซ่อมแซมถนน ทางเท้า ระบบระบายน้ำ และไฟฟ้าส่องสว่าง</p>
              </div>

              <div className="impact-item">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm4.5-4H7V4h9v14z" />
                </svg>
                <h4>บริการดิจิทัล</h4>
                <p>
                  พัฒนาแอปพลิเคชันและบริการออนไลน์เพื่ออำนวยความสะดวกให้ประชาชน
                </p>
              </div>

              <div className="impact-item">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z" />
                  <path d="M16 3v18" />
                  <path d="M8 3v18" />
                  <path d="M3 16h18" />
                  <path d="M3 8h18" />
                </svg>
                <h4>สิ่งแวดล้อม</h4>
                <p>
                  จัดการขยะและมลพิษ ส่งเสริมการรีไซเคิล และดูแลพื้นที่สีเขียว
                </p>
              </div>
            </div>
          </div>

          <div className="voter-checklist">
            <h3>เช็คลิสต์สำหรับผู้มีสิทธิ์เลือกตั้งครั้งแรก</h3>
            <div className="checklist-items">
              <div className="checklist-item">
                <input type="checkbox" id="check1" />
                <label htmlFor="check1">
                  ตรวจสอบรายชื่อผู้มีสิทธิ์เลือกตั้งที่{" "}
                  <a
                    href="https://www.ect.go.th/ect_th/smartvote/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Smart Vote
                  </a>
                </label>
              </div>

              <div className="checklist-item">
                <input type="checkbox" id="check2" />
                <label htmlFor="check2">
                  ศึกษาข้อมูลของผู้สมัครในพื้นที่ของคุณล่วงหน้า
                </label>
              </div>

              <div className="checklist-item">
                <input type="checkbox" id="check3" />
                <label htmlFor="check3">เตรียมบัตรประชาชนให้พร้อม</label>
              </div>

              <div className="checklist-item">
                <input type="checkbox" id="check4" />
                <label htmlFor="check4">
                  วางแผนเวลาและการเดินทางไปหน่วยเลือกตั้ง
                </label>
              </div>

              <div className="checklist-item">
                <input type="checkbox" id="check5" />
                <label htmlFor="check5">
                  ทำความเข้าใจวิธีลงคะแนนเสียงที่ถูกต้อง
                </label>
              </div>
            </div>
            <div className="encourage-text">
              เสียงของคุณมีความหมาย!
              การเลือกตั้งเทศบาลอาจไม่ได้รับความสนใจเท่าการเลือกตั้งระดับชาติ
              แต่มีผลกระทบโดยตรงต่อคุณภาพชีวิตของคุณ
            </div>
          </div>

          <div className="faq-section">
            <h3>คำถามที่พบบ่อย</h3>
            <div className="faq-items">
              <div className="faq-item">
                <div className="faq-question">
                  ฉันจะตรวจสอบได้อย่างไรว่าฉันอยู่ในเขตเทศบาลใด?
                </div>
                <div className="faq-answer">
                  คุณสามารถตรวจสอบได้จากแผนที่ในแอปนี้
                  หรือสอบถามจากสำนักงานเขต/อำเภอ
                  หรือที่ว่าการเทศบาลในพื้นที่ของคุณ
                </div>
              </div>

              <div className="faq-item">
                <div className="faq-question">
                  จะเกิดอะไรขึ้นถ้าฉันไม่ไปใช้สิทธิ์เลือกตั้ง?
                </div>
                <div className="faq-answer">
                  หากไม่ไปใช้สิทธิ์โดยไม่แจ้งเหตุผลอันสมควร
                  คุณอาจถูกจำกัดสิทธิบางประการ เช่น การสมัครรับเลือกตั้ง
                  หรือการดำรงตำแหน่งทางการเมืองเป็นเวลา 2 ปี
                </div>
              </div>

              <div className="faq-item">
                <div className="faq-question">
                  ฉันสามารถลงคะแนนล่วงหน้าได้หรือไม่?
                </div>
                <div className="faq-answer">
                  ไม่ได้ การเลือกตั้งเทศบาลไม่มีการลงคะแนนล่วงหน้า
                  คุณต้องไปลงคะแนนในวันเลือกตั้งที่หน่วยเลือกตั้งที่คุณมีชื่ออยู่เท่านั้น
                </div>
              </div>

              <div className="faq-item">
                <div className="faq-question">
                  หากฉันย้ายที่อยู่เข้ามาในเขตเทศบาลเมื่อไม่นานมานี้
                  ฉันมีสิทธิ์เลือกตั้งหรือไม่?
                </div>
                <div className="faq-answer">
                  คุณต้องมีชื่ออยู่ในทะเบียนบ้านในเขตเทศบาลนั้นอย่างน้อย 1
                  ปีก่อนวันเลือกตั้ง หากไม่ถึง 1 ปี
                  คุณจะยังไม่มีสิทธิ์ในการเลือกตั้งครั้งนี้
                </div>
              </div>
            </div>
          </div>

          <div className="sources-section">
            <h3>แหล่งข้อมูลเพิ่มเติม</h3>
            <div className="sources-list">
              <a
                href="https://www.ect.go.th/"
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
              >
                <div className="source-icon ect"></div>
                <div className="source-info">
                  <h4>สำนักงานคณะกรรมการการเลือกตั้ง (กกต.)</h4>
                  <p>ข้อมูลทางการเกี่ยวกับการเลือกตั้งทุกระดับในประเทศไทย</p>
                </div>
              </a>

              <a
                href="https://www.thansettakij.com/politics/620748"
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
              >
                <div className="source-icon news"></div>
                <div className="source-info">
                  <h4>เลือกตั้งเทศบาล 2568 วันไหน เช็กความรู้การเลือกตั้ง</h4>
                  <p>บทความให้ความรู้เกี่ยวกับการเลือกตั้งเทศบาลปี 2568</p>
                </div>
              </a>

              <a
                href="https://psub.psu.ac.th/?p=14569"
                target="_blank"
                rel="noopener noreferrer"
                className="source-link"
              >
                <div className="source-icon edu"></div>
                <div className="source-info">
                  <h4>กำหนดวันเลือกตั้งเทศบาล ทั่วประเทศ 11 พ.ค. 2568</h4>
                  <p>ประกาศอย่างเป็นทางการเกี่ยวกับกำหนดการเลือกตั้งเทศบาล</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
