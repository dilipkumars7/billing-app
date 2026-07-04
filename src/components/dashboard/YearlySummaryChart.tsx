import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import styled from '@emotion/styled';
import type { DashboardYearlySummary } from '../../types/dashboard.types';

interface Props {
  data: DashboardYearlySummary | null;
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

export default function YearlySummaryChart({ data, loading }: Props) {
  if (loading) return <Skeleton />;

  const options: Highcharts.Options = {
    chart: { type: 'spline', height: 280, style: { fontFamily: 'inherit' }, animation: false },
    title: { text: undefined },
    credits: { enabled: false },
    xAxis: {
      categories: data?.categories,
      labels: { style: { color: '#9ca3af', fontSize: '11px' } },
      lineColor: '#f3f4f6',
      tickColor: 'transparent',
    },
    yAxis: {
      title: { text: undefined },
      labels: {
        style: { color: '#9ca3af', fontSize: '11px' },
        formatter() {
          return '₹' + Highcharts.numberFormat((this.value as number) / 1000, 0) + 'k';
        },
      },
      gridLineColor: '#f3f4f6',
    },
    legend: {
      itemStyle: { fontSize: '12px', fontWeight: '500', color: '#4b5563' },
      symbolRadius: 3,
    },
    tooltip: {
      shared: true,
      backgroundColor: 'white',
      borderColor: '#e5e7eb',
      borderRadius: 10,
      shadow: { opacity: 0.1 },
      style: { fontSize: '12px' },
      formatter() {
        let s = `<b>${this.x}</b><br/>`;
        this.points?.forEach((p) => {
          if (p.y != null) {
            s += `<span style="color:${p.color}">●</span> ${p.series.name}: <b>₹${Highcharts.numberFormat(p.y, 0)}</b><br/>`;
          }
        });
        return s;
      },
    },
    plotOptions: {
      spline: {
        marker: { enabled: false, states: { hover: { enabled: true, radius: 5 } } },
        lineWidth: 2.5,
      },
    },
    series: data?.series.map((s) => ({
      name: s.name,
      type: 'spline' as const,
      color: s.color,
      dashStyle: s.dashStyle as Highcharts.DashStyleValue,
      data: s.data,
      connectNulls: false,
    })) as Highcharts.SeriesOptionsType[] ?? [],
  };

  return (
    <Card>
      <CardHeader>
        <TitleBlock>
          <Title>Year over Year</Title>
          <Subtitle>this year vs last</Subtitle>
        </TitleBlock>
      </CardHeader>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </Card>
  );
}
