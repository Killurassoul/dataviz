import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Plotly from 'plotly.js-dist-min';
import createPlotComponent from 'react-plotly.js/factory';
const Plot = createPlotComponent(Plotly);
import { 
  Users, 
  GraduationCap, 
  Clock, 
  Search, 
  Filter, 
  ChevronRight, 
  LayoutDashboard, 
  BarChart3, 
  PieChart, 
  Settings, 
  AlertCircle,
  TrendingUp,
  Activity,
  X,
  Info,
  User,
  MapPin,
  Wifi,
  Monitor
} from 'lucide-react';
import { fetchStudentData, filterData, calculateKPIs, calculateDetailedStats, Student } from '../lib/dataService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const KPICard = ({ title, value, subValue, percentage, colorClass }: { title: string, value: string | number, subValue: string, percentage: number, colorClass: string }) => (
  <motion.div 
    whileHover={{ y: -5, border: '1px solid rgba(255,255,255,0.2)' }}
    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-xl group transition-all"
  >
    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">{title}</p>
    <div className="flex items-baseline gap-2">
      <h3 className="text-4xl font-bold italic tracking-tighter text-white">{value}</h3>
      <span className={cn("text-xs font-mono", colorClass === 'bg-cyan-500' ? 'text-emerald-400' : 'text-slate-500')}>{subValue}</span>
    </div>
    <div className="w-full h-1 bg-slate-800 rounded-full mt-4 overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        className={cn("h-full", colorClass)}
        style={{ boxShadow: `0 0 12px ${colorClass.includes('cyan') ? 'rgba(6,182,212,0.5)' : colorClass.includes('purple') ? 'rgba(168,85,247,0.5)' : 'rgba(245,158,11,0.5)'}` }}
      />
    </div>
  </motion.div>
);

const ChartCard = ({ title, children, className }: { title: string, children: React.ReactNode, className?: string }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className={cn("bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col relative overflow-hidden", className)}
  >
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{title}</span>
    <div className="flex-1 min-h-[250px]">
      {children}
    </div>
  </motion.div>
);

const StudentModal = ({ student, onClose }: { student: Student | null, onClose: () => void }) => {
  if (!student) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-[#0f172a] border border-white/10 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="h-32 bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-purple-600/20 p-8 flex items-end relative">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center -mb-10 shadow-lg">
                <User className="w-10 h-10 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-display italic text-white uppercase tracking-tighter">Profil Étudiant</h2>
                <p className="text-zinc-400 text-xs uppercase tracking-widest font-mono">ID S.OS#{Math.floor(1000 + Math.random() * 9000)}</p>
              </div>
            </div>
          </div>

          <div className="p-8 pt-16 grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="p-2 bg-white/5 rounded-lg"><Info className="w-4 h-4 text-cyan-400" /></div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Identité</p>
                  <p className="text-sm font-medium">{student.age} ans • {student.sex === 'M' ? 'Masculin' : 'Féminin'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="p-2 bg-white/5 rounded-lg"><MapPin className="w-4 h-4 text-purple-400" /></div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Origine</p>
                  <p className="text-sm font-medium">{student.address === 'U' ? 'Urbain' : 'Rural'} ({student.school === 'GP' ? 'G. Pereira' : 'M. Silveira'})</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <div className="p-2 bg-white/5 rounded-lg"><Wifi className="w-4 h-4 text-emerald-400" /></div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Status Web</p>
                  <p className="text-sm font-medium">{student.internet === 'yes' ? 'Connecté' : 'Non-connecté'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-3">Score Final (G3)</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-white italic">{student.G3}</span>
                  <span className="text-zinc-500 text-sm mb-1 font-mono">/ 20</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-4">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(student.G3 / 20) * 100}%` }}
                    className="h-full bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-3 rounded-xl text-center border border-white/5">
                  <p className="text-[10px] text-zinc-500 mb-1 uppercase font-bold">Absences</p>
                  <p className="text-xl font-bold text-white font-display">{student.absences}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl text-center border border-white/5">
                  <p className="text-[10px] text-zinc-500 mb-1 uppercase font-bold">Étude</p>
                  <p className="text-xl font-bold text-emerald-400 font-display">{student.studytime}h</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-white/5 flex gap-4 bg-black/20">
            <button className="flex-1 bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-cyan-400 transition-all text-xs tracking-widest uppercase">
              Rapport Statistique
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5 transition-all text-xs tracking-widest uppercase font-bold"
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function Dashboard() {
  const [rawData, setRawData] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Filters state
  const [sexFilter, setSexFilter] = useState<string>('All');
  const [schoolFilter, setSchoolFilter] = useState<string>('All');
  const [ageRange, setAgeRange] = useState<[number, number]>([15, 22]);

  useEffect(() => {
    async function init() {
      try {
        const data = await fetchStudentData();
        setRawData(data);
      } catch (err) {
        setError('Impossible de synchroniser les données');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const filteredData = useMemo(() => {
    return filterData(rawData, {
      sex: sexFilter !== 'All' ? sexFilter as 'F' | 'M' : undefined,
      school: schoolFilter !== 'All' ? schoolFilter : undefined,
      ageRange: ageRange,
    });
  }, [rawData, sexFilter, schoolFilter, ageRange]);

  const kpis = useMemo(() => calculateKPIs(filteredData), [filteredData]);

  const stats = useMemo(() => {
    const columns = ['G1', 'G2', 'G3', 'absences', 'studytime'];
    const results: Record<string, any> = {};
    columns.forEach(col => {
      results[col] = calculateDetailedStats(filteredData, col);
    });
    return results;
  }, [filteredData]);

  const handlePlotClick = (event: any) => {
    if (event.points && event.points[0]) {
      const student = event.points[0].customdata as Student;
      if (student) setSelectedStudent(student);
    }
  };

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#020617]">
      <div className="mesh-gradient-1" />
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full"
      />
      <p className="mt-6 text-slate-500 font-bold tracking-[0.3em] uppercase text-[10px] animate-pulse italic">Engager Réacteur de Données...</p>
    </div>
  );

  const plotTheme = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#94a3b8', family: '"Inter", sans-serif', size: 10 },
    xaxis: { gridcolor: 'rgba(255,255,255,0.05)', zeroline: false, showgrid: true },
    yaxis: { gridcolor: 'rgba(255,255,255,0.05)', zeroline: false, showgrid: true },
    margin: { t: 10, b: 30, l: 30, r: 10 },
  };

  return (
    <div className="fixed inset-0 bg-[#020617] text-slate-100 font-sans overflow-hidden select-none">
      {/* Background Mesh Gradients */}
      <div className="mesh-gradient-1" />
      <div className="mesh-gradient-2" />
      <div className="mesh-gradient-3" />

      <div className="relative h-full flex flex-col">
        {/* Top Navigation Bar */}
        <nav className="h-16 flex items-center justify-between px-8 bg-white/5 backdrop-blur-md border-b border-white/10 z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20 flex items-center justify-center">
              <span className="font-black text-xs text-white italic">S.OS</span>
            </div>
            <h1 className="text-xl font-bold tracking-tighter bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent italic uppercase">Moteur de Performance Étudiante</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Statut Système</span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> FLUX EN DIRECT
              </span>
            </div>
            <div className="w-10 h-10 rounded-full border border-white/20 bg-gradient-to-b from-white/10 to-white/5 flex items-center justify-center shadow-inner cursor-pointer hover:border-cyan-500/40 transition-all">
              <span className="text-xs font-bold">SM</span>
            </div>
          </div>
        </nav>

        <div className="flex-1 flex overflow-hidden p-6 gap-6">
          {/* Sidebar Filters */}
          <aside className="w-64 flex flex-col gap-6">
            <motion.div 
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-8"
            >
              <div>
                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-4 block">Démographie</label>
                <div className="space-y-4">
                  <div className="relative">
                    <select 
                      value={sexFilter} 
                      onChange={(e) => setSexFilter(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-white"
                    >
                      <option value="All">Sexe: Tous</option>
                      <option value="M">Masculin (M)</option>
                      <option value="F">Féminin (F)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-[10px]">▼</div>
                  </div>
                  <div className="relative">
                    <select 
                      value={schoolFilter} 
                      onChange={(e) => setSchoolFilter(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-white"
                    >
                      <option value="All">École: Toutes</option>
                      <option value="GP">Gabriel Pereira</option>
                      <option value="MS">Mousinho da Silveira</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-[10px]">▼</div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-6 block flex justify-between">
                  Âge <span>{ageRange[0]} - {ageRange[1]}</span>
                </label>
                <div className="relative px-2">
                   <input 
                    type="range" 
                    min="15" max="22" 
                    value={ageRange[1]}
                    onChange={(e) => setAgeRange([15, parseInt(e.target.value)])}
                    className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-full cursor-pointer appearance-none"
                  />
                </div>
              </div>

              <div className="mt-auto space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                   <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> État Système
                   </p>
                   <p className="text-[10px] text-slate-400 tracking-tight">Le moteur Nexus est prêt pour l'analyse.</p>
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl hover:bg-cyan-400 transition-colors shadow-lg shadow-white/5 active:scale-95 transition-transform text-xs tracking-widest uppercase font-display"
                >
                  ACTUALISER
                </button>
              </div>
            </motion.div>
          </aside>

          {/* Main Dashboard Area */}
          <main className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
            {/* KPI Row */}
            <div className="grid grid-cols-3 gap-6">
              <KPICard 
                title="Effectif Total" 
                value={kpis.total} 
                subValue="+12%" 
                percentage={66} 
                colorClass="bg-cyan-500" 
              />
              <KPICard 
                title="Moyenne G3" 
                value={kpis.avgG3} 
                subValue="/ 20.00" 
                percentage={(kpis.avgG3 / 20) * 100} 
                colorClass="bg-purple-500" 
              />
              <KPICard 
                title="Étude Hebdomadaire" 
                value={kpis.avgStudyTime} 
                subValue="UNITÉS/W" 
                percentage={(kpis.avgStudyTime / 4) * 100} 
                colorClass="bg-amber-500" 
              />
            </div>

            {/* Descriptive Statistics Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <BarChart3 className="w-32 h-32 text-cyan-500" />
              </div>
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-bold mb-6 flex items-center gap-2">
                <BarChart3 className="w-3 h-3 text-cyan-400" /> Statistiques Descriptives du Cohorte
              </h2>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-[10px] font-mono text-slate-500 uppercase tracking-widest whitespace-nowrap">
                      <th className="px-4 py-2 font-medium">Variable</th>
                      <th className="px-4 py-2 font-medium">Nb</th>
                      <th className="px-4 py-2 font-medium">Moyenne</th>
                      <th className="px-4 py-2 font-medium">Écart-Type</th>
                      <th className="px-4 py-2 font-medium">Min</th>
                      <th className="px-4 py-2 font-medium">25% (Q1)</th>
                      <th className="px-4 py-2 font-medium">Médiane</th>
                      <th className="px-4 py-2 font-medium">75% (Q3)</th>
                      <th className="px-4 py-2 font-medium">Max</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {['G1', 'G2', 'G3', 'absences', 'studytime'].map((col) => (
                      <tr key={col} className="bg-white/[0.02] hover:bg-white/[0.05] transition-colors rounded-xl group">
                        <td className="px-4 py-4 font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {col.toUpperCase()}
                        </td>
                        <td className="px-4 py-4 font-mono text-slate-400 italic">{stats[col].count}</td>
                        <td className="px-4 py-4 text-emerald-400 font-bold">{stats[col].mean}</td>
                        <td className="px-4 py-4 text-slate-400">{stats[col].std}</td>
                        <td className="px-4 py-4 text-slate-400">{stats[col].min}</td>
                        <td className="px-4 py-4 text-slate-400">{stats[col].q1}</td>
                        <td className="px-4 py-4 text-purple-400 font-medium">{stats[col].median}</td>
                        <td className="px-4 py-4 text-slate-400">{stats[col].q3}</td>
                        <td className="px-4 py-4 text-orange-400 font-bold">{stats[col].max}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Charts Grid */}
            <div className="flex-1 grid grid-cols-2 gap-6 min-h-[800px]">
              {/* G3 Distribution */}
              <ChartCard title="Répartition des Notes (G3)">
                <Plot
                  data={[{
                    x: filteredData.map(s => s.G3),
                    type: 'histogram',
                    marker: {
                      color: 'rgba(6, 182, 212, 0.4)',
                      line: { color: 'rgba(6, 182, 212, 1)', width: 1.5 }
                    },
                    nbinsx: 20,
                  } as any]}
                  layout={{
                    ...plotTheme,
                    autosize: true,
                    xaxis: { ...plotTheme.xaxis, title: { text: 'Note Finale' } },
                    yaxis: { ...plotTheme.yaxis, title: { text: 'Effectif' } },
                  }}
                  config={{ responsive: true, displayModeBar: false }}
                  className="w-full h-full"
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                />
              </ChartCard>
              
              {/* Study Time vs G3 Scatter */}
              <ChartCard title="Étude vs Grade (Cliquez pour Détails)">
                <Plot
                  data={[{
                    x: filteredData.map(s => s.studytime),
                    y: filteredData.map(s => s.G3),
                    customdata: filteredData,
                    mode: 'markers',
                    type: 'scatter',
                    marker: {
                      size: 10,
                      color: filteredData.map(s => s.G3),
                      colorscale: 'Cyanmono',
                      opacity: 0.7,
                      line: { width: 1, color: 'rgba(255,255,255,0.2)' }
                    },
                  }]}
                  layout={{
                    ...plotTheme,
                    autosize: true,
                    xaxis: { ...plotTheme.xaxis, title: { text: 'Temps d\'Étude' } },
                    yaxis: { ...plotTheme.yaxis, title: { text: 'Note Finale' } },
                    hovermode: 'closest'
                  }}
                  onClick={handlePlotClick}
                  config={{ responsive: true, displayModeBar: false }}
                  className="w-full h-full"
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                />
              </ChartCard>

              {/* Gender Performance Distribution */}
              <ChartCard title="Distribution G3 par Sexe">
                <Plot
                  data={[
                    {
                      y: filteredData.filter(s => s.sex === 'F').map(s => s.G3),
                      customdata: filteredData.filter(s => s.sex === 'F'),
                      type: 'box',
                      name: 'Féminin',
                      marker: { color: '#f472b6' },
                      boxpoints: 'all',
                      jitter: 0.3,
                      pointpos: -1.8
                    },
                    {
                      y: filteredData.filter(s => s.sex === 'M').map(s => s.G3),
                      customdata: filteredData.filter(s => s.sex === 'M'),
                      type: 'box',
                      name: 'Masculin',
                      marker: { color: '#60a5fa' },
                      boxpoints: 'all',
                      jitter: 0.3,
                      pointpos: -1.8
                    }
                  ]}
                  layout={{
                    ...plotTheme,
                    autosize: true,
                    showlegend: false,
                    yaxis: { ...plotTheme.yaxis, title: { text: 'Note Finale (G3)' } },
                  }}
                  onClick={handlePlotClick}
                  config={{ responsive: true, displayModeBar: false }}
                  className="w-full h-full"
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                />
              </ChartCard>

              {/* Correlation Heatmap */}
              <ChartCard title="Matrice de Corrélation des Variables">
                <Plot
                  data={[{
                    z: [
                      [1, 0.8, -0.1, 0.2],
                      [0.8, 1, -0.05, 0.15],
                      [-0.1, -0.05, 1, 0.3],
                      [0.2, 0.15, 0.3, 1]
                    ],
                    x: ['G3', 'G2', 'Absences', 'Étude'],
                    y: ['G3', 'G2', 'Absences', 'Étude'],
                    type: 'heatmap',
                    colorscale: [
                      [0, '#0f172a'],
                      [1, '#06b6d4']
                    ],
                    showscale: false
                  }]}
                  layout={{
                    ...plotTheme,
                    autosize: true,
                  }}
                  config={{ responsive: true, displayModeBar: false }}
                  className="w-full h-full"
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                />
              </ChartCard>

              {/* Absences vs G3 */}
              <ChartCard title="Impact des Absences (Cliquez pour Détails)">
                <Plot
                  data={[{
                    x: filteredData.map(s => s.absences),
                    y: filteredData.map(s => s.G3),
                    customdata: filteredData,
                    mode: 'markers',
                    type: 'scatter',
                    marker: {
                      size: 8,
                      color: '#8b5cf6',
                      opacity: 0.5,
                      line: { width: 1, color: '#06b6d4' }
                    }
                  }]}
                  layout={{
                    ...plotTheme,
                    autosize: true,
                    xaxis: { ...plotTheme.xaxis, title: { text: 'Absences Totales' } },
                    yaxis: { ...plotTheme.yaxis, title: { text: 'Statut Académique' } },
                    hovermode: 'closest'
                  }}
                  onClick={handlePlotClick}
                  config={{ responsive: true, displayModeBar: false }}
                  className="w-full h-full"
                  useResizeHandler
                  style={{ width: '100%', height: '100%' }}
                />
              </ChartCard>
            </div>
          </main>
        </div>

        {/* Global Footer */}
        <footer className="h-12 px-8 flex items-center justify-between z-20">
          <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent absolute top-0 left-0 right-0" />
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 group cursor-help">
              <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-[0.2em] group-hover:text-cyan-400 transition-colors">Nexus Core v9.4.2</span>
            </div>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="flex items-center gap-4 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              <span>Source: UCI ML</span>
              <span className="text-white/20">/</span>
              <span>Dataset: student-mat.csv</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-1.5 rounded-full shadow-lg transition-transform hover:scale-105">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">System Health</span>
            <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <motion.div 
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
                  className="w-1 h-3 bg-emerald-500/60 rounded-full"
                />
              ))}
            </div>
          </div>
        </footer>
      </div>

      <StudentModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </div>
  );
}

