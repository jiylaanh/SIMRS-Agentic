export enum AgentType {
  COORDINATOR = 'Koordinator Utama',
  PATIENT_INFO = 'Agen Informasi Pasien',
  SCHEDULER = 'Penjadwal Janji Temu',
  MEDICAL_RECORDS = 'Agen Rekam Medis',
  BILLING = 'Agen Penagihan & Asuransi',
  GOOGLE_SEARCH = 'Google Search'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  activeAgent?: AgentType;
  groundingUrls?: string[]; // For Google Search results
  generatedDocument?: {
    title: string;
    type: 'pdf' | 'docx';
    content: string;
  };
}

export interface Patient {
  id: string;
  name: string;
  dob: string;
  bpjsNumber: string;
  history: string[];
}

export interface Appointment {
  id: string;
  patientId: string;
  doctor: string;
  date: string;
  status: 'Scheduled' | 'Cancelled' | 'Completed';
}

export interface Bill {
  id: string;
  patientId: string;
  amount: number;
  status: 'Paid' | 'Pending';
  insuranceCovered: boolean;
}