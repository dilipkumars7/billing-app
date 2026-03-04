import React, { useEffect, useState, useRef } from "react";
import Table from "../../components/Table";
import { useApi } from "../../hooks/useApi";
import { PATH } from "../../constants/app.constant";
import SkeletonLoader from "../../components/SkeletonLoader";
import Button from '@mui/joy/Button';
import { Button as PButton, Result, Tag } from "antd";
import Tooltip from '@mui/joy/Tooltip';
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

const InvoiceList: React.FC = () => {
  const notificationApi = useNotification();
  const [searchParams] = useSearchParams();

  const { data: invoicesData, loading: invoicesLoading, error: invoicesError, refetch: reloadData } =
    useApi<any[]>(`${PATH.INVOICES_DATA}/all/${CookieService.get('companyId')}`, { method: "GET" });

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
  const [searchKeyword, setSearchKeyword] = useState("");

  const pendingDeleteConfirmations = useRef<Record<string, number>>({});
  const userSettings = useSelector((state: RootState) => state.userSettings.settings);
  const lastFetchRef = useRef<string | null>(null);

  const defaultHeaders = [
    { headerName: "Invoice Code", field: "invoiceNumber", type: "text", isEditable: false },
    { headerName: "Customer", field: "customerName", type: "text", isEditable: false },
    { headerName: "Date", field: "invoiceDate", type: "date", isEditable: false },
    { headerName: "Due Date", field: "dueDate", type: "date", isEditable: false },
    { headerName: "Status", field: "status", type: "select", isEditable: true },
    { headerName: "Total", field: "totalAmount", type: "number", isEditable: false },
    { headerName: "Paid", field: "paidAmount", type: "number", isEditable: false },
    { headerName: "Balance", field: "balanceDue", type: "number", isEditable: false },
  ];

  useEffect(() => {
    const sortBy = searchParams.get("sortBy");
    const direction = searchParams.get("direction");
    if (!sortBy || !direction) return;
    const key = `${sortBy}_${direction}`;
    if (lastFetchRef.current === key) return;

    lastFetchRef.current = key;
    reloadData({
      path: `?sortBy=${sortBy}&direction=${direction}`,
    });
  }, [searchParams, reloadData]);

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
    let storedSettings = {};

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
        return {
          headerName: header.headerName,
          field: header.field,
          defaultWidth: stored?.width || getDefaultWidth(header.headerName),
          type: header.type,
          isEditable: header.isEditable,
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
    if (!invoicesData || !tableHeader.length) return;

    const fields = tableHeader.map(h => h.field);
    const formatted = invoicesData.map(item => {
      const out: any = {};
      fields.forEach(field => {
        out[field] = item[field];
      });
      out.invoiceNumber = item.invoiceNumber;
      return out;
    });
    setTableData(formatted);
  }, [invoicesData, tableHeader]);

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
        .map((s: any) => merged.find((m) => m.name === s.name))
        .filter(Boolean)
        .concat(merged.filter((m) => !map.has(m.name)))
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
        await reloadData();
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
    if (updateData?.invoiceNumber) {
      setTableData(prev => prev.map(r => r.invoiceNumber === updateData.invoiceNumber ? { ...r, ...updateData } : r));
    }
  };

  const handleNew = () => navigate("/invoice/create");

  const filteredData = searchKeyword
    ? tableData.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(searchKeyword.toLowerCase())
      )
    )
    : tableData;

  return (
    <div className="p-[12px]">
      {tableHeader.length !== 0 && (
        <div className="flex items-center justify-between px-1 py-2">
          <div className="flex items-center w-[15rem] pr-3 gap-2 bg-white border-gray-500/30 border-2 hover:border-[#357DE8] focus-within:border-[#357DE8] h-[39px] rounded-[5px] overflow-hidden">
            <input
              className="w-full h-full pl-5 outline-none placeholder-gray-500 text-sm"
              placeholder="Search for Invoices"
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <IoSearchOutline size={25} color="#6a7282" />
          </div>

          <div className="flex gap-2 items-center">
            <Tooltip title="Add Invoice" variant="solid" placement="top">
              <Button size="sm" onClick={handleNew}>
                <IoMdAddCircleOutline size={25} />
              </Button>
            </Tooltip>

            <Tooltip title="View Settings" variant="solid" placement="top">
              <Button size="sm" variant="outlined" onClick={() => { setOpenModal(true) }}>
                <LuSettings2 size={20} />
              </Button>
            </Tooltip>
          </div>
        </div>
      )}

      {invoicesLoading && (
        <SkeletonLoader></SkeletonLoader>
      )}

      {filteredData.length > 0 && (
        <Table
          TableName="invoiceTable"
          Idlinkpath="invoice"
          idkey="invoiceNumber"
          TableHeader={tableHeader}
          TableData={filteredData}
          HeaderLoading={headersLoading}
          DataLoading={invoicesLoading}
          checkbox={true}
          selectedRows={selectedRows}
          onSelectionChange={(rows) => {
            setSelectedRows(rows);
            setDeleteDialogOpen(rows.length > 0);
          }}
          onRowChange={(rowIndex, updatedRow) => OnEditChange(updatedRow)}
          onSortClear={() => reloadData()}
        />
      )}

      {!invoicesLoading &&
        tableHeader.length > 0 &&
        filteredData.length === 0 && (
          <Result
            status="404"
            title="NO INVOICES FOUND"
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
}

export default InvoiceList;
