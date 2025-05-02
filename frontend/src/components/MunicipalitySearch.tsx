import React, { useState, useEffect, useRef } from "react";
import { Municipality } from "../types";
import { searchMunicipalities } from "../services/municipalityService";

interface MunicipalitySearchProps {
  onMunicipalitySelect: (municipality: Municipality) => void;
}

const MunicipalitySearch: React.FC<MunicipalitySearchProps> = ({
  onMunicipalitySelect,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Municipality[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setLoading(true);
        setError(null);

        try {
          const results = await searchMunicipalities(searchQuery);
          setSearchResults(results);
          setShowResults(true);
        } catch (err) {
          setError("ไม่สามารถค้นหาเทศบาลได้ โปรดลองใหม่อีกครั้ง");
          setSearchResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSelectMunicipality = (municipality: Municipality) => {
    onMunicipalitySelect(municipality);
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  const getBadgeClass = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("นคร") || lowerType.includes("nakhon")) {
      return "city";
    } else if (lowerType.includes("เมือง") || lowerType.includes("mueang")) {
      return "town";
    } else {
      return "subdistrict";
    }
  };

  return (
    <div className="municipality-search-container" ref={searchContainerRef}>
      <div className="search-box">
        <svg
          className="search-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="ค้นหาเทศบาลของคุณ..."
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowResults(true);
            }
          }}
        />
        {loading && <div className="search-spinner"></div>}
      </div>

      {error && <div className="search-error">{error}</div>}

      {showResults && searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map((municipality) => (
            <div
              key={municipality.id}
              className="search-result-item"
              onClick={() => handleSelectMunicipality(municipality)}
            >
              <div className="result-info">
                <div className="result-name">{municipality.name}</div>
                <div className="result-details">
                  <span
                    className={`type-badge ${getBadgeClass(municipality.type)}`}
                  >
                    {municipality.type}
                  </span>
                  <span className="location">
                    {municipality.district}, {municipality.province}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showResults &&
        searchQuery.trim().length >= 2 &&
        searchResults.length === 0 &&
        !loading &&
        !error && (
          <div className="no-results">
            ไม่พบผลลัพธ์ที่ตรงกับ "{searchQuery}"
          </div>
        )}
    </div>
  );
};

export default MunicipalitySearch;
