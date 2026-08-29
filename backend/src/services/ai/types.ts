/** Contract types for the FastAPI risk/prediction service. */

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface RiskAnalysisInput {
  latitude: number;
  longitude: number;
   location: string;
  state: string;
}

export interface RiskFeatures {
  rainfall_24h: number;
  rainfall_48h: number;
  rainfall_7d: number;
  average_humidity_24h: number;
  soil_moisture: number;
  elevation: number;
  slope: number;
}

export interface RiskAnalysisResult {
  probability: number;
  risk_score: number;
  risk_level: RiskLevel;
  features: RiskFeatures;
}
