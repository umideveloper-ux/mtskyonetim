export interface School {
  id: string;
  name: string;
  email: string;
  candidates: {
    [key in LicenseClass | DifferenceClass]: number;
  };
}

export interface Message {
  id: string;
  schoolId: string;
  schoolName: string;
  content: string;
  timestamp: Date;
}

export type LicenseClass = 'B' | 'A1' | 'A2' | 'C' | 'D';
export type DifferenceClass = 'FARK_A1' | 'FARK_A2' | 'BAKANLIK_A1';

export const LICENSE_FEES: { [key in LicenseClass | DifferenceClass]: number } = {
  B: 15000,
  A1: 12000,
  A2: 12000,
  C: 15000,
  D: 15000,
  FARK_A1: 10000,
  FARK_A2: 12000,
  BAKANLIK_A1: 7500,
};

export const CLASS_NAMES: { [key in LicenseClass | DifferenceClass]: string } = {
  B: 'B Sınıfı',
  A1: 'A1 Sınıfı',
  A2: 'A2 Sınıfı',
  C: 'C Sınıfı',
  D: 'D Sınıfı',
  FARK_A1: 'Fark A1',
  FARK_A2: 'Fark A2',
  BAKANLIK_A1: 'Bakanlık A1',
};