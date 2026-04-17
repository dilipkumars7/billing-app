import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { CookieService } from '../../store/Cookie'
import { Controller, useForm, useFieldArray, useWatch } from 'react-hook-form'
import { useApi } from '../../hooks/useApi'
import { PATH } from '../../constants/app.constant'
import { useNavigate, useLocation } from 'react-router'
import { useNotification } from '../../components/provider/NotificationProvider'
import styled from '@emotion/styled'
import { Button, Divider, Form, Input, InputNumber, Modal, Select, Tooltip } from 'antd'
import FormErrorMessage from '../../components/FormErrorMessage'
import { MdAddBox } from 'react-icons/md'
import { IoIosArrowDown } from 'react-icons/io'
import { IoTrashBinSharp } from 'react-icons/io5'
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd'
import { MdDragIndicator } from 'react-icons/md'
import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'

// ─── Grid Template ────────────────────────────────────────────────────────────
// drag | item | boxQty | qty (+ sqft below) | rate | tax% | amount | del
const GRID_COLS = '25px 2.5fr 1.2fr 1.8fr 1.5fr 1.2fr 1.5fr 52px'

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div`
  display: grid;
  grid-template-rows: 40px 1fr 60px;
  height: calc(100vh - 65px);
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
`;
const Header = styled.div`
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid #e8e8e8;
`;
const Content = styled.div`
  background: #fff;
  width: 100%;
  overflow-y: auto;
  padding: 10px 40px;
`;
const Footer = styled.div`
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: left;
  border-top: 1px solid #e8e8e8;
  padding: 23px 20px;
  gap: 10px;
`;
const FormUxScope = styled.div`
  .ant-input,
  .ant-input-number-input,
  .ant-input-affix-wrapper input,
  .ant-select-selection-search-input { color: #1f2937; caret-color: #111827; }
  .ant-input, .ant-input-affix-wrapper,
  .ant-input-number, .ant-select-selector { background-color: #fff; }
  .ant-input:focus, .ant-input-focused,
  .ant-input-affix-wrapper:focus-within,
  .ant-input-number:focus-within,
  .ant-select-focused .ant-select-selector {
    border-color: #1677ff !important;
    box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.18) !important;
  }
  .ant-form-item-has-error .ant-input,
  .ant-form-item-has-error .ant-input-affix-wrapper,
  .ant-form-item-has-error .ant-input-number,
  .ant-form-item-has-error .ant-select-selector { background-color: #fff; }
  .ant-form-item-has-error .ant-input,
  .ant-form-item-has-error .ant-input-number-input,
  .ant-form-item-has-error .ant-input-affix-wrapper input,
  .ant-form-item-has-error .ant-select-selection-search-input { color: #1f2937; caret-color: #111827; }
`;

// ─── Totals Section Styles ────────────────────────────────────────────────────

const TotalsWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`;
const TotalsCard = styled.div`
  width: 580px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
`;
const TotalsRow = styled.div<{ highlight?: boolean; grand?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: ${({ grand }) => (grand ? 'none' : '1px solid #f0f0f0')};
  background: ${({ grand }) => (grand ? '#f6ffed' : ({ highlight }: any) => (highlight ? '#fafafa' : '#fff'))};
  font-weight: ${({ grand }) => (grand ? 700 : 400)};
  font-size: ${({ grand }) => (grand ? '15px' : '13px')};
  color: ${({ grand }) => (grand ? '#237804' : '#1a1a1a')};
`;
const TotalsLabel = styled.span`
  color: inherit;
`;
const TotalsValue = styled.span`
  font-weight: inherit;
  color: inherit;
`;
const Rupee = styled.span`
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;
const TotalsHeader = styled.div`
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  padding: 8px 16px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #8c8c8c;
`;

// ─── Square-feet sub-label (shown below the quantity input) ──────────────────
const SqftSubLabel = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-top: 3px;
  font-size: 11px;
  font-weight: 600;
  color: #0958d9;
  background: #e6f4ff;
  border: 1px solid #91caff;
  border-radius: 4px;
  padding: 1px 6px;
  white-space: nowrap;
  width: fit-content;
`;

// ─── Helper: parse size string → sq ft per single tile/unit ─────────────────
// Format: "48 x 24" means length=48 inches, width=24 inches
// sq ft per tile = (48 ÷ 12) × (24 ÷ 12) = 4 × 2 = 8 sq ft
// ─── Helper: parse size string → sq ft per single tile/unit ─────────────────
// Now handles "48x24-in", "600x600-mm", "60x60-cm", "1.2x0.6-m", "48 x 24" etc.
function parseSizeToSqFtPerUnit(size: string | undefined | null): number {
  if (!size) return 0;

  const sizeStr = size.toLowerCase().trim();

  // Extract unit suffix if present
  const unitMatch = sizeStr.match(/-(in|mm|cm|m)$/);
  const unit = unitMatch ? unitMatch[1] : 'in'; // default inches

  // Remove unit suffix
  const cleaned = sizeStr.replace(/-(in|mm|cm|m)$/, '');

  const parts = cleaned
    .split(/[xX×\s]+/)
    .map(s => parseFloat(s.trim()))
    .filter(n => !isNaN(n));

  if (parts.length < 2) return 0;

  let length = parts[0];
  let width = parts[1];

  // Convert to feet
  switch (unit) {
    case 'mm':  length /= 304.8;  width /= 304.8;  break;
    case 'cm':  length /= 30.48;  width /= 30.48;  break;
    case 'm':   length *= 3.28084; width *= 3.28084; break;
    default:    length /= 12;     width /= 12;      // inches → feet
  }

  return length * width;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PurchaseCreate() {
  const location = useLocation();
  const preSelectedItems = location.state?.preSelectedItems as any[] | undefined;

  console.log('PurchaseCreate - preSelectedItems:', preSelectedItems);
  console.log('PurchaseCreate - preSelectedItems[0] keys:', preSelectedItems?.[0] ? Object.keys(preSelectedItems[0]) : 'none');
  console.log('PurchaseCreate - preSelectedItems[0] boxQuantity:', preSelectedItems?.[0]?.boxQuantity);
  console.log('PurchaseCreate - preSelectedItems[0] itemBoxQuantity:', preSelectedItems?.[0]?.itemBoxQuantity);

  const { control, handleSubmit, formState: { errors }, register, setValue, getValues, watch, reset } = useForm({
    defaultValues: {
      purchaseCode: '',
      supplierId: '',
      purchaseItems: preSelectedItems?.length
        ? preSelectedItems.map(item => ({
            itemCode: item.itemCode || '',
            name: item.name || item.itemName || '',
            category: item.category || '',
            unit: item.unit || '',
            size: item.size || '',
            quantity: 0,
            costPrice: item.costPrice || 0,
            boxQuantity: 0,
            itemBoxQuantity: item.boxQuantity || 0,
            taxRate: item.taxRate || 0,
            amount: 0,
            squareFeet: 0,
          }))
        : [{
            itemCode: '', name: '', category: '', unit: '', size: '',
            quantity: 0, costPrice: 0,
            boxQuantity: 0,
            itemBoxQuantity: 0,
            taxRate: 0.00,
            amount: 0.00,
            squareFeet: 0,
          }],
      purchaseAccount: '',
      purchaseTotalCost: 0,
      purchaseTotalItems: 0,
      purchaseTaxRate: 0,
      companyId: CookieService.get('companyId') || '',
    }
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: 'purchaseItems' });

  console.log('PurchaseCreate - fields:', fields);
  console.log('PurchaseCreate - getValues(purchaseItems):', getValues('purchaseItems'));

  useEffect(() => {
    console.log('PurchaseCreate useEffect - fields:', fields);
    console.log('PurchaseCreate useEffect - getValues(purchaseItems):', getValues('purchaseItems'));
  }, [fields, getValues]);

  const { control: controlDyn, handleSubmit: handleSubmitDyn, formState: { errors: errorsDyn }, reset: resetDyn } = useForm({
    defaultValues: { name: '', subname: '' }
  });

  const notificationApi = useNotification();
  const navigate = useNavigate();

  // ── APIs ───────────────────────────────────────────────────────────────────
  const { data: DropDownAccount, refetch: reloadAccount } = useApi<any[]>(`${PATH.GET_DROP_DOWN}/accountType`, { method: 'GET', showOverlay: true });
  const { refetch: DropRefetch } = useApi<any[]>(PATH.POST_DROP_DOWN, { method: 'POST', autoFetch: false });
  const { refetch: DropDelRefetch } = useApi<any[]>(PATH.POST_DROP_DOWN, { method: 'DELETE', autoFetch: false });

  const { data, loading, error, refetch } = useApi<any>(PATH.PURCHASE_DATA, { method: 'POST', autoFetch: false });

  const companyId = CookieService.get('companyId') || '';
  const { data: itemsPageData, loading: itemsLoading, refetch: reloadItems } = useApi<any>(`${PATH.GET_ITEMS_DATA}/all/${companyId}`, { method: 'GET', showOverlay: true });
  const { data: itemsSearchData, refetch: reloadItemsSearch } = useApi<any[]>(`${PATH.GET_ITEMS_DATA}/search`, { method: 'GET', autoFetch: false });

  const { data: suppliersPageData, loading: suppliersLoading, refetch: reloadSuppliers } = useApi<any>(`${PATH.SUPPLIERS_DATA}/all/${companyId}`, { method: 'GET', autoFetch: true, showOverlay: true });
  const { data: suppliersSearchData, refetch: reloadSuppliersSearch } = useApi<any[]>(`${PATH.SUPPLIERS_DATA}/search`, { method: 'GET', autoFetch: false });

  // ── State ──────────────────────────────────────────────────────────────────
  type DropdownItem = { label: string; value: string | number; code?: string };
  const [accountType, setAccountType] = useState<DropdownItem[]>([]);
  const [modalType, setModalType] = useState<'account' | 'unit' | 'size' | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [itemsVersion, setItemsVersion] = useState(0);

  // --- Suppliers ---
  const allSuppliersRef = useRef<any[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<any[]>([]);
  const [supplierPage, setSupplierPage] = useState(0);
  const [supplierHasMore, setSupplierHasMore] = useState(true);
  const [isSupplierSearching, setIsSupplierSearching] = useState(false);
  const supplierSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Items ---
  const allItemsRef = useRef<any[]>([]);
  const [itemOptionsState, setItemOptionsState] = useState<any[]>([]);
  const [itemPage, setItemPage] = useState(0);
  const [itemHasMore, setItemHasMore] = useState(true);
  const [isItemSearching, setIsItemSearching] = useState(false);
  const itemSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Live totals ────────────────────────────────────────────────────────────
  const watchedTotalCost = watch('purchaseTotalCost');
  const watchedTotalItems = watch('purchaseTotalItems');
  const watchedTaxRate = watch('purchaseTaxRate');

  const subTotal = watchedTaxRate > 0
    ? watchedTotalCost / (1 + watchedTaxRate / 100)
    : watchedTotalCost;
  const taxAmount = watchedTotalCost - subTotal;

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!suppliersPageData || isSupplierSearching) return;
    const incoming = suppliersPageData.content ?? (Array.isArray(suppliersPageData) ? suppliersPageData : []);
    const isLast = suppliersPageData.last ?? (incoming.length < 15);
    const newItems = incoming.filter(
      (n: any) => !allSuppliersRef.current.some(e => e.supplierCode === n.supplierCode)
    );
    allSuppliersRef.current = [...allSuppliersRef.current, ...newItems];
    setSupplierOptions([...allSuppliersRef.current]);
    setSupplierHasMore(!isLast);
  }, [suppliersPageData, isSupplierSearching]);

  const loadMoreSuppliers = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const t = e.target as HTMLDivElement;
    if (t.scrollTop + t.offsetHeight >= t.scrollHeight - 10) {
      if (supplierHasMore && !suppliersLoading && !isSupplierSearching) {
        const next = supplierPage + 1;
        setSupplierPage(next);
        reloadSuppliers({ path: `?page=${next}&size=15` });
      }
    }
  }, [supplierHasMore, suppliersLoading, isSupplierSearching, supplierPage, reloadSuppliers]);

  const handleSupplierSearch = useCallback((value: string) => {
    if (supplierSearchTimer.current) clearTimeout(supplierSearchTimer.current);
    if (!value.trim()) { setIsSupplierSearching(false); setSupplierOptions([...allSuppliersRef.current]); return; }
    supplierSearchTimer.current = setTimeout(() => {
      setIsSupplierSearching(true);
      reloadSuppliersSearch({ path: `?q=${encodeURIComponent(value.trim())}&companyId=${companyId}` });
    }, 350);
  }, [companyId, reloadSuppliersSearch]);

  useEffect(() => {
    if (!isSupplierSearching) return;
    if (suppliersSearchData != null) setSupplierOptions(suppliersSearchData);
  }, [suppliersSearchData, isSupplierSearching]);

  useEffect(() => {
    if (!itemsPageData || isItemSearching) return;
    const incoming = itemsPageData.content ?? (Array.isArray(itemsPageData) ? itemsPageData : []);
    const isLast = itemsPageData.last ?? (incoming.length < 15);
    const newItems = incoming.filter(
      (n: any) => !allItemsRef.current.some(e => e.itemCode === n.itemCode)
    );
    allItemsRef.current = [...allItemsRef.current, ...newItems];
    setItemOptionsState([...allItemsRef.current]);
    setItemHasMore(!isLast);
  }, [itemsPageData, isItemSearching]);

  const loadMoreItems = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const t = e.target as HTMLDivElement;
    if (t.scrollTop + t.offsetHeight >= t.scrollHeight - 10) {
      if (itemHasMore && !itemsLoading && !isItemSearching) {
        const next = itemPage + 1;
        setItemPage(next);
        reloadItems({ path: `?page=${next}&size=15` });
      }
    }
  }, [itemHasMore, itemsLoading, isItemSearching, itemPage, reloadItems]);

  const handleItemSearch = useCallback((value: string) => {
    if (itemSearchTimer.current) clearTimeout(itemSearchTimer.current);
    if (!value.trim()) { setIsItemSearching(false); setItemOptionsState([...allItemsRef.current]); return; }
    itemSearchTimer.current = setTimeout(() => {
      setIsItemSearching(true);
      reloadItemsSearch({ path: `?q=${encodeURIComponent(value.trim())}&companyId=${companyId}` });
    }, 350);
  }, [companyId, reloadItemsSearch]);

  useEffect(() => {
    if (!isItemSearching) return;
    if (itemsSearchData != null) setItemOptionsState(itemsSearchData);
  }, [itemsSearchData, isItemSearching]);

  useEffect(() => {
    return () => {
      if (supplierSearchTimer.current) clearTimeout(supplierSearchTimer.current);
      if (itemSearchTimer.current) clearTimeout(itemSearchTimer.current);
    };
  }, []);

  useEffect(() => {
    if (DropDownAccount) {
      setAccountType(DropDownAccount.map(u => ({
        label: `${u.dropdownValue}`,
        value: u.dropdownValue,
        code: u.dropdownCode,
      })));
    }
  }, [DropDownAccount]);

  useEffect(() => {
    if (data) {
      notificationApi.success({ message: `${data.error}`, description: `${data?.message}`, showProgress: true, pauseOnHover: true });
      setTimeout(() => navigate('/purchase'), 500);
    }
    if (error) {
      notificationApi.error({ message: error.error, description: `${error?.message || 'Save failed.'}`, showProgress: true, pauseOnHover: true });
    }
  }, [data, error]);

  // ── Calculations ───────────────────────────────────────────────────────────
  const calculateTotals = (items: any[]) => {
    let totalCost = 0;
    let totalItems = 0;
    let totalTaxAmount = 0;

    for (const item of items) {
      const qty = Number(item?.quantity) || 0;
      const price = Number(item?.costPrice) || 0;
      const taxRate = Number(item?.taxRate) || 0;
      const lineAmt = qty * price;
      const lineTax = lineAmt * (taxRate / 100);
      totalCost += lineAmt + lineTax;
      totalItems += 1;
      totalTaxAmount += lineTax;
    }

    setValue('purchaseTotalCost', Number(totalCost.toFixed(3)), { shouldDirty: false, shouldValidate: false, shouldTouch: false });
    setValue('purchaseTotalItems', totalItems, { shouldDirty: false, shouldValidate: false, shouldTouch: false });

    const st = totalCost - totalTaxAmount;
    const effectiveTaxRate = st > 0 ? (totalTaxAmount / st) * 100 : 0;
    setValue('purchaseTaxRate', Number(effectiveTaxRate.toFixed(3)), { shouldDirty: false, shouldValidate: false, shouldTouch: false });
  };

  const calculateLineAmount = (item: any) => {
    const qty = Number(item?.quantity) || 0;
    const rate = Number(item?.costPrice) || 0;
    const tax = Number(item?.taxRate) || 0;
    return qty * rate * (1 + tax / 100);
  };

  const PIECE_BASED_CATEGORIES = ['sanitaryware', 'sanitary ware', 'pieces', 'piece'];

  const isSanitaryware = (category?: string): boolean =>
    PIECE_BASED_CATEGORIES.some(c => c === (category || '').toLowerCase().trim());

  // ── Square-feet calculation ───────────────────────────────────────────────
  const calculateSquareFeet = (item: {
    size?: string;
    boxQuantity?: number;        // number of boxes (purchase)
    itemBoxQuantity?: number;    // tiles per box (item master)
    category?: string; 
  }): number => {

    if (!item.size) return 0;

     if (isSanitaryware(item.category)) {
      const tilesPerBox = Number(item.itemBoxQuantity) || 0;
      const numberOfBoxes = Number(item.boxQuantity) || 0;
      return tilesPerBox && numberOfBoxes ? tilesPerBox * numberOfBoxes : 0;
    }

    const sizeStr = item.size.toLowerCase().trim();

    // ✅ Extract unit
    const unitMatch = sizeStr.match(/-(in|mm|cm|m)$/);
    const unit = unitMatch ? unitMatch[1] : 'in';

    // ✅ Remove unit
    const cleaned = sizeStr.replace(/-(in|mm|cm|m)$/g, '');

    const parts = cleaned
      .split(/[xX×]/)
      .map(s => parseFloat(s.trim()))
      .filter(n => !isNaN(n));

    if (parts.length < 2) return 0;

    let length = parts[0];
    let width = parts[1];

    // ✅ Convert to feet
    switch (unit) {
      case 'mm':
        length /= 304.8;
        width /= 304.8;
        break;
      case 'cm':
        length /= 30.48;
        width /= 30.48;
        break;
      case 'm':
        length *= 3.28084;
        width *= 3.28084;
        break;
      default:
        length /= 12;
        width /= 12;
    }

    const sqFtPerTile = length * width;

    const tilesPerBox = Number(item.itemBoxQuantity) || 0; // ✅ MUST come from item master
    const numberOfBoxes = Number(item.boxQuantity) || 0;   // ✅ user input

    if (!sqFtPerTile || !tilesPerBox || !numberOfBoxes) return 0;

    return sqFtPerTile * tilesPerBox * numberOfBoxes;
  };

  const totalsRecalc$ = useRef(new Subject<any[]>());

  useEffect(() => {
    const sub = totalsRecalc$.current
      .pipe(debounceTime(120))
      .subscribe((items) => calculateTotals(items));
    return () => sub.unsubscribe();
  }, []);

  const queueTotalsRecalculation = useCallback(() => {
    totalsRecalc$.current.next(getValues('purchaseItems') || []);
  }, [getValues]);

  useEffect(() => { queueTotalsRecalculation(); }, [fields.length, queueTotalsRecalculation]);

  useEffect(() => {
    if (preSelectedItems?.length) {
      setTimeout(() => queueTotalsRecalculation(), 100);
    }
  }, [preSelectedItems, queueTotalsRecalculation]);

  useEffect(() => {
    setItemsVersion(v => v + 1);
  }, [preSelectedItems]);

  // ── Dropdown helpers ───────────────────────────────────────────────────────
  const deleteAccount = async (value: string) => {
    try {
      await DropDelRefetch({ path: `/${value}`, method: 'DELETE' });
      reloadAccount();
      notificationApi.success({ message: 'Deleted!', description: `"${value}" removed.` });
    } catch {
      notificationApi.error({ message: 'Error', description: 'Failed to delete. It might be in use.' });
    }
  };

  const onSubmitDyn = async (values: any) => {
    try {
      if (modalType === 'account') {
        await DropRefetch({ body: { dropdownName: 'accountType', dropdownLabel: values.name, dropdownValue: values.subname } });
        reloadAccount();
      }
      closeModal();
      resetDyn();
    } catch {
      notificationApi.error({ message: 'Error', description: 'Failed to save data. Try again.' });
    }
  };

  const handleOpenModal = (type: 'account' | 'unit') => { setModalType(type); resetDyn(); setOpenModal(true); };
  const closeModal = () => { setOpenModal(false); setModalType(null); resetDyn(); };

  // ── Memoised item options ──────────────────────────────────────────────────
  const itemOptions = React.useMemo(() => {
    if (!itemOptionsState?.length) return [];
    return itemOptionsState.map((item: any) => ({
      label: item?.name || item?.itemName || '',
      value: item?.itemCode || '',
      itemName: item?.name || item?.itemName || '',
      category: item?.category || '',
      unit: item?.unit || '',
      itemCode: item?.itemCode || '',
      sellingPrice: item?.sellingPrice ?? 0,
      size: item?.size || '',                   // ← NEW
      boxQuantity: item?.boxQuantity ?? 0,      // qty-per-box from item master ← NEW
    }));
  }, [itemOptionsState]);

  const addPurchaseItem = () => append({
    name: '', category: '', unit: '', size: '',
    quantity: 0, costPrice: 0,
    boxQuantity: 0, itemBoxQuantity: 0,
    taxRate: 0.0, amount: 0, squareFeet: 0,
  });
  const handleRemoveItem = useCallback((index: number) => remove(index), [remove]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    move(result.source.index, result.destination.index);
    queueTotalsRecalculation();
  };

  const onSubmit = async (formValues: any) => {
    const userName = CookieService.get('user_name');
    refetch({ body: { ...formValues, createdBy: userName, updatedBy: userName } });
  };

  const layout = { labelCol: { span: 6 }, wrapperCol: { span: 8 } };
  const ModelLayout = { labelCol: { span: 6 }, wrapperCol: { span: 16 } };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Container>
      <Header>Create Purchase</Header>

      <Content>
        <FormUxScope>
          <Form {...layout} labelAlign="left">

            {/* SUPPLIER */}
            <Form.Item label="Supplier" required
              validateStatus={errors.supplierId ? 'error' : ''}
              help={<FormErrorMessage message={errors.supplierId?.message} />}
            >
              <Controller name="supplierId" control={control} rules={{ required: 'Supplier is required' }}
                render={({ field }) => (
                  <Select {...field}
                    showSearch
                    suffixIcon={<IoIosArrowDown size={20} />}
                    size="large"
                    fieldNames={{ label: 'supplierName', value: 'supplierCode' }}
                    options={supplierOptions}
                    optionRender={(option: any) => {
                      const s = option.data;
                      return (
                        <div className="flex justify-between">
                          <div style={{ fontWeight: 500 }}>{s.supplierName}</div>
                          <div style={{ fontSize: 12, color: '#777' }}>{s.supplierCompanyName}</div>
                        </div>
                      );
                    }}
                    popupRender={(menu) => (
                      <>
                        {menu}
                        <Divider style={{ margin: '4px 0' }} />
                        <div className="flex gap-2 items-center justify-center">
                          <Button size="small" type="primary"
                            icon={<MdAddBox size={18} style={{ marginTop: 4 }} />}
                            onClick={() => navigate('/supplier/create')}>
                            Create
                          </Button>
                        </div>
                      </>
                    )}
                    filterOption={false}
                    onSearch={handleSupplierSearch}
                    onPopupScroll={loadMoreSuppliers}
                    onClear={() => handleSupplierSearch('')}
                    allowClear
                  />
                )}
              />
            </Form.Item>

            {/* ACCOUNT TYPE */}
            <Form.Item label="Account Type" required
              validateStatus={errors.purchaseAccount ? 'error' : ''}
              help={<FormErrorMessage message={errors.purchaseAccount?.message} />}
            >
              <Controller name="purchaseAccount" control={control} rules={{ required: 'Account is required' }}
                render={({ field }) => SelectFun(field, accountType, deleteAccount, handleOpenModal, 'account')}
              />
            </Form.Item>

            <Divider />

            {/* ── Items table ── */}
            <div style={{ marginBottom: 12, fontWeight: 600 }}>Items to purchase</div>
            <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}>

              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: GRID_COLS,
                background: '#fafafa',
                borderBottom: '1px solid #e8e8e8',
                padding: '10px 12px',
                fontWeight: 600,
                fontSize: 12,
                gap: 8,
              }}>
                <div />
                <div>ITEM DETAILS</div>
                <div>BOX QTY</div>
                <div>QUANTITY</div>
                <div>RATE</div>
                <div>TAX %</div>
                <div>AMOUNT</div>
                <div />
              </div>

              {/* Draggable rows */}
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="purchase-items-droppable">
                  {(dropProvided) => (
                    <div ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                      {fields.map((item, index) => (
                        <PurchaseItemRow
                          key={`${item.id}-${itemsVersion}`}
                          rowId={item.id}
                          index={index}
                          control={control}
                          register={register}
                          setValue={setValue}
                          getValues={getValues}
                          itemOptions={itemOptions}
                          onSearchItems={handleItemSearch}
                          onScrollItems={loadMoreItems}
                          onQueueTotals={queueTotalsRecalculation}
                          onRemoveRow={handleRemoveItem}
                          canRemove={fields.length > 1}
                          calculateLineAmount={calculateLineAmount}
                          calculateSquareFeet={calculateSquareFeet}
                        />
                      ))}
                      {dropProvided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>

            {/* Add row button */}
            <div style={{ marginTop: 12 }}>
              <Button icon={<MdAddBox />} onClick={addPurchaseItem}>
                Add New Row
              </Button>
            </div>

            {/* ── Totals Section ── */}
            <TotalsWrapper>
              <TotalsCard>
                <TotalsHeader>Purchase Summary</TotalsHeader>
                <TotalsRow>
                  <TotalsLabel>Total Items (qty)</TotalsLabel>
                  <TotalsValue>{watchedTotalItems.toLocaleString()}</TotalsValue>
                </TotalsRow>
                <TotalsRow>
                  <TotalsLabel>Sub Total</TotalsLabel>
                  <TotalsValue><Rupee>₹</Rupee> {subTotal.toFixed(2)}</TotalsValue>
                </TotalsRow>
                <TotalsRow highlight>
                  <TotalsLabel>
                    Tax
                    <span style={{ fontSize: 11, color: '#8c8c8c', marginLeft: 6 }}>
                      ({watchedTaxRate.toFixed(2)} %)
                    </span>
                  </TotalsLabel>
                  <TotalsValue style={{ color: '#d46b08' }}>+ <Rupee>₹</Rupee> {taxAmount.toFixed(2)}</TotalsValue>
                </TotalsRow>
                <TotalsRow grand>
                  <TotalsLabel>Grand Total</TotalsLabel>
                  <TotalsValue><Rupee>₹</Rupee> &nbsp;
                    {Number(watchedTotalCost).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </TotalsValue>
                </TotalsRow>
                <TotalsRow>
              <TotalsLabel>Amount in Words</TotalsLabel>
                <TotalsValue style={{ textAlign: 'right', maxWidth: 220 }}>
                  {numberToWords(watchedTotalCost)}
                </TotalsValue>
              </TotalsRow>
              </TotalsCard>
            </TotalsWrapper>

          </Form>
        </FormUxScope>
      </Content>

      <Footer>
        <Button variant="solid" color="primary" className="w-[150px]" htmlType="submit" loading={loading} onClick={handleSubmit(onSubmit)}>
          Save
        </Button>
        <Button variant="outlined" color="danger" className="w-[150px]" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </Footer>

      <Modal
        title={modalType === 'account' ? 'Add Account Type' : 'Add Unit'}
        open={openModal} onOk={handleSubmitDyn(onSubmitDyn)} onCancel={closeModal} okText="Save"
      >
        <Form {...ModelLayout} labelAlign="left">
          <Form.Item label="Name" required
            validateStatus={errorsDyn.subname ? 'error' : ''}
            help={<FormErrorMessage message={errorsDyn.subname?.message} />}
          >
            <Controller name="subname" control={controlDyn} rules={{ required: 'Name is required' }}
              render={({ field }) => <Input size="large" {...field} placeholder="Enter" />}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  );
}

// ─── PurchaseItemRow ──────────────────────────────────────────────────────────

function numberToWords(num: number): string {
  if (num === 0) return 'Zero';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
    'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen',
    'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10];
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred ' + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand ' + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh ' + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + ' Crore ' + inWords(n % 10000000);
  };

  return inWords(Math.floor(num)).trim() + ' Rupees Only';
}

const PurchaseItemRow = memo(function PurchaseItemRow({
  rowId, index, control, register, setValue, getValues,
  itemOptions, onSearchItems, onScrollItems, onQueueTotals,
  onRemoveRow, canRemove, calculateLineAmount, calculateSquareFeet,
}: any) {
  const Rupee = styled.span`
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  `;

  const watchedItem = useWatch({ control, name: `purchaseItems.${index}` });

  console.log(`PurchaseItemRow[${index}] - watchedItem:`, watchedItem);
  console.log(`PurchaseItemRow[${index}] - boxQuantity:`, watchedItem?.boxQuantity);
  console.log(`PurchaseItemRow[${index}] - itemBoxQuantity:`, watchedItem?.itemBoxQuantity);

  const rowCalc = {
    quantity: Number(watchedItem?.quantity) || 0,
    costPrice: Number(watchedItem?.costPrice) || 0,
    taxRate: Number(watchedItem?.taxRate) || 0,
    unit: watchedItem?.unit || '',
    boxQuantity: Number(watchedItem?.boxQuantity) || 0,
    itemBoxQuantity: Number(watchedItem?.itemBoxQuantity) || 0,
    size: watchedItem?.size || '',
    category: watchedItem?.category || '',
  };

  useEffect(() => {
    const amountValue = Number(calculateLineAmount(rowCalc).toFixed(3));
    setValue(`purchaseItems.${index}.amount`, amountValue, { shouldDirty: false, shouldValidate: false, shouldTouch: false });
  }, [rowCalc.quantity, rowCalc.boxQuantity, rowCalc.costPrice, rowCalc.taxRate, index, setValue, calculateLineAmount]);

  const amount = calculateLineAmount(rowCalc);
  const squareFeet = calculateSquareFeet(rowCalc);

  const navigate = useNavigate();

  const PIECE_BASED_CATEGORIES = ['sanitaryware', 'sanitary ware', 'pieces', 'piece'];

  const isSanitaryware = (category?: string): boolean =>
    PIECE_BASED_CATEGORIES.some(c => c === (category || '').toLowerCase().trim());

  return (
    <Draggable draggableId={rowId} index={index}>
      {(dragProvided) => (
        <div
          ref={dragProvided.innerRef}
          {...dragProvided.draggableProps}
          style={{
            display: 'grid',
            gridTemplateColumns: GRID_COLS,
            padding: '10px 12px',
            borderBottom: '1px solid #f0f0f0',
            alignItems: 'center',
            gap: 8,
            ...dragProvided.draggableProps.style,
          }}
        >
          {/* Drag handle */}
          <div {...dragProvided.dragHandleProps} style={{ cursor: 'grab', display: 'flex', justifyContent: 'center' }}>
            <MdDragIndicator size={18} color="#8c8c8c" />
          </div>

          {/* Item selector */}
          <Controller
            name={`purchaseItems.${index}.name`}
            control={control}
            rules={{ required: 'Item is required' }}
            render={({ field }) => (
              <Select
                {...field}
                showSearch allowClear
                suffixIcon={<IoIosArrowDown size={20} />}
                placeholder="Select Item"
                options={itemOptions}
                filterOption={false}
                onSearch={onSearchItems}
                onClear={() => onSearchItems('')}
                onPopupScroll={onScrollItems}
                listHeight={320}
                popupMatchSelectWidth={350}
                optionRender={(option: any) => {
                  const item = option.data;
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{item.itemName || item.label}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{item.category} • {item.unit}</div>
                        {item.size && <div style={{ fontSize: 11, color: '#aaa' }}>Size: {item.size}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 500, color: '#1677ff' }}><Rupee>₹</Rupee>{item.sellingPrice || 0}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{item.itemCode}</div>
                      </div>
                    </div>
                  );
                }}
                onChange={(_val, option: any) => {
                  const nextUnit = option?.unit || '';
                  const nextSize = option?.size || '';
                  const nextBoxQty = Number(option?.boxQuantity) || 0; // qty-per-box from item master
                  field.onChange(option?.itemName || '');
                  const nextCategory = option?.category || ''; 
                  setValue(`purchaseItems.${index}.category`, option?.category || '');
                  setValue(`purchaseItems.${index}.itemCode`, option?.itemCode || 'null');
                  setValue(`purchaseItems.${index}.unit`, nextUnit);
                  setValue(`purchaseItems.${index}.size`, nextSize);
                  setValue(`purchaseItems.${index}.itemBoxQuantity`, nextBoxQty);
                  onQueueTotals();
                }}
                value={field.value || undefined}
                popupRender={(menu: any) => (
                  <>
                    {menu}
                    <Divider style={{ margin: '4px 0' }} />
                    <div className="flex gap-2 items-center justify-center">
                      <Button size="small" type="primary"
                        icon={<MdAddBox size={18} style={{ marginTop: 4 }} />}
                        onClick={e => { e.stopPropagation(); navigate('/item/create'); }}>
                        Create Item
                      </Button>
                    </div>
                  </>
                )}
              />
            )}
          />

          {/* Hidden fields */}
          <input type="hidden" {...register(`purchaseItems.${index}.category`)} />
          <input type="hidden" {...register(`purchaseItems.${index}.unit`)} />
          <input type="hidden" {...register(`purchaseItems.${index}.size`)} />
          <input type="hidden" {...register(`purchaseItems.${index}.itemBoxQuantity`)} />
          <input type="hidden" {...register(`purchaseItems.${index}.amount`)} />
          <input type="hidden" {...register(`purchaseItems.${index}.squareFeet`)} />

          {/* ── BOX QUANTITY ── */}
          <Controller name={`purchaseItems.${index}.boxQuantity`} control={control}
            render={({ field }) => (
              <Tooltip title={rowCalc.size ? `Size: ${rowCalc.size} | Tiles per box: ${rowCalc.itemBoxQuantity}` : 'Select an item to enable sq ft calculation'}>
                <InputNumber
                  {...field}
                  min={0}
                  inputMode="numeric"
                  style={{ width: '100%' }}
                  controls={{ upIcon: <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>, downIcon: <span style={{ fontSize: 14, lineHeight: 1 }}>−</span> }}
                  onChange={(value) => {
                    const nextBoxQty = Number(value) || 0;
                    const tilesPerBox = rowCalc.itemBoxQuantity || 0;

                    let nextQty = 0;

                    if (isSanitaryware(rowCalc.category)) {
                      // Sanitaryware: quantity = number of pieces = boxes × pieces-per-box
                      nextQty = nextBoxQty * tilesPerBox;
                    } else {
                      // Tiles/flooring: quantity = total sq ft = sqFtPerTile × tilesPerBox × boxes
                      const sqFtPerTile = parseSizeToSqFtPerUnit(rowCalc.size);
                      nextQty = Number((sqFtPerTile * tilesPerBox * nextBoxQty).toFixed(3));
                    }

                    setValue(`purchaseItems.${index}.quantity`, nextQty, {
                      shouldDirty: false, shouldValidate: false, shouldTouch: false,
                    });
                    field.onChange(nextBoxQty);
                    onQueueTotals();
                  }}
                />
              </Tooltip>
            )}
          />



          {/* Quantity + sq ft sub-label */}
          <div>
            <Controller name={`purchaseItems.${index}.quantity`} control={control}
              render={({ field }) => (
                <InputNumber {...field} inputMode="numeric" style={{ width: '100%' }} suffix={<span className='text-[11px]'>{rowCalc.unit}</span>}
                  onChange={(value) => {
                    const nextQty = Number(value) || 0;
                    const tilesPerBox = rowCalc.itemBoxQuantity || 0;

                    let derivedBoxQty = 0;

                    if (isSanitaryware(rowCalc.category)) {
                      // pieces ÷ pieces-per-box
                      derivedBoxQty = tilesPerBox > 0
                        ? Math.round((nextQty / tilesPerBox) * 100) / 100
                        : 0;
                    } else {
                      // sqFt ÷ (sqFtPerTile × tilesPerBox)
                      const sqFtPerTile = parseSizeToSqFtPerUnit(rowCalc.size);
                      const sqFtPerBox = sqFtPerTile * tilesPerBox;
                      derivedBoxQty = sqFtPerBox > 0
                        ? Math.round((nextQty / sqFtPerBox) * 100) / 100
                        : 0;
                    }

                    setValue(`purchaseItems.${index}.boxQuantity`, derivedBoxQty, {
                      shouldDirty: false, shouldValidate: false, shouldTouch: false,
                    });
                    field.onChange(nextQty);
                    onQueueTotals();
                  }}
                />
              )}
            />
            {/* {squareFeet > 0 && (
              <SqftSubLabel>
                {squareFeet.toFixed(2)}
                <span style={{ fontWeight: 400, color: '#4096ff' }}>ft²</span>
              </SqftSubLabel>
            )} */}
          </div>

          {/* Cost Price */}
          <Controller name={`purchaseItems.${index}.costPrice`} control={control}
            render={({ field }) => (
              <InputNumber {...field} style={{ width: '100%' }} inputMode="numeric"
                onChange={(value) => {
                  const next = Number(value) || 0;
                  field.onChange(next); onQueueTotals();
                }}
              />
            )}
          />

          {/* Tax Rate */}
          <Controller name={`purchaseItems.${index}.taxRate`} control={control}
            render={({ field }) => (
              <InputNumber {...field} min={0} style={{ width: '100%' }} value={field.value}
                onChange={(value) => {
                  const next = Number(value) || 0;
                  field.onChange(next); onQueueTotals();
                }}
              />
            )}
          />

          {/* Row amount */}
          <div style={{ fontWeight: 600 }}>₹ {amount.toFixed(2)}</div>

          {/* Remove row */}
          <Button type="text" danger onClick={() => onRemoveRow(index)} disabled={!canRemove} icon={<IoTrashBinSharp />} />
        </div>
      )}
    </Draggable>
  );
}, (prev, next) =>
  prev.rowId === next.rowId &&
  prev.index === next.index &&
  prev.canRemove === next.canRemove &&
  prev.itemOptions === next.itemOptions &&
  prev.onSearchItems === next.onSearchItems &&
  prev.onScrollItems === next.onScrollItems
);

// ─── SelectFun helper ─────────────────────────────────────────────────────────

function SelectFun(field: any, Items: any[], onDelete: any, onAddNew: (type: string) => void, type: 'account' | 'unit') {
  return (
    <Select size="large" {...field} placeholder="Select value"
      suffixIcon={<IoIosArrowDown size={20} />} showSearch optionLabelProp="title"
      popupRender={(menu) => (
        <>
          {menu}
          <Divider style={{ margin: '4px 0' }} />
          <div className="flex gap-2 items-center justify-center">
            <Button size="small" type="primary"
              icon={<MdAddBox size={18} style={{ marginTop: 4 }} />}
              onClick={e => { e.stopPropagation(); onAddNew(type); }}>
              Add New
            </Button>
          </div>
        </>
      )}
      options={Items.map(item => ({
        value: item.value,
        title: item.label,
        label: (
          <div className="flex justify-between items-center w-full">
            <span>{item.label}</span>
            <IoTrashBinSharp size={18} color="red" title="Delete"
              style={{ cursor: 'pointer', opacity: 0.4 }}
              onClick={e => { e.stopPropagation(); onDelete(item.code); }}
            />
          </div>
        ),
      }))}
    />
  );
}