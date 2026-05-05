/**
 * SERVICE DE DONNÉES - ADULT CENSUS INCOME (UCI)
 * Ce fichier gère la récupération, le filtrage et les calculs statistiques
 * pour l'examen de Data Visualisation du DIT.
 */

import Papa from 'papaparse';

export interface AdultData {
  age: number;
  workclass: string;
  fnlwgt: number;
  education: string;
  'education-num': number;
  'marital-status': string;
  occupation: string;
  relationship: string;
  race: string;
  sex: string;
  'capital-gain': number;
  'capital-loss': number;
  'hours-per-week': number;
  'native-country': string;
  income: string;
  [key: string]: any;
}

// URL du dataset source (GitHub raw pour éviter les erreurs CORS/Blocking)
const ADULT_DATA_URL = 'https://raw.githubusercontent.com/jbrownlee/Datasets/master/adult-all.csv';

// Headers par défaut si le CSV n'en possède pas (fallback)
const HEADERS = [
  'age', 'workclass', 'fnlwgt', 'education', 'education-num',
  'marital-status', 'occupation', 'relationship', 'race', 'sex',
  'capital-gain', 'capital-loss', 'hours-per-week', 'native-country', 'income'
];

/**
 * Récupère les données depuis la source et effectue un nettoyage complet.
 */
export async function fetchAdultData(): Promise<AdultData[]> {
  try {
    const response = await fetch(ADULT_DATA_URL);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    const csvData = await response.text();
    
    // Détection dynamique des en-têtes
    const firstLine = csvData.split('\n')[0].toLowerCase();
    const hasHeaders = firstLine.includes('age') || firstLine.includes('workclass');

    const results = Papa.parse(csvData, {
      header: hasHeaders,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

    // Uniformisation des données (nettoyage des chaînes et normalisation)
    const data = hasHeaders ? results.data : results.data.map((row: any) => {
      const obj: any = {};
      HEADERS.forEach((header, index) => { obj[header] = row[index]; });
      return obj;
    });

    return (data as any[]).map((row: any) => {
      const cleanObj: any = {};
      Object.keys(row).forEach(key => {
        if (!key) return;
        const normalizedKey = key.trim().toLowerCase().replace(/"/g, '');
        let val = row[key];
        
        // Nettoyage des chaînes (suppression des espaces en trop et points UCI)
        if (typeof val === 'string') {
          val = val.trim().replace(/"/g, '').replace(/\.$/, '');
        }
        
        // Mapping des colonnes cibles (Label/Income)
        let k = normalizedKey;
        if (normalizedKey === 'income' || normalizedKey === 'label' || normalizedKey === 'class' || normalizedKey === 'target') {
          k = 'income';
          // Normalisation des classes binaires
          if (val === '0' || val === '<=50k') val = '<=50K';
          if (val === '1' || val === '>50k') val = '>50K';
        }
        
        cleanObj[k] = val;
      });
      return cleanObj as AdultData;
    });
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    return [];
  }
}

/**
 * Filtre les données selon les sélections de l'utilisateur (Dropdowns & Slider).
 */
export function filterAdultData(
  data: AdultData[],
  filters: {
    sex?: string;
    education?: string;
    ageRange?: [number, number];
  }
): AdultData[] {
  return data.filter((d) => {
    if (filters.sex && d.sex !== filters.sex) return false;
    if (filters.education && d.education !== filters.education) return false;
    if (filters.ageRange && (d.age < filters.ageRange[0] || d.age > filters.ageRange[1])) return false;
    return true;
  });
}

export interface DescriptiveStats {
  count: number;
  mean: number;
  std: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

/**
 * Calcule les indicateurs clés (KPIs).
 */
export function calculateAdultKPIs(data: AdultData[]) {
  if (data.length === 0) return { total: 0, avgAge: 0, highIncomePercent: 0 };

  const total = data.length;
  const avgAge = data.reduce((acc, curr) => acc + (curr.age || 0), 0) / total;
  const highIncomeCount = data.filter(d => d.income === '>50K').length;
  const highIncomePercent = (highIncomeCount / total) * 100;

  return {
    total,
    avgAge: Number(avgAge.toFixed(1)),
    highIncomePercent: Number(highIncomePercent.toFixed(1)),
  };
}

/**
 * Calcule la matrice de corrélation de Pearson pour les colonnes numériques données.
 */
export function calculateCorrelationMatrix(data: AdultData[], columns: string[]): number[][] {
  const n = columns.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  // Extraire les vecteurs de valeurs valides pour chaque colonne
  const vectors: number[][] = columns.map(col =>
    data.map(d => d[col]).filter(v => typeof v === 'number' && !isNaN(v))
  );

  // Limiter au nombre de lignes valides communes (taille minimale)
  const minLen = Math.min(...vectors.map(v => v.length));
  const trimmed = vectors.map(v => v.slice(0, minLen));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
        continue;
      }
      const xi = trimmed[i];
      const xj = trimmed[j];
      const meanI = xi.reduce((a, b) => a + b, 0) / minLen;
      const meanJ = xj.reduce((a, b) => a + b, 0) / minLen;
      let num = 0, denomI = 0, denomJ = 0;
      for (let k = 0; k < minLen; k++) {
        const di = xi[k] - meanI;
        const dj = xj[k] - meanJ;
        num += di * dj;
        denomI += di * di;
        denomJ += dj * dj;
      }
      const denom = Math.sqrt(denomI * denomJ);
      matrix[i][j] = denom === 0 ? 0 : Number((num / denom).toFixed(3));
    }
  }

  return matrix;
}

/**
 * Génère des insights purement statistiques à partir des données filtrées.
 * Aucune IA n'est utilisée : tout est calculé à partir des données.
 */
export function generateStatisticalInsights(
  data: AdultData[],
  kpis: { total: number; avgAge: number; highIncomePercent: number },
  highIncomeByEdu: { edu: string; percent: number; total: number }[]
): string[] {
  if (data.length === 0) return [
    "Aucune donnée disponible pour générer des insights.",
    "Modifiez les filtres pour inclure des individus.",
    "Le dataset est vide avec les paramètres actuels."
  ];

  const insights: string[] = [];

  // Insight 1: Top education for high income
  const topEdu = highIncomeByEdu.filter(e => e.total >= 20).sort((a, b) => b.percent - a.percent);
  if (topEdu.length > 0) {
    insights.push(
      `Le diplôme "${topEdu[0].edu}" présente le taux de hauts revenus le plus élevé (${topEdu[0].percent.toFixed(1)}%), soit ${(topEdu[0].percent / Math.max(kpis.highIncomePercent, 0.1)).toFixed(1)}x la moyenne globale.`
    );
  } else {
    insights.push(`Le taux global de hauts revenus (>50K$) est de ${kpis.highIncomePercent}% sur ${kpis.total} individus.`);
  }

  // Insight 2: Age distribution analysis
  const ages = data.map(d => d.age).filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
  if (ages.length > 0) {
    const medianAge = ages[Math.floor(ages.length / 2)];
    const highIncomeAges = data.filter(d => d.income === '>50K').map(d => d.age).sort((a, b) => a - b);
    const medianHighIncomeAge = highIncomeAges.length > 0 ? highIncomeAges[Math.floor(highIncomeAges.length / 2)] : 0;
    if (medianHighIncomeAge > 0) {
      insights.push(
        `L'âge médian des hauts revenus est ${medianHighIncomeAge} ans contre ${medianAge} ans pour l'ensemble, soit un écart de ${medianHighIncomeAge - medianAge} ans.`
      );
    } else {
      insights.push(`L'âge médian de l'échantillon est ${medianAge} ans (moyenne: ${kpis.avgAge} ans).`);
    }
  }

  // Insight 3: Hours-per-week analysis
  const hoursHigh = data.filter(d => d.income === '>50K').map(d => d['hours-per-week']).filter(v => typeof v === 'number');
  const hoursLow = data.filter(d => d.income === '<=50K').map(d => d['hours-per-week']).filter(v => typeof v === 'number');
  if (hoursHigh.length > 0 && hoursLow.length > 0) {
    const avgHoursHigh = hoursHigh.reduce((a, b) => a + b, 0) / hoursHigh.length;
    const avgHoursLow = hoursLow.reduce((a, b) => a + b, 0) / hoursLow.length;
    const diff = avgHoursHigh - avgHoursLow;
    insights.push(
      `Les hauts revenus travaillent en moyenne ${avgHoursHigh.toFixed(1)}h/sem contre ${avgHoursLow.toFixed(1)}h/sem pour les bas revenus (${diff > 0 ? '+' : ''}${diff.toFixed(1)}h).`
    );
  } else {
    const allHours = data.map(d => d['hours-per-week']).filter(v => typeof v === 'number');
    const avgAll = allHours.length > 0 ? allHours.reduce((a, b) => a + b, 0) / allHours.length : 0;
    insights.push(`Le nombre moyen d'heures travaillées par semaine est ${avgAll.toFixed(1)}h.`);
  }

  // Insight 4: Gender gap analysis
  const males = data.filter(d => d.sex === 'Male');
  const females = data.filter(d => d.sex === 'Female');
  if (males.length > 0 && females.length > 0) {
    const maleHighPct = (males.filter(d => d.income === '>50K').length / males.length) * 100;
    const femaleHighPct = (females.filter(d => d.income === '>50K').length / females.length) * 100;
    insights.push(
      `Écart de revenu par sexe: ${maleHighPct.toFixed(1)}% des hommes gagnent >50K$ contre ${femaleHighPct.toFixed(1)}% des femmes (ratio ${(maleHighPct / Math.max(femaleHighPct, 0.1)).toFixed(1)}x).`
    );
  }

  // Insight 5: Capital gain analysis
  const withCapitalGain = data.filter(d => d['capital-gain'] > 0);
  if (withCapitalGain.length > 0) {
    const pctWithGain = (withCapitalGain.length / data.length) * 100;
    const highIncomeWithGain = withCapitalGain.filter(d => d.income === '>50K').length;
    const highIncomePctWithGain = (highIncomeWithGain / withCapitalGain.length) * 100;
    insights.push(
      `${pctWithGain.toFixed(1)}% des individus ont un gain en capital positif, parmi eux ${highIncomePctWithGain.toFixed(1)}% ont un revenu >50K$.`
    );
  }

  // Insight 6: Education level distribution
  const eduNums = data.map(d => d['education-num']).filter(v => typeof v === 'number' && !isNaN(v));
  if (eduNums.length > 0) {
    const avgEdu = eduNums.reduce((a, b) => a + b, 0) / eduNums.length;
    const highEduNums = data.filter(d => d.income === '>50K').map(d => d['education-num']).filter(v => typeof v === 'number');
    const avgHighEdu = highEduNums.length > 0 ? highEduNums.reduce((a, b) => a + b, 0) / highEduNums.length : 0;
    if (avgHighEdu > 0) {
      insights.push(
        `Le score d'éducation moyen des hauts revenus est ${avgHighEdu.toFixed(1)} contre ${avgEdu.toFixed(1)} pour l'ensemble (+${(avgHighEdu - avgEdu).toFixed(1)} pts).`
      );
    }
  }

  return insights.slice(0, 6);
}

/**
 * Calcule la distribution d'une variable catégorielle.
 */
export function calculateCategoryDistribution(data: AdultData[], column: string): { category: string; count: number; percent: number }[] {
  const counts: Record<string, number> = {};
  data.forEach(d => {
    const val = String(d[column] || 'Unknown').trim();
    counts[val] = (counts[val] || 0) + 1;
  });
  const total = data.length;
  return Object.entries(counts)
    .map(([category, count]) => ({ category, count, percent: total > 0 ? (count / total) * 100 : 0 }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Calcule le coefficient de variation (écart-type / moyenne * 100).
 */
export function calculateCV(data: AdultData[], column: string): number {
  const values = data.map(d => d[column]).filter(v => typeof v === 'number' && !isNaN(v));
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const std = Math.sqrt(values.map(v => Math.pow(v - mean, 2)).reduce((a, b) => a + b, 0) / values.length);
  return Number(((std / mean) * 100).toFixed(2));
}

/**
 * Calcule le taux de hauts revenus par tranche d'âge.
 */
export function calculateIncomeByAgeGroup(data: AdultData[]): { group: string; total: number; highIncome: number; percent: number }[] {
  const groups = [
    { label: '17-25', min: 17, max: 25 },
    { label: '26-35', min: 26, max: 35 },
    { label: '36-45', min: 36, max: 45 },
    { label: '46-55', min: 46, max: 55 },
    { label: '56-65', min: 56, max: 65 },
    { label: '66+', min: 66, max: 200 },
  ];
  return groups.map(g => {
    const subset = data.filter(d => d.age >= g.min && d.age <= g.max);
    const highIncome = subset.filter(d => d.income === '>50K').length;
    return {
      group: g.label,
      total: subset.length,
      highIncome,
      percent: subset.length > 0 ? (highIncome / subset.length) * 100 : 0,
    };
  });
}

/**
 * Calcule les statistiques descriptives pour une colonne donnée.
 */
export function calculateDetailedStats(data: AdultData[], column: string): DescriptiveStats {
  const values = data
    .map(d => d[column])
    .filter(v => typeof v === 'number' && !isNaN(v))
    .sort((a, b) => a - b);
  
  const count = values.length;
  if (count === 0) return { count: 0, mean: 0, std: 0, min: 0, q1: 0, median: 0, q3: 0, max: 0 };

  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / count;
  const squareDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / count;
  const std = Math.sqrt(avgSquareDiff);

  const getPercentile = (p: number) => {
    const pos = (count - 1) * p;
    const base = Math.floor(pos);
    const rest = pos - base;
    return values[base + 1] !== undefined 
      ? values[base] + rest * (values[base + 1] - values[base]) 
      : values[base];
  };

  return {
    count,
    mean: Number(mean.toFixed(2)),
    std: Number(std.toFixed(2)),
    min: values[0],
    q1: Number(getPercentile(0.25).toFixed(2)),
    median: Number(getPercentile(0.5).toFixed(2)),
    q3: Number(getPercentile(0.75).toFixed(2)),
    max: values[count - 1],
  };
}
