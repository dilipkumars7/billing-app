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
import { Modal } from "antd";
import ViewSettingsList from "../../components/ViewSettingsList";

const ItemList: React.FC = () => {

  const { data: itemsData, loading: itemsLoading, error: itemsError } =
    useApi<any[]>(PATH.GET_ITEMS_DATA, { method: "GET" });

  const { data: headersData, loading: headersLoading, error: headersError } =
    useApi<any[]>(PATH.GET_CONFIG_HEADER + '/items', { method: "GET" });

  const [units, setUnits] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const { data: DropDownUnit } = useApi<any[]>(`${PATH.GET_DROP_DOWN}/Unit`, {
    method: "GET",
    showOverlay: true
  });

  const { data: DropDownCat } = useApi<any[]>(`${PATH.GET_DROP_DOWN}/Category`, {
    method: "GET",
    showOverlay: true
  });

  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    if (DropDownUnit) {
      setUnits(
        DropDownUnit.map((u) => ({
          label: `${u.dropdownLabel} - ${u.dropdownValue}`,
          value: u.dropdownValue,
          code: u.dropdownCode,
        }))
      );
    }
    if (DropDownCat) {
      setCategories(
        DropDownCat.map((c) => ({
          label: `${c.dropdownLabel} - ${c.dropdownValue}`,
          value: c.dropdownValue,
          code: c.dropdownCode,
        }))
      );
    }
  }, [DropDownUnit, DropDownCat]);

  const [tableHeader, setTableHeader] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const navigate = useNavigate();
  const [viewSettings, setViewSettings] = useState<any[]>([]);

  const userSettings = useSelector((state: RootState) => state.userSettings.settings);

  // Subscribe to RxJS update stream
  useEffect(() => {
    const sub = itemUpdateStream$.subscribe({
      next: (res) => console.log("Update success:", res),
      error: (err) => console.error("Update Error:", err),
    });
    return () => sub.unsubscribe();
  }, []);

  // 🔥 **TRANSFORM HEADERS WITH LOCALSTORAGE MERGE**
  useEffect(() => {
    if (!headersData || headersData.length === 0) return;

    // Fallback width calculation
    const getDefaultWidth = (key: string) => {
      const baseWidth = 120;
      const extraPerChar = 7;
      const minWidth = 120;
      const maxWidth = 400;
      const width = baseWidth + key.length * extraPerChar;
      return Math.min(Math.max(width, minWidth), maxWidth);
    };

    const storedSettingsRaw = localStorage.getItem("settingsConfig");
    let storedSettings = {};

    try {
      storedSettings = storedSettingsRaw ? JSON.parse(storedSettingsRaw) : {};
    } catch (e) {
      console.error("Invalid settingsConfig JSON — resetting", e);
      storedSettings = {};
      localStorage.setItem("settingsConfig", JSON.stringify(storedSettings));
    }

  const columnConfig =
    storedSettings?.tableRowOrder?.itemTable
    ? storedSettings.tableRowOrder.itemTable
    : [];

  const columnConfigMap = new Map(
    columnConfig.map((col: any) => [col.name, col])
  );

    // Merge backend headers + localStorage config
    const formattedHeaders = headersData
      .map((header: any) => {
        const stored = columnConfigMap.get(header.field);

        return {
          headerName: header.headerName,
          field: header.field,
          defaultWidth: stored?.width || getDefaultWidth(header.headerName),
          type: header.type,
          isEditable: header.isEditable,
          isVisible: stored?.isVisible !== undefined ? stored.isVisible : true,
          options:
            header.headerName === "Unit"
              ? units
              : header.headerName === "Category"
              ? categories
              : header.options || [],
        };
      })
      // Filter out hidden columns
      .filter((header: any) => header.isVisible)
      // Order by localStorage order
      .sort((a: any, b: any) => {
        const indexA = columnConfig.findIndex((c: any) => c.name === a.field);
        const indexB = columnConfig.findIndex((c: any) => c.name === b.field);
        return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
      });
    setTableHeader(formattedHeaders);
  }, [headersData, userSettings, units, categories, openModal]);

  // Map rows to visible fields only
  useEffect(() => {
    if (!itemsData || !tableHeader.length) return;

    const fields = tableHeader.map((h) => h.field);

    const filteredData = itemsData.map((item: any) => {
      const out: any = {};
      fields.forEach((field) => {
        out[field] = item[field];
      });
      return out;
    });

    setTableData(filteredData);
  }, [itemsData, tableHeader]);

  const OnRowSelect = (selected: any) => {
    if (selected.length) console.log(selected);
  };

  const OnEditChange = (updateData: any) => {
    itemUpdateSubject.next(updateData);
  };

  const handleNew = () => navigate("/item/new");

  if (itemsError || headersError)
  return (
    <div style={{ color: "red", whiteSpace: "pre-wrap" }}>
      {JSON.stringify(itemsError || headersError, null, 2)}
    </div>
  );

  useEffect(() => {
    if (!openModal || !headersData) return;
    const stored = JSON.parse(localStorage.getItem("settingsConfig") || "{}");
    const savedOrder = stored?.tableRowOrder?.itemTable || [];
    const map = new Map(savedOrder.map((c: any) => [c.name, c]));
    const merged = headersData.map((h: any) => {
      const saved = map.get(h.field);
      return {
        name: h.field,
        headerName: h.headerName,
        isVisible: saved?.isVisible ?? true,
        width: saved?.width ?? 150
      };
    });
    const ordered = savedOrder.length
      ? savedOrder
          .map((s: any) => merged.find((m) => m.name === s.name))
          .filter(Boolean)
          .concat(merged.filter((m) => !map.has(m.name)))
      : merged;
    setViewSettings(ordered);
  }, [openModal]);
  
  const closeModal = () => {
    setOpenModal(false);
  }

  const OnSaveView = () => {
    const stored = JSON.parse(localStorage.getItem("settingsConfig") || "{}");
    stored.tableRowOrder = stored.tableRowOrder || {};
    stored.tableRowOrder.itemTable = viewSettings.map((v) => ({
      name: v.name,
      isVisible: v.isVisible,
      width: v.width
    }));
    localStorage.setItem("settingsConfig", JSON.stringify(stored));
    itemUpdateSubject.next("REFRESH_HEADERS");
    setOpenModal(false);
  };


  return (
    <div className="p-[12px]">
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
            <Button size="sm" variant="outlined" onClick={()=>{setOpenModal(true)}}>
              <LuSettings2 size={20} />
            </Button>
          </Tooltip>
        </div>
      </div>

      {(itemsLoading || headersLoading) && <SkeletonLoader />}

      {tableHeader.length && tableData.length ? (
        <Table
          TableName="itemTable"
          TableHeader={tableHeader}
          TableData={tableData}
          checkbox={true}
          onSelectionChange={OnRowSelect}
          onRowChange={(rowIndex, updatedRow) => OnEditChange(updatedRow)}
        />
      ) : (
        !itemsLoading && !headersLoading && <p>No data found</p>
      )}

      <Modal title={"View Settings"}  open={openModal} onOk={OnSaveView} onCancel={closeModal} style={{ top: 20 }} okText="Save">
       <ViewSettingsList
          columns={viewSettings}
          onChange={setViewSettings}
        />
      </Modal>
    </div>
  );
};

export default ItemList;
