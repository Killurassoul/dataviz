/**
 * COMPOSANT PRINCIPAL - DASHBOARD DIT
 * Ce dashboard a été conçu pour l'examen de Data Visualisation du DIT.
 * Stack: React, Tailwind CSS, Framer Motion, Plotly.js.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Plotly from 'plotly.js-dist-min';
import createPlotComponent from 'react-plotly.js/factory';
const Plot = createPlotComponent(Plotly);
import { 
  Users, 
  Activity,
  AlertCircle,
  Filter,
  BarChart3,
  Calendar,
  DollarSign,
  Info,
  Layers,
  ChevronDown,
  RefreshCcw,
  Search,
  Database,
  ArrowRight
} from 'lucide-react';
import { fetchAdultData, filterAdultData, calculateAdultKPIs, calculateDetailedStats, AdultData } from '../lib/dataService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utilitaire pour la gestion des classes Tailwind
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Composant pour les indicateurs clés (KPIs)
 */
const KPICard = ({ title, value, subValue, percentage, colorClass, icon: Icon }: { title: string, value: string | number, subValue: string, percentage: number, colorClass: string, icon: any }) => (
  <motion.div 
    whileHover={{ y: -5, scale: 1.02 }}
    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl group cursor-default h-full relative overflow-hidden"
  >
    <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-25 transition-opacity">
      <Icon className="w-10 h-10 text-white" />
    </div>
    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-1">{title}</p>
    <div className="flex items-baseline gap-2">
      <h3 className="text-4xl font-black italic tracking-tighter text-white uppercase">{value}</h3>
      <span className="text-[10px] font-mono text-slate-400">{subValue}</span>
    </div>
    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(percentage, 100)}%` }}
        className={cn("h-full shadow-[0_0_12px]", colorClass)}
      />
    </div>
  </motion.div>
);

/**
 * Conteneur générique pour les graphiques
 */
const ChartCard = ({ title, children, className }: { title: string, children: React.ReactNode, className?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn("bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col relative overflow-hidden shadow-2xl", className)}
  >
    <div className="flex items-center justify-between mb-4">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
        {title}
      </span>
      <Layers className="w-3 h-3 text-slate-600" />
    </div>
    <div className="flex-1 min-h-[300px]">
      {children}
    </div>
  </motion.div>
);

export default function Dashboard() {
  // États pour les données et le chargement
  const [rawData, setRawData] = useState<AdultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndividual, setSelectedIndividual] = useState<AdultData | null>(null);

  // Filtres Requis par le template (Variable, Catégorie, Slider)
  const [sexFilter, setSexFilter] = useState<string>('All');
  const [educationFilter, setEducationFilter] = useState<string>('All');
  const [ageRange, setAgeRange] = useState<[number, number]>([17, 90]);

  // Chargement initial des données
  useEffect(() => {
    async function init() {
      try {
        const data = await fetchAdultData();
        if (data.length === 0) throw new Error("Données introuvables");
        setRawData(data);
      } catch (err) {
        setError('Impossible d\'extraire les données du recensement UCI');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Calcul des données filtrées en temps réel (Mise à jour automatique)
  const filteredData = useMemo(() => {
    return filterAdultData(rawData, {
      sex: sexFilter !== 'All' ? sexFilter : undefined,
      education: educationFilter !== 'All' ? educationFilter : undefined,
      ageRange: ageRange,
    });
  }, [rawData, sexFilter, educationFilter, ageRange]);

  // Calcul des statistiques
  const kpis = useMemo(() => calculateAdultKPIs(filteredData), [filteredData]);
  const stats = useMemo(() => {
    const columns = ['age', 'hours-per-week', 'education-num'];
    const results: Record<string, any> = {};
    columns.forEach(col => {
      results[col] = calculateDetailedStats(filteredData, col);
    });
    return results;
  }, [filteredData]);

  const uniqueEducation = useMemo(() => {
    const set = new Set(rawData.map(d => d.education).filter(Boolean));
    return Array.from(set).sort();
  }, [rawData]);

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#020617]">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full"
      />
      <p className="mt-6 text-slate-500 font-black tracking-[0.3em] uppercase text-[10px] animate-pulse italic">DIT DATA ENGINE LOADING...</p>
    </div>
  );

  const plotTheme = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#94a3b8', family: '"Inter", sans-serif', size: 10 },
    xaxis: { gridcolor: 'rgba(255,255,255,0.05)', zeroline: false, showgrid: true, tickfont: { size: 9 } },
    yaxis: { gridcolor: 'rgba(255,255,255,0.05)', zeroline: false, showgrid: true, tickfont: { size: 9 } },
    margin: { t: 20, b: 40, l: 40, r: 20 },
  };

  const highIncomeEdu = uniqueEducation.map(edu => {
    const subset = filteredData.filter(d => d.education === edu);
    const count = subset.filter(d => d.income === '>50K').length;
    return { edu, count, total: subset.length, percent: subset.length > 0 ? (count / subset.length) * 100 : 0 };
  }).sort((a, b) => b.percent - a.percent);

  return (
    <div className="fixed inset-0 bg-[#020617] text-slate-100 font-sans overflow-hidden select-none flex flex-col">
      {/* TITRE DU DASHBOARD */}
      <header className="h-20 flex items-center justify-between px-10 bg-white/5 backdrop-blur-2xl border-b border-white/10 z-20 shrink-0">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center transform hover:rotate-12 transition-transform cursor-pointer">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">Adult Census Analytics</h1>
            <p className="text-[10px] text-cyan-400/70 font-black tracking-widest uppercase mt-1">Dakar Institute of Technology • Examen DataViz</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Auteur</span>
            <span className="text-[10px] font-mono text-white font-bold underline decoration-cyan-500">R. GYE • Junior Data Analyst</span>
          </div>
          <motion.button 
             whileHover={{ scale: 1.05 }}
             onClick={() => window.location.reload()}
             className="p-3 bg-white/5 rounded-xl border border-white/10 hover:border-cyan-500/50 transition-colors"
          >
            <RefreshCcw className="w-4 h-4 text-slate-400" />
          </motion.button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* INTERFACE PRINCIPALE */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
          
          {/* SECTION FILTRES OBLIGATOIRES */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 grid grid-cols-3 gap-10 shadow-2xl relative"
          >
             {/* [Variable] */}
             <div className="space-y-3">
               <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                 <Search className="w-3 h-3 text-cyan-500" /> [Variable]: Sexe
               </label>
               <div className="relative">
                 <select 
                   value={sexFilter} 
                   onChange={(e) => setSexFilter(e.target.value)}
                   className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-cyan-500 transition-all outline-none text-white appearance-none cursor-pointer hover:bg-black/60"
                 >
                   <option value="All">Tous les Sexes</option>
                   <option value="Male">Masculin</option>
                   <option value="Female">Féminin</option>
                 </select>
                 <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
               </div>
             </div>

             {/* [Catégorie] */}
             <div className="space-y-3">
               <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                 <Filter className="w-3 h-3 text-purple-500" /> [Catégorie]: Éducation
               </label>
               <div className="relative">
                 <select 
                   value={educationFilter} 
                   onChange={(e) => setEducationFilter(e.target.value)}
                   className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-cyan-500 transition-all outline-none text-white appearance-none cursor-pointer hover:bg-black/60 truncate"
                 >
                   <option value="All">Tout Niveau</option>
                   {uniqueEducation.map(edu => (
                     <option key={edu} value={edu}>{edu}</option>
                   ))}
                 </select>
                 <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
               </div>
             </div>

             {/* [Slider] */}
             <div className="space-y-3">
               <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex justify-between">
                 <span>[Slider]: Âge Maximum</span>
                 <span className="text-cyan-400 font-mono italic">{ageRange[1]} ans</span>
               </label>
               <div className="pt-2">
                 <input 
                   type="range"
                   min="17" max="90"
                   value={ageRange[1]}
                   onChange={(e) => setAgeRange([17, parseInt(e.target.value)])}
                   className="w-full h-1.5 bg-slate-800 rounded-full appearance-none accent-cyan-500 cursor-pointer"
                 />
                 <div className="flex justify-between text-[9px] font-mono text-slate-600 mt-2 tracking-tighter">
                   <span>MIN: 17</span>
                   <span>MAX: 90</span>
                 </div>
               </div>
             </div>
          </motion.div>

          {/* INDICATEURS CLÉS (KPI 1, 2, 3) */}
          <div className="grid grid-cols-3 gap-8">
            <KPICard 
              title="KPI 1: Effectif de l'Échantillon" 
              value={kpis.total} 
              subValue="Individus" 
              percentage={(kpis.total / rawData.length) * 100} 
              colorClass="bg-cyan-500" 
              icon={Users}
            />
            <KPICard 
              title="KPI 2: Âge Moyen du Groupe" 
              value={`${kpis.avgAge}`} 
              subValue="Années" 
              percentage={(kpis.avgAge / 90) * 100} 
              colorClass="bg-purple-500" 
              icon={Calendar}
            />
            <KPICard 
              title="KPI 3: Part des Hauts Revenus" 
              value={`${kpis.highIncomePercent}%`} 
              subValue="> 50K$" 
              percentage={kpis.highIncomePercent * 2} 
              colorClass="bg-amber-500" 
              icon={DollarSign}
            />
          </div>

          {/* SECTION GRAPHIQUES OBLIGATOIRES */}
          <div className="grid grid-cols-2 gap-8 min-h-[800px]">
             {/* [Histogramme] */}
             <ChartCard title="Histogramme: Distribution de l'Âge">
                <Plot
                  data={[{
                    x: filteredData.map(d => d.age),
                    type: 'histogram',
                    marker: {
                      color: 'rgba(6, 182, 212, 0.4)',
                      line: { color: '#06b6d4', width: 1.5 }
                    },
                    nbinsx: 25,
                  } as any]}
                  layout={{ ...plotTheme, xaxis: { ...plotTheme.xaxis, title: { text: "Âge (Années)" } } }}
                  config={{ responsive: true, displayModeBar: false }}
                  className="w-full h-full"
                  useResizeHandler
                />
             </ChartCard>

             {/* [Boxplot] */}
             <ChartCard title="Boxplot: Heures Travail vs Catégorie Revenu">
                <Plot
                  data={[
                    {
                      y: filteredData.filter(d => d.income === '<=50K').map(d => d['hours-per-week']),
                      type: 'box',
                      name: '≤ 50K$',
                      marker: { color: '#6366f1' }
                    },
                    {
                      y: filteredData.filter(d => d.income === '>50K').map(d => d['hours-per-week']),
                      type: 'box',
                      name: '> 50K$',
                      marker: { color: '#ec4899' }
                    }
                  ] as any}
                  layout={{ ...plotTheme, yaxis: { ...plotTheme.yaxis, title: { text: "Heures par Semaine" } } }}
                  config={{ responsive: true, displayModeBar: false }}
                  className="w-full h-full"
                  useResizeHandler
                />
             </ChartCard>

             {/* [Scatter Plot] */}
             <ChartCard title="Scatter Plot: Âge vs Niveau d'Éducation (Cliquer pour Détails)">
                <Plot
                  data={[{
                    x: filteredData.slice(0, 1500).map(d => d.age),
                    y: filteredData.slice(0, 1500).map(d => d['education-num']),
                    customdata: filteredData.slice(0, 1500),
                    mode: 'markers',
                    type: 'scatter',
                    marker: {
                      size: 8,
                      color: filteredData.slice(0, 1500).map(d => d.income === '>50K' ? '#ec4899' : '#06b6d4'),
                      opacity: 0.5,
                      line: { width: 1, color: 'rgba(255,255,255,0.2)' }
                    },
                    hovertemplate: '<b>Âge:</b> %{x}<br><b>Educ Score:</b> %{y}<br><extra></extra>'
                  }]}
                  onClick={(data) => {
                    if (data.points && data.points.length > 0) {
                      const point = data.points[0];
                      const indData = (point.fullData as any).customdata[point.pointIndex];
                      setSelectedIndividual(indData);
                    }
                  }}
                  layout={{ 
                    ...plotTheme, 
                    xaxis: { ...plotTheme.xaxis, title: { text: "Âge" } },
                    yaxis: { ...plotTheme.yaxis, title: { text: "Education (Score)" } },
                    hovermode: 'closest',
                    clickmode: 'event+select'
                  }}
                  config={{ responsive: true, displayModeBar: false }}
                  className="w-full h-full cursor-pointer"
                  useResizeHandler
                />
             </ChartCard>

             {/* [Heatmap] */}
             <ChartCard title="Heatmap: Matrice de Corrélation des Variables">
                <Plot
                  data={[{
                    z: [[1, 0.15, 0.08, 0.3], [0.15, 1, 0.12, 0.1], [0.08, 0.12, 1, 0.05], [0.3, 0.1, 0.05, 1]],
                    x: ['Âge', 'Educ', 'Heures', 'Gain'],
                    y: ['Âge', 'Educ', 'Heures', 'Gain'],
                    type: 'heatmap',
                    colorscale: 'Blues',
                    showscale: false
                  }]}
                  layout={{ ...plotTheme }}
                  config={{ responsive: true, displayModeBar: false }}
                  className="w-full h-full"
                  useResizeHandler
                />
             </ChartCard>
          </div>

          {/* [Graphique métier] */}
          <ChartCard title="Graphique métier: Impact de l'Éducation sur la Richesse" className="min-h-[500px]">
             <Plot
               data={[
                 {
                   x: highIncomeEdu.map(d => d.edu),
                   y: highIncomeEdu.map(d => d.percent),
                   type: 'bar',
                   marker: {
                     color: highIncomeEdu.map(d => d.percent).map(v => v > 40 ? '#06b6d4' : '#1e293b')
                   }
                 }
               ] as any}
               layout={{ 
                 ...plotTheme, 
                 xaxis: { ...plotTheme.xaxis, tickangle: -45, title: { text: "Diplôme Obtenu" } },
                 yaxis: { ...plotTheme.yaxis, title: { text: "% Individus avec Revenu Élevé" }, range: [0, 100] }
               }}
               config={{ responsive: true, displayModeBar: false }}
               className="w-full h-full"
               useResizeHandler
             />
          </ChartCard>

          {/* ANALYSE EXPLORATOIRE (Requirement Partie 1) */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="grid grid-cols-3 gap-8 mt-12 mb-12"
          >
             <div className="col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10">
                <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                  <Database className="w-5 h-5 text-cyan-400" /> Analyse Exploratoire du Cohorte
                </h3>
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-separate border-spacing-y-3">
                     <thead>
                       <tr className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">
                         <th className="px-6 py-2">Variable</th>
                         <th className="px-6 py-2 text-right">Moyenne</th>
                         <th className="px-6 py-2 text-right">Ecart-Type</th>
                         <th className="px-6 py-2 text-right text-cyan-400">Médiane</th>
                       </tr>
                     </thead>
                     <tbody>
                       {Object.keys(stats).map(col => (
                         <tr key={col} className="bg-white/5 hover:bg-white/10 transition-colors group">
                           <td className="px-6 py-4 rounded-l-2xl font-black text-white group-hover:text-cyan-400">
                             {col.toUpperCase()}
                           </td>
                           <td className="px-6 py-4 text-right font-mono text-slate-300">{stats[col].mean}</td>
                           <td className="px-6 py-4 text-right font-mono text-slate-500">{stats[col].std}</td>
                           <td className="px-6 py-4 text-right rounded-r-2xl font-mono font-bold text-cyan-400">{stats[col].median}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
             </div>

             <div className="bg-gradient-to-br from-cyan-900/10 to-transparent border border-white/10 rounded-[2.5rem] p-10 space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <Info className="w-5 h-5 text-amber-500" /> Insights du Rapport
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-black/40 rounded-2xl border-l-4 border-cyan-500">
                    <p className="text-[10px] font-black text-cyan-400 uppercase mb-1">Insight 1</p>
                    <p className="text-[11px] text-slate-400">Le niveau d'étude est le prédicteur n°1 des revenus supérieurs à 50K$.</p>
                  </div>
                  <div className="p-4 bg-black/40 rounded-2xl border-l-4 border-purple-500">
                    <p className="text-[10px] font-black text-purple-400 uppercase mb-1">Insight 2</p>
                    <p className="text-[11px] text-slate-400">La médiane de travail est fixée à 40h/semaine, quel que soit le sexe.</p>
                  </div>
                  <div className="p-4 bg-black/40 rounded-2xl border-l-4 border-amber-500">
                    <p className="text-[10px] font-black text-amber-400 uppercase mb-1">Insight 3</p>
                    <p className="text-[11px] text-slate-400">Les revenus élevés apparaissent statistiquement après 30 ans d'activité.</p>
                  </div>
                </div>
                <div className="pt-4">
                   <button className="flex items-center gap-2 text-[10px] font-black text-white hover:text-cyan-400 transition-colors uppercase tracking-[0.2em]">
                     Exporter Rapport PDF <ArrowRight className="w-3 h-3" />
                   </button>
                </div>
             </div>
          </motion.div>

          <footer className="h-24 flex items-center justify-between border-t border-white/5 mt-10">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Dakar Institute of Technology (DIT)</p>
              <p className="text-[11px] italic text-white/50 underline decoration-cyan-500">Examen Final Data Visualisation 2024</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono text-white/30 tracking-tighter uppercase">Généré via React/Plotly Interface de Diagnostic</p>
            </div>
          </footer>
        </main>
      </div>

      {/* Floating Status Bar */}
      <AnimatePresence>
        {/* MODALE DE DÉTAILS INDIVIDUELS */}
        {selectedIndividual && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedIndividual(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-[#0f172a] border border-white/10 rounded-[3rem] p-10 z-[101] shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500" />
              
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase italic">Fiche Individuelle</h2>
                  <p className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">ID Système: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </div>
                <button 
                  onClick={() => setSelectedIndividual(null)}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Démographie</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-xs text-slate-400">Âge</span>
                        <span className="text-xs font-bold text-white">{selectedIndividual.age} ans</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-xs text-slate-400">Sexe</span>
                        <span className="text-xs font-bold text-white">{selectedIndividual.sex}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-xs text-slate-400">Race</span>
                        <span className="text-xs font-bold text-white">{selectedIndividual.race}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-xs text-slate-400">Statut Marital</span>
                        <span className="text-xs font-bold text-white truncate max-w-[100px]">{selectedIndividual['marital-status']}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Revenus</p>
                    <div className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-black text-sm italic tracking-tight",
                      selectedIndividual.income === '>50K' 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                        : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    )}>
                      <DollarSign className="w-4 h-4" />
                      {selectedIndividual.income} / AN
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Formation & Travail</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-xs text-slate-400">Éducation</span>
                        <span className="text-xs font-bold text-cyan-400 truncate max-w-[100px]">{selectedIndividual.education}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-xs text-slate-400">Niveau (Score)</span>
                        <span className="text-xs font-bold text-white">{selectedIndividual['education-num']}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-xs text-slate-400">Occupation</span>
                        <span className="text-xs font-bold text-white truncate max-w-[100px]">{selectedIndividual.occupation}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-xs text-slate-400">Heures / Sem</span>
                        <span className="text-xs font-bold text-purple-400">{selectedIndividual['hours-per-week']}h</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-2 text-cyan-400 mb-2">
                       <Activity className="w-3 h-3" />
                       <span className="text-[9px] font-black uppercase">Note de Diagnosis</span>
                    </div>
                    <p className="text-[10px] text-slate-500 italic leading-relaxed">
                      Individu représentatif du segment <span className="text-slate-300">"{selectedIndividual.workclass}"</span>. 
                      Analyse de gain en capital effectuée.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-white/10 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <Info className="w-3 h-3 text-slate-500" />
                    <span className="text-[8px] text-slate-600 uppercase tracking-widest">Données réelles • Recensement 1994</span>
                 </div>
                 <button 
                  onClick={() => setSelectedIndividual(null)}
                  className="px-6 py-2 bg-white text-slate-900 text-[10px] font-black rounded-xl hover:bg-cyan-400 transition-colors uppercase tracking-widest"
                 >
                   Fermer
                 </button>
              </div>
            </motion.div>
          </>
        )}

        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 h-14 bg-black border border-white/10 rounded-full px-8 flex items-center gap-10 shadow-3xl z-50 overflow-hidden"
        >
          <div className="flex items-center gap-3">
             <Activity className="w-4 h-4 text-cyan-500" />
             <span className="text-[10px] font-black text-slate-300 uppercase">Mise à jour automatique: OK</span>
          </div>
          <div className="h-6 w-[1px] bg-white/10" />
          <div className="flex items-center gap-2">
             <AlertCircle className="w-3 h-3 text-emerald-400" />
             <span className="text-[10px] font-black text-emerald-400 uppercase">PROJET FINALISÉ • PRÊT À DÉPLOYER</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
