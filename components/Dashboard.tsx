import React, { useState, useEffect } from 'react';
import { dbService } from '../services/mockDb';
import { Users, Calendar, CreditCard, Activity, Search, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { Patient, Bill } from '../types';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'billing'>('overview');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [bills, setBills] = useState<(Bill & { patientName: string })[]>([]);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Load data
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setPatients(dbService.getAllPatients());
    setBills(dbService.getAllBills());
    setAppointmentsCount(dbService.getAllAppointments().filter(a => a.status === 'Scheduled').length);
  };

  const handlePayBill = (id: string) => {
    if (confirm('Proses pembayaran untuk tagihan ini?')) {
        dbService.payBill(id);
        refreshData();
    }
  };

  // Filter Logic
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBills = bills.filter(b => 
    b.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = bills.filter(b => b.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
  const pendingRevenue = bills.filter(b => b.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Dashboard Header */}
      <div className="px-8 py-6 bg-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard Rumah Sakit</h1>
            <p className="text-sm text-slate-500 mt-1">Sistem Informasi Manajemen & Administrasi Terpadu</p>
        </div>
        
        {/* Search Bar */}
        {(activeTab !== 'overview') && (
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg border border-transparent focus-within:border-teal-500 focus-within:bg-white transition-all">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Cari pasien atau tagihan..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none text-sm focus:ring-0 outline-none w-64 placeholder:text-slate-400"
                />
            </div>
        )}
      </div>

      {/* Stats Overview */}
      {activeTab === 'overview' && (
        <div className="p-8 pb-4 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                    <Users className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-slate-500 font-medium">Total Pasien</p>
                    <p className="text-2xl font-bold text-slate-800">{patients.length}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                    <Calendar className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-slate-500 font-medium">Janji Temu Aktif</p>
                    <p className="text-2xl font-bold text-slate-800">{appointmentsCount}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                    <Clock className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-slate-500 font-medium">Tagihan Pending</p>
                    <p className="text-2xl font-bold text-slate-800">Rp {pendingRevenue.toLocaleString('id-ID')}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-teal-100 text-teal-600 rounded-lg">
                    <DollarSign className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-slate-500 font-medium">Pendapatan Masuk</p>
                    <p className="text-2xl font-bold text-slate-800">Rp {totalRevenue.toLocaleString('id-ID')}</p>
                </div>
            </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-8 mt-4 border-b border-slate-200 flex gap-6">
        <button 
            onClick={() => setActiveTab('overview')}
            className={`pb-4 text-sm font-medium transition-colors ${activeTab === 'overview' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
            Overview
        </button>
        <button 
            onClick={() => setActiveTab('patients')}
            className={`pb-4 text-sm font-medium transition-colors ${activeTab === 'patients' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
            Rekam Medis Pasien
        </button>
        <button 
            onClick={() => setActiveTab('billing')}
            className={`pb-4 text-sm font-medium transition-colors ${activeTab === 'billing' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
            Keuangan & Billing
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
        
        {/* VIEW: PATIENTS / MEDICAL RECORDS */}
        {(activeTab === 'patients' || activeTab === 'overview') && (
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-red-500" /> 
                        Data Rekam Medis Pasien
                    </h2>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                            <tr>
                                <th className="px-6 py-4">ID Pasien</th>
                                <th className="px-6 py-4">Nama Lengkap</th>
                                <th className="px-6 py-4">Tgl Lahir</th>
                                <th className="px-6 py-4">No. BPJS</th>
                                <th className="px-6 py-4">Riwayat Medis</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(activeTab === 'overview' ? patients.slice(0, 5) : filteredPatients).map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono text-xs">{p.id}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{p.name}</td>
                                    <td className="px-6 py-4">{p.dob}</td>
                                    <td className="px-6 py-4">{p.bpjsNumber}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-2">
                                            {p.history.map((h, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded-full border border-red-100">
                                                    {h}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredPatients.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                        Data pasien tidak ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* VIEW: BILLING */}
        {(activeTab === 'billing' || activeTab === 'overview') && (
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-teal-600" /> 
                        Status Keuangan & Tagihan
                    </h2>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                            <tr>
                                <th className="px-6 py-4">ID Tagihan</th>
                                <th className="px-6 py-4">Nama Pasien</th>
                                <th className="px-6 py-4">Jumlah</th>
                                <th className="px-6 py-4">Asuransi</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(activeTab === 'overview' ? bills.slice(0, 5) : filteredBills).map((b) => (
                                <tr key={b.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono text-xs">{b.id}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{b.patientName}</td>
                                    <td className="px-6 py-4">Rp {b.amount.toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-4">
                                        {b.insuranceCovered ? (
                                            <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                                                <CheckCircle className="w-3 h-3" /> Covered
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs">Pribadi</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                                            b.status === 'Paid' 
                                            ? 'bg-green-50 text-green-700 border-green-200' 
                                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        }`}>
                                            {b.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {b.status === 'Pending' && (
                                            <button 
                                                onClick={() => handlePayBill(b.id)}
                                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors"
                                            >
                                                Proses Bayar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                             {filteredBills.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                                        Data tagihan tidak ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;