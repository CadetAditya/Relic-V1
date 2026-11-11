import React from 'react';
import { AlertTriangle, Search, Filter } from 'lucide-react';

export default function ComplaintsList() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-mono">
              CYBERCRIME COMPLAINTS EXPLORER
            </h2>
            <p className="text-xs font-mono text-slate-400">
              Module skeleton ready — we will build the search table, pagination, and filter controls next.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center">
        <div className="max-w-md mx-auto space-y-2 text-slate-500 font-mono text-xs">
          <Search className="w-8 h-8 mx-auto text-slate-600" />
          <div className="font-bold text-slate-300">Complaints Table Skeleton</div>
          <div>Placeholder for searchable cybercrime complaint database.</div>
        </div>
      </div>
    </div>
  );
}
