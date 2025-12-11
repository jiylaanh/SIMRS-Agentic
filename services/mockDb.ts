import { Patient, Appointment, Bill } from '../types';

// Mock Data
export const patients: Patient[] = [
  {
    id: "P001",
    name: "Budi Santoso",
    dob: "1985-05-20",
    bpjsNumber: "000123456789",
    history: ["Hipertensi", "Diabetes Tipe 2"]
  },
  {
    id: "P002",
    name: "Siti Aminah",
    dob: "1992-11-10",
    bpjsNumber: "000987654321",
    history: ["Asma Bronkial"]
  },
  {
    id: "P003",
    name: "Rina Wijaya",
    dob: "1988-03-15",
    bpjsNumber: "000456789123",
    history: ["Alergi Obat", "Gastritis"]
  }
];

export const appointments: Appointment[] = [
  { id: "A001", patientId: "P001", doctor: "Dr. Andi Sp.PD", date: "2023-11-15 10:00", status: "Completed" },
  { id: "A002", patientId: "P002", doctor: "Dr. Budi Sp.P", date: "2023-12-20 14:00", status: "Scheduled" },
  { id: "A003", patientId: "P003", doctor: "Dr. Citra Sp.A", date: "2023-12-21 09:00", status: "Scheduled" }
];

export const bills: Bill[] = [
  { id: "B001", patientId: "P001", amount: 150000, status: "Paid", insuranceCovered: true },
  { id: "B002", patientId: "P002", amount: 750000, status: "Pending", insuranceCovered: false },
  { id: "B003", patientId: "P003", amount: 200000, status: "Pending", insuranceCovered: true }
];

// Helper Functions simulating Database Access
export const dbService = {
  getPatientByName: (name: string) => patients.find(p => p.name.toLowerCase().includes(name.toLowerCase())),
  getPatientById: (id: string) => patients.find(p => p.id === id),
  getAppointments: (patientId: string) => appointments.filter(a => a.patientId === patientId),
  scheduleAppointment: (patientId: string, doctor: string, date: string): Appointment => {
    const newAppt: Appointment = {
      id: `A${Math.floor(Math.random() * 1000)}`,
      patientId,
      doctor,
      date,
      status: 'Scheduled'
    };
    appointments.push(newAppt);
    return newAppt;
  },
  getBilling: (patientId: string) => bills.filter(b => b.patientId === patientId),
  generateMedicalRecordDoc: (patientId: string) => {
    const p = patients.find(p => p.id === patientId);
    if (!p) return null;
    return `LAPORAN MEDIS RESMI\nNama: ${p.name}\nID: ${p.id}\nRiwayat: ${p.history.join(", ")}\n\nDokumen ini dihasilkan secara otomatis dan valid untuk keperluan administrasi.`;
  },
  
  // Dashboard Admin Helpers
  getAllPatients: () => [...patients],
  getAllAppointments: () => [...appointments],
  getAllBills: () => bills.map(b => ({
    ...b,
    patientName: patients.find(p => p.id === b.patientId)?.name || 'Unknown'
  })),
  payBill: (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (bill) {
        bill.status = 'Paid';
        return true;
    }
    return false;
  }
};