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
