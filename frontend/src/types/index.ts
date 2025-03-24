export interface Municipality {
  id: string;
  name: string;
  budget: number;
  province: string;
  district: string;
  population?: number;
  area?: number;
  type: string; // เทศบาลนคร, เทศบาลเมือง, เทศบาลตำบล
  budgetSources?: {
    selfCollected?: number; // จัดเก็บเอง (ล้านบาท)
    stateAllocated?: number; // รัฐจัดสรร (ล้านบาท)
    subsidies?: number; // เงินอุดหนุน (ล้านบาท)
  };
}

export interface GeoJsonFeature {
  type: string;
  properties: {
    name?: string;
    mun_name?: string;
    muni_code?: string;
    cwt_name?: string;
    amp_name?: string;
    "check-extracted-data - all-muni-nso-thai_type"?: string;
    "1- clean-extracted_46_to_235_land-sque-km"?: string;
    "1- clean-extracted_46_to_235_poppu"?: string;
    "1- clean-extracted_46_to_235_total"?: string;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][] | number[][][][][];
  };
}

export interface GeoJsonData {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

export interface MunicipalityDetail extends Municipality {
  boundaries: GeoJsonFeature;
}

export interface TopoJsonGeometry {
  type: string;
  arcs: number[][];
  properties: any;
}

export interface TopoJsonObject {
  type: string;
  objects: {
    [key: string]: {
      type: string;
      geometries: TopoJsonGeometry[];
    };
  };
  arcs: number[][][];
}

export interface BudgetCategory {
  id: string;
  name: string;
  description: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MunicipalBudget {
  municipalityId: string;
  year: number;
  totalBudget: number;
  categories: BudgetCategory[];
  dataSource: string;
  lastUpdated: string;
}

export interface UserBudgetAllocation {
  userId: string;
  municipalityId: string;
  totalBudget: number;
  categories: BudgetCategory[];
  timestamp: string;
}
