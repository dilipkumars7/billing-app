import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import styled from '@emotion/styled';
import type { DashboardItems } from '../../types/dashboard.types';

interface Props {
  data: DashboardItems | null;
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
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const ByCategory = styled.span`
  font-size: 0.775rem;
  color: #9ca3af;
`;

const ChartWrapper = styled.div`
  position: relative;
`;

const DonutCenter = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
`;

const CenterValue = styled.div`
  font-size: 1.4rem;
  font-weight: 700;
  color: #111827;
  line-height: 1;
`;

const CenterSub = styled.div`
  font-size: 0.725rem;
  color: #9ca3af;
  margin-top: 4px;
`;

const Legend = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const LegendRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LegendLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LegendDot = styled.span<{ color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ color }) => color};
  flex-shrink: 0;
`;

const LegendName = styled.span`
  font-size: 0.775rem;
  color: #6b7280;
  font-weight: 500;
  letter-spacing: 0.02em;
`;

const LegendPct = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  color: #111827;
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

export default function ItemsCard({ data, loading }: Props) {
  if (loading) return <Skeleton />;

  const total = data?.categories.reduce((sum, c) => sum + c.count, 0) ?? 0;

  const options: Highcharts.Options = {
    chart: {
      type: 'pie',
      height: 200,
      margin: [0, 0, 0, 0],
      spacing: [0, 0, 0, 0],
      backgroundColor: 'transparent',
      animation: false,
    },
    title: { text: undefined },
    credits: { enabled: false },
    legend: { enabled: false },
    tooltip: {
      pointFormat: '<b>{point.percentage:.1f}%</b>',
    },
    plotOptions: {
      pie: {
        innerSize: '68%',
        dataLabels: { enabled: false },
        borderWidth: 3,
        borderColor: '#ffffff',
        states: {
          hover: { halo: { size: 6 } },
        },
      },
    },
    series: data?.series.map((s) => ({
      name: s.name,
      type: 'pie' as const,
      data: s.data.map((pt) => ({ name: pt.name, y: pt.y, color: pt.color })),
    })) as Highcharts.SeriesOptionsType[] ?? [],
  };

  return (
    <Card>
      <CardHeader>
        <Title>Items Breakdown</Title>
        <ByCategory>by category</ByCategory>
      </CardHeader>

      <ChartWrapper>
        <HighchartsReact highcharts={Highcharts} options={options} />
        <DonutCenter>
          <CenterValue>100%</CenterValue>
          <CenterSub>of stock</CenterSub>
        </DonutCenter>
      </ChartWrapper>

      <Legend>
        {data?.categories.map((cat) => {
          const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
          return (
            <LegendRow key={cat.name}>
              <LegendLeft>
                <LegendDot color={cat.color} />
                <LegendName>{cat.name}</LegendName>
              </LegendLeft>
              <LegendPct>{pct}%</LegendPct>
            </LegendRow>
          );
        })}
      </Legend>
    </Card>
  );
}
