import styled from '@emotion/styled';
import React, { useEffect, useState, useRef } from "react";
import { useApi } from "../../hooks/useApi";
import { PATH } from "../../constants/app.constant";
import { useNavigate, useParams } from 'react-router';
import { Checkbox, Tag, Button as PButton, Tabs, TabsProps, Table } from 'antd';
import { IoClose } from 'react-icons/io5';
import { EditOutlined } from '@ant-design/icons';
import StickyBox from 'react-sticky-box';
import { CookieService } from '../../store/Cookie';
import { use } from 'react';

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
  .prize { font-size: 9px; }
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
  overflow-y: auto;  
  overflow-x: hidden;
  h1, h2, h3 { margin: 0 0 16px 0; }
  section    { margin-bottom: 24px; }
`;

const ItemDetailsHeader = styled.div`
  position: sticky;
  top: -24px;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding-top: 9px;
  padding-bottom: 3px;
`;

const TabsWrapper = styled.div`
  position: sticky;
  z-index: 15;
  background: #fff;
`;

const TabContentWrapper = styled.div`
  flex: 1;
  overflow-y: auto !important;
  -webkit-overflow-scrolling: touch;
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function PurchaseGet() {
  const companyId = CookieService.get('companyId') || '';

  // ── Pagination state ───────────────────────────────────────────────────────
  const [currentPage,    setCurrentPage]    = useState(0);
  const [hasMore,        setHasMore]        = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const allItemsRef        = useRef<any[]>([]);
  const initialDataLoaded  = useRef(false);

  // ── APIs ───────────────────────────────────────────────────────────────────
  const { data: purchasePageData, loading: purchaseLoading, refetch: reloadPurchases } =
    useApi<any>(`${PATH.PURCHASE_DATA}/all/${companyId}`, {
      method: 'GET',
      showOverlay: true,
    });
  
  const { data: supplierData, loading: supplierLoading, refetch: reloadSuppliers } = useApi<any>(
    `${PATH.SUPPLIERS_DATA}`, {
      method: 'GET',
      showOverlay: true,
      autoFetch: false,
    }
  );

  // ── Local state ────────────────────────────────────────────────────────────
  const [tableData,      setTableData]      = useState<any[]>([]);
  const [selectedItems,  setSelectedItems]  = useState<Set<string>>(new Set());
  const [supplier,       setSupplier]       = useState<any | null>({});

  const { id }  = useParams();
  const navigate = useNavigate();

  // ── Scroll / item refs ─────────────────────────────────────────────────────
  const listContainerRef  = useRef<HTMLDivElement | null>(null);
  const itemRefs          = useRef<Record<string, HTMLDivElement | null>>({});
  const previousIdRef     = useRef<string | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (purchasePageData) {
      const content = purchasePageData.content ?? (Array.isArray(purchasePageData) ? purchasePageData : []);
      setTableData(content);
      handleSelect(content.find((item: any) => item.purchaseCode === id) ?? content[0] ?? null);
    }
  }, [purchasePageData]);

  useEffect(() => {
    if (supplierData) {
      setSupplier(supplierData);
    }
  }, [supplierData]);

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
  const selectedItem = tableData.find(item => item.purchaseCode === id);

  const handleSelect = (item: any) => { 
    reloadSuppliers({
      path: `/${item.supplierId}`
    })
    navigate(`/purchase/${item.purchaseCode}`, { replace: true });
  }

  const toggleItem = (item: any) =>
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.has(item.purchaseCode) ? next.delete(item.purchaseCode) : next.add(item.purchaseCode);
      return next;
    });

  const toggleAll   = (checked: boolean) =>
    setSelectedItems(checked ? new Set(tableData.map(i => i.purchaseCode)) : new Set());

  const closeSelect = () => setSelectedItems(new Set());
  const Back        = () => navigate('/purchase');

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const tabItems = [
    {
      key: '1',
      label: 'Overview',
      children: selectedItem
        ? <PurchaseDetailsTab selectedItem={selectedItem} />
        : <div className="text-gray-500">Select a purchase</div>,
    }
  ];

  const handleTabChange = (key: string) => {
    // only one tab for overview
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
            'All Purchases'
          )}
        </ColumnHeader>

        <ColumnConent ref={listContainerRef}>
          {tableData.map(item => (
            <ColumnItem
              key={item.purchaseCode}
              ref={el => { itemRefs.current[item.purchaseCode] = el; }}
              data-selected={item.purchaseCode === id}
              onClick={() => handleSelect(item)}
            >
              <Checkbox
                checked={selectedItems.has(item.purchaseCode)}
                onClick={e => e.stopPropagation()}
                onChange={() => toggleItem(item)}
              />
              <div style={{ flex: 1 }}>
                <div className="title">{item.purchaseCode}</div>
                <div className="subtitle">Total Items: &nbsp;
                   {Number(item.purchaseTotalItems).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                </div>
              </div>
              <div className="text-[14px]">
                Rs: &nbsp;
                {Number(item.purchaseTotalCost).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            </ColumnItem>
          ))}

          {/* ── Infinite scroll trigger ── */}
          <LoadMoreTrigger ref={loadMoreTriggerRef}>
            {isFetchingMore
              ? 'Loading…'
              : hasMore
                ? ''
                : tableData.length > 0
                  ? 'All purchases loaded'
                  : ''
            }
          </LoadMoreTrigger>
        </ColumnConent>
      </Column>

      {/* ── Right panel ── */}
      <ItemDetails>
        {selectedItem ? (
          <ItemDetailsHeader>
            <div><h3>Purchase ID: {selectedItem.purchaseCode}</h3></div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* <PButton
                size="small"
                variant="outlined"
                color="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(`/purchase/${id}/edit`)}
              >
                Edit
              </PButton> */}
              <PButton size="small" variant="outlined" color="danger" onClick={Back}>
                <IoClose size={16} />
              </PButton>
            </div>
          </ItemDetailsHeader>
        ) : (
          'Select a purchase'
        )}

        {selectedItem && (
          <>
            {/* <TabsWrapper>
              <Tabs
                activeKey="1"
                items={tabItems}
                onChange={handleTabChange}
                animated={{ inkBar: true, tabPane: false }}
              />
            </TabsWrapper>

            <TabContentWrapper>
              {tabItems[0].children}
            </TabContentWrapper> */}
            <PurchaseDetailsTab selectedItem={selectedItem} supplier={supplier} />
          </>
        )}
      </ItemDetails>
    </Main>
  );
}

// ─── PurchaseDetailsTab ───────────────────────────────────────────────────────────

function PurchaseDetailsTab({ selectedItem, supplier }: { selectedItem: any; supplier: any }) {
  const ContainerBlock = styled.div`
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 13px;
    color: #000;
  `;
  const Title = styled.div`font-size: 14px; font-weight: 600; margin-bottom: 8px;`;
  const Grid  = styled.div`display: grid; grid-template-columns: 140px auto; row-gap: 10px;`;
  const Label = styled.div`color: #6b6b6b;`;
  const Value = styled.div`color: #000; font-weight: 500;`;

  const itemColumns = [
    { title: 'Item Code', dataIndex: 'itemCode', key: 'itemCode' },
    { title: 'Item Name', dataIndex: 'name', key: 'name' },
    { title: 'Unit', dataIndex: 'unit', key: 'unit' },
    { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Cost Price', dataIndex: 'costPrice', key: 'costPrice' },
    { title: 'Tax %', dataIndex: 'taxRate', key: 'taxRate' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div style={{ flex: 1 }}>
        <ContainerBlock>
          <Title>Primary Information</Title>
          <Grid>
            <Label>Purchase Code</Label>  <Value>{selectedItem.purchaseCode}</Value>
            <Label>Supplier</Label>       <Value>{selectedItem.supplierName || selectedItem.supplierId || 'N/A'}</Value>
            <Label>Account Type</Label>   <Value>{selectedItem.purchaseAccount || 'N/A'}</Value>
            <Label>Created By</Label>     <Value>{selectedItem.createdBy || 'N/A'}</Value>
          </Grid>
        </ContainerBlock>
        <ContainerBlock style={{marginTop:"1rem"}}>
          <Title>Supplier Information</Title>
          <Grid>
            <Label>Name</Label>       <Value>{supplier?.supplierName || 'N/A'}</Value>
            <Label>Company</Label>    <Value>{supplier?.supplierCompanyName || 'N/A'}</Value>
            <Label>Email</Label>      <Value>{supplier?.supplierEmail || 'N/A'}</Value>
            <Label>GSTIN</Label>     <Value>{supplier?.supplierGstNo || 'N/A'}</Value>
          </Grid>
        </ContainerBlock>

      </div>

      {selectedItem.purchaseItems && selectedItem.purchaseItems.length > 0 && (
        <ContainerBlock style={{ width: '100%' }}>
          <Title>Purchase Items</Title>
          <Table 
            dataSource={selectedItem.purchaseItems} 
            columns={itemColumns} 
            rowKey={(record: any, index: any) => record.itemCode || index}
            pagination={false}
            size="small"
            bordered
          />
        </ContainerBlock>
      )}

      <ContainerBlock className='flex flex-col w-full items-end'style={{ marginTop: 2 }}>
          <Grid>
            <label className='font-semibold text-[14px] text-[#000]'>Purchase Summary</label> <Value></Value>
            <Label>Total Items</Label> 
            <Value>
              {Number(selectedItem.purchaseTotalItems).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </Value>
            <Label>Tax Rate </Label>    <Value>{selectedItem.purchaseTaxRate ?? 0} %</Value>
            <Label>Total Cost </Label>  
            <Value>
              Rs. {Number(selectedItem.purchaseTotalCost).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
            </Value>
          </Grid>
        </ContainerBlock>
    </div>
  );
}
