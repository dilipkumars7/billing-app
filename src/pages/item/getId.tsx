import styled from '@emotion/styled';
import React, { useEffect, useState, useRef } from "react";
import { useApi } from "../../hooks/useApi";
import { PATH } from "../../constants/app.constant";
import { useLocation, useNavigate, useParams } from 'react-router';
import { Checkbox, Tag, Button as PButton, Tabs, TabsProps } from 'antd';
import { IoClose } from 'react-icons/io5';
import {QRCodeCanvas} from 'qrcode.react';
import HistoryTab from '../../components/HistoryTab';
import StickyBox from 'react-sticky-box';


export default function ItemGet() {

  
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
  `

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
    /* Smooth scrolling experience */
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
    &:hover {
      background-color: #f7f7f7;
    }
    &:active {
      background-color: #f0f0f0;
    }
    /* Optional selected state support */
    &[data-selected="true"] {
      background-color: #eef4ff;
    }
    /* Primary text */
    .title {
      font-size: 13px;
      font-weight: 500;
      color: #1a1a1a;
    }
    .titleRs{
      font-size: 14px;
      font-weight: 500;
      color: #1a1a1a;
    }
    /* Secondary metadata */
    .subtitle {
      font-size: 12px;
      color: #6b6b6b;
    }
  `;

  const ItemDetails = styled.section`
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding: 24px;
    overflow-y: auto;
    border-left: 1px solid rgb(228, 228, 228);
    background-color: #fff;
    /* Improve long content readability */
    overflow: hidden;
    h1,
    h2,
    h3 {
      margin: 0 0 16px 0;
    }
    section {
      margin-bottom: 24px;
    }
  `;

  const ItemDetailsHeader = styled.div`
    position: sticky;
    top: -20px;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
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

  const BulkButton = styled.button`
    background: none;
    border: none;
    color: #1677ff;
    font-size: 13px;
    cursor: pointer;
    padding: 4px 8px;

    &:hover {
      background-color: rgba(22, 119, 255, 0.08);
      border-radius: 4px;
    }
  `;

  const { data: itemsData, loading: itemsLoading, error: itemsError, refetch:reloadData } =
      useApi<any[]>(PATH.GET_ITEMS_DATA, { method: "GET", showOverlay: true});

  const { data: itemsHistoryData, loading: itemsHistoryLoading, error: itemsHistoryError, refetch:refetchHistoryData } =
      useApi<any[]>(PATH.GET_ITEMS_DATA, { method: "GET", showOverlay: true, autoFetch: false});
    
  const [tableData, setTableData] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { id } = useParams(); // 👈 matches :id
  const navigate = useNavigate();

  useEffect(() => {
    if(itemsData){
      setTableData(itemsData);
    }
  }, [itemsData])

  const handleSelect = (itemCode:string) => {
    navigate(`/item/${itemCode}`, { replace: true });
  };

  const selectedItem = tableData.find(
    (item) => item.itemCode === id
  );

  const toggleItem = (item: any) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(item.itemCode)) {
        next.delete(item.itemCode);
      } else {
        next.add(item.itemCode);
      }
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedItems(
      checked ? new Set(tableData.map(i => i.itemCode)) : new Set()
    );
  };

  const closeSelect = () => {
    setSelectedItems(new Set());
  }
  
  const Back = () => {
    navigate(`/item`);
  }

  const tabItems = [
    {
      key: '1',
      label: `Overview`,
      children: selectedItem ? (
        <ItemDetailsTab selectedItem={selectedItem} />
      ) : (
        <div className="text-gray-500">
          Select an item
        </div>
      ),
    },
    {
      key: '2',
      label: `Transactions`,
    },
    {
      key: '3',
      label: `History`,
      children: (!itemsHistoryLoading && itemsHistoryData) ? (
        <HistoryTab history={itemsHistoryData} />
      ) : (
        "Loading history..."
      ),
    }
  ]

  const isAllSelected =
    tableData.length > 0 && selectedItems.size === tableData.length;

  const isIndeterminate =
    selectedItems.size > 0 && selectedItems.size < tableData.length;
  
  const location = useLocation();
  
  const activeTab = React.useMemo(() => {
    if (location.pathname.endsWith("/history")){
      return "3";
    } 
    if (location.pathname.endsWith("/transactions")) return "2";
    return "1";
  }, [location.pathname]);

  useEffect(() => {
    if (!id) return;
    if (location.pathname.endsWith("/history")) {
      GetHistory();
    }
  }, [location.pathname, id]);

  const handleTabChange = (key: string) => {
    if (!id) return;
    switch (key) {
      case "2":
        navigate(`/item/${id}/transactions`, { replace: true });
        break;
      case "3":
        navigate(`/item/${id}/history`, { replace: true });
        break;
      default:
        navigate(`/item/${id}`, { replace: true });
    }
  };

  const GetHistory = () => {
    refetchHistoryData({path:`/history/${id}`});
  }


  const renderTabBar: TabsProps['renderTabBar'] = (props, DefaultTabBar) => (
    <StickyBox offsetTop={40} offsetBottom={20} style={{ zIndex: 1 }}>
      <DefaultTabBar {...props} />
    </StickyBox>
  );

  return (
    <Main>
      <Column>
        <ColumnHeader>
          {selectedItems.size > 0 && (
            <div className='flex justify-between items-center' style={{flex:1}}>
              <div className='flex gap-2'>
                <Checkbox
                  indeterminate={isIndeterminate}
                  checked={isAllSelected}
                  onChange={e => toggleAll(e.target.checked)}
                />
                <span className='text-[14px]'>Bulk Action</span>
              </div>
              <div className='text-[12px] flex items-center'>
                <Tag color="geekblue">
                  {selectedItems.size}
                </Tag>
                <span>Selected</span>
                <PButton className='ml-2' size={'small'} variant="outlined" color="danger" onClick={closeSelect}>
                  <IoClose />
                </PButton>
              </div>
            </div>
          )}
          {selectedItems.size === 0 && (
            <>
              All Items
            </>
          )}
        </ColumnHeader>
        <ColumnConent>
          {tableData.map(item => {
            const checked = selectedItems.has(item.itemCode);
            return (
              <ColumnItem
                key={item.itemCode}
                data-selected={item.itemCode === id}
                onClick={() => handleSelect(item.itemCode)}
              >
                <Checkbox
                  checked={checked}
                  onClick={e => e.stopPropagation()}
                  onChange={() => toggleItem(item)}
                />

                <div style={{ flex: 1 }}>
                  <div className="title">{item.name}</div>
                  <div className="subtitle">
                    Qt: {item.quantity} {item.unit}
                  </div>
                </div>

                <div className="price">Rs: {item.sellingPrice}</div>
              </ColumnItem>
            )
          })}
          {/* {tableData.map(item => {})} */}
        </ColumnConent>
      </Column>
      <ItemDetails>
        {selectedItem ? (
          <ItemDetailsHeader>
            <div>
              <h3>{selectedItem.name}</h3>
            </div>
            <div>
              <PButton variant="outlined" size='small' color="danger" onClick={Back} >
                <IoClose size={16} />
              </PButton>
            </div>
          </ItemDetailsHeader>
        ) : (
          "Select an item"
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
  )
}
function ItemDetailsTab({ selectedItem }: { selectedItem: any }) {
  const Container = styled.div`
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
      Roboto, Helvetica, Arial, sans-serif;
    font-size: 13px;
    color: #000;
  `;

  const Title = styled.div`
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
  `;

  const Grid = styled.div`
    display: grid;
    grid-template-columns: 140px auto;
    row-gap: 10px;
  `;

  const Label = styled.div`
    color: #6b6b6b;
  `;

  const Value = styled.div`
    color: #000;
    font-weight: 500;
  `;

  const qrRef = useRef<HTMLDivElement | null>(null);

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");

    link.href = image;
    link.download = `${selectedItem.itemCode}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className='flex'>
      <div style={{flex:1}}>
        <Container>
          <Title>Primary Information</Title>
          <Grid>
              <React.Fragment key={selectedItem.itemId}>
                <Label>SKU Code</Label>
                <Value>{selectedItem.itemCode}</Value>
                <Label>Category</Label>
                <Value>{selectedItem.category}</Value>
                <Label>Unit</Label>
                <Value>{selectedItem.unit}</Value>
                <Label>Size</Label>
                <Value>{selectedItem.size}</Value>
                <Label>Quantity</Label>
                <Value>{selectedItem.quantity}</Value>
                <Label>Tax Rate</Label>
                <Value>{selectedItem.taxRate} %</Value>
              </React.Fragment>
          </Grid>
        </Container>
        <Container style={{marginTop: '8px'}}>
          <Title>Sales Information</Title>
          <Grid>
              <React.Fragment key={selectedItem.itemId}>
                <Label>Selling Price</Label>
                <Value>Rs. {selectedItem.sellingPrice}</Value>
                <Label>Cost Price</Label>
                <Value>Rs. {selectedItem.costPrice}</Value>
              </React.Fragment>
          </Grid>
        </Container>
        <Container style={{marginTop: '8px'}}>
          <Title>Item QR</Title>
          <div className='flex flex-col gap-2 items-left'>
            <div ref={qrRef} className='border-2 border-[#000000] w-fit p-1'>
              <QRCodeCanvas
                value={selectedItem.itemCode}
                size={128}
                bgColor="#ffffff"
                fgColor="#000000"
                level="L"
                minVersion={6}
              />
            </div>
            <PButton variant="outlined" size='small' color="primary" style={{width: "138px"}} onClick={downloadQR} >
              download QR
            </PButton>
          </div>
        </Container>
        
      </div>

      <div style={{width:`350px`}} className='flex flex-col items-center'>
        <Container>
          <Title>Item QR</Title>
          
        </Container>
      </div>
      
    </div>
  );
}

