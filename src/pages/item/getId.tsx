import styled from '@emotion/styled';
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useApi } from "../../hooks/useApi";
import { PATH } from "../../constants/app.constant";
import { useLocation, useNavigate, useParams } from 'react-router';
import { Checkbox, Tag, Button as PButton, Tabs, TabsProps } from 'antd';
import { IoClose } from 'react-icons/io5';
import { EditOutlined } from '@ant-design/icons';
import { QRCodeCanvas } from 'qrcode.react';
import HistoryTab from '../../components/HistoryTab';
import StickyBox from 'react-sticky-box';
import { CookieService } from '../../store/Cookie';
import TransactionTab from '../../components/TransactionTab';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15;

// ─── Styled Components ────────────────────────────────────────────────────────

const Main = styled.div`
  display: flex;
  flex-grow: 1;
  overflow-y: auto;
  position: relative;
  height: 100%;
`;

const Column = styled.div`
  flex-shrink: 0;
  width: 360px;
  border-right: 1px solid rgb(228, 228, 228);
  display: flex;
  flex-direction: column;
  position: relative;
`;

const ColumnHeader = styled.div`
  height: 55px;
  border-bottom: 1px solid rgb(228, 228, 228);
  top: 0;
  width: 100%;
  position: sticky;
  display: flex;
  align-items: center;
  padding: 0 16px;
`;

const ColumnConent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  background-color: #fff;
`;

const ColumnItem = styled.div`
  display: flex;
  gap: 2rem;
  padding: 16px;
  cursor: pointer;
  border-bottom: 1px solid rgb(228, 228, 228);
  transition: background-color 0.15s ease;
  &:hover  { background-color: #f7f7f7; }
  &:active { background-color: #f0f0f0; }
  &[data-selected="true"] { background-color: #eef4ff; }
  .title    { font-size: 13px; font-weight: 500; color: #1a1a1a; }
  .subtitle { font-size: 12px; color: #6b6b6b; }
`;

const LoadMoreTrigger = styled.div`
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: #8c8c8c;
`;

const ItemDetails = styled.section`
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 24px;
  border-left: 1px solid rgb(228, 228, 228);
  background-color: #fff;
  overflow: hidden;
  h1, h2, h3 { margin: 0 0 16px 0; }
  section    { margin-bottom: 24px; }
`;

const ItemDetailsHeader = styled.div`
  position: sticky;
  top: -20px;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding-bottom: 4px;
`;

const TabsWrapper = styled.div`
  position: sticky;
  z-index: 15;
  background: #fff;
`;

const TabContentWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ItemGet() {
  const companyId = CookieService.get('companyId') || '';

  // ── Pagination state ───────────────────────────────────────────────────────
  const [currentPage,    setCurrentPage]    = useState(0);
  const [hasMore,        setHasMore]        = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const allItemsRef        = useRef<any[]>([]);
  const initialDataLoaded  = useRef(false);

  // ── APIs ───────────────────────────────────────────────────────────────────
  const { data: itemsPageData, loading: itemsLoading, refetch: reloadItems } =
    useApi<any>(`${PATH.GET_ITEMS_DATA}/getAll/${companyId}`, {
      method: 'GET',
      showOverlay: true,
    });

  const { data: itemsHistoryData, loading: itemsHistoryLoading, refetch: refetchHistoryData } =
    useApi<any[]>(PATH.GET_ITEMS_DATA, { method: 'GET', showOverlay: true, autoFetch: false });

  // ── Local state ────────────────────────────────────────────────────────────
  const [tableData,      setTableData]      = useState<any[]>([]);
  const [selectedItems,  setSelectedItems]  = useState<Set<string>>(new Set());

  const { id }  = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Scroll / item refs ─────────────────────────────────────────────────────
  const listContainerRef  = useRef<HTMLDivElement | null>(null);
  const itemRefs          = useRef<Record<string, HTMLDivElement | null>>({});
  const previousIdRef     = useRef<string | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (itemsPageData) {
      setTableData(itemsPageData);
    }
  }, [itemsPageData]);

  // ── Auto-scroll selected item into view ────────────────────────────────────
  useEffect(() => {
    if (!id || !tableData.length) return;
    const container = listContainerRef.current;
    const node      = itemRefs.current[id];
    if (!container || !node || previousIdRef.current === id) return;
    previousIdRef.current = id;
    const nr = node.getBoundingClientRect();
    const cr = container.getBoundingClientRect();
    if (!(nr.top >= cr.top && nr.bottom <= cr.bottom)) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [id, tableData]);

  // ── Item selection helpers ─────────────────────────────────────────────────
  const selectedItem = tableData.find(item => item.itemCode === id);

  const handleSelect = (itemCode: string) => navigate(`/item/${itemCode}`, { replace: true });

  const toggleItem = (item: any) =>
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.has(item.itemCode) ? next.delete(item.itemCode) : next.add(item.itemCode);
      return next;
    });

  const toggleAll   = (checked: boolean) =>
    setSelectedItems(checked ? new Set(tableData.map(i => i.itemCode)) : new Set());

  const closeSelect = () => setSelectedItems(new Set());
  const Back        = () => navigate('/item');

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const tabItems = [
    {
      key: '1',
      label: 'Overview',
      children: selectedItem
        ? <ItemDetailsTab selectedItem={selectedItem} />
        : <div className="text-gray-500">Select an item</div>,
    },
    {
      key: '2',
      label: 'Transactions',
      children: !itemsHistoryLoading && itemsHistoryData
        ? <TransactionTab history={itemsHistoryData} />
        : 'Loading transactions…',
    },
    {
      key: '3',
      label: 'History',
      children: !itemsHistoryLoading && itemsHistoryData
        ? <HistoryTab history={itemsHistoryData} />
        : 'Loading history…',
    },
  ];

  const activeTab = React.useMemo(() => {
    if (location.pathname.endsWith('/history'))      return '3';
    if (location.pathname.endsWith('/transactions')) return '2';
    return '1';
  }, [location.pathname]);

  useEffect(() => {
    if (!id) return;
    if (location.pathname.endsWith('/history') || location.pathname.endsWith('/transactions')) {
      refetchHistoryData({ path: `/history/${id}` });
    }
  }, [location.pathname, id]);

  const handleTabChange = (key: string) => {
    if (!id) return;
    const routes: Record<string, string> = {
      '2': `/item/${id}/transactions`,
      '3': `/item/${id}/history`,
    };
    navigate(routes[key] ?? `/item/${id}`, { replace: true });
  };

  const renderTabBar: TabsProps['renderTabBar'] = (props, DefaultTabBar) => (
    <StickyBox offsetTop={40} offsetBottom={20} style={{ zIndex: 1 }}>
      <DefaultTabBar {...props} />
    </StickyBox>
  );

  const isAllSelected   = tableData.length > 0 && selectedItems.size === tableData.length;
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < tableData.length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Main>
      {/* ── Left column ── */}
      <Column>
        <ColumnHeader>
          {selectedItems.size > 0 ? (
            <div className="flex justify-between items-center" style={{ flex: 1 }}>
              <div className="flex gap-2">
                <Checkbox
                  indeterminate={isIndeterminate}
                  checked={isAllSelected}
                  onChange={e => toggleAll(e.target.checked)}
                />
                <span className="text-[14px]">Bulk Action</span>
              </div>
              <div className="text-[12px] flex items-center">
                <Tag color="geekblue">{selectedItems.size}</Tag>
                <span>Selected</span>
                <PButton className="ml-2" size="small" variant="outlined" color="danger" onClick={closeSelect}>
                  <IoClose />
                </PButton>
              </div>
            </div>
          ) : (
            'All Items'
          )}
        </ColumnHeader>

        <ColumnConent ref={listContainerRef}>
          {tableData.map(item => (
            <ColumnItem
              key={item.itemCode}
              ref={el => { itemRefs.current[item.itemCode] = el; }}
              data-selected={item.itemCode === id}
              onClick={() => handleSelect(item.itemCode)}
            >
              <Checkbox
                checked={selectedItems.has(item.itemCode)}
                onClick={e => e.stopPropagation()}
                onChange={() => toggleItem(item)}
              />
              <div style={{ flex: 1 }}>
                <div className="title">{item.name}</div>
                <div className="subtitle">Qt: {item.quantity} {item.unit}</div>
              </div>
              <div className="price">Rs: {item.sellingPrice}</div>
            </ColumnItem>
          ))}

          {/* ── Infinite scroll trigger ── */}
          <LoadMoreTrigger ref={loadMoreTriggerRef}>
            {isFetchingMore
              ? 'Loading…'
              : hasMore
                ? ''
                : tableData.length > 0
                  ? 'All items loaded'
                  : ''
            }
          </LoadMoreTrigger>
        </ColumnConent>
      </Column>

      {/* ── Right panel ── */}
      <ItemDetails>
        {selectedItem ? (
          <ItemDetailsHeader>
            <div><h3>{selectedItem.name}</h3></div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <PButton
                size="small"
                variant="outlined"
                color="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(`/item/${id}/edit`)}
              >
                Edit
              </PButton>
              <PButton size="small" variant="outlined" color="danger" onClick={Back}>
                <IoClose size={16} />
              </PButton>
            </div>
          </ItemDetailsHeader>
        ) : (
          'Select an item'
        )}

        <TabsWrapper>
          <Tabs
            activeKey={activeTab}
            items={tabItems.map(({ children, ...rest }) => rest)}
            onChange={handleTabChange}
            animated={{ inkBar: true, tabPane: false }}
          />
        </TabsWrapper>

        <TabContentWrapper>
          {tabItems.find(tab => tab.key === activeTab)?.children}
        </TabContentWrapper>
      </ItemDetails>
    </Main>
  );
}

// ─── ItemDetailsTab ───────────────────────────────────────────────────────────

function ItemDetailsTab({ selectedItem }: { selectedItem: any }) {
  const ContainerBlock = styled.div`
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 13px;
    color: #000;
  `;
  const Title = styled.div`font-size: 14px; font-weight: 600; margin-bottom: 8px;`;
  const Grid  = styled.div`display: grid; grid-template-columns: 140px auto; row-gap: 10px;`;
  const Label = styled.div`color: #6b6b6b;`;
  const Value = styled.div`color: #000; font-weight: 500;`;

  const qrRef = useRef<HTMLDivElement | null>(null);

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.href     = canvas.toDataURL('image/png');
    link.download = `${selectedItem.itemCode}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const customFieldEntries: [string, any][] = Object.entries(selectedItem.customFields ?? {});

  const formatKey = (key: string) =>
    key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, c => c.toUpperCase());

  const formatValue = (val: any): string => {
    if (val === null || val === undefined || val === '') return '—';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    return String(val);
  };

  return (
    <div className="flex">
      <div style={{ flex: 1 }}>

        <ContainerBlock>
          <Title>Primary Information</Title>
          <Grid>
            <Label>SKU Code</Label>       <Value>{selectedItem.itemCode}</Value>
            <Label>Category</Label>       <Value>{selectedItem.category}</Value>
            <Label>Unit</Label>           <Value>{selectedItem.unit}</Value>
            <Label>Size</Label>           <Value>{selectedItem.size || 'N/A'}</Value>
            <Label>Pieces Per Box</Label> <Value>{selectedItem.boxQuantity}</Value>
            <Label>Tax Rate</Label>       <Value>{selectedItem.taxRate} %</Value>
          </Grid>
        </ContainerBlock>

        <ContainerBlock style={{ marginTop: 8 }}>
          <Title>Sales Information</Title>
          <Grid>
            <Label>Selling Price</Label> <Value>Rs. {selectedItem.sellingPrice}</Value>
            <Label>Cost Price</Label>    <Value>Rs. {selectedItem.costPrice}</Value>
          </Grid>
        </ContainerBlock>

        <ContainerBlock style={{ marginTop: 8 }}>
          <Title>Stock Information</Title>
          <Grid>
            <Label>Quantity</Label> <Value>{selectedItem.quantity}</Value>
            <Label>Box Count</Label>    <Value>{selectedItem.boxQuantityInStock || "No Stock Available"}</Value>
          </Grid>
        </ContainerBlock>

        {customFieldEntries.length > 0 && (
          <ContainerBlock style={{ marginTop: 8 }}>
            <Title>Additional Information</Title>
            <Grid>
              {customFieldEntries.map(([key, value]) => (
                <React.Fragment key={key}>
                  <Label>{formatKey(key)}</Label>
                  <Value>{formatValue(value)}</Value>
                </React.Fragment>
              ))}
            </Grid>
          </ContainerBlock>
        )}

      </div>

      <div style={{ width: '50%' }} className="flex flex-col px-15">

        {/* ── Item Image ──────────────────────────────────────────────── */}
        <ContainerBlock style={{ marginBottom: 8 }}>
          <Title>Image</Title>
          <div className="flex flex-col gap-2 items-left h-[20vh] w-[30vh]">
            {selectedItem.imageUrl ? (
              <img
                src={selectedItem.imageUrl}
                alt={selectedItem.name}
                style={{
                  maxWidth: '30vh',
                  maxHeight: '20vh',
                  objectFit: 'contain',
                  borderRadius: 1,
                  border: '1px solid #e8e8e8',
                }}
              />
            ) : (
              /* No image stored — show a clear placeholder */
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  background: '#f5f5f5',
                  border: '2px dashed #d9d9d9',
                  borderRadius: 6,
                }}
              >
                {/* Simple image icon */}
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bfbfbf" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>No Image Available</span>
              </div>
            )}
          </div>
        </ContainerBlock>

        {/* ── Item QR ─────────────────────────────────────────────────── */}
        <ContainerBlock style={{ marginTop: 8 }}>
          <Title>Item QR</Title>
          <div className="flex flex-col gap-2 items-left">
            <div ref={qrRef} className="border-2 border-[#000000] w-fit p-1">
              <QRCodeCanvas
                value={selectedItem.itemCode}
                size={128}
                bgColor="#ffffff"
                fgColor="#000000"
                level="L"
                minVersion={6}
              />
            </div>
            <PButton variant="outlined" size="small" color="primary" style={{ width: 138 }} onClick={downloadQR}>
              Download QR
            </PButton>
          </div>
        </ContainerBlock>

      </div>
    </div>
  );
}