import React, { useEffect, useState, useRef, useCallback } from "react";
import Table from "../../components/Table";
import { useApi } from "../../hooks/useApi";
import { PATH } from "../../constants/app.constant";
import SkeletonLoader from "../../components/SkeletonLoader";
import { IoSearchOutline } from "react-icons/io5";
import { IoMdAddCircleOutline } from "react-icons/io";
import { LuSettings2 } from "react-icons/lu";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Button as PButton, Result, Tag, Badge,
  Tooltip as AntTooltip, Drawer, Select,
  Slider, Divider as AntDivider,
} from "antd";
import { supplierUpdateSubject, supplierUpdateStream$ } from "../../services/updateStream";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { Modal } from "antd";
import ViewSettingsList from "../../components/ViewSettingsList";
import { CookieService } from "../../store/Cookie";
import { IoClose } from "react-icons/io5";
import { useNotification } from "../../components/provider/NotificationProvider";


const PAGE_SIZE = 15;

const SupplierList: React.FC = () => {
  const notificationApi = useNotification();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const companyId = CookieService.get('companyId') || '';

  // ── Pagination state ──────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const allDataRef = useRef<any[]>([]);
  const initialDataLoaded = useRef(false);

  // ── Search state ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: suppliersPageData,
    loading: suppliersPageLoading,
    error: suppliersAllError,
    refetch: reloadPageData,
  } = useApi<{ content: any[]; totalElements: number; last: boolean }>(
    `${PATH.SUPPLIERS_DATA}/all/${companyId}`,
    { method: "GET" }
  );

  const { data: suppliersSearchData, loading: suppliersSearchLoading, error: suppliersSearchError, refetch: reloadSearchData } =
    useApi<any[]>(`${PATH.SUPPLIERS_DATA}/search`, { method: "GET", autoFetch: false });

  const { data: headersData, loading: headersLoading, error: headersError } =
    useApi<any[]>(PATH.GET_CONFIG_HEADER + '/suppliers', { method: "GET" });

  const { data: Settings, loading: SettingsLoading, error: SettingsError, refetch: SettingsRefetch } =
    useApi<any[]>(`${PATH.USER_SETTINGS}/${CookieService.get('user_id')}`, { method: "PUT", autoFetch: false });

  const { data: DeleteData, error: DeleteError, refetch: DeleteRefetch } =
    useApi<any[]>(`${PATH.SUPPLIERS_DATA}`, { method: "DELETE", autoFetch: false });

  const [openModal, setOpenModal] = useState(false);
  const [tableHeader, setTableHeader] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [viewSettings, setViewSettings] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [deleteLoad, setDeleteLoad] = useState(false);

  // Track pending deletion confirmations (supplierCode -> timeout id)
  const pendingDeleteConfirmations = useRef<Record<string, number>>({});

  const userSettings = useSelector((state: RootState) => state.userSettings.settings);

  const lastSortKeyRef = useRef<string | null>(null);

  const resetPagination = useCallback(() => {
    allDataRef.current = [];
    setCurrentPage(0);
    setHasMore(true);
    setIsFetchingMore(false);
    initialDataLoaded.current = false;
  }, []);

  useEffect(() => {
    const sortBy = searchParams.get("sortBy");
    const direction = searchParams.get("direction");
    const key = sortBy && direction ? `${sortBy}_${direction}` : null;
    if (key === lastSortKeyRef.current) return;
    lastSortKeyRef.current = key;

    resetPagination();
    const sortQuery = sortBy && direction ? `?page=0&size=${PAGE_SIZE}&sortBy=${sortBy}&direction=${direction}` : `?page=0&size=${PAGE_SIZE}`;
    reloadPageData({ path: sortQuery });
  }, [searchParams, reloadPageData, resetPagination]);

  useEffect(() => {
    if (!tableHeader.length) return;
    if (allDataRef.current.length === 0 && !initialDataLoaded.current) {
      const sortBy = searchParams.get("sortBy");
      const direction = searchParams.get("direction");
      const sortQuery = sortBy && direction
        ? `?page=0&size=${PAGE_SIZE}&sortBy=${sortBy}&direction=${direction}`
        : `?page=0&size=${PAGE_SIZE}`;
      reloadPageData({ path: sortQuery });
    }
  }, [tableHeader, searchParams, reloadPageData]);


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
    let storedSettings:any = {};

    try {
      storedSettings = storedSettingsRaw ? JSON.parse(storedSettingsRaw) : {};
    } catch (e) {
      storedSettings = {};
      localStorage.setItem("settingsConfig", JSON.stringify(storedSettings));
    }

    const columnConfig =
      storedSettings?.tableRowOrder?.supplierTable
        ? storedSettings.tableRowOrder.supplierTable
        : [];

    const columnConfigMap = new Map(
      columnConfig.map((col: any) => [col.name, col])
    );



    // Merge backend headers + localStorage config
    const formattedHeaders = headersData
      .map((header: any) => {
        const stored:any = columnConfigMap.get(header.field);

        return {
          headerName: header.headerName,
          field: header.field,
          defaultWidth: stored?.width || getDefaultWidth(header.headerName),
          type: header.type,
          isEditable: header.isEditable,
          isVisible: stored?.isVisible !== undefined ? stored.isVisible : true,
          options: [],
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
  }, [headersData, userSettings, openModal]);

  useEffect(() => {
    if (Settings) {
      setOpenModal(false);
    }
    if (SettingsError) {
      console.error("Error fetching User Settings:", SettingsError);
    }
    if (DeleteData && !deleteLoad) {
      notificationApi.success({
        message: DeleteData.error,
        description: DeleteData.message
      })
    }
    if (DeleteError && !deleteLoad) {
      notificationApi.error({
        message: "Error deleting supplier",
        description: JSON.stringify(DeleteError)
      })
    }
  }, [Settings, SettingsError, DeleteData, DeleteError, deleteLoad, notificationApi]);

  const applyHeaderFilter = useCallback((items: any[]) => {
    if (!tableHeader.length) return items;
    const fields = tableHeader.map(h => h.field);
    return items.map(item => {
      const out: any = {};
      fields.forEach(field => { out[field] = item[field]; });
      out.supplierCode = item.supplierCode;
      return out;
    });
  }, [tableHeader]);

  useEffect(() => {
    if (!suppliersPageData || isSearchMode) return;

    const incoming = suppliersPageData.content ?? (Array.isArray(suppliersPageData) ? suppliersPageData : []);
    const isLastPage: boolean = suppliersPageData.last ?? (incoming.length < PAGE_SIZE);

    const filtered = applyHeaderFilter(incoming);

    const existingCodes = new Set(allDataRef.current.map((r: any) => r.purchaseCode));
    const newItems = filtered.filter((item: any) => !existingCodes.has(item.purchaseCode));

    allDataRef.current = [...allDataRef.current, ...newItems];
    setTableData([...allDataRef.current]);

    setHasMore(!isLastPage);
    setIsFetchingMore(false);
    initialDataLoaded.current = true;
  }, [suppliersPageData, isSearchMode, applyHeaderFilter]);

  useEffect(() => {
    if (!isSearchMode) return;

    if (suppliersSearchError) {
      notificationApi.error({
        message: 'Search failed',
        description: (suppliersSearchError as any)?.message || 'Could not fetch search results.',
      });
      setIsSearchMode(false);
      setTableData([...allDataRef.current]);
      return;
    }

    if (suppliersSearchData !== undefined && suppliersSearchData !== null) {
      setTableData(applyHeaderFilter(suppliersSearchData));
    }
  }, [suppliersSearchData, suppliersSearchError, isSearchMode, notificationApi, applyHeaderFilter]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!value.trim()) {
      setIsSearchMode(false);
      setTableData([...allDataRef.current]);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      setIsSearchMode(true);
      reloadSearchData({
        path: `?q=${encodeURIComponent(value.trim())}&companyId=${encodeURIComponent(companyId)}`,
      });
    }, 350);
  }, [companyId, allDataRef, reloadSearchData]);

  const clearSearch = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setSearchQuery('');
    setIsSearchMode(false);
    setTableData([...allDataRef.current]);
  }, []);

  useEffect(() => () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); }, []);

  const loadNextPage = useCallback(() => {
    if (!hasMore || isFetchingMore || isSearchMode || suppliersPageLoading) return;

    setIsFetchingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);

    const sortBy = searchParams.get("sortBy");
    const direction = searchParams.get("direction");
    const sortQuery = sortBy && direction
      ? `?page=${nextPage}&size=${PAGE_SIZE}&sortBy=${sortBy}&direction=${direction}`
      : `?page=${nextPage}&size=${PAGE_SIZE}`;

    reloadPageData({ path: sortQuery });
  }, [hasMore, isFetchingMore, isSearchMode, suppliersPageLoading, currentPage, searchParams, reloadPageData]);

  useEffect(() => {
    if (!openModal || !headersData) return;
    const stored = JSON.parse(localStorage.getItem("settingsConfig") || "{}");
    const savedOrder = stored?.tableRowOrder?.supplierTable || [];
    const map = new Map(savedOrder.map((c: any) => [c.name, c]));
    const merged = headersData.map((h: any) => {
      const saved:any = map.get(h.field);
      return {
        name: h.field,
        headerName: h.headerName,
        isVisible: saved?.isVisible ?? true,
        width: saved?.width ?? 150
      };
    });
    const ordered = savedOrder.length
      ? savedOrder
        .map((s: any) => merged.find((m:any) => m.name === s.name))
        .filter(Boolean)
        .concat(merged.filter((m:any) => !map.has(m.name)))
      : merged;
    setViewSettings(ordered);
  }, [openModal, headersData]);

  const closeModal = () => {
    setOpenModal(false);
  }

  const OnSaveView = () => {
    const stored = JSON.parse(localStorage.getItem("settingsConfig") || "{}");
    stored.tableRowOrder = stored.tableRowOrder || {};
    stored.tableRowOrder.supplierTable = viewSettings.map((v) => ({
      name: v.name,
      isVisible: v.isVisible,
      width: v.width
    }));
    localStorage.setItem("settingsConfig", JSON.stringify(stored));
    SettingsRefetch({
      body: { "settingsConfig": stored, "pageAccess": [] }
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedRows([]);
  };

  const DeleteItem = async () => {
    if (selectedRows.length === 0) return;
    const codes = selectedRows.map(r => r.supplierCode);
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
        resetPagination();
        reloadPageData({ path: `?page=0&size=${PAGE_SIZE}` });
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

  useEffect(() => {
    const sub = supplierUpdateStream$.subscribe({
      next: (res) => res,
      error: (err) => err,
    });
    return () => sub.unsubscribe();
  }, []);

  const OnEditChange = (updateData: any) => {
    supplierUpdateSubject.next(updateData);
    if (updateData?.supplierCode) {
      setTableData(prev => prev.map(r => r.supplierCode === updateData.supplierCode ? { ...r, ...updateData } : r));
      allDataRef.current = allDataRef.current.map(r => r.supplierCode === updateData.supplierCode ? { ...r, ...updateData } : r);
    }
  };

  const handleNew = () => navigate("/supplier/create");


  return (
    <div className="p-[12px]">
      {tableHeader.length != 0 && (
        <div className="flex items-center justify-between px-1 py-2">
          <div className="flex items-center w-[15rem] pr-3 gap-2 bg-white border-gray-500/30 border-2 hover:border-[#357DE8] focus-within:border-[#357DE8] h-[39px] rounded-[5px] overflow-hidden">
            <input
              className="w-full h-full pl-5 outline-none placeholder-gray-500 text-sm"
              placeholder="Search for Suppliers"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {isSearchMode && suppliersSearchLoading
              ? <span className="pr-1 text-gray-400 text-xs animate-pulse">…</span>
              : searchQuery
                ? <IoClose size={20} color="#6a7282" className="cursor-pointer flex-shrink-0 mr-1" onClick={clearSearch} />
                : <IoSearchOutline size={25} color="#6a7282" className="flex-shrink-0" />
            }
          </div>

          <div className="flex gap-2 items-center">

            <AntTooltip title="Create Supplier">
              <PButton variant="solid" color="primary" onClick={handleNew}><IoMdAddCircleOutline size={25} /></PButton>
            </AntTooltip>

            <AntTooltip title="View Settings">
              <PButton variant="outlined" onClick={() => setOpenModal(true)}><LuSettings2 size={20} /></PButton>
            </AntTooltip>
          </div>
        </div>
      )
      }

      {suppliersPageLoading && !initialDataLoaded.current && headersLoading && (
        <SkeletonLoader></SkeletonLoader>
      )}

      {tableData.length > 0 && (
        <Table
          TableName="supplierTable"
          Idlinkpath="supplier"
          idkey="supplierCode"
          TableHeader={tableHeader}
          TableData={tableData}
          HeaderLoading={headersLoading}
          DataLoading={suppliersPageLoading && !initialDataLoaded.current}
          checkbox={true}
          selectedRows={selectedRows}
          onSelectionChange={(rows) => {
            setSelectedRows(rows);
            setDeleteDialogOpen(rows.length > 0);
          }}
          onRowChange={(rowIndex, updatedRow) => OnEditChange(updatedRow)}
          onSortClear={() => {
            resetPagination();
            reloadPageData({ path: `?page=0&size=${PAGE_SIZE}` });
          }}
          hasMore={hasMore && !isSearchMode}
          isFetchingMore={isFetchingMore}
          onLoadMore={loadNextPage}
        />
      )}

      {(!suppliersPageLoading || initialDataLoaded.current) &&
        !headersLoading &&
        tableHeader.length > 0 &&
        tableData.length === 0 && (
          <Result
            status="404"
            title={searchQuery.trim() ? `No results for "${searchQuery}"` : "NO SUPPLIERS FOUND"}
            subTitle=""
            extra={
              searchQuery.trim()
                ? <PButton type="default" onClick={clearSearch}>Clear Search</PButton>
                : <PButton type="primary" onClick={handleNew}>
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

            {/* <PButton variant="solid" color="primary">
              Bulk Action
            </PButton> */}

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
}


export default SupplierList;