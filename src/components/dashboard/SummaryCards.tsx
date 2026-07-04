import styled from '@emotion/styled';
import { FiTrendingUp, FiTrendingDown, FiFileText, FiUsers, FiClock } from 'react-icons/fi';
import { MdCurrencyRupee } from 'react-icons/md';
import type { DashboardSummary, KpiCard } from '../../types/dashboard.types';

interface Props {
  data: DashboardSummary | null;
  loading: boolean;
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 1px 12px rgba(0, 0, 0, 0.07);
  transition: transform 0.15s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const IconBox = styled.div<{ bg: string; color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ bg }) => bg};
  color: ${({ color }) => color};
  flex-shrink: 0;
`;

const CardLabel = styled.p`
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0;
  font-weight: 500;
`;

const CardValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
  font-family: 'Nexa', inherit;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const CardFooter = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
`;

const TrendBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const TrendPill = styled.span<{ up: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  color: ${({ up }) => (up ? '#059669' : '#dc2626')};
  background: ${({ up }) => (up ? '#ecfdf5' : '#fef2f2')};
  padding: 3px 8px;
  border-radius: 99px;
  width: fit-content;
`;

const VsText = styled.p`
  font-size: 0.7rem;
  color: #9ca3af;
  margin: 0;
`;

const SkeletonCard = styled.div`
  border-radius: 16px;
  height: 128px;
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

const ICONS: Record<string, React.ReactNode> = {
  revenue: <MdCurrencyRupee size={20} />,
  invoice: <FiFileText size={18} />,
  customers: <FiUsers size={18} />,
  pending: <FiClock size={18} />,
};

function sparklinePoints(isUp: boolean): string {
  const pts: [number, number][] = isUp
    ? [[0, 30], [10, 26], [20, 28], [30, 20], [42, 22], [54, 13], [64, 16], [74, 7], [80, 2]]
    : [[0, 2], [10, 8], [20, 6], [30, 13], [42, 11], [54, 19], [64, 17], [74, 25], [80, 30]];
  return pts.map(([x, y]) => `${x},${y}`).join(' ');
}

function MiniSparkline({ isUp }: { isUp: boolean }) {
  const color = isUp ? '#10b981' : '#ef4444';
  return (
    <svg width="80" height="32" viewBox="0 0 80 32" style={{ display: 'block', flexShrink: 0 }}>
      <polyline
        points={sparklinePoints(isUp)}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SummaryCards({ data, loading }: Props) {
  if (loading) {
    return (
      <Grid>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </Grid>
    );
  }

  return (
    <Grid>
      {data?.cards.map((card: KpiCard) => {
        const isUp = card.trend >= 0;
        return (
          <Card key={card.id}>
            <CardHeader>
              <IconBox bg={card.bgColor} color={card.color}>
                {ICONS[card.icon] ?? <MdCurrencyRupee size={20} />}
              </IconBox>
              <CardLabel>{card.label}</CardLabel>
            </CardHeader>

            <CardValue>{card.value}</CardValue>

            <CardFooter>
              <TrendBlock>
                <TrendPill up={isUp}>
                  {isUp ? <FiTrendingUp size={11} /> : <FiTrendingDown size={11} />}
                  {Math.abs(card.trend)}%
                </TrendPill>
                <VsText>vs last month</VsText>
              </TrendBlock>
              <MiniSparkline isUp={isUp} />
            </CardFooter>
          </Card>
        );
      })}
    </Grid>
  );
}
