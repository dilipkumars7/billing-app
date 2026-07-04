import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import styled from '@emotion/styled';
import { FiArrowUpRight } from 'react-icons/fi';
import type { DashboardSalesHistory } from '../../types/dashboard.types';

interface Props {
  data: DashboardSalesHistory | null;
  loading: boolean;
}

const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 1px 12px rgba(0, 0, 0, 0.07);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const TitleBlock = styled.div``;

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 3px;
`;

const Subtitle = styled.p`
  font-size: 0.775rem;
  color: #9ca3af;
  margin: 0;
`;

const TrendBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #059669;
  background: #ecfdf5;
  padding: 4px 10px;
  border-radius: 99px;
  white-space: nowrap;
  flex-shrink: 0;
`;

const Skeleton = styled.div`
  border-radius: 16px;
  height: 340px;
  background: #f3f4f6;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  animation: pulse 1.5s ease-in-out infinite;
`;

function computeTrend(series: DashboardSalesHistory['series']): number | null {
  const pts = series[0]?.data ?? [];
  if (pts.length < 2) return null;
  const first = pts[0][1];
  const last = pts[pts.length - 1][1];
  if (!first) return null;
  return Math.round(((last - first) / first) * 100);
}

export default function SalesHistoryChart({ data, loading }: Props) {
  if (loading) return <Skeleton />;

  const trendPct = data ? computeTrend(data.series) : null;

  const options: Highcharts.Options = {
    chart: { type: 'area', height: 260, style: { fontFamily: 'inherit' }, animation: false },
    title: { text: undefined },
    credits: { enabled: false },
    xAxis: {
      type: 'datetime',
      labels: { style: { color: '#9ca3af', fontSize: '11px' } },
      lineColor: '#f3f4f6',
      tickColor: '#f3f4f6',
    },
    yAxis: [
      {
        title: { text: undefined },
        labels: {
          style: { color: '#9ca3af', fontSize: '11px' },
          formatter() {
            return Highcharts.numberFormat((this.value as number) / 1000, 0);
          },
        },
        gridLineColor: '#f3f4f6',
      },
      {
        title: { text: undefined },
        opposite: true,
        labels: { style: { color: '#9ca3af', fontSize: '11px' } },
        gridLineWidth: 0,
      },
    ],
    legend: {
      enabled: true,
      itemStyle: { fontSize: '12px', fontWeight: '500', color: '#4b5563' },
      symbolRadius: 3,
    },
    tooltip: {
      shared: true,
      xDateFormat: '%b %d, %Y',
      backgroundColor: 'white',
      borderColor: '#e5e7eb',
      borderRadius: 10,
      shadow: { opacity: 0.1 },
      style: { fontSize: '12px' },
    },
    plotOptions: {
      area: {
        marker: { enabled: false, states: { hover: { enabled: true, radius: 4 } } },
        lineWidth: 2.5,
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, 'rgba(59,130,246,0.22)'],
            [1, 'rgba(59,130,246,0)'],
          ],
        },
      },
      line: {
        marker: { enabled: false, states: { hover: { enabled: true, radius: 4 } } },
        lineWidth: 2,
        yAxis: 1,
      },
    },
    series: data?.series.map((s) => ({
      name: s.name,
      type: s.type as 'area' | 'line',
      color: s.color,
      data: s.data,
      fillOpacity: parseFloat(s.fillOpacity),
      ...(s.type === 'line' ? { yAxis: 1 } : {}),
    })) as Highcharts.SeriesOptionsType[] ?? [],
  };

  return (
    <Card>
      <CardHeader>
        <TitleBlock>
          <Title>Last 30 Days</Title>
          <Subtitle>Revenue trend (₹ thousands)</Subtitle>
        </TitleBlock>
        {trendPct !== null && (
          <TrendBadge>
            <FiArrowUpRight size={13} />
            {trendPct}%
          </TrendBadge>
        )}
      </CardHeader>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </Card>
  );
}
