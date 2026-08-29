import { AREAS } from "./analysisData";

const COORDINATES = {
  kohima: { lat: 25.6751, lng: 94.1086 },
  shillong: { lat: 25.5788, lng: 91.8933 },
  gangtok: { lat: 27.3389, lng: 88.6065 },
  itanagar: { lat: 27.0844, lng: 93.6053 },
  aizawl: { lat: 23.7271, lng: 92.7176 },
};

export const MAP_LOCATIONS = AREAS.map((a) => ({
  ...a,
  ...COORDINATES[a.id],
}));
