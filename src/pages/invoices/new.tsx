import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Form, Input, Select, InputNumber, Button, Divider, DatePicker, Checkbox } from 'antd'
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form'
import { useApi } from '../../hooks/useApi'
import { PATH } from '../../constants/app.constant'
import { useNotification } from '../../components/provider/NotificationProvider';
import { useNavigate, useLocation } from 'react-router-dom'
import { Tooltip } from 'antd';
import { CookieService } from '../../store/Cookie'
import FormErrorMessage from '../../components/FormErrorMessage'
import { IoTrashBinSharp } from "react-icons/io5";
import { MdAddBox, MdDragIndicator } from "react-icons/md";
import { IoIosArrowDown } from 'react-icons/io'
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd'
import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
import '../../css/common.css';
import styled from "@emotion/styled";
import dayjs from 'dayjs';

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
  font-weight: 600;
  font-size: 16px;
`;
const Content = styled.div`
  background: #fff;
  width: 100%;
  overflow-y: auto;
  padding: 20px 40px;
`;
const Footer = styled.div`
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: left;
  border-top: 1px solid #e8e8e8;
  padding: 10px 20px;
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
`;

// ─── Totals Section Styles ────────────────────────────────────────────────────

const TotalsWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`;
const TotalsCard = styled.div`
  width: 420px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
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
const TotalsRow = styled.div<{ highlight?: boolean; grand?: boolean; discount?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: ${({ grand }) => (grand ? 'none' : '1px solid #f0f0f0')};
  background: ${({ grand, highlight }) =>
    grand ? '#f6ffed' : highlight ? '#fafafa' : '#fff'};
  font-weight: ${({ grand }) => (grand ? 700 : 400)};
  font-size: ${({ grand }) => (grand ? '15px' : '13px')};
  color: ${({ grand, discount }) =>
    grand ? '#237804' : discount ? '#cf1322' : '#1a1a1a'};
`;
const TotalsLabel = styled.span`color: inherit;`;
const TotalsValue = styled.span`font-weight: inherit; color: inherit;`;

// ─── Discount toggle ──────────────────────────────────────────────────────────

const DiscountTypeToggle = styled.div`
  display: inline-flex;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  button {
    border: none;
    background: #fff;
    padding: 3px 10px;
    cursor: pointer;
    font-size: 13px;
    line-height: 1;
    transition: all 0.2s;
    &:first-of-type { border-right: 1px solid #d9d9d9; }
    &.active { background: #1677ff; color: #fff; }
    &:hover:not(.active) { background: #f5f5f5; }
  }
`;

const Rupee = styled.span`
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

// ─── Row error banner ─────────────────────────────────────────────────────────

const RowErrorBanner = styled.div`
  grid-column: 1 / -1;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 12px;
  color: #cf1322;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: -4px;
  margin-bottom: 2px;
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomField {
  id: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  fieldDefaultValue: string;
  fieldOptions: { label: string; value: string }[];
  required: boolean;
}
interface InvoiceItem {
  itemCode: string;
  itemName: string;
  description: string;
  quantity: number;
  boxQuantity: number;
  itemBoxQuantity: number;
  size: string;
  category: string;
  unit: string;
  unitPrice: number;
  taxRate: number;
  discount: number;
  amount: number;
  squareFeet: number;
  availableQty?: number;
}
type DiscountType = 'percentage' | 'amount';

// ─── Stock validation types ───────────────────────────────────────────────────

interface RowError {
  type: 'NO_ITEM' | 'OUT_OF_STOCK' | 'INSUFFICIENT_STOCK' | 'LOW_STOCK' | 'NO_QUANTITY';
  message: string;
  severity: 'error' | 'warning';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InvoiceCreate() {
  const location = useLocation();
  const preSelectedItems = location.state?.preSelectedItems as any[] | undefined;

  const companyId = CookieService.get('companyId') || '';

  const {
    control, handleSubmit, formState: { errors },
    register, setValue, getValues, watch, setFocus,
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      customerCode: '',
      customerName: '',
      customerEmail: '',
      customerMobile: '',
      customerAddress: {} as Record<string, any>,
      invoiceDate: dayjs(),
      dueDate: dayjs().add(30, 'day'),
      status: 'DRAFT',
      items: preSelectedItems?.length
        ? preSelectedItems.map(item => ({
            itemCode: item.itemCode || '',
            itemName: item.name || item.itemName || '',
            description: '',
            quantity: 0,
            boxQuantity: 0,
            itemBoxQuantity: item.boxQuantity,
            size: item.size || '',
            category: item.category || '',
            unit: item.unit || '',
            unitPrice: item.sellingPrice || 0,
            taxRate: item.taxRate || 0,
            discount: 0,
            amount: 0,
            squareFeet: 0,
            availableQty: item.quantity || 0,
          }))
        : [
            { itemCode: '', itemName: '', description: '', quantity: 0, boxQuantity: 0, itemBoxQuantity: 0, size: '', category: '', unit: '', unitPrice: 0, taxRate: 0, discount: 0, amount: 0, squareFeet: 0, availableQty: 0 }
          ] as InvoiceItem[],
      discountType: 'percentage' as DiscountType,
      discountValue: 0,
      notes: '',
      termsAndConditions: '',
      paymentMethod: '',
      customFields: {} as Record<string, any>,
      companyId,
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 0,
      paidAmount: 0,
    }
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: 'items' });

  const notificationApi = useNotification();
  const navigate        = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [discountType, setDiscountType]       = useState<DiscountType>('percentage');
  const [customFields, setCustomFields]       = useState<CustomField[]>([]);
  const [customerOptions, setCustomerOptions] = useState<any[]>([]);
  const [itemsVersion, setItemsVersion]       = useState(0);

  // ── Row-level validation errors (keyed by row index) ──────────────────────
  const [rowErrors, setRowErrors] = useState<Record<number, RowError>>({});

  // --- Items (scroll loading + search) ---
  const allItemsRef = useRef<any[]>([]);
  const [itemOptionsState, setItemOptionsState] = useState<any[]>([]);
  const [itemPage, setItemPage] = useState(0);
  const [itemHasMore, setItemHasMore] = useState(true);
  const [isItemSearching, setIsItemSearching] = useState(false);
  const itemSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── APIs ───────────────────────────────────────────────────────────────────
  const { data: customersData, loading: customersLoading } = useApi<any[]>(
    `${PATH.CUSTOMERS_DATA}/all/${companyId}`, { method: 'GET' }
  );
  const { data: itemsPageData, loading: itemsLoading, refetch: reloadItems } = useApi<any>(
    `${PATH.GET_ITEMS_DATA}/all/${companyId}`, { method: 'GET', showOverlay: true }
  );
  const { data: itemsSearchData, refetch: reloadItemsSearch } = useApi<any[]>(
    `${PATH.GET_ITEMS_DATA}/search`, { method: 'GET', autoFetch: false }
  );
  const { data, loading, error, refetch } = useApi<any>(
    PATH.INVOICES_DATA, { method: 'POST', autoFetch: false }
  );

  useEffect(() => {
    if (customersData) {
      setCustomerOptions(customersData['content'].map(c => ({
        label: `${c.customerFirstName} ${c.customerLastName || ''} (${c.customerCode})`,
        value: c.customerCode,
        ...c,
      })));
    }
  }, [customersData]);

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
      if (itemSearchTimer.current) clearTimeout(itemSearchTimer.current);
    };
  }, []);

  useEffect(() => {
    if (data) {
      notificationApi.success({ message: 'Success', description: `Invoice ${data.invoiceNumber} created successfully`, showProgress: true, pauseOnHover: true });
      setTimeout(() => navigate('/invoice'), 500);
    }
    if (error) {
      notificationApi.error({ message: 'Error', description: error?.message || 'Failed to create invoice.', showProgress: true, pauseOnHover: true });
    }
  }, [data, error, navigate, notificationApi]);

  // ── Item options ───────────────────────────────────────────────────────────
  const itemOptions = React.useMemo(() => {
    if (!itemOptionsState?.length) return [];
    return itemOptionsState.map((item: any) => ({
      label:           item?.name          || item?.itemName || '',
      value:           item?.itemCode      || '',
      itemName:        item?.name          || item?.itemName || '',
      category:        item?.category      || '',
      unit:            item?.unit          || '',
      itemCode:        item?.itemCode      || '',
      sellingPrice:    item?.sellingPrice  || 0,
      taxRate:         item?.taxRate       || 0,
      quantity:        item?.quantity      || 0,
      size:            item?.size          || '',
      itemBoxQuantity: item?.boxQuantity   || 0,
    }));
  }, [itemOptionsState]);

  // ── Calculations ───────────────────────────────────────────────────────────
  const calculateTotals = useCallback((
    itemsList: InvoiceItem[], discType: DiscountType, discValue: number
  ) => {
    let subtotal = 0;
    let taxAmount = 0;
    for (const item of itemsList) {
      const qty     = Number(item?.quantity)  || 0;
      const price   = Number(item?.unitPrice) || 0;
      const taxRate = Number(item?.taxRate)   || 0;
      const lineAmt = qty * price;
      subtotal  += lineAmt;
      taxAmount += lineAmt * (taxRate / 100);
    }
    const discountVal = Number(discValue) || 0;
    let discountAmount = 0;
    if (discType === 'percentage') {
      discountAmount = subtotal * (Math.min(Math.max(discountVal, 0), 100) / 100);
    } else {
      discountAmount = Math.min(Math.max(discountVal, 0), subtotal);
    }
    const totalAmount = Math.max(0, subtotal + taxAmount - discountAmount);
    setValue('subtotal',       Number(subtotal.toFixed(2)),       { shouldDirty: false, shouldValidate: false, shouldTouch: false });
    setValue('taxAmount',      Number(taxAmount.toFixed(2)),      { shouldDirty: false, shouldValidate: false, shouldTouch: false });
    setValue('discountAmount', Number(discountAmount.toFixed(2)), { shouldDirty: false, shouldValidate: false, shouldTouch: false });
    setValue('totalAmount',    Number(totalAmount.toFixed(2)),    { shouldDirty: false, shouldValidate: false, shouldTouch: false });
    return { subtotal, taxAmount, discountAmount, totalAmount };
  }, [setValue]);

  const calculateLineAmount = useCallback((item: any) => {
    const qty  = Number(item?.quantity)  || 0;
    const rate = Number(item?.unitPrice) || 0;
    const tax  = Number(item?.taxRate)   || 0;
    return qty * rate * (1 + tax / 100);
  }, []);

  // ── Debounced recalculation ────────────────────────────────────────────────
  const totalsRecalc$ = useRef(new Subject<{ items: InvoiceItem[]; discType: DiscountType; discValue: number }>());

  useEffect(() => {
    const sub = totalsRecalc$.current
      .pipe(debounceTime(120))
      .subscribe(({ items, discType, discValue }) => calculateTotals(items, discType, discValue));
    return () => sub.unsubscribe();
  }, [calculateTotals]);

  const queueTotalsRecalculation = useCallback(() => {
    totalsRecalc$.current.next({
      items:    getValues('items')                               || [],
      discType: (getValues('discountType') as DiscountType)     || 'percentage',
      discValue: getValues('discountValue')                     || 0,
    });
  }, [getValues]);

  const watchedDiscountValue = watch('discountValue');
  useEffect(() => { queueTotalsRecalculation(); }, [watchedDiscountValue, discountType, queueTotalsRecalculation]);
  useEffect(() => { queueTotalsRecalculation(); }, [fields.length, queueTotalsRecalculation]);

  useEffect(() => {
    if (preSelectedItems?.length) {
      setTimeout(() => queueTotalsRecalculation(), 100);
    }
  }, [preSelectedItems, queueTotalsRecalculation]);

  useEffect(() => {
    setItemsVersion(v => v + 1);
  }, [preSelectedItems]);

  // ── Watched totals ─────────────────────────────────────────────────────────
  const subtotal       = watch('subtotal')       || 0;
  const taxAmount      = watch('taxAmount')      || 0;
  const discountAmount = watch('discountAmount') || 0;
  const totalAmount    = watch('totalAmount')    || 0;

  // ── Stock validation ───────────────────────────────────────────────────────
  /**
   * Validates every row in the items table for stock issues.
   * Returns true if all rows are valid and the form can be saved.
   * Sets rowErrors for display and shows a summary notification.
   */
  const validateItems = useCallback((): boolean => {
    const items = getValues('items') || [];
    const newErrors: Record<number, RowError> = {};
    let hasBlockingErrors = false;

    items.forEach((item: InvoiceItem, index: number) => {
      const itemName     = item.itemName || '';
      const quantity     = Number(item.quantity)     || 0;
      const availableQty = Number(item.availableQty) || 0;
      const unit         = item.unit || 'units';

      // Rule 1 — No item selected
      if (!itemName.trim()) {
        newErrors[index] = {
          type: 'NO_ITEM',
          message: `Row ${index + 1}: Please select an item.`,
          severity: 'error',
        };
        hasBlockingErrors = true;
        return;
      }

      // Rule 2 — No quantity entered
      if (quantity <= 0) {
        newErrors[index] = {
          type: 'NO_QUANTITY',
          message: `Row ${index + 1}: "${itemName}" — quantity must be greater than 0.`,
          severity: 'error',
        };
        hasBlockingErrors = true;
        return;
      }

      // Rule 3 — Out of stock (availableQty === 0)
      if (availableQty === 0) {
        newErrors[index] = {
          type: 'OUT_OF_STOCK',
          message: `Row ${index + 1}: "${itemName}" is out of stock and cannot be invoiced.`,
          severity: 'error',
        };
        hasBlockingErrors = true;
        return;
      }

      // Rule 4 — Requested quantity exceeds available stock
      if (quantity > availableQty) {
        newErrors[index] = {
          type: 'INSUFFICIENT_STOCK',
          message: `Row ${index + 1}: "${itemName}" — requested ${quantity} ${unit} but only ${availableQty} ${unit} available.`,
          severity: 'error',
        };
        hasBlockingErrors = true;
        return;
      }

      // Rule 5 — Low stock warning (available < 10 after deduction) — non-blocking
      const remainingAfter = availableQty - quantity;
      if (availableQty < 10 && availableQty > 0 && quantity <= availableQty) {
        newErrors[index] = {
          type: 'LOW_STOCK',
          message: `Row ${index + 1}: "${itemName}" — low stock. Only ${remainingAfter} ${unit} will remain after this invoice.`,
          severity: 'warning',
        };
        // NOT setting hasBlockingErrors — low stock is a warning, not a block
      }
    });

    setRowErrors(newErrors);

    // Show summary notification
    const errorEntries   = Object.values(newErrors).filter(e => e.severity === 'error');
    const warningEntries = Object.values(newErrors).filter(e => e.severity === 'warning');

    if (errorEntries.length > 0) {
      notificationApi.error({
        message: `${errorEntries.length} stock issue${errorEntries.length > 1 ? 's' : ''} found`,
        description: (
          <div style={{ maxHeight: 160, overflowY: 'auto' }}>
            {errorEntries.map((e, i) => (
              <div key={i} style={{ marginBottom: 4, fontSize: 12 }}>
                ❌ {e.message}
              </div>
            ))}
            {warningEntries.map((e, i) => (
              <div key={`w${i}`} style={{ marginBottom: 4, fontSize: 12, color: '#d46b08' }}>
                ⚠️ {e.message}
              </div>
            ))}
          </div>
        ) as any,
        showProgress: true,
        pauseOnHover: true,
        duration: 6,
      });
      return false;
    }

    if (warningEntries.length > 0) {
      notificationApi.warning({
        message: `${warningEntries.length} low stock warning${warningEntries.length > 1 ? 's' : ''}`,
        description: (
          <div>
            {warningEntries.map((e, i) => (
              <div key={i} style={{ fontSize: 12 }}>⚠️ {e.message}</div>
            ))}
          </div>
        ) as any,
        showProgress: true,
        pauseOnHover: true,
      });
      // Low stock warnings do NOT block saving
    }

    return !hasBlockingErrors;
  }, [getValues, notificationApi]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const onCustomerSelect = useCallback((value: string, option: any) => {
    setValue('customerCode',    option.customerCode);
    setValue('customerName',    `${option.customerFirstName} ${option.customerLastName || ''}`);
    setValue('customerEmail',   option.customerEmail   || '');
    setValue('customerMobile',  option.customerMobile  || '');
    setValue('customerAddress', option.customerAddress || {});
  }, [setValue]);

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    move(result.source.index, result.destination.index);
    queueTotalsRecalculation();
  }, [move, queueTotalsRecalculation]);

  const addInvoiceItem = useCallback(() => {
    append({ itemCode: '', itemName: '', description: '', quantity: 0, boxQuantity: 0, itemBoxQuantity: 0, size: '', category: '', unit: '', unitPrice: 0, taxRate: 0, discount: 0, amount: 0, squareFeet: 0, availableQty: 0 });
  }, [append]);

  const handleRemoveItem = useCallback((index: number) => {
    remove(index);
    // Clear error for removed row and shift indices
    setRowErrors(prev => {
      const next: Record<number, RowError> = {};
      Object.entries(prev).forEach(([key, val]) => {
        const k = Number(key);
        if (k < index) next[k] = val;
        else if (k > index) next[k - 1] = val;
        // k === index is removed
      });
      return next;
    });
  }, [remove]);

  const handleDiscountTypeChange = useCallback((type: DiscountType) => {
    setDiscountType(type);
    setValue('discountType', type);
    setValue('discountValue', 0);
    queueTotalsRecalculation();
  }, [setValue, queueTotalsRecalculation]);

  // ── Clear a single row's error when item is changed ───────────────────────
  const clearRowError = useCallback((index: number) => {
    setRowErrors(prev => {
      if (!prev[index]) return prev;
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }, []);

  // ── Save with validation ──────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    // Step 1: validate stock
    const stockValid = validateItems();
    if (!stockValid) return; // stop — errors shown in rowErrors + notification

    // Step 2: run react-hook-form validation, then submit
    handleSubmit(onSubmit, onError)();
  }, [validateItems, handleSubmit]);

  const onSubmit = async (formValues: any) => {
    const userName   = CookieService.get('user_name') || 'Admin';
    const paid       = Number(formValues.paidAmount) || 0;
    const total      = Number(formValues.totalAmount) || 0;
    const balanceDue = Math.max(0, total - paid);

    let status = formValues.status;
    if (paid >= total && total > 0)    status = 'PAID';
    else if (paid > 0 && paid < total) status = 'PARTIALLY_PAID';

    await refetch({
      body: {
        ...formValues,
        invoiceDate:        formValues.invoiceDate?.format?.('YYYY-MM-DD') || formValues.invoiceDate,
        dueDate:            formValues.dueDate?.format?.('YYYY-MM-DD')     || formValues.dueDate,
        discountType:       (formValues.discountType as DiscountType) || discountType,
        discountValue:      formValues.discountValue ?? 0,
        discountAmount:     formValues.discountAmount,
        paidAmount:         paid,
        balanceDue,
        status,
        createdBy:          userName,
        updatedBy:          userName,
        paymentMethod:      formValues.paymentMethod || 'UPI',
      }
    });
  };

  const onError = (errs: any) => {
    for (const f of ['customerCode', 'invoiceDate', 'dueDate']) {
      if (errs[f]) { setFocus(f as any); break; }
    }
  };

  const layout = { labelCol: { span: 6 }, wrapperCol: { span: 10 } };

  // ── Custom field renderer ──────────────────────────────────────────────────
  const renderCustomField = (field: CustomField) => {
    const fieldName = `customFields.${field.fieldName}`;
    const commonProps = { name: fieldName as any, control, rules: field.required ? { required: `${field.fieldLabel} is required` } : undefined };

    switch (field.fieldType) {
      case 'NUMBER':
        return (
          <Form.Item key={field.id} label={field.fieldLabel} required={field.required}>
            <Controller {...commonProps} render={({ field: f }) => (
              <InputNumber size="large" {...f} style={{ width: '100%' }} placeholder={`Enter ${field.fieldLabel}`} />
            )} />
          </Form.Item>
        );
      case 'BOOLEAN':
        return (
          <Form.Item key={field.id} label={field.fieldLabel} required={field.required}>
            <Controller name={fieldName as any} control={control} render={({ field: f }) => (
              <Checkbox checked={f.value} onChange={e => f.onChange(e.target.checked)}>{field.fieldLabel}</Checkbox>
            )} />
          </Form.Item>
        );
      case 'DROPDOWN':
        return (
          <Form.Item key={field.id} label={field.fieldLabel} required={field.required}>
            <Controller {...commonProps} render={({ field: f }) => (
              <Select size="large" {...f} placeholder={`Select ${field.fieldLabel}`}
                options={field.fieldOptions?.map(o => ({ label: o.label, value: o.value })) || []} />
            )} />
          </Form.Item>
        );
      case 'MULTISELECT':
        return (
          <Form.Item key={field.id} label={field.fieldLabel} required={field.required}>
            <Controller {...commonProps} render={({ field: f }) => (
              <Select size="large" mode="multiple" {...f} placeholder={`Select ${field.fieldLabel}`}
                options={field.fieldOptions?.map(o => ({ label: o.label, value: o.value })) || []} />
            )} />
          </Form.Item>
        );
      case 'DATE':
        return (
          <Form.Item key={field.id} label={field.fieldLabel} required={field.required}>
            <Controller {...commonProps} render={({ field: f }) => (
              <DatePicker size="large" {...f} style={{ width: '100%' }} format="YYYY-MM-DD"
                value={f.value ? dayjs(f.value) : null}
                onChange={date => f.onChange(date?.format('YYYY-MM-DD'))} />
            )} />
          </Form.Item>
        );
      case 'DATETIME':
        return (
          <Form.Item key={field.id} label={field.fieldLabel} required={field.required}>
            <Controller {...commonProps} render={({ field: f }) => (
              <DatePicker size="large" showTime {...f} style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss"
                value={f.value ? dayjs(f.value) : null}
                onChange={date => f.onChange(date?.format('YYYY-MM-DD HH:mm:ss'))} />
            )} />
          </Form.Item>
        );
      default:
        return (
          <Form.Item key={field.id} label={field.fieldLabel} required={field.required}>
            <Controller {...commonProps} render={({ field: f }) => (
              <Input size="large" {...f} placeholder={`Enter ${field.fieldLabel}`} />
            )} />
          </Form.Item>
        );
    }
  };

  const watchedPaidAmount = watch('paidAmount');

  useEffect(() => {
    const paid  = Number(watchedPaidAmount) || 0;
    const total = Number(getValues('totalAmount')) || 0;
    if (paid <= 0) return;
    if (paid >= total && total > 0) setValue('status', 'PAID');
    else if (paid > 0)              setValue('status', 'PARTIALLY_PAID');
  }, [watchedPaidAmount, totalAmount]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Container>
      <Header>Create Invoice</Header>

      <Content>
        <FormUxScope>
          <Form {...layout} labelAlign="left">

            {/* CUSTOMER */}
            <Form.Item label="Customer" required
              validateStatus={errors.customerCode ? 'error' : ''}
              help={<FormErrorMessage message={errors.customerCode?.message as string} />}
            >
              <Controller name="customerCode" control={control} rules={{ required: 'Customer is required' }}
                render={({ field }) => (
                  <Select {...field} size="large" showSearch
                    suffixIcon={<IoIosArrowDown size={20} />}
                    placeholder="Select Customer"
                    loading={customersLoading}
                    options={customerOptions}
                    optionFilterProp="label"
                    onChange={(value, option: any) => { field.onChange(value); onCustomerSelect(value, option); }}
                    optionRender={(option: any) => {
                      const c = option.data;
                      return (
                        <div className="flex justify-between">
                          <div style={{ fontWeight: 500 }}>{c.customerFirstName} {c.customerLastName || ''}</div>
                          <div style={{ fontSize: 12, color: '#777' }}>{c.customerCode}</div>
                        </div>
                      );
                    }}
                    popupRender={menu => (
                      <>
                        {menu}
                        <Divider style={{ margin: '4px 0' }} />
                        <div className="flex gap-2 items-center justify-center">
                          <Button size="small" type="primary"
                            icon={<MdAddBox size={18} style={{ marginTop: 4 }} />}
                            onClick={() => navigate('/customer/create')}>
                            Create
                          </Button>
                        </div>
                      </>
                    )}
                  />
                )}
              />
            </Form.Item>

            {/* INVOICE DATE */}
            <Form.Item label="Invoice Date" required
              validateStatus={errors.invoiceDate ? 'error' : ''}
              help={<FormErrorMessage message={errors.invoiceDate?.message as string} />}
            >
              <Controller name="invoiceDate" control={control} rules={{ required: 'Invoice date is required' }}
                render={({ field }) => <DatePicker {...field} size="large" style={{ width: '100%' }} format="YYYY-MM-DD" />}
              />
            </Form.Item>

            {/* DUE DATE */}
            <Form.Item label="Due Date" required
              validateStatus={errors.dueDate ? 'error' : ''}
              help={<FormErrorMessage message={errors.dueDate?.message as string} />}
            >
              <Controller name="dueDate" control={control} rules={{ required: 'Due date is required' }}
                render={({ field }) => <DatePicker {...field} size="large" style={{ width: '100%' }} format="YYYY-MM-DD" />}
              />
            </Form.Item>

            {/* STATUS */}
            <Form.Item label="Status">
              <Controller name="status" control={control}
                render={({ field }) => (
                  <Select {...field} size="large" suffixIcon={<IoIosArrowDown size={20} />} options={[
                    { label: 'Draft',          value: 'DRAFT' },
                    { label: 'Paid',           value: 'PAID' },
                    { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
                    { label: 'Cancelled',      value: 'CANCELLED' },
                  ]} />
                )}
              />
            </Form.Item>

            {/* PAYMENT METHOD */}
            <Form.Item label="Payment Method">
              <Controller name="paymentMethod" control={control}
                render={({ field }) => (
                  <Select {...field} size="large" suffixIcon={<IoIosArrowDown size={20} />} options={[
                    { label: 'UPI',         value: 'UPI' },
                    { label: 'Cash',        value: 'Cash' },
                    { label: 'Card',        value: 'Card' },
                    { label: 'Net Banking', value: 'Net Banking' },
                  ]} />
                )}
              />
            </Form.Item>

            {/* PAID AMOUNT */}
            <Form.Item label="Paid Amount">
              <Controller name="paidAmount" control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    size="large"
                    min={0}
                    style={{ width: '100%' }}
                    prefix={<Rupee>₹</Rupee>}
                    placeholder="0.00"
                    onChange={value => { field.onChange(Number(value) || 0); }}
                  />
                )}
              />
            </Form.Item>

            <Divider />

            {/* ── Items table ── */}
            <div style={{ marginBottom: 12, fontWeight: 600 }}>
              Invoice Items
              {Object.keys(rowErrors).length > 0 && (
                <span style={{
                  marginLeft: 12,
                  fontSize: 12,
                  color: Object.values(rowErrors).some(e => e.severity === 'error') ? '#cf1322' : '#d46b08',
                  fontWeight: 400,
                }}>
                  {Object.values(rowErrors).filter(e => e.severity === 'error').length > 0
                    ? `⚠ ${Object.values(rowErrors).filter(e => e.severity === 'error').length} error(s) — please fix before saving`
                    : `⚠ ${Object.values(rowErrors).filter(e => e.severity === 'warning').length} low stock warning(s)`
                  }
                </span>
              )}
            </div>

            <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '25px 2.5fr 1.2fr 1.8fr 1.5fr 1.2fr 1.5fr 52px',
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

              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="invoice-items-droppable">
                  {(dropProvided) => (
                    <div ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                      {fields.map((item, index) => (
                        <InvoiceItemRow
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
                          rowError={rowErrors[index]}
                          onClearRowError={clearRowError}
                        />
                      ))}
                      {dropProvided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>

            <div style={{ marginTop: 12 }}>
              <Button icon={<MdAddBox />} onClick={addInvoiceItem}>Add New Row</Button>
            </div>

            {/* ── Totals ── */}
            <TotalsWrapper>
              <TotalsCard>
                <TotalsHeader>Invoice Summary</TotalsHeader>

                <TotalsRow>
                  <TotalsLabel>Subtotal</TotalsLabel>
                  <TotalsValue><Rupee>₹ </Rupee>{subtotal.toFixed(2)}</TotalsValue>
                </TotalsRow>

                <TotalsRow highlight>
                  <TotalsLabel>Tax</TotalsLabel>
                  <TotalsValue style={{ color: '#d46b08' }}>+ <Rupee>₹ </Rupee>{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TotalsValue>
                </TotalsRow>

                <TotalsRow discount>
                  <TotalsLabel>Discount</TotalsLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Controller
                      name="discountValue"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          value={field.value ?? 0}
                          size="small"
                          min={0}
                          max={discountType === 'percentage' ? 100 : subtotal + taxAmount}
                          style={{ width: 80 }}
                          onChange={value => {
                            const val = value === null || value === undefined ? 0 : Number(value);
                            const currentType = (getValues('discountType') as DiscountType) || discountType;
                            const clampedVal = currentType === 'percentage'
                              ? Math.min(Math.max(val, 0), 100)
                              : Math.min(Math.max(val, 0), subtotal + taxAmount);
                            field.onChange(clampedVal);
                            totalsRecalc$.current.next({
                              items:     getValues('items') || [],
                              discType:  currentType,
                              discValue: clampedVal,
                            });
                          }}
                        />
                      )}
                    />
                    <DiscountTypeToggle>
                      <button type="button"
                        className={discountType === 'percentage' ? 'active' : ''}
                        onClick={() => handleDiscountTypeChange('percentage')}
                        title="Percentage">%</button>
                      <button type="button"
                        className={discountType === 'amount' ? 'active' : ''}
                        onClick={() => handleDiscountTypeChange('amount')}
                        title="Fixed Amount"><Rupee>₹</Rupee></button>
                    </DiscountTypeToggle>
                  </div>
                </TotalsRow>

                {discountAmount > 0 && (
                  <TotalsRow discount>
                    <TotalsLabel>
                      Discount applied
                      <span style={{ fontSize: 11, color: '#8c8c8c', marginLeft: 6 }}>
                        {discountType === 'percentage' ? `(${watch('discountValue') || 0}%)` : '(fixed)'}
                      </span>
                    </TotalsLabel>
                    <TotalsValue>− <Rupee>₹ </Rupee>{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TotalsValue>
                  </TotalsRow>
                )}

                {(watch('paidAmount') || 0) > 0 && (
                  <TotalsRow highlight>
                    <TotalsLabel>Paid Amount</TotalsLabel>
                    <TotalsValue style={{ color: '#237804' }}>
                      − <Rupee>₹ </Rupee>{(watch('paidAmount') || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TotalsValue>
                  </TotalsRow>
                )}

                <TotalsRow style={{
                  background: Math.max(0, totalAmount - (watch('paidAmount') || 0)) === 0 ? '#f6ffed' : '#fff1f0'
                }}>
                  <TotalsLabel style={{ fontWeight: 600 }}>Balance Due</TotalsLabel>
                  <TotalsValue style={{
                    fontWeight: 700,
                    color: Math.max(0, totalAmount - (watch('paidAmount') || 0)) === 0 ? '#237804' : '#cf1322'
                  }}>
                    <Rupee>₹ </Rupee>
                    {Math.max(0, totalAmount - (watch('paidAmount') || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TotalsValue>
                </TotalsRow>

                <TotalsRow grand>
                  <TotalsLabel>Total</TotalsLabel>
                  <TotalsValue><Rupee>₹ </Rupee>{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TotalsValue>
                </TotalsRow>
                <TotalsRow>
                  <TotalsLabel>Amount in Words</TotalsLabel>
                  <TotalsValue style={{ textAlign: 'right', maxWidth: 220 }}>
                    {numberToWords(totalAmount)}
                  </TotalsValue>
                </TotalsRow>
              </TotalsCard>
            </TotalsWrapper>

            {/* NOTES */}
            <Form.Item label="Notes" style={{ marginTop: 24 }}>
              <Controller name="notes" control={control}
                render={({ field }) => <Input.TextArea {...field} rows={3} placeholder="Additional notes" />}
              />
            </Form.Item>

            {/* TERMS */}
            <Form.Item label="Terms & Conditions">
              <Controller name="termsAndConditions" control={control}
                render={({ field }) => <Input.TextArea {...field} rows={3} placeholder="Terms and conditions" />}
              />
            </Form.Item>

            {/* CUSTOM FIELDS */}
            {customFields.length > 0 && (
              <>
                <Divider orientation="left">Additional Information</Divider>
                {customFields.map(field => renderCustomField(field))}
              </>
            )}

          </Form>
        </FormUxScope>
      </Content>

      <Footer>
        {/* Save now calls handleSave which validates stock first */}
        <Button
          variant="solid"
          color="primary"
          className="w-[150px]"
          htmlType="button"
          loading={loading}
          onClick={handleSave}
        >
          Save
        </Button>
        <Button variant="outlined" color="danger" className="w-[150px]" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </Footer>
    </Container>
  );
}

// ─── Number to Words Helper ───────────────────────────────────────────────────
function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
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

// ─── Size helper ──────────────────────────────────────────────────────────────
function parseSizeToSqFtPerUnit(size: string | undefined | null): number {
  if (!size) return 0;
  const sizeStr = size.toLowerCase().trim();
  const unitMatch = sizeStr.match(/-(in|mm|cm|m)$/);
  const unit = unitMatch ? unitMatch[1] : 'in';
  const cleaned = sizeStr.replace(/-(in|mm|cm|m)$/, '');
  const parts = cleaned.split(/[xX×\s]+/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
  if (parts.length < 2) return 0;
  let length = parts[0]; let width = parts[1];
  switch (unit) {
    case 'mm': length /= 304.8; width /= 304.8; break;
    case 'cm': length /= 30.48; width /= 30.48; break;
    case 'm':  length *= 3.28084; width *= 3.28084; break;
    default:   length /= 12; width /= 12; break;
  }
  return length * width;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PIECE_BASED_CATEGORIES = ['sanitaryware', 'sanitary ware', 'pieces', 'piece'];

const isSanitaryware = (category?: string): boolean =>
  PIECE_BASED_CATEGORIES.some(c => c === (category || '').toLowerCase().trim());

const calculateSquareFeet = (item: {
  size?: string; boxQuantity?: number; itemBoxQuantity?: number; category?: string;
}): number => {
  if (!item.size) return 0;
  if (isSanitaryware(item.category)) {
    return (Number(item.itemBoxQuantity) || 0) * (Number(item.boxQuantity) || 0);
  }
  const sizeStr = item.size.toLowerCase().trim();
  const unitMatch = sizeStr.match(/-(in|mm|cm|m)$/);
  const unit = unitMatch ? unitMatch[1] : 'in';
  const cleaned = sizeStr.replace(/-(in|mm|cm|m)$/g, '');
  const parts = cleaned.split(/[xX×]/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
  if (parts.length < 2) return 0;
  let length = parts[0]; let width = parts[1];
  switch (unit) {
    case 'mm': length /= 304.8; width /= 304.8; break;
    case 'cm': length /= 30.48; width /= 30.48; break;
    case 'm':  length *= 3.28084; width *= 3.28084; break;
    default:   length /= 12; width /= 12; break;
  }
  const sqFtPerTile = length * width;
  const tilesPerBox = Number(item.itemBoxQuantity) || 0;
  const numberOfBoxes = Number(item.boxQuantity) || 0;
  if (!sqFtPerTile || !tilesPerBox || !numberOfBoxes) return 0;
  return sqFtPerTile * tilesPerBox * numberOfBoxes;
};

// ─── Row error color helpers ──────────────────────────────────────────────────
const rowErrorBorderColor = (error: { severity: 'error' | 'warning' } | undefined): string => {
  if (!error) return '#f0f0f0';
  return error.severity === 'error' ? '#ff4d4f' : '#faad14';
};

const rowErrorBg = (error: { severity: 'error' | 'warning' } | undefined): string => {
  if (!error) return 'transparent';
  return error.severity === 'error' ? '#fff2f0' : '#fffbe6';
};

// ─── InvoiceItemRow ───────────────────────────────────────────────────────────
const InvoiceItemRow = memo(function InvoiceItemRow({
  rowId, index, control, register, setValue, getValues,
  itemOptions, onSearchItems, onScrollItems, onQueueTotals, onRemoveRow, canRemove,
  calculateLineAmount, calculateSquareFeet,
  rowError,       // ← NEW: RowError | undefined
  onClearRowError, // ← NEW: (index: number) => void
}: any) {
  const navigate = useNavigate();
  const notificationApi = useNotification();

  const watchedItem = useWatch({ control, name: `items.${index}` });

  const rowCalc = {
    quantity:        Number(watchedItem?.quantity)        || 0,
    boxQuantity:     Number(watchedItem?.boxQuantity)     || 0,
    itemBoxQuantity: Number(watchedItem?.itemBoxQuantity) || 0,
    size:            watchedItem?.size     || '',
    category:        watchedItem?.category || '',
    unitPrice:       Number(watchedItem?.unitPrice) || 0,
    taxRate:         Number(watchedItem?.taxRate)   || 0,
    unit:            watchedItem?.unit     || '',
    availableQty:    watchedItem?.availableQty || 0,
  };

  useEffect(() => {
    const amountValue = Number(calculateLineAmount(rowCalc).toFixed(2));
    setValue(`items.${index}.amount`, amountValue, { shouldDirty: false, shouldValidate: false, shouldTouch: false });
  }, [rowCalc.quantity, rowCalc.boxQuantity, rowCalc.unitPrice, rowCalc.taxRate]);

  const amount      = calculateLineAmount(rowCalc);
  const squareFeet  = calculateSquareFeet(rowCalc);

  const hasError   = !!rowError && rowError.severity === 'error';
  const hasWarning = !!rowError && rowError.severity === 'warning';

  return (
    <Draggable draggableId={rowId} index={index}>
      {(dragProvided) => (
        <div
          ref={dragProvided.innerRef}
          {...dragProvided.draggableProps}
          style={{ ...dragProvided.draggableProps.style }}
        >
          {/* ── Main row ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '25px 2.5fr 1.2fr 1.8fr 1.5fr 1.2fr 1.5fr 52px',
            padding: '10px 12px',
            borderBottom: rowError ? 'none' : '1px solid #f0f0f0',
            borderLeft: `3px solid ${rowErrorBorderColor(rowError)}`,
            background: rowErrorBg(rowError),
            alignItems: 'center',
            gap: 8,
            transition: 'border-color 0.2s, background 0.2s',
          }}>
            {/* Drag handle */}
            <div {...dragProvided.dragHandleProps} style={{ cursor: 'grab', display: 'flex', justifyContent: 'center' }}>
              <MdDragIndicator size={18} color="#8c8c8c" />
            </div>

            {/* Item select */}
            <Controller name={`items.${index}.itemName`} control={control} rules={{ required: 'Item is required' }}
              render={({ field }) => (
                <Select
                  {...field}
                  showSearch
                  allowClear
                  suffixIcon={<IoIosArrowDown size={20} />}
                  placeholder="Select Item"
                  options={itemOptions}
                  filterOption={false}
                  onSearch={onSearchItems}
                  onClear={() => onSearchItems('')}
                  onPopupScroll={onScrollItems}
                  listHeight={320}
                  popupMatchSelectWidth={350}
                  status={hasError && !watchedItem?.itemName ? 'error' : undefined}
                  optionRender={(option: any) => {
                    const item = option.data;
                    const isOutOfStock = item.quantity === 0;
                    const isLowStock   = item.quantity > 0 && item.quantity < 10;
                    return (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{item.itemName || item.label}</div>
                          <div style={{ fontSize: 11, color: '#888' }}>{item.category} • {item.unit}</div>
                          {isOutOfStock && (
                            <div style={{ fontSize: 11, color: '#fff', background: '#ff4d4f', padding: '1px 6px', borderRadius: 3, marginTop: 2 }}>Out of Stock</div>
                          )}
                          {isLowStock && (
                            <div style={{ fontSize: 11, color: '#fff', background: '#faad14', padding: '1px 6px', borderRadius: 3, marginTop: 2 }}>Low Stock: {item.quantity}</div>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 500, color: '#1677ff' }}><Rupee>₹</Rupee>{item.sellingPrice || 0}</div>
                          <div style={{ fontSize: 11, color: '#888' }}>{item.itemCode}</div>
                          {!isOutOfStock && !isLowStock && (
                            <div style={{ fontSize: 11, color: '#52c41a' }}>Stock: {item.quantity}</div>
                          )}
                        </div>
                      </div>
                    );
                  }}
                  onChange={(_val, option: any) => {
                    const nextUnit     = option?.unit         || '';
                    const sellingPrice = option?.sellingPrice || 0;
                    const taxRate      = option?.taxRate      || 0;
                    const availableQty = option?.quantity     || 0;
                    const isOutOfStock = availableQty === 0;
                    field.onChange(option?.itemName || '');
                    setValue(`items.${index}.itemCode`,        option?.itemCode        || '');
                    setValue(`items.${index}.unit`,            nextUnit);
                    setValue(`items.${index}.unitPrice`,       sellingPrice);
                    setValue(`items.${index}.taxRate`,         taxRate);
                    setValue(`items.${index}.availableQty`,    availableQty);
                    setValue(`items.${index}.size`,            option?.size            || '');
                    setValue(`items.${index}.itemBoxQuantity`, option?.itemBoxQuantity || 0);
                    setValue(`items.${index}.category`,        option?.category        || '');
                    onClearRowError(index); // clear error when item is re-selected
                    if (isOutOfStock) {
                      notificationApi.warning({
                        message: 'Out of Stock',
                        description: `${option?.itemName || option?.label} is out of stock.`,
                        showProgress: true,
                        pauseOnHover: true,
                      });
                    }
                    onQueueTotals();
                  }}
                  value={field.value || undefined}
                  popupRender={menu => (
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
            <input type="hidden" {...register(`items.${index}.itemCode`)} />
            <input type="hidden" {...register(`items.${index}.unit`)} />
            <input type="hidden" {...register(`items.${index}.amount`)} />
            <input type="hidden" {...register(`items.${index}.size`)} />
            <input type="hidden" {...register(`items.${index}.category`)} />
            <input type="hidden" {...register(`items.${index}.itemBoxQuantity`)} />

            {/* Box Quantity */}
            <Controller name={`items.${index}.boxQuantity`} control={control}
              render={({ field }) => (
                <Tooltip title={rowCalc.size ? `Size: ${rowCalc.size} | Tiles per box: ${rowCalc.itemBoxQuantity}` : 'Select an item to enable sq ft calculation'}>
                  <InputNumber
                    {...field}
                    min={0}
                    inputMode="numeric"
                    style={{ width: '100%' }}
                    controls={{ upIcon: <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>, downIcon: <span style={{ fontSize: 14, lineHeight: 1 }}>−</span> }}
                    onChange={(value) => {
                      const nextBoxQty  = Number(value) || 0;
                      const tilesPerBox = rowCalc.itemBoxQuantity || 0;
                      let nextQty = 0;
                      if (isSanitaryware(rowCalc.category)) {
                        nextQty = nextBoxQty * tilesPerBox;
                      } else {
                        const sqFtPerTile = parseSizeToSqFtPerUnit(rowCalc.size);
                        nextQty = Number((sqFtPerTile * tilesPerBox * nextBoxQty).toFixed(3));
                      }
                      if (rowCalc.availableQty > 0 && nextQty > rowCalc.availableQty) {
                        notificationApi.warning({
                          message: 'Insufficient Stock',
                          description: `Only ${rowCalc.availableQty} ${rowCalc.unit} available in stock.`,
                          showProgress: true, pauseOnHover: true,
                        });
                      }
                      setValue(`items.${index}.quantity`, nextQty, { shouldDirty: false, shouldValidate: false, shouldTouch: false });
                      field.onChange(nextBoxQty);
                      onClearRowError(index);
                      onQueueTotals();
                    }}
                  />
                </Tooltip>
              )}
            />

            {/* Quantity */}
            <Controller name={`items.${index}.quantity`} control={control}
              render={({ field }) => (
                <Tooltip title={rowCalc.availableQty > 0 ? `Available: ${rowCalc.availableQty} ${rowCalc.unit}` : ''}>
                  <InputNumber
                    {...field}
                    inputMode="numeric"
                    min={1}
                    max={rowCalc.availableQty > 0 ? rowCalc.availableQty : undefined}
                    style={{
                      width: '100%',
                      ...(hasError && rowCalc.quantity > rowCalc.availableQty ? { borderColor: '#ff4d4f' } : {}),
                      ...(rowCalc.availableQty === 0 ? { borderColor: '#ff4d4f' } : {}),
                    }}
                    suffix={<span className='text-[11px]'>{rowCalc.unit}</span>}
                    status={
                      (hasError && (rowCalc.quantity <= 0 || rowCalc.quantity > rowCalc.availableQty)) ||
                      rowCalc.availableQty === 0
                        ? 'error'
                        : hasWarning
                        ? 'warning'
                        : undefined
                    }
                    onChange={(value) => {
                      const nextQty = Number(value) || 1;
                      if (rowCalc.availableQty > 0 && nextQty > rowCalc.availableQty) {
                        notificationApi.warning({
                          message: 'Insufficient Stock',
                          description: `Only ${rowCalc.availableQty} ${rowCalc.unit} available in stock.`,
                          showProgress: true, pauseOnHover: true,
                        });
                      }
                      const tilesPerBox = rowCalc.itemBoxQuantity || 0;
                      let derivedBoxQty = 0;
                      if (isSanitaryware(rowCalc.category)) {
                        derivedBoxQty = tilesPerBox > 0 ? Math.round((nextQty / tilesPerBox) * 100) / 100 : 0;
                      } else {
                        const sqFtPerTile = parseSizeToSqFtPerUnit(rowCalc.size);
                        const sqFtPerBox  = sqFtPerTile * tilesPerBox;
                        derivedBoxQty = sqFtPerBox > 0 ? Math.round((nextQty / sqFtPerBox) * 100) / 100 : 0;
                      }
                      setValue(`items.${index}.boxQuantity`, derivedBoxQty, { shouldDirty: false, shouldValidate: false, shouldTouch: false });
                      field.onChange(nextQty);
                      onClearRowError(index);
                      onQueueTotals();
                    }}
                  />
                </Tooltip>
              )}
            />

            {/* Unit Price */}
            <Controller name={`items.${index}.unitPrice`} control={control}
              render={({ field }) => (
                <InputNumber {...field} style={{ width: '100%' }} inputMode="numeric" min={0}
                  prefix={<Rupee>₹</Rupee>}
                  onChange={value => { field.onChange(Number(value) || 0); onQueueTotals(); }}
                />
              )}
            />

            {/* Tax Rate */}
            <Controller name={`items.${index}.taxRate`} control={control}
              render={({ field }) => (
                <InputNumber {...field} min={0} max={100} style={{ width: '100%' }}
                  addonAfter="%"
                  onChange={value => { field.onChange(Number(value) || 0); onQueueTotals(); }}
                />
              )}
            />

            {/* Amount */}
            <div style={{ fontWeight: 600, textAlign: 'right' }}><Rupee>₹</Rupee> {amount.toFixed(2)}</div>

            {/* Remove */}
            <Button type="text" danger onClick={() => onRemoveRow(index)} disabled={!canRemove} icon={<IoTrashBinSharp />} />
          </div>

          {/* ── Row error / warning banner ── */}
          {rowError && (
            <div style={{
              padding: '5px 44px 6px 44px',
              borderBottom: '1px solid #f0f0f0',
              borderLeft: `3px solid ${rowErrorBorderColor(rowError)}`,
              background: rowErrorBg(rowError),
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: rowError.severity === 'error' ? '#cf1322' : '#d46b08',
            }}>
              <span>{rowError.severity === 'error' ? '❌' : '⚠️'}</span>
              <span>{rowError.message}</span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}, (prev, next) =>
  prev.rowId          === next.rowId          &&
  prev.index          === next.index          &&
  prev.canRemove      === next.canRemove      &&
  prev.itemOptions    === next.itemOptions    &&
  prev.onSearchItems  === next.onSearchItems  &&
  prev.onScrollItems  === next.onScrollItems  &&
  prev.rowError       === next.rowError       &&
  prev.onClearRowError === next.onClearRowError
);