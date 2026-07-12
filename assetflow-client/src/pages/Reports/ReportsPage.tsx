import { useState } from 'react';
import { useReportData } from '../../hooks/enterpriseHooks';
import { reportService } from '../../services/reportService';
import { 
  FileText, Download, Printer, ShieldCheck, 
  Layers, Wrench, AlertTriangle, Trash2, Calendar, HelpCircle 
} from 'lucide-react';

export function ReportsPage() {
  const [selectedType, setSelectedType] = useState<string>('utilization');
  const { data, isLoading } = useReportData(selectedType);


  const reportTypes = [
    { type: 'utilization', name: 'Asset Utilization', desc: 'Displays overall asset allocation statuses, current conditions, and total investment costs.', icon: Layers },
    { type: 'maintenance', name: 'Maintenance Cost Analysis', desc: 'Summarizes completed and pending maintenance activities alongside associated cost budgets.', icon: Wrench },
    { type: 'lost', name: 'Lost/Missing Inventory', desc: 'Lists assets classified as lost or missing for insurance adjustment and auditing purposes.', icon: AlertTriangle },
    { type: 'retired', name: 'Retired Assets', desc: 'Tracks decommissioned equipment inventory records and dates.', icon: Trash2 },
    { type: 'warranty', name: 'Warranty Expansions', desc: 'Identifies corporate equipment with warranties expiring within the next 30 days.', icon: Calendar },
    { type: 'idle', name: 'Idle Equipment Alert', desc: 'Scans inventory to isolate assets that have remained completely unallocated for over 90 days.', icon: HelpCircle }
  ];

  const handleExportCSV = async () => {
    try {
      await reportService.downloadReportCSV(selectedType);
    } catch (err) {
      alert('Failed to export CSV report.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 print:bg-white print:p-0">
      {/* Page Title */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-500" />
            Reporting Center & Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Compile inventory registers, maintenance cost records, and audit anomalies.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            <Printer className="h-4.5 w-4.5" />
            Print / PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-750 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-500/10 cursor-pointer"
          >
            <Download className="h-4.5 w-4.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Select Report Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <div className="md:col-span-1 space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Available Reports</span>
          {reportTypes.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedType === item.type;
            return (
              <button
                key={item.type}
                onClick={() => setSelectedType(item.type)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3 cursor-pointer ${
                  isSelected 
                    ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500/30 text-blue-600 dark:text-blue-400' 
                    : 'bg-slate-50/20 dark:bg-slate-900/10 border-transparent hover:border-slate-200 dark:hover:border-slate-800 text-slate-655 dark:text-slate-400'
                }`}
              >
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="text-sm font-bold block">{item.name}</span>
                  <span className="text-[11px] leading-relaxed block mt-0.5 opacity-80">{item.desc}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Report Output preview */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active Report View</span>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {reportTypes.find(r => r.type === selectedType)?.name}
              </h2>
            </div>
            <div className="h-9 w-9 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center border border-blue-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          {/* Grid list details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center gap-3">
                  <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-slate-455">Compiling report data...</span>
                </div>
              ) : data && data.rows?.length > 0 ? (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-bold tracking-wider">
                    <tr>
                      {data.headers.map((h: string, idx: number) => (
                        <th key={idx} className="p-4 pl-6 first:pl-6">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row: any[], rowIdx: number) => (
                      <tr key={rowIdx} className="border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                        {row.map((cell: any, cellIdx: number) => (
                          <td key={cellIdx} className="p-4 pl-6 first:pl-6">
                            {typeof cell === 'number' && selectedType === 'maintenance' && cellIdx === 5 ? `$${cell}` : String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">No records matching report constraints.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Printable Sheet View - only shows on print */}
      <div className="hidden print:block space-y-6">
        <div className="text-center pb-6 border-b border-slate-200">
          <h1 className="text-3xl font-extrabold text-slate-900">{reportTypes.find(r => r.type === selectedType)?.name}</h1>
          <p className="text-sm text-slate-500 mt-1">Generated by AssetFlow ERP | Timestamp: {new Date().toLocaleString()}</p>
        </div>

        {data && data.rows?.length > 0 ? (
          <table className="w-full text-xs text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                {data.headers.map((h: string, idx: number) => (
                  <th key={idx} className="p-3 border border-slate-200 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row: any[], rowIdx: number) => (
                <tr key={rowIdx} className="border-b border-slate-250 text-slate-800">
                  {row.map((cell: any, cellIdx: number) => (
                    <td key={cellIdx} className="p-3 border border-slate-200">
                      {typeof cell === 'number' && selectedType === 'maintenance' && cellIdx === 5 ? `$${cell}` : String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-slate-500 py-10">No report records found.</p>
        )}
      </div>
    </div>
  );
}
