import { GoogleGenAI, FunctionDeclaration, Type, Chat } from "@google/genai";
import { AgentType } from '../types';
import { dbService } from './mockDb';

// 1. Define Function Declarations (The "API" the AI can call)

const getPatientInfoTool: FunctionDeclaration = {
  name: 'getPatientInfo',
  description: 'Mengambil informasi dasar pasien berdasarkan nama atau ID. Gunakan ini untuk Agent Informasi Pasien.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'Nama pasien atau ID pasien (contoh: P001)' }
    },
    required: ['query']
  }
};

const scheduleAppointmentTool: FunctionDeclaration = {
  name: 'scheduleAppointment',
  description: 'Menjadwalkan janji temu baru. Gunakan ini untuk Agent Penjadwalan.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      patientId: { type: Type.STRING, description: 'ID Pasien' },
      doctorName: { type: Type.STRING, description: 'Nama Dokter' },
      date: { type: Type.STRING, description: 'Tanggal dan Jam (Format: YYYY-MM-DD HH:MM)' }
    },
    required: ['patientId', 'doctorName', 'date']
  }
};

const getMedicalRecordsTool: FunctionDeclaration = {
  name: 'getMedicalRecords',
  description: 'Mengambil riwayat medis pasien. Gunakan ini untuk Agent Rekam Medis.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      patientId: { type: Type.STRING, description: 'ID Pasien' }
    },
    required: ['patientId']
  }
};

const getBillingInfoTool: FunctionDeclaration = {
  name: 'getBillingInfo',
  description: 'Mengecek status tagihan atau asuransi. Gunakan ini untuk Agent Billing.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      patientId: { type: Type.STRING, description: 'ID Pasien' }
    },
    required: ['patientId']
  }
};

const generateDocumentTool: FunctionDeclaration = {
  name: 'generateDocument',
  description: 'Membuat dokumen resmi (PDF/DOCX) untuk rekam medis atau rujukan.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      patientId: { type: Type.STRING, description: 'ID Pasien' },
      docType: { type: Type.STRING, description: 'Jenis dokumen (medical_record, referral)' }
    },
    required: ['patientId', 'docType']
  }
};

// 2. Initialize Gemini

let chatSession: Chat | null = null;

export const initializeChat = (apiKey: string) => {
  const ai = new GoogleGenAI({ apiKey });
  
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `
        Anda adalah Koordinator Sistem Rumah Sakit (SIMRS) yang cerdas dengan arsitektur Agentic.
        Tugas Anda adalah menganalisis permintaan pengguna dan mendelegasikannya ke sub-agen yang tepat.

        PERAN SUB-AGEN & INSTRUKSI:
        
        1. Agen Informasi Pasien (Gunakan tool 'getPatientInfo')
           - Tugas: Mengelola pendaftaran, pembaruan detail, dan pengambilan info pasien.
           - Output: Berikan info pasien yang diminta atau konfirmasi pembaruan. Gunakan 'generateDocument' jika diminta formulir.
           
        2. Penjadwal Janji Temu (Gunakan tool 'scheduleAppointment')
           - Tugas: Menjadwalkan, menjadwal ulang, dan membatalkan janji temu.
           - Output: Konfirmasi status (terjadwal/batal) dengan detail dokter, waktu, dan pasien.
           
        3. Agen Rekam Medis (Gunakan tool 'getMedicalRecords' atau 'generateDocument')
           - Tugas: Memproses permintaan riwayat medis, diagnosis, dan hasil tes.
           - Output: Sajikan data medis secara rahasia. Gunakan 'generateDocument' untuk membuat laporan terstruktur.
           
        4. Agen Penagihan & Asuransi (Gunakan tool 'getBillingInfo')
           - Tugas: Menangani pertanyaan faktur, klaim BPJS, dan status pembayaran.
           - Output: Jelaskan status tagihan dan cakupan asuransi secara komprehensif.

        ATURAN UTAMA:
        - Jika pengguna bertanya tentang hal umum (misal: "Apa gejala flu?"), gunakan tool 'googleSearch' untuk grounding fakta.
        - Gunakan Function Calling untuk data spesifik RS. Jangan pernah mengarang data pasien.
        - Bersikaplah profesional, sopan, dan empatik.
        - Jika data tidak ditemukan, katakan dengan jelas.
        - Jawablah selalu dalam Bahasa Indonesia.
      `,
      tools: [
        { functionDeclarations: [
            getPatientInfoTool, 
            scheduleAppointmentTool, 
            getMedicalRecordsTool, 
            getBillingInfoTool, 
            generateDocumentTool 
          ] 
        },
        { googleSearch: {} } // Enable Google Search grounding
      ]
    }
  });
};

// 3. Execution Function

export interface ChatResponse {
  text: string;
  agentUsed: AgentType;
  groundingUrls?: string[];
  generatedDoc?: { title: string; content: string; type: 'pdf' | 'docx' };
}

export const sendMessageToGemini = async (message: string): Promise<ChatResponse> => {
  if (!chatSession) throw new Error("Chat session not initialized");

  // Initial prompt
  let response = await chatSession.sendMessage({ message });
  let finalAgent = AgentType.COORDINATOR;
  let generatedDoc = undefined;

  // Handle Function Calling Loop
  // The API might return a function call request. We must execute it and send the result back.
  
  // We loop because one request might trigger multiple function calls (though usually one for this app)
  // Or the model might verify information.
  
  while (response.candidates?.[0]?.content?.parts?.some(p => p.functionCall)) {
    const parts = response.candidates[0].content.parts;
    
    // Construct the response parts to send back to Gemini
    const functionResponses = [];

    for (const part of parts) {
      if (part.functionCall) {
        const { name, args } = part.functionCall;
        console.log(`[Function Call] ${name} with args:`, args);
        
        let result: any = { error: "Function not found" };

        try {
          // Execute Mock DB Logic
          switch (name) {
            case 'getPatientInfo':
              finalAgent = AgentType.PATIENT_INFO;
              const pInfo = dbService.getPatientByName(args['query'] as string) || dbService.getPatientById(args['query'] as string);
              result = pInfo ? pInfo : { message: "Pasien tidak ditemukan." };
              break;

            case 'scheduleAppointment':
              finalAgent = AgentType.SCHEDULER;
              const appt = dbService.scheduleAppointment(args['patientId'] as string, args['doctorName'] as string, args['date'] as string);
              result = { message: "Janji temu berhasil dibuat", detail: appt };
              break;

            case 'getMedicalRecords':
              finalAgent = AgentType.MEDICAL_RECORDS;
              const meds = dbService.getPatientById(args['patientId'] as string);
              result = meds ? { history: meds.history } : { message: "Data medis tidak ditemukan" };
              break;

            case 'getBillingInfo':
              finalAgent = AgentType.BILLING;
              const bills = dbService.getBilling(args['patientId'] as string);
              result = bills.length > 0 ? bills : { message: "Tidak ada tagihan tertunggak." };
              break;

            case 'generateDocument':
              finalAgent = AgentType.MEDICAL_RECORDS;
              const content = dbService.generateMedicalRecordDoc(args['patientId'] as string);
              if (content) {
                result = { success: true, message: "Dokumen telah dibuat." };
                generatedDoc = {
                  title: `Rekam_Medis_${args['patientId']}.pdf`,
                  content: content,
                  type: 'pdf' as const
                };
              } else {
                result = { error: "Pasien tidak valid." };
              }
              break;
          }
        } catch (e: any) {
          result = { error: e.message };
        }

        functionResponses.push({
            name: name,
            response: { result: result },
            id: part.functionCall.id
        });
      }
    }

    // Send the function execution result back to Gemini
    // We use .sendMessage with the function response to continue the conversation
    response = await chatSession.sendMessage(functionResponses);
  }

  // Check if Google Search was used (grounding)
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  let groundingUrls: string[] = [];
  if (groundingChunks) {
    // If search was used, update the agent type
    if (finalAgent === AgentType.COORDINATOR) {
        finalAgent = AgentType.GOOGLE_SEARCH;
    }
    groundingUrls = groundingChunks
      .map(c => c.web?.uri)
      .filter((uri): uri is string => !!uri);
  }

  return {
    text: response.text || "Maaf, saya tidak dapat memproses permintaan tersebut.",
    agentUsed: finalAgent,
    groundingUrls,
    generatedDoc
  };
};