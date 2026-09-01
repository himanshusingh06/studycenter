import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, ShieldCheck, User } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

const StudentIDCard = ({ student }) => {
  if (!student) return null;

  const handlePrint = () => {
    window.print();
  };

  const studentFullName = `${student.first_name} ${student.last_name}`;

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex justify-end no-print">
        <button
          onClick={handlePrint}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-brand-600/20 transition-all"
        >
          <Printer className="h-4 w-4" />
          <span>Print / Save ID Card</span>
        </button>
      </div>

      {/* Printable ID Card Badge Container */}
      <div className="printable-area flex justify-center">
        <div className="w-[340px] bg-slate-900 border-2 border-brand-500/40 rounded-2xl overflow-hidden shadow-2xl relative text-slate-100 font-sans">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 p-4 text-center text-white relative">
            <div className="flex items-center justify-center space-x-2.5 mb-1">
              <img src="/buddha-logo.png" alt="Buddha Library" className="h-8 w-8 object-contain rounded-full ring-2 ring-white/60 bg-white/10" />
              <h2 className="font-extrabold text-base tracking-wide uppercase">Buddha Library</h2>
            </div>
            <p className="text-[10px] text-amber-100 uppercase tracking-widest font-semibold">A Unit of Flair Foundation</p>
            <p className="text-[9px] text-amber-200 font-serif italic">बुद्धम शरणम् गच्छामि। • Student Pass</p>
          </div>

          {/* Body Info */}
          <div className="p-5 flex flex-col items-center text-center space-y-4">
            {/* Student Photo */}
            <div className="relative">
              {student.photo_url ? (
                <img
                  src={student.photo_url}
                  alt={studentFullName}
                  className="w-28 h-32 rounded-xl object-cover border-2 border-brand-400/50 shadow-md"
                />
              ) : (
                <div className="w-28 h-32 rounded-xl bg-slate-800 border-2 border-slate-700 flex flex-col items-center justify-center text-slate-500">
                  <User className="h-10 w-10 mb-1" />
                  <span className="text-[10px]">No Photo</span>
                </div>
              )}
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2">
                <StatusBadge status={student.status} />
              </div>
            </div>

            {/* Student Name & ID */}
            <div className="pt-1">
              <h3 className="text-lg font-bold text-white leading-tight">{studentFullName}</h3>
              <div className="inline-block mt-1 px-3 py-1 bg-brand-500/10 border border-brand-500/30 rounded-lg text-brand-300 font-mono text-sm font-bold tracking-wider">
                {student.student_id}
              </div>
            </div>

            {/* Grid Metadata */}
            <div className="w-full grid grid-cols-2 gap-2 text-left text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Course / Exam</span>
                <span className="text-slate-200 font-medium truncate block">{student.course || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Seat Number</span>
                <span className="text-brand-400 font-bold block">{student.seat_number || 'General Desk'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Enrolled On</span>
                <span className="text-slate-300 font-medium block">{student.enrollment_date}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Mobile</span>
                <span className="text-slate-300 font-medium block">{student.mobile}</span>
              </div>
            </div>

            {/* QR Code */}
            <div className="p-2 bg-white rounded-xl shadow-inner border border-slate-200">
              <QRCodeSVG value={student.student_id} size={90} level="H" />
            </div>
            <p className="text-[10px] text-slate-500">Scan at front desk for instant attendance check-in</p>
          </div>

          {/* Footer Bar */}
          <div className="bg-slate-950 px-4 py-2 border-t border-slate-800/80 text-center text-[9px] text-slate-500">
            Property of Buddha Library (A Unit of Flair Foundation) • Non-Transferable Card
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentIDCard;
