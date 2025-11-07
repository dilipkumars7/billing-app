import React, { useEffect, useState } from "react";
import Table from "../components/Table";
import { useApi } from "../hooks/useApi";
import { PATH } from "../constants/app.constant";

interface Items {
  itemId: number;
  itemCode: string;
  itemName: string;
  itemCategory: string;
  itemQuantity: number;
  costPrice: number;
  sellingPrice: number;
  taxRate: number;
  createdBy: string;
  createdOn: string;
  updatedBy: string;
  updatedOn: string;
}

const List: React.FC = () => {
  // 👇 Assuming your endpoint returns an array of items directly
  const { data, loading, error } = useApi<Items[]>(PATH.GET_ITEMS_DATA ,{ method: "GET" });

  const [tableHeader, setTableHeader] = useState<any[]>([]);
  const [tableData, setTableData] = useState<Items[]>([]);

  useEffect(() => {
    if (data && data.length > 0) {
      const desiredFields: (keyof Items)[] = [
        "itemCode",
        "itemName",
        "itemCategory",
        "itemQuantity",
        "costPrice",
        "sellingPrice",
        "taxRate",
        "createdBy",
      ];

      const getWidth = (key: string) => {
        const baseWidth = 150;
        const extraPerChar = 10;
        const minWidth = 120;
        const maxWidth = 400;
        const width = baseWidth + key.length * extraPerChar;
        return Math.min(Math.max(width, minWidth), maxWidth);
      };

      const headers = desiredFields.map((key) => ({
        headerName: key
        .replace(/([A-Z])/g, " $1")        // insert space before capital letters
        .replace(/_/g, " ")                // replace underscores with spaces
        .replace(/\s+/g, " ")              // normalize multiple spaces
        .trim()                            // remove leading/trailing spaces
        .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1)),
        field: key,
        defaultWidth: getWidth(key),
        type: typeof data[0][key] === "number" ? "number" : "string",
      }));

      const filteredData = data.map((item) => {
        const filtered: Partial<Items> = {};
        desiredFields.forEach((field) => {
          filtered[field] = item[field];
        });
        return filtered as Items;
      });

      setTableHeader(headers);
      setTableData(filteredData);
    }
  }, [data]);

  if (loading) return <p>Loading items...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div>
      <h3>📦 Items List (From API)</h3>

      {tableHeader.length > 0 && tableData.length > 0 ? (
        <Table TableHeader={tableHeader} TableData={tableData} />
      ) : (
        <p>No items found.</p>
      )}
    </div>
  );
};

export default List;
