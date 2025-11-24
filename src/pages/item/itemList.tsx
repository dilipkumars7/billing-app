// ItemList.tsx
import React, { useEffect, useState } from "react";
import Table from "../../components/Table";
import { useApi } from "../../hooks/useApi";
import { PATH } from "../../constants/app.constant";
import SkeletonLoader from "../../components/SkeletonLoader";
import Button from '@mui/joy/Button';
import Tooltip from '@mui/joy/Tooltip';
import { IoSearchOutline } from "react-icons/io5";
import { IoMdAddCircleOutline } from "react-icons/io";
import { LuSettings2 } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

import { itemUpdateSubject, itemUpdateStream$ } from "../../services/updateStream";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";

const ItemList: React.FC = () => {

  const { data: itemsData, loading: itemsLoading, error: itemsError } =
    useApi<any[]>(PATH.GET_ITEMS_DATA, { method: "GET" });

  const { data: headersData, loading: headersLoading, error: headersError } =
    useApi<any[]>(PATH.GET_CONFIG_HEADER + '/items', { method: "GET" });

  const [tableHeader, setTableHeader] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const navigate = useNavigate();

  const userSettings = useSelector((state: RootState) => state.userSettings.settings);

  // Subscribe to RxJS update stream
  useEffect(() => {
    const sub = itemUpdateStream$.subscribe({
      next: (res) => console.log("Update success:", res),
      error: (err) => console.error("Update Error:", err),
    });

    return () => sub.unsubscribe();
  }, []);

  // Transform headers
  useEffect(() => {
    if (!headersData || headersData.length === 0) return;

    const getWidth = (key: string) => {
      const baseWidth = 120;
      const extraPerChar = 7;
      const minWidth = 120;
      const maxWidth = 400;
      const width = baseWidth + key.length * extraPerChar;
      return Math.min(Math.max(width, minWidth), maxWidth);
    };

    console.log("Redux user settings:", userSettings);

    const formattedHeaders = headersData.map((header: any) => ({
      headerName: header.headerName,
      field: header.field,
      defaultWidth: getWidth(header.headerName),
      type: header.type,
      isEditable: header.isEditable,
    }));

    setTableHeader(formattedHeaders);
  }, [headersData, userSettings]);

  // Map item data according to header config
  useEffect(() => {
    if (!itemsData || itemsData.length === 0 || tableHeader.length === 0) return;

    const fields = tableHeader.map((h) => h.field);

    const filteredData = itemsData.map((item: any) => {
      const filtered: any = {};
      fields.forEach((field) => {
        filtered[field] = item[field];
      });
      return filtered;
    });

    setTableData(filteredData);
  }, [itemsData, tableHeader]);

  const OnRowSelect = (selected: any) => {
    if (selected.length !== 0) console.log(selected);
  };

  const OnEditChange = (updateData: any) => {
    itemUpdateSubject.next(updateData);  // Send edit event to RxJS stream
  };

  const handleNew = () => navigate("/item/new");

  if (itemsError || headersError)
    return (
      <div style={{ color: "red", whiteSpace: "pre-wrap" }}>
        {JSON.stringify(itemsError || headersError, null, 2)}
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between px-1 py-2">

        <div className="flex items-center w-[15rem] pr-3 gap-2 bg-white border-gray-500/30 border-2 hover:border-[#357DE8] focus-within:border-[#357DE8] h-[39px] rounded-[5px] overflow-hidden">
          <input
            className="w-full h-full pl-5 outline-none placeholder-gray-500 text-sm"
            placeholder="Search for Items"
            type="text"
          />
          <IoSearchOutline size={25} color="#6a7282" />
        </div>

        <div className="flex gap-2 items-center">
          <Tooltip title="Add Products" variant="solid" placement="top">
            <Button size="sm" onClick={handleNew}>
              <IoMdAddCircleOutline size={25} />
            </Button>
          </Tooltip>

          <Tooltip title="View Settings" variant="solid" placement="top">
            <Button size="sm" variant="outlined">
              <LuSettings2 size={20} />
            </Button>
          </Tooltip>
        </div>
      </div>

      {(itemsLoading || headersLoading) && <SkeletonLoader />}

      {tableHeader.length && tableData.length ? (
        <Table
          TableHeader={tableHeader}
          TableData={tableData}
          checkbox={true}
          onSelectionChange={OnRowSelect}
          onRowChange={(rowIndex, updatedRow) => OnEditChange(updatedRow)}
        />
      ) : (
        !itemsLoading && !headersLoading && <p>No data found</p>
      )}
    </div>
  );
};

export default ItemList;
