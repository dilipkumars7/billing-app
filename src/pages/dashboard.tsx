import { useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { CookieService } from '../store/Cookie';
import { PATH } from '../constants/app.constant';
import styled from '@emotion/styled';
import type {
  DashboardWelcome,
  DashboardSummary,
  DashboardItems,
  DashboardSalesHistory,
  DashboardMonthlyReport,
  DashboardYearlySummary,
} from '../types/dashboard.types';

import WelcomeCard from '../components/dashboard/WelcomeCard';
import SummaryCards from '../components/dashboard/SummaryCards';
import ItemsCard from '../components/dashboard/ItemsCard';
import SalesHistoryChart from '../components/dashboard/SalesHistoryChart';
import MonthlyReportChart from '../components/dashboard/MonthlyReportChart';
import YearlySummaryChart from '../components/dashboard/YearlySummaryChart';

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 4px 4px 24px;
`;

const MiddleRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  @media (min-width: 1024px) {
    grid-template-columns: 2fr 1fr;
  }
`;

const BottomRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Dashboard: React.FC = () => {
  const companyId = CookieService.get('companyId') ?? '';

  const { data: settingsData } = useApi<any>(
    `${PATH.USER_SETTINGS}/${CookieService.get('user_id')}`,
    { method: 'GET', autoFetch: true }
  );

  const { data: welcome, loading: welcomeLoading } = useApi<DashboardWelcome>(
    `${PATH.DASHBOARD_WELCOME}/${companyId}`,
    { method: 'GET', autoFetch: true }
  );

  const { data: summary, loading: summaryLoading } = useApi<DashboardSummary>(
    `${PATH.DASHBOARD_SUMMARY}/${companyId}`,
    { method: 'GET', autoFetch: true }
  );

  const { data: items, loading: itemsLoading } = useApi<DashboardItems>(
    `${PATH.DASHBOARD_ITEMS}/${companyId}`,
    { method: 'GET', autoFetch: true }
  );

  const { data: salesHistory, loading: salesLoading } = useApi<DashboardSalesHistory>(
    `${PATH.DASHBOARD_SALES_HISTORY}/${companyId}`,
    { method: 'GET', autoFetch: true }
  );

  const { data: monthlyReport, loading: monthlyLoading } = useApi<DashboardMonthlyReport>(
    `${PATH.DASHBOARD_MONTHLY_REPORT}/${companyId}`,
    { method: 'GET', autoFetch: true }
  );

  const { data: yearlySummary, loading: yearlyLoading } = useApi<DashboardYearlySummary>(
    `${PATH.DASHBOARD_YEARLY_SUMMARY}/${companyId}`,
    { method: 'GET', autoFetch: true }
  );

  useEffect(() => {
    if (settingsData) {
      localStorage.setItem('settingsConfig', JSON.stringify(settingsData?.settingsConfig));
    }
  }, [settingsData]);

  return (
    <PageWrapper>
      <WelcomeCard data={welcome} loading={welcomeLoading} />
      <SummaryCards data={summary} loading={summaryLoading} />

      <MiddleRow>
        <SalesHistoryChart data={salesHistory} loading={salesLoading} />
        <ItemsCard data={items} loading={itemsLoading} />
      </MiddleRow>

      <BottomRow>
        <MonthlyReportChart data={monthlyReport} loading={monthlyLoading} />
        <YearlySummaryChart data={yearlySummary} loading={yearlyLoading} />
      </BottomRow>
    </PageWrapper>
  );
};

export default Dashboard;
