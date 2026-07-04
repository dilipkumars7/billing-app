export interface DashboardWelcome {
  userName: string;
  companyName: string;
  greeting: string;
  currentDate: string;
}

export interface KpiCard {
  id: string;
  label: string;
  value: string;
  trend: number;
  icon: string;
  color: string;
  bgColor: string;
}

export interface DashboardSummary {
  cards: KpiCard[];
}

export interface CategoryBreakdown {
  name: string;
  count: number;
  color: string;
}

export interface PiePoint {
  name: string;
  y: number;
  color: string;
}

export interface ItemsChartSeries {
  name: string;
  type: string;
  innerSize: string;
  data: PiePoint[];
}

export interface DashboardItems {
  totalItems: number;
  categories: CategoryBreakdown[];
  series: ItemsChartSeries[];
}

export interface TimeSeriesPoint {
  0: number;
  1: number;
}

export interface SalesChartSeries {
  name: string;
  type: string;
  color: string;
  fillOpacity: string;
  data: [number, number][];
}

export interface DashboardSalesHistory {
  series: SalesChartSeries[];
}

export interface CategoricalChartSeries {
  name: string;
  type: string;
  color: string;
  data: (number | null)[];
}

export interface DashboardMonthlyReport {
  categories: string[];
  series: CategoricalChartSeries[];
}

export interface YearlyChartSeries {
  name: string;
  type: string;
  color: string;
  dashStyle: string;
  data: (number | null)[];
}

export interface DashboardYearlySummary {
  categories: string[];
  series: YearlyChartSeries[];
}
