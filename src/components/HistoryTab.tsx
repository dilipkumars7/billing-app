import styled from "@emotion/styled";
import dayjs from "dayjs";
import Avatar from "./Avatar";
import { Tag } from "antd";
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

const SectionLabel = styled.div`
  margin-top: 10px;
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #9b9b9b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

// Static fields to always diff
const HISTORY_FIELDS = [
  { label: "Name",          prev: "previousName",         curr: "currentName" },
  { label: "Category",      prev: "previousCategory",     curr: "currentCategory" },
  { label: "Unit",          prev: "previousUnit",         curr: "currentUnit" },
  { label: "Size",          prev: "previousSize",         curr: "currentSize" },
  { label: "Quantity",      prev: "previousQuantity",     curr: "currentQuantity" },
  { label: "Cost Price",    prev: "previousCostPrice",    curr: "currentCostPrice" },
  { label: "Selling Price", prev: "previousSellingPrice", curr: "currentSellingPrice" },
  { label: "Tax Rate",      prev: "previousTaxRate",      curr: "currentTaxRate" },
  { label: "Pieces Per Box",   prev: "previousBoxQuantity", curr: "currentBoxQuantity" },
];

/** Format a snake_case or camelCase key into a readable label */
function formatKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Normalise a value for display */
function formatValue(val: any): string {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  return String(val);
}

/**
 * Compute which custom-field keys changed between two snapshots.
 * Returns an array of { key, prev, curr } for every key that differs.
 */
function diffCustomFields(
  prev: Record<string, any> = {},
  curr: Record<string, any> = {}
): { key: string; prev: any; curr: any }[] {
  // Union of all keys from both snapshots
  const allKeys = Array.from(
    new Set([...Object.keys(prev), ...Object.keys(curr)])
  );

  return allKeys
    .filter((key) => {
      const p = prev[key] ?? "";
      const c = curr[key] ?? "";
      return String(p) !== String(c); // only include changed keys
    })
    .map((key) => ({ key, prev: prev[key], curr: curr[key] }));
}

export default function HistoryTab({ history }: { history: any[] }) {
  const filteredHistory = useMemo(
    () =>
      (history || []).filter(
        (h) => h.historyType === "CREATE" || h.historyType === "UPDATE"
      ),
    [history]
  );

  return (
    <HistoryContainer>
      {filteredHistory.map((h) => {
        // Diff static fields
        const staticChanges = HISTORY_FIELDS.filter(
          (f) => String(h[f.prev] ?? "") !== String(h[f.curr] ?? "")
        );

        // Diff dynamic custom fields
        const customChanges = diffCustomFields(
          h.previousCustomFields,
          h.currentCustomFields
        );

        const hasChanges = staticChanges.length > 0 || customChanges.length > 0;

        return (
          <HistoryItem key={h.id}>
            <AvatarDiv>
              <Avatar name={h.updatedBy} size={31} />
            </AvatarDiv>

            <Content>
              <Header>
                <strong>{h.updatedBy}</strong>{" "}
                {h.historyType === "CREATE" ? "created the item" : "updated the item"}
              </Header>

              <Time>{dayjs(h.updatedOn).format("MMMM D, YYYY [at] h:mm A")}</Time>

              {h.historyType === "UPDATE" && (
                <>
                  {/* ── Static field changes ──────────────────────────── */}
                  {staticChanges.length > 0 && (
                    <>
                      {staticChanges.map((field) => (
                        <ChangeRow key={field.label}>
                          {field.label}&nbsp;:&nbsp;
                          <Tag color="volcano">
                            {formatValue(h[field.prev])}
                          </Tag>
                          &#8594;&nbsp;
                          <Tag color="blue">
                            {formatValue(h[field.curr])}
                          </Tag>
                        </ChangeRow>
                      ))}
                    </>
                  )}

                  {/* ── Dynamic custom field changes ──────────────────── */}
                  {customChanges.length > 0 && (
                    <>
                      {staticChanges.length > 0 && (
                        <SectionLabel>Custom Fields</SectionLabel>
                      )}
                      {customChanges.map(({ key, prev, curr }) => (
                        <ChangeRow key={key}>
                          {formatKey(key)}&nbsp;:&nbsp;
                          <Tag color="volcano">
                            {formatValue(prev)}
                          </Tag>
                          &#8594;&nbsp;
                          <Tag color="blue">
                            {formatValue(curr)}
                          </Tag>
                        </ChangeRow>
                      ))}
                    </>
                  )}

                  {/* Fallback if nothing changed (shouldn't happen normally) */}
                  {!hasChanges && (
                    <ChangeRow style={{ color: "#999" }}>No changes recorded</ChangeRow>
                  )}
                </>
              )}
            </Content>
          </HistoryItem>
        );
      })}
    </HistoryContainer>
  );
}