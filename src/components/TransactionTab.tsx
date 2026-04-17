import styled from "@emotion/styled";
import dayjs from "dayjs";
import Avatar from "./Avatar";
import { Result, Tag, Typography } from "antd";
import { useMemo } from "react";
import { ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Text, Link } = Typography;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px;
`;

const TransactionCard = styled.div`
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border-color: #d1d1d1;
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CardBody = styled.div`
  padding: 7px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ChangeGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ComparisonRow = styled.div`
  display: grid;
  grid-template-columns: 140px 1fr;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  background: #f9f9f9;
  border-radius: 8px;
`;

const ValueFlow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'Roboto Mono', monospace; /* Cleaner for numbers */
`;

const DeltaBadge = styled.span<{ negative?: boolean }>`
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  background: ${props => props.negative ? '#fff1f0' : '#f6ffed'};
  color: ${props => props.negative ? '#cf1322' : '#389e0d'};
  border: 1px solid ${props => props.negative ? '#ffa39e' : '#b7eb8f'};
`;

const Label = styled(Text)`
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
  text-transform: uppercase;
`;

export default function TransactionTab({ history }: { history: any[] }) {
  const filteredHistory = useMemo(() => {
    return (history || []).filter(
      (h) => h.historyType === "PURCHASE" || h.historyType === "INVOICE"
    );
  }, [history]);
  
  const navigate = useNavigate();

  if (filteredHistory.length === 0) {
    return <Result status="404" title="NO DATA FOUND" subTitle="This item has no transactions" />;
  }

  const UNIT_MAP: Record<string, string> = { "SQUARE FEET": "SQFT", "PIECE": "PCS", "FEET": "FT" };
  const shortenUnit = (unit?: string) => (unit ? UNIT_MAP[unit.toUpperCase()] ?? unit : "");

  return (
    <Container>
      {filteredHistory.map((h) => {
        const isPurchase = h.historyType === "PURCHASE";
        const qtyDiff = Number(h.currentQuantity ?? 0) - Number(h.previousQuantity ?? 0);
        const boxDiff = Number(h.currentBoxQuantity ?? 0) - Number(h.previousBoxQuantity ?? 0);
        const unit = shortenUnit(h.currentUnit);
        const linkPath = `/${isPurchase ? 'purchase' : 'invoice'}/${h.transactionsId}`;

        return (
          <TransactionCard key={h.id}>
            <CardHeader>
              <UserInfo>
                <Avatar name={h.updatedBy} size={28} />
                <div>
                  <Text strong>{h.updatedBy}</Text>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                    {dayjs(h.updatedOn).format("MMM D, YYYY · h:mm A")}
                  </Text>
                </div>
              </UserInfo>
              <div style={{ textAlign: 'right' }}>
                <Tag color={isPurchase ? "geekblue" : "volcano"} variant="solid" style={{ margin: 0 }}>
                  {isPurchase ? "STOCK PURCHASE" : "STOCK SOLD"}
                </Tag>
                <div style={{ fontSize: '11px', color: '#bfbfbf', marginTop: '2px' }}>
                  ID: <Link onClick={() => navigate(linkPath)} >{h.transactionsId}</Link>
                </div>
              </div>
            </CardHeader>

            <CardBody>
              <ChangeGrid>
                {/* Stock Quantity Comparison */}
                {qtyDiff !== 0 && (
                  <ComparisonRow>
                    <Label>Stock Volume</Label>
                    <ValueFlow>
                      <Text delete type="secondary">{h.previousQuantity} {unit}</Text>
                      <ArrowRightOutlined style={{ fontSize: '12px', color: '#bfbfbf' }} />
                      <Text strong>{h.currentQuantity} {unit}</Text>
                      <DeltaBadge negative={qtyDiff < 0}>
                        {qtyDiff > 0 ? `+${qtyDiff}` : qtyDiff} {unit}
                      </DeltaBadge>
                    </ValueFlow>
                  </ComparisonRow>
                )}

                {/* Box Quantity Comparison */}
                {boxDiff !== 0 && (
                  <ComparisonRow>
                    <Label>Box Count</Label>
                    <ValueFlow>
                      <Text delete type="secondary">{h.previousBoxQuantity}</Text>
                      <ArrowRightOutlined style={{ fontSize: '12px', color: '#bfbfbf' }} />
                      <Text strong>{h.currentBoxQuantity}</Text>
                      <DeltaBadge negative={boxDiff < 0}>
                        {boxDiff > 0 ? `+${boxDiff}` : boxDiff}
                      </DeltaBadge>
                    </ValueFlow>
                  </ComparisonRow>
                )}

                {/* Price Comparison */}
                {h.previousCostPrice !== h.currentCostPrice && (
                  <ComparisonRow>
                    <Label>Cost Price</Label>
                    <ValueFlow>
                      <Text delete type="secondary">Rs: {h.previousCostPrice ?? "0"}</Text>
                      <ArrowRightOutlined style={{ fontSize: '12px', color: '#bfbfbf' }} />
                      <Text strong>Rs: {h.currentCostPrice}</Text>
                    </ValueFlow>
                  </ComparisonRow>
                )}
              </ChangeGrid>
            </CardBody>
          </TransactionCard>
        );
      })}
    </Container>
  );
}