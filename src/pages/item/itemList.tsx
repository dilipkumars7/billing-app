// ItemList.tsx - FIXED VERSION
import React, { useEffect, useState, useRef, useMemo } from "react";
import Table from "../../components/Table";
import { useApi } from "../../hooks/useApi";
import { PATH } from "../../constants/app.constant";
import SkeletonLoader from "../../components/SkeletonLoader";
import Button from '@mui/joy/Button';
import { Button as PButton, Result, Tag, Badge } from "antd";
import Tooltip from '@mui/joy/Tooltip';
import { IoSearchOutline } from "react-icons/io5";
import { IoMdAddCircleOutline } from "react-icons/io";
import { LuSettings2 } from "react-icons/lu";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { itemUpdateSubject, itemUpdateStream$ } from "../../services/updateStream";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { Modal } from "antd";
import ViewSettingsList from "../../components/ViewSettingsList";
import { CookieService } from "../../store/Cookie";
import { IoClose } from "react-icons/io5";
import { useNotification } from '../../components/provider/NotificationProvider';
import { websocketService } from "../../services/websocketService";

const ItemList: React.FC = () => {

  const notificationApi = useNotification();

  const [searchParams] = useSearchParams();

  const { data: itemsAllData, loading: itemsAllLoading, error: itemsAllError, refetch:reloadAllData } =
    useApi<any[]>(`${PATH.GET_ITEMS_DATA}/all`, { method: "GET" });

  const { data: headersData, loading: headersLoading, error: headersError } =
    useApi<any[]>(PATH.GET_CONFIG_HEADER + '/items', { method: "GET" });

  const { data:Settings, loading:SettingsLoading, error:SettingsError, refetch: SettingsRefetch } = 
    useApi<any[]>(`${PATH.USER_SETTINGS}/${CookieService.get('user_id')}`, { method: "PUT", autoFetch: false });
  
  const { data:DeleteData, error:DeleteError, refetch: DeleteRefetch } = 
    useApi<any[]>(`${PATH.GET_ITEMS_DATA}`, { method: "DELETE", autoFetch: false });

  const [units, setUnits] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [size, setSize] = useState<any[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  const { data: DropDownUnit } = useApi<any[]>(`${PATH.GET_DROP_DOWN}/Unit`, {
    method: "GET",
    showOverlay: true
  });

  const { data: DropDownCat } = useApi<any[]>(`${PATH.GET_DROP_DOWN}/Category`, {
    method: "GET",
    showOverlay: true
  });

  const { data: DropDownSize } = useApi<any[]>(`${PATH.GET_DROP_DOWN}/Size`, {
    method: "GET",
    showOverlay: true
  });

  const [openModal, setOpenModal] = useState(false);
  const [tableHeader, setTableHeader] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const navigate = useNavigate();
  const [viewSettings, setViewSettings] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [deleteLoad, setDeleteLoad] = useState(false);

  // Track if initial data has been loaded
  const initialDataLoaded = useRef(false);
  // Buffer WS events that arrive before initial data load
  const wsEventBuffer = useRef<{type: 'create'|'update'|'delete', payload: any}[]>([]);
  // Track pending deletion confirmations (itemCode -> timeout id)
  const pendingDeleteConfirmations = useRef<Record<string, number>>({});

  const userSettings = useSelector((state: RootState) => state.userSettings.settings);

  const lastFetchRef = useRef<string | null>(null);

  useEffect(() => {
    const sortBy = searchParams.get("sortBy");
    const direction = searchParams.get("direction");
    if (!sortBy || !direction) return;
    const key = `${sortBy}_${direction}`;
    if (lastFetchRef.current === key) return;

    lastFetchRef.current = key;
    reloadAllData({
      path: `?sortBy=${sortBy}&direction=${direction}`,
    });
  }, [searchParams, reloadAllData]);

  useEffect(() => {
    websocketService.ItemWsconnect('items');

    return () => {
      websocketService.disconnect();
    };
  }, []);

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

    if (DropDownSize) {
      setSize(
        DropDownSize.map((c) => ({
          label: `${c.dropdownValue}`,
          value: c.dropdownValue,
          code: c.dropdownCode,
        }))
      );
    }
  }, [DropDownUnit, DropDownCat, DropDownSize]);

  // ============================================
  // 🔧 FIX: Helper to filter item by current visible fields
  // ============================================
  const filterItemByHeaders = (item: any) => {
    if (!tableHeader.length) return item;
    const fields = tableHeader.map(h => h.field);
    const filtered: any = { itemCode: item.itemCode };
    fields.forEach(field => {
      filtered[field] = item[field];
    });
    return filtered;
  };

  // ============================================
  // WebSocket Real-Time Updates (single subscription)
  // ============================================
  useEffect(() => {
    // Monitor connection status
    const unsubConnection = websocketService.onConnectionChange((connected) => {
      setWsConnected(connected);
    });

    // 🔧 FIX: Apply create/update/delete event with proper field filtering
    const applyOrBuffer = (type: 'create'|'update'|'delete', payload: any) => {
      if (!initialDataLoaded.current) {
        // Buffer events arriving before initial data loaded
        wsEventBuffer.current.push({ type, payload });
        return;
      }

      // Apply immediately if initial data has been loaded
      if (type === 'create') {
        const filteredPayload = filterItemByHeaders(payload);
        setTableData(prev => {
          if (prev.some(item => item.itemCode === payload.itemCode)) {
            return prev;
          }
          return [...prev, filteredPayload];
        });
      } else if (type === 'update') {
        // 🔧 FIX: Filter the payload to only include fields in tableHeader
        const filteredPayload = filterItemByHeaders(payload);
        
        setTableData(prev => {
          const itemExists = prev.some(item => item.itemCode === payload.itemCode);
          if (!itemExists) {
            return prev;
          }
          // Create completely new array with updated item
          const updatedList = prev.map(item =>
            item.itemCode === payload.itemCode
              ? { ...item, ...filteredPayload }  // Merge filtered payload
              : item
          );
          
          return updatedList;
        });
      } else if (type === 'delete') {
        const code = payload;
        if (pendingDeleteConfirmations.current[code]) {
          clearTimeout(pendingDeleteConfirmations.current[code]);
          delete pendingDeleteConfirmations.current[code];
        }
        setTableData(prev => prev.filter(i => i.itemCode !== code));
      }
    };

    // Created
    const unsubCreated = websocketService.onItemCreated((newItem) => {
      applyOrBuffer('create', newItem);
    });

    // Updated
    const unsubUpdated = websocketService.onItemUpdated((updatedItem) => {
      applyOrBuffer('update', updatedItem);
    });

    // Deleted
    const unsubDeleted = websocketService.onItemDeleted((itemCode: string) => {
      applyOrBuffer('delete', itemCode);
    });

    // Cleanup
    return () => {
      unsubConnection();
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
    };
  }, [tableHeader]); // 🔧 FIX: Add tableHeader as dependency

  // Subscribe to RxJS update stream (local edits)
  useEffect(() => {
    const sub = itemUpdateStream$.subscribe({
      next: (res) => res,
      error: (err) => err,
    });
    return () => sub.unsubscribe();
  }, []);

  // 🔥 TRANSFORM HEADERS WITH LOCALSTORAGE MERGE
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

    const optionsMap: Record<string, any[]> = {
      Unit: units,
      Category: categories,
      Size: size,
    };

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
          options: optionsMap[header.headerName] ?? header.options ?? [],
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

  useEffect(() => {
    if (Settings) {
      setOpenModal(false);
    }
    if(SettingsError){
      console.error("Error fetching User Settings:", SettingsError);
    }
    if(DeleteData && !deleteLoad){
      notificationApi.success({
        message: DeleteData.error,
        description: DeleteData.message
      })
    }
    if(DeleteError && !deleteLoad){
      notificationApi.error({
        message: "Error deleting items",
        description: JSON.stringify(DeleteError)
      })
    }
  }, [Settings, SettingsError, DeleteData, DeleteError, deleteLoad, notificationApi]);

  // ✅ FIXED: Load initial data with proper dependency tracking
  useEffect(() => {
    // Don't process if headers aren't ready
    if (!tableHeader.length) return;

    // Determine which data source to use
    const sourceData = itemsAllData;
    
    // Don't process if no data available
    if (!sourceData || sourceData.length === 0) {
      console.log("No source data available yet");
      return;
    }

    const fields = tableHeader.map(h => h.field);

    const filtered = sourceData.map(item => {
      const out: any = { itemCode: item.itemCode };
      fields.forEach(field => {
        out[field] = item[field];
      });
      return out;
    });

    setTableData(filtered);
    
    // Mark initial data as loaded
    if (!initialDataLoaded.current) {
      initialDataLoaded.current = true;

      // Process any buffered WebSocket events
      if (wsEventBuffer.current.length > 0) {
        wsEventBuffer.current.forEach(event => {
          if (event.type === "create") {
            const filteredPayload = filterItemByHeaders(event.payload);
            setTableData(prev => {
              if (prev.some(i => i.itemCode === event.payload.itemCode)) {
                return prev;
              }
              return [...prev, filteredPayload];
            });
          } else if (event.type === "update") {
            const filteredPayload = filterItemByHeaders(event.payload);
            setTableData(prev =>
              prev.map(i =>
                i.itemCode === event.payload.itemCode
                  ? { ...i, ...filteredPayload }
                  : i
              )
            );
          } else if (event.type === "delete") {
            setTableData(prev =>
              prev.filter(i => i.itemCode !== event.payload)
            );
          }
        });
        wsEventBuffer.current = [];
      }
    }
  }, [itemsAllData, itemsAllLoading, tableHeader]); // ✅ Fixed dependencies


  const OnEditChange = (updateData: any) => {
    itemUpdateSubject.next(updateData);
    if (updateData?.itemCode) {
      setTableData(prev => prev.map(r => r.itemCode === updateData.itemCode ? { ...r, ...updateData } : r));
    }
  };

  const handleNew = () => navigate("/item/create");

  if (itemsAllError || headersError)
    return (
      <div style={{ color: "red", whiteSpace: "pre-wrap" }}>
        {JSON.stringify(itemsAllError || headersError, null, 2)}
      </div>
    );

  // View settings modal populate
  // eslint-disable-next-line react-hooks/rules-of-hooks
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
  }, [openModal, headersData]);
  
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
    SettingsRefetch({
      body: {"settingsConfig": stored, "pageAccess":[]}
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedRows([]);
  };

  // Delete with proper awaiting and fallback mechanism
  const DeleteItem = async () => {
    if (selectedRows.length === 0) return;
    const codes = selectedRows.map(r => r.itemCode);
    setDeleteLoad(true);
    try {
      const deletePromises = codes.map(code => {
        const fallbackTimeout = window.setTimeout(() => {
        }, 5000);
        pendingDeleteConfirmations.current[code] = fallbackTimeout;
        return DeleteRefetch({ path: `/${code}` });
      });
      await Promise.all(deletePromises);
      await new Promise(resolve => setTimeout(resolve, 1200));
      const pendingLeft = Object.keys(pendingDeleteConfirmations.current);
      if (pendingLeft.length > 0) {
        pendingLeft.forEach(code => {
          clearTimeout(pendingDeleteConfirmations.current[code]);
          delete pendingDeleteConfirmations.current[code];
        });
        // fallback reload to ensure consistency
        await reloadAllData();
      }
      closeDeleteDialog();
    } catch (err) {
      notificationApi.error({
        message: 'Error deleting items',
        description: JSON.stringify(err)
      });
    } finally {
      setDeleteLoad(false);
    }
  };

  return (
    <div className="p-[12px]">
      {tableHeader.length!=0 && tableData.length!=0 && (
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
            <Badge 
              status={wsConnected ? "processing" : "default"} 
              text={wsConnected ? "Live" : "Offline"}
            />

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
      )}

      {tableData.length > 0 && (
        <Table
          TableName="itemTable"
          Idlinkpath="item"
          idkey="itemId"
          TableHeader={tableHeader}
          TableData={tableData}
          HeaderLoading={headersLoading}
          DataLoading={itemsAllLoading}
          checkbox={true}
          selectedRows={selectedRows}
          onSelectionChange={(rows) => {
            setSelectedRows(rows);
            setDeleteDialogOpen(rows.length > 0);
          }}
          onRowChange={(rowIndex, updatedRow) => OnEditChange(updatedRow)}
          onSortClear={() => reloadAllData()}
        />
      )}

      {!itemsAllLoading &&
      !headersLoading &&
      tableHeader.length > 0 &&
      tableData.length === 0 && (
        <Result
          status="404"
          title="NO PRODUCTS FOUND"
          subTitle=""
          extra={
            <PButton type="primary" onClick={handleNew}>
              Create
            </PButton>
          }
        />
      )}

      <Modal title={"View Settings"} open={openModal} onOk={OnSaveView} onCancel={closeModal} style={{ top: 20 }} okText="Save" maskClosable={!SettingsLoading} closable={!SettingsLoading} confirmLoading={SettingsLoading}>
       <ViewSettingsList
          columns={viewSettings}
          onChange={setViewSettings}
        />
      </Modal>

      <Modal 
        open={deleteDialogOpen} 
        title={null}
        wrapClassName="delete-nonblocking-modal"
        okText="Delete"
        style={{ top: 550 }}
        okButtonProps={{ danger: true }}
        closable={false}
        mask={false}
        maskClosable={false}
        keyboard={false}  
        footer={null} 
      >
        <div className="flex items-center justify-between w-full">
          <span style={{ marginRight: "auto" }}>
            Selected 
            &nbsp;
            <Tag color="geekblue">
              {selectedRows.length}
            </Tag>
          </span>

          <div className="flex items-center gap-2">

            <PButton variant="solid" color="primary">
              Bulk Action
            </PButton>

            <PButton
              variant="solid"
              color="danger"
              onClick={DeleteItem}
              loading={deleteLoad}
            >
              Delete
            </PButton>

            <PButton variant="outlined" color="default" onClick={closeDeleteDialog}>
              <IoClose />
            </PButton>
          </div>
          
        </div>
      </Modal>

    </div>
  );
};

export default ItemList;