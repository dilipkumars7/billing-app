import styled from "@emotion/styled";
import dayjs from "dayjs";
import Avatar from "./Avatar";
import { Result, Tag } from "antd";
import { useMemo } from "react";

const HistoryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const HistoryItem = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
`;

const AvatarDiv = styled.div`
  width: 25px;
  height: 25px;
`;

const Content = styled.div`
  flex: 1;
`;

const Header = styled.div`
  font-size: 13px;
  font-weight: 500;
`;

const Time = styled.div`
  font-size: 12px;
  color: #6b6b6b;
  margin-top: 2px;
`;

const ChangeRow = styled.div`
  margin-top: 6px;
  font-size: 12px;
`;

const HighlightTag = styled(Tag)<{ bgcolor?: string }>`
  font-weight: 500;
`;

export default function TransactionTab({ history }: { history: any[] }) {

  const filteredHistory = useMemo(() => {
    return (history || []).filter(
      (h) => h.historyType === "PURCHASE" || h.historyType === "STOCK_OUT"
    );
  }, [history]);

  if(filteredHistory.length == 0){
    return (<Result
            status="404"
            title="NO DATA FOUND"
            subTitle="This Item have no transactions"
          />)
  }

  return (
    <HistoryContainer>
      {filteredHistory.map((h) => {
        const prevQty = Number(h.previousQuantity ?? 0);
        const currQty = Number(h.currentQuantity ?? 0);
        const qtyDifference = currQty - prevQty;

        return (
          <HistoryItem key={h.id}>
            <AvatarDiv>
              <Avatar name={h.updatedBy} size={31} />
            </AvatarDiv>

            <Content>
              <Header>
                <strong>{h.updatedBy}</strong>{" "}
                {h.historyType === "PURCHASE"
                  ? "purchased stock"
                  : "sold stock"}
              </Header>

              <Time>
                {dayjs(h.updatedOn).format("MMMM D, YYYY [at] h:mm A")}
              </Time>

              <ChangeRow>
                Transaction ID : <strong>{h.transactionsId}</strong>
              </ChangeRow>

              {/* PURCHASE LOG */}
              {h.historyType === "PURCHASE" && qtyDifference !== 0 && (
                <ChangeRow>
                  Stock Updated :{" "}
                  <Tag color="volcano">
                    {prevQty}
                  </Tag>
                  &#8594; &nbsp;
                  <Tag color="blue">
                    {currQty}
                  </Tag>
                  {" "}
                  <Tag color="green">
                    +{qtyDifference}
                  </Tag>
                </ChangeRow>
              )}

              {/* STOCK OUT LOG */}
              {h.historyType === "STOCK_OUT" && qtyDifference !== 0 && (
                <ChangeRow>
                  Stock Reduced :{" "}
                  <Tag color="volcano">
                    {prevQty}
                  </Tag>
                  &#8594; &nbsp;
                  <Tag color="blue">
                    {currQty}
                  </Tag>
                  {" "}
                  <Tag color="red">
                    {qtyDifference}
                  </Tag>
                </ChangeRow>
              )}

              {/* Cost Price Change */}
              {h.previousCostPrice !== h.currentCostPrice && (
                <ChangeRow>
                  Cost Price :{" "}
                  <Tag color="volcano">
                    {h.previousCostPrice ?? "—"}
                  </Tag>
                  {" → "}
                  <Tag color="blue">
                    {h.currentCostPrice ?? "—"}
                  </Tag>
                </ChangeRow>
              )}

            </Content>
          </HistoryItem>
        );
      })}
    </HistoryContainer>
  );
}
