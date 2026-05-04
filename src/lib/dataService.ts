import Papa from 'papaparse';

export interface Student {
  school: string;
  sex: 'F' | 'M';
  age: number;
  address: 'U' | 'R';
  famsize: 'LE3' | 'GT3';
  Pstatus: 'T' | 'A';
  Medu: number;
  Fedu: number;
  studytime: number;
  failures: number;
  schoolsup: 'yes' | 'no';
  famsup: 'yes' | 'no';
  paid: 'yes' | 'no';
  activities: 'yes' | 'no';
  nursery: 'yes' | 'no';
  higher: 'yes' | 'no';
  internet: 'yes' | 'no';
  romantic: 'yes' | 'no';
  famrel: number;
  freetime: number;
  goout: number;
  Dalc: number;
  Walc: number;
  health: number;
  absences: number;
  G1: number;
  G2: number;
  G3: number;
  [key: string]: any;
}

const DATA_URL = 'https://raw.githubusercontent.com/jbrownlee/Datasets/master/student-mat.csv';

export async function fetchStudentData(): Promise<Student[]> {
  try {
    const response = await fetch(DATA_URL);
    const csvData = await response.text();
    
    // The dataset might use ',' or ';'. Papaparse handles it, but let's be safe.
    const results = Papa.parse(csvData, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });

    return results.data as Student[];
  } catch (error) {
    console.error('Error fetching student data:', error);
    return [];
  }
}

export function filterData(
  data: Student[],
  filters: {
    sex?: string;
    school?: string;
    ageRange?: [number, number];
  }
): Student[] {
  return data.filter((s) => {
    if (filters.sex && s.sex !== filters.sex) return false;
    if (filters.school && s.school !== filters.school) return false;
    if (filters.ageRange && (s.age < filters.ageRange[0] || s.age > filters.ageRange[1])) return false;
    return true;
  });
}

export function calculateKPIs(data: Student[]) {
  if (data.length === 0) return { total: 0, avgG3: 0, avgStudyTime: 0 };

  const total = data.length;
  const avgG3 = data.reduce((acc, curr) => acc + curr.G3, 0) / total;
  const avgStudyTime = data.reduce((acc, curr) => acc + curr.studytime, 0) / total;

  return {
    total,
    avgG3: Number(avgG3.toFixed(2)),
    avgStudyTime: Number(avgStudyTime.toFixed(2)),
  };
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

export function calculateDetailedStats(data: Student[], column: string): DescriptiveStats {
  const values = data.map(s => s[column]).filter(v => typeof v === 'number').sort((a, b) => a - b);
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
    if (values[base + 1] !== undefined) {
      return values[base] + rest * (values[base + 1] - values[base]);
    } else {
      return values[base];
    }
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
