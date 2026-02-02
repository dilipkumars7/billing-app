import styled from "@emotion/styled";
import dayjs from "dayjs";
import Avatar  from "./Avatar";
import { Tag } from "antd";

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

const Badge = styled.span<{ color: string }>`
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  background: ${({ color }) => color};
  color: #000;
`;

export default function HistoryTab({ history }: { history: any[] }) {

  const HISTORY_FIELDS = [
    { label: "Name", prev: "previousName", curr: "currentName" },
    { label: "Category", prev: "previousCategory", curr: "currentCategory" },
    { label: "Unit", prev: "previousUnit", curr: "currentUnit" },
    { label: "Quantity", prev: "previousQuantity", curr: "currentQuantity" },
    { label: "Cost Price", prev: "previousCostPrice", curr: "currentCostPrice" },
    { label: "Selling Price", prev: "previousSellingPrice", curr: "currentSellingPrice" },
    { label: "Tax Rate", prev: "previousTaxRate", curr: "currentTaxRate" },
    { label: "Size", prev: "previousSize", curr: "currentSize" }
  ];

  return (
    <HistoryContainer>
      {history.map((h) => (
        <HistoryItem key={h.id}>
          <AvatarDiv>
            <Avatar name={h.updatedBy} size={31} />
          </AvatarDiv>
          <Content>
            <Header>
              <strong>{h.updatedBy}</strong>{" "}
              {h.historyType === "CREATE"
                ? "created the item"
                : "updated the item"}
            </Header>

            <Time>
              {dayjs(h.updatedOn).format("MMMM D, YYYY [at] h:mm A")}
            </Time>
            {h.historyType === "UPDATE" &&
              HISTORY_FIELDS.map((field) => {
                const prevValue = h[field.prev];
                const currValue = h[field.curr];

                // show only if value changed
                if (prevValue === currValue) return null;

                return (
                  <ChangeRow key={field.label}>
                    {field.label} &nbsp;: &nbsp;
                    <Tag color="volcano">
                      {prevValue === "" || prevValue === 0 ? "—" : prevValue}
                    </Tag>
                    &#8594; &nbsp;
                    <Tag color="blue">
                      {currValue}
                    </Tag>
                  </ChangeRow>
                );
              })}
          </Content>
        </HistoryItem>
      ))}
    </HistoryContainer>
  );
}
