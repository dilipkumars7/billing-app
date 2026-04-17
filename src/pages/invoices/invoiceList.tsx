import React, { useEffect, useState, useRef, useCallback } from "react";
import Table from "../../components/Table";
import { useApi } from "../../hooks/useApi";
import { PATH } from "../../constants/app.constant";
import SkeletonLoader from "../../components/SkeletonLoader";
import {
  Button as PButton, Result, Tag, Badge,
  Tooltip as AntTooltip, Drawer, Select,
  Slider, Divider as AntDivider,
} from "antd";
import { IoSearchOutline } from "react-icons/io5";
import { IoMdAddCircleOutline } from "react-icons/io";
import { LuSettings2 } from "react-icons/lu";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { Modal } from "antd";
import ViewSettingsList from "../../components/ViewSettingsList";
import { CookieService } from "../../store/Cookie";
import { IoClose } from "react-icons/io5";
import { useNotification } from "../../components/provider/NotificationProvider";
import { invoiceUpdateSubject, invoiceUpdateStream$ } from "../../services/updateStream";

const PAGE_SIZE = 15;

const InvoiceList: React.FC = () => {
  const notificationApi = useNotification();
  const [searchParams] = useSearchParams();
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
    data: invoicesPageData,
    loading: invoicesPageLoading,
    error: invoicesAllError,
    refetch: reloadPageData,
  } = useApi<{ content: any[]; totalElements: number; last: boolean }>(
    `${PATH.INVOICES_DATA}/all/${companyId}`,
    { method: "GET", autoFetch: false }
  );

  const { data: invoicesSearchData, loading: invoicesSearchLoading, error: invoicesSearchError, refetch: reloadSearchData } =
    useApi<any[]>(`${PATH.INVOICES_DATA}/search`, { method: "GET", autoFetch: false });

  const { data: headersData, loading: headersLoading, error: headersError } =
    useApi<any[]>(PATH.GET_CONFIG_HEADER + '/invoices', { method: "GET" });

  const { data: Settings, loading: SettingsLoading, error: SettingsError, refetch: SettingsRefetch } =
    useApi<any[]>(`${PATH.USER_SETTINGS}/${CookieService.get('user_id')}`, { method: "PUT", autoFetch: false });

  const { data: DeleteData, error: DeleteError, refetch: DeleteRefetch } =
    useApi<any[]>(`${PATH.INVOICES_DATA}`, { method: "DELETE", autoFetch: false });

  const [openModal, setOpenModal] = useState(false);
  const [tableHeader, setTableHeader] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const navigate = useNavigate();
  const [viewSettings, setViewSettings] = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [deleteLoad, setDeleteLoad] = useState(false);

  const pendingDeleteConfirmations = useRef<Record<string, number>>({});
  const userSettings = useSelector((state: RootState) => state.userSettings.settings);
  const lastSortKeyRef = useRef<string | null>(null);
  const initialFetchTriggered = useRef(false);

  const statusColorMap: Record<string, string> = {
    DRAFT: "default",
    SENT: "processing",
    PAID: "success",
    PARTIALLY_PAID: "orange",
    OVERDUE: "error",
    CANCELLED: "default"
  };

  const defaultHeaders = [
    { headerName: "Invoice Code", field: "invoiceNumber", type: "text", isEditable: false },
    { headerName: "Customer", field: "customerName", type: "text", isEditable: false },
    { headerName: "Date", field: "invoiceDate", type: "date", isEditable: false },
    { headerName: "Due Date", field: "dueDate", type: "date", isEditable: false },
    { headerName: "Status", field: "status", type: "select", isEditable: true, isTag: true, tagColor: (value: string) => statusColorMap[value] || "default" },
    { headerName: "Payment Type", field: "paymentType", type: "text", isEditable: false },
    { headerName: "Total", field: "totalAmount", type: "number", isEditable: false },
    { headerName: "Paid", field: "paidAmount", type: "number", isEditable: false },
    { headerName: "Balance", field: "balanceDue", type: "number", isEditable: false },
  ];

  const resetPagination = useCallback(() => {
    allDataRef.current = [];
    setCurrentPage(0);
    setHasMore(true);
    setIsFetchingMore(false);
    initialDataLoaded.current = false;
    initialFetchTriggered.current = false; // ← reset so sort/reload works
  }, []);

  useEffect(() => {
    const sortBy = searchParams.get("sortBy");
    const direction = searchParams.get("direction");
    const key = sortBy && direction ? `${sortBy}_${direction}` : null;
    if (key === lastSortKeyRef.current) return;
    lastSortKeyRef.current = key;

    resetPagination();
    initialFetchTriggered.current = true; // ← mark it
    const sortQuery = sortBy && direction
      ? `?page=0&size=${PAGE_SIZE}&sortBy=${sortBy}&direction=${direction}`
      : `?page=0&size=${PAGE_SIZE}`;
    reloadPageData({ path: sortQuery });
  }, [searchParams, reloadPageData, resetPagination]);

  useEffect(() => {
    const headers = headersData && headersData.length > 0 ? headersData : defaultHeaders;

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
      storedSettings?.tableRowOrder?.invoiceTable
        ? storedSettings.tableRowOrder.invoiceTable
        : [];

    const columnConfigMap = new Map(
      columnConfig.map((col: any) => [col.name, col])
    );

    const formattedHeaders = headers
      .map((header: any) => {
        const stored: any = columnConfigMap.get(header.field);
        const isStatusField = header.field === "status";
        return {
          headerName: header.headerName,
          field: header.field,
          defaultWidth: stored?.width || getDefaultWidth(header.headerName),
          type: header.type,
          isEditable: header.isEditable,
          isTag: header.isTag || isStatusField,
          tagColor: isStatusField 
            ? (value: string) => statusColorMap[value] || "default"
            : (typeof header.tagColor === "function" ? header.tagColor : header.tagColor || "blue"),
          isVisible: stored?.isVisible !== undefined ? stored.isVisible : true,
          options: optionsMap[header.field] ?? []
        };
      })
      .filter((header: any) => header.isVisible)
      .sort((a: any, b: any) => {
        const indexA = columnConfig.findIndex((c: any) => c.name === a.field);
        const indexB = columnConfig.findIndex((c: any) => c.name === b.field);
        return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
      });

    setTableHeader(formattedHeaders);
  }, [headersData, userSettings, openModal]);

  useEffect(() => {
    if (!tableHeader.length) return;
    if (initialFetchTriggered.current) return; // ← skip if already fired above

    if (allDataRef.current.length === 0 && !initialDataLoaded.current) {
      const sortBy = searchParams.get("sortBy");
      const direction = searchParams.get("direction");
      const sortQuery = sortBy && direction
        ? `?page=0&size=${PAGE_SIZE}&sortBy=${sortBy}&direction=${direction}`
        : `?page=0&size=${PAGE_SIZE}`;
      initialFetchTriggered.current = true;
      reloadPageData({ path: sortQuery });
    }
  }, [tableHeader, searchParams, reloadPageData]);

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
      });
    }
    if (DeleteError && !deleteLoad) {
      notificationApi.error({
        message: "Error deleting invoice",
        description: JSON.stringify(DeleteError)
      });
    }
  }, [Settings, SettingsError, DeleteData, DeleteError, deleteLoad, notificationApi]);

  useEffect(() => {
    const sub = invoiceUpdateStream$.subscribe({
      next: () => {
        const sortBy = searchParams.get("sortBy");
        const direction = searchParams.get("direction");
        const sortQuery = sortBy && direction
          ? `?page=${currentPage}&size=${PAGE_SIZE}&sortBy=${sortBy}&direction=${direction}`
          : `?page=${currentPage}&size=${PAGE_SIZE}`;
        reloadPageData({ path: sortQuery });
      },
      error: (err: any) => console.error("Invoice update error:", err)
    });
    return () => sub.unsubscribe();
  }, [searchParams, currentPage, reloadPageData]);

  const applyHeaderFilter = useCallback((items: any[]) => {
    if (!tableHeader.length) return items;
    const fields = tableHeader.map(h => h.field);
    return items.map(item => {
      const out: any = {};
      fields.forEach(field => { out[field] = item[field]; });
      out.invoiceNumber = item.invoiceNumber;
      return out;
    });
  }, [tableHeader]);

  useEffect(() => {
  if (!invoicesPageData || isSearchMode) return;
  const incoming = invoicesPageData.content ?? (Array.isArray(invoicesPageData) ? invoicesPageData : []);
  const isLastPage: boolean = invoicesPageData.last ?? (incoming.length < PAGE_SIZE);
  const filtered = applyHeaderFilter(incoming);
  if (currentPage === 0) {
    allDataRef.current = filtered;
  } else {
    allDataRef.current = [...allDataRef.current, ...filtered];
  }

  setTableData([...allDataRef.current]);
  setHasMore(!isLastPage);
  setIsFetchingMore(false);
  initialDataLoaded.current = true;
}, [invoicesPageData, isSearchMode, applyHeaderFilter, currentPage]);

  useEffect(() => {
    if (!isSearchMode) return;

    if (invoicesSearchError) {
      notificationApi.error({
        message: 'Search failed',
        description: (invoicesSearchError as any)?.message || 'Could not fetch search results.',
      });
      setIsSearchMode(false);
      setTableData([...allDataRef.current]);
      return;
    }

    if (invoicesSearchData !== undefined && invoicesSearchData !== null) {
      setTableData(applyHeaderFilter(invoicesSearchData));
    }
  }, [invoicesSearchData, invoicesSearchError, isSearchMode, notificationApi, applyHeaderFilter]);

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
    if (!hasMore || isFetchingMore || isSearchMode || invoicesPageLoading) return;

    setIsFetchingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);

    const sortBy = searchParams.get("sortBy");
    const direction = searchParams.get("direction");
    const sortQuery = sortBy && direction
      ? `?page=${nextPage}&size=${PAGE_SIZE}&sortBy=${sortBy}&direction=${direction}`
      : `?page=${nextPage}&size=${PAGE_SIZE}`;

    reloadPageData({ path: sortQuery });
  }, [hasMore, isFetchingMore, isSearchMode, invoicesPageLoading, currentPage, searchParams, reloadPageData]);

  const optionsMap: Record<string, any[]> = {
    status: [
      { label: "Draft", value: "DRAFT" },
      { label: "Sent", value: "SENT" },
      { label: "Paid", value: "PAID" },
      { label: "Partially Paid", value: "PARTIALLY_PAID" },
      { label: "Overdue", value: "OVERDUE" },
      { label: "Cancelled", value: "CANCELLED" }
    ]
  };

  useEffect(() => {
    if (!openModal) return;
    const headers = headersData && headersData.length > 0 ? headersData : defaultHeaders;
    const stored = JSON.parse(localStorage.getItem("settingsConfig") || "{}");
    const savedOrder = stored?.tableRowOrder?.invoiceTable || [];
    const map = new Map(savedOrder.map((c: any) => [c.name, c]));
    const merged = headers.map((h: any) => {
      const saved: any = map.get(h.field);
      return {
        name: h.field,
        headerName: h.headerName,
        isVisible: saved?.isVisible ?? true,
        width: saved?.width ?? 150,
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
  };

  const OnSaveView = () => {
    const stored = JSON.parse(localStorage.getItem("settingsConfig") || "{}");
    stored.tableRowOrder = stored.tableRowOrder || {};
    stored.tableRowOrder.invoiceTable = viewSettings.map((v) => ({
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
    const numbers = selectedRows.map(r => r.invoiceNumber);
    setDeleteLoad(true);
    try {
      const deletePromises = numbers.map(num => {
        const fallbackTimeout = window.setTimeout(() => { }, 5000);
        pendingDeleteConfirmations.current[num] = fallbackTimeout;
        return DeleteRefetch({ path: `/${num}` });
      });
      await Promise.all(deletePromises);
      await new Promise(resolve => setTimeout(resolve, 1200));
      const pendingLeft = Object.keys(pendingDeleteConfirmations.current);
      if (pendingLeft.length > 0) {
        pendingLeft.forEach(num => {
          clearTimeout(pendingDeleteConfirmations.current[num]);
          delete pendingDeleteConfirmations.current[num];
        });
        resetPagination();
        reloadPageData({ path: `?page=0&size=${PAGE_SIZE}` });
      }
      closeDeleteDialog();
    } catch (err) {
      notificationApi.error({
        message: 'Error deleting invoices',
        description: JSON.stringify(err)
      });
    } finally {
      setDeleteLoad(false);
    }
  };

  const OnEditChange = (updateData: any) => {
    invoiceUpdateSubject.next(updateData);
    if (updateData?.invoiceNumber) {
      setTableData(prev =>
        prev.map(r => r.invoiceNumber === updateData.invoiceNumber ? { ...r, ...updateData } : r)
      );
      allDataRef.current = allDataRef.current.map(r =>
        r.invoiceNumber === updateData.invoiceNumber ? { ...r, ...updateData } : r
      );
      setTimeout(() => {
        const loadedCount = allDataRef.current.length;
        const pagesToReload = Math.ceil(loadedCount / PAGE_SIZE) || 1;
        const sortBy = searchParams.get("sortBy");
        const direction = searchParams.get("direction");
        const sortQuery = sortBy && direction
          ? `?page=0&size=${pagesToReload * PAGE_SIZE}&sortBy=${sortBy}&direction=${direction}`
          : `?page=0&size=${pagesToReload * PAGE_SIZE}`;

        reloadPageData({ path: sortQuery });
      }, 1000);
    }
  };

  const handleNew = () => navigate("/invoice/create");

  return (
    <div className="p-[12px]">
      {tableHeader.length !== 0 && (
        <div className="flex items-center justify-between px-1 py-2">
          <div className="flex items-center w-[15rem] pr-3 gap-2 bg-white border-gray-500/30 border-2 hover:border-[#357DE8] focus-within:border-[#357DE8] h-[39px] rounded-[5px] overflow-hidden">
            <input
              className="w-full h-full pl-5 outline-none placeholder-gray-500 text-sm"
              placeholder="Search for Invoices"
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {isSearchMode && invoicesSearchLoading
              ? <span className="pr-1 text-gray-400 text-xs animate-pulse">…</span>
              : searchQuery
                ? <IoClose size={20} color="#6a7282" className="cursor-pointer flex-shrink-0 mr-1" onClick={clearSearch} />
                : <IoSearchOutline size={25} color="#6a7282" className="flex-shrink-0" />
            }
          </div>

          <div className="flex gap-2 items-center">
            <AntTooltip title="Create Invoice">
              <PButton variant="solid" color="primary" onClick={handleNew}><IoMdAddCircleOutline size={25} /></PButton>
            </AntTooltip>

            <AntTooltip title="View Settings">
              <PButton variant="outlined" onClick={() => setOpenModal(true)}><LuSettings2 size={20} /></PButton>
            </AntTooltip>
          </div>
        </div>
      )}

      {invoicesPageLoading && !initialDataLoaded.current && headersLoading && (
        <SkeletonLoader></SkeletonLoader>
      )}

      {tableData.length > 0 && (
        <Table
          TableName="invoiceTable"
          Idlinkpath="invoice"
          idkey="invoiceNumber"
          TableHeader={tableHeader}
          TableData={tableData}
          HeaderLoading={headersLoading}
          DataLoading={invoicesPageLoading && !initialDataLoaded.current}
          checkbox={false}
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

      {(!invoicesPageLoading || initialDataLoaded.current) &&
        !headersLoading &&
        tableHeader.length > 0 &&
        tableData.length === 0 && (
          <Result
            status="404"
            title={searchQuery.trim() ? `No results for "${searchQuery}"` : "NO INVOICES FOUND"}
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

export default InvoiceList;
