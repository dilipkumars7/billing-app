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

// ─── Totals Section Styles (matches PurchaseCreate) ───────────────────────────

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
const TotalsValue = styled.span`
  font-weight: inherit;
  color: inherit;
`;

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
            itemBoxQuantity:  item.boxQuantity,
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
  const [itemsVersion, setItemsVersion] = useState(0);

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
      label:          item?.name          || item?.itemName || '',
      value:          item?.itemCode      || '',
      itemName:       item?.name          || item?.itemName || '',
      category:       item?.category      || '',
      unit:           item?.unit          || '',
      itemCode:       item?.itemCode      || '',
      sellingPrice:   item?.sellingPrice  || 0,
      taxRate:        item?.taxRate       || 0,
      quantity:       item?.quantity      || 0,
      size:           item?.size          || '',
      itemBoxQuantity: item?.boxQuantity  || 0,
    }));
  }, [itemOptionsState]);

  // ── Calculations ───────────────────────────────────────────────────────────
  const calculateTotals = useCallback((
    itemsList: InvoiceItem[], discType: DiscountType, discValue: number
  ) => {
    let subtotal = 0;
    let taxAmount = 0;
    for (const item of itemsList) {
      const qty       = Number(item?.quantity)  || 0;
      const price     = Number(item?.unitPrice)  || 0;
      const taxRate   = Number(item?.taxRate)    || 0;
      const lineAmt   = qty * price;
      subtotal   += lineAmt;
      taxAmount  += lineAmt * (taxRate / 100);
    }
    const discountVal = Number(discValue) || 0;
    let discountAmount = 0;
    if (discType === 'percentage') {
      discountAmount = subtotal * (Math.min(Math.max(discountVal, 0), 100) / 100);
    } else {
      discountAmount = Math.min(Math.max(discountVal, 0), subtotal);
    }
    const totalAmount = Math.max(0, subtotal + taxAmount - discountAmount);
    setValue('subtotal',        Number(subtotal.toFixed(2)),        { shouldDirty: false, shouldValidate: false, shouldTouch: false });
    setValue('taxAmount',       Number(taxAmount.toFixed(2)),       { shouldDirty: false, shouldValidate: false, shouldTouch: false });
    setValue('discountAmount',  Number(discountAmount.toFixed(2)),  { shouldDirty: false, shouldValidate: false, shouldTouch: false });
    setValue('totalAmount',     Number(totalAmount.toFixed(2)),     { shouldDirty: false, shouldValidate: false, shouldTouch: false });
    return { subtotal, taxAmount, discountAmount, totalAmount };
  }, [setValue]);

  const calculateLineAmount = useCallback((item: any) => {
    const qty   = Number(item?.quantity)  || 0;
    const rate  = Number(item?.unitPrice) || 0;
    const tax   = Number(item?.taxRate)   || 0;
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
      items:    getValues('items')         || [],
      discType: discountType,
      discValue: getValues('discountValue') || 0,
    });
  }, [getValues, discountType]);

  const watchedDiscountValue = watch('discountValue');
  useEffect(() => { queueTotalsRecalculation(); }, [watchedDiscountValue, discountType, queueTotalsRecalculation]);
  useEffect(() => { queueTotalsRecalculation(); }, [fields.length, queueTotalsRecalculation]);

  useEffect(() => {
    if (preSelectedItems?.length) {
      console.log('InvoiceCreate useEffect - preSelectedItems:', preSelectedItems);
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

  const addInvoiceItem   = useCallback(() => {
    append({ itemCode: '', itemName: '', description: '', quantity: 0, boxQuantity: 0, itemBoxQuantity: 0, size: '', category: '', unit: '', unitPrice: 0, taxRate: 0, discount: 0, amount: 0, squareFeet: 0, availableQty: 0 });
  }, [append]);

  const handleRemoveItem = useCallback((index: number) => remove(index), [remove]);

  const handleDiscountTypeChange = useCallback((type: DiscountType) => {
    setDiscountType(type);
    setValue('discountType', type);
    setValue('discountValue', 0);
    queueTotalsRecalculation();
  }, [setValue, queueTotalsRecalculation]);

  // AFTER (fixed)
  const onSubmit = async (formValues: any) => {
    const userName   = CookieService.get('user_name') || 'Admin';
    const paid       = Number(formValues.paidAmount) || 0;
    const total      = Number(formValues.totalAmount) || 0;
    const balanceDue = Math.max(0, total - paid);

    // Derive correct status from payment state
    let status = formValues.status;
    if (paid >= total && total > 0)   status = 'PAID';
    else if (paid > 0 && paid < total) status = 'PARTIALLY_PAID';

    await refetch({
      body: {
        ...formValues,
        invoiceDate:        formValues.invoiceDate?.format?.('YYYY-MM-DD') || formValues.invoiceDate,
        dueDate:            formValues.dueDate?.format?.('YYYY-MM-DD')     || formValues.dueDate,
        discountPercentage: discountType === 'percentage' ? formValues.discountValue : 0,
        discountAmount:     formValues.discountAmount,
        paidAmount:         paid,        // ✅ uses actual value
        balanceDue:         balanceDue,  // ✅ total - paid
        status,                          // ✅ auto-corrected
        createdBy:          userName,
        updatedBy:          userName,
        paymentMethod:        formValues.paymentMethod || 'UPI',
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
      default: // STRING + fallback
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
                    { label: 'Draft',     value: 'DRAFT' },
                    { label: 'Paid',      value: 'PAID' },
                    { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
                    { label: 'Cancelled', value: 'CANCELLED' },
                  ]} />
                )}
              />
            </Form.Item>

            {/* PAYMENT TYPE */}
            <Form.Item label="Payment Method">
              <Controller name="paymentMethod" control={control}
                render={({ field }) => (
                  <Select {...field} size="large" suffixIcon={<IoIosArrowDown size={20} />} options={[
                    { label: 'UPI',       value: 'UPI' },
                    { label: 'Cash',      value: 'Cash' },
                    { label: 'Card',      value: 'Card' },
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
                    onChange={value => {
                      const val = Number(value) || 0;
                      field.onChange(val);
                    }}
                  />
                )}
              />
            </Form.Item>

            <Divider />

            {/* ── Items table ── */}
            <div style={{ marginBottom: 12, fontWeight: 600 }}>Invoice Items</div>
            <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
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

            {/* ── Totals Section (matches PurchaseCreate TotalsCard) ── */}
            <TotalsWrapper>
              <TotalsCard>
                <TotalsHeader>Invoice Summary</TotalsHeader>

                {/* Subtotal */}
                <TotalsRow>
                  <TotalsLabel>Subtotal</TotalsLabel>
                  <TotalsValue><Rupee>₹ </Rupee>{subtotal.toFixed(2)}</TotalsValue>
                </TotalsRow>

                {/* Tax */}
                <TotalsRow highlight>
                  <TotalsLabel>Tax</TotalsLabel>
                  <TotalsValue style={{ color: '#d46b08' }}>+ <Rupee>₹ </Rupee>{taxAmount.toLocaleString('en-IN',{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TotalsValue>
                </TotalsRow>

                {/* Discount row — input + toggle inline */}
                <TotalsRow discount>
                  <TotalsLabel>Discount</TotalsLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Controller
                      name="discountValue"
                      control={control}
                      render={({ field }) => (
                        <InputNumber
                          {...field}
                          size="small"
                          min={0}
                          max={discountType === 'percentage' ? 100 : subtotal + taxAmount}
                          style={{ width: 80 }}
                          onChange={value => {
                            const val = Number(value) || 0;
                            field.onChange(
                              discountType === 'percentage'
                                ? Math.min(Math.max(val, 0), 100)
                                : Math.min(Math.max(val, 0), subtotal + taxAmount)
                            );
                          }}
                        />
                      )}
                    />
                    <DiscountTypeToggle>
                      <button type="button"
                        className={discountType === 'percentage' ? 'active' : ''}
                        onClick={() => handleDiscountTypeChange('percentage')}
                        title="Percentage">
                        %
                      </button>
                      <button type="button"
                        className={discountType === 'amount' ? 'active' : ''}
                        onClick={() => handleDiscountTypeChange('amount')}
                        title="Fixed Amount">
                        <Rupee>₹</Rupee>
                      </button>
                    </DiscountTypeToggle>
                  </div>
                </TotalsRow>

                {/* Discount applied */}
                {discountAmount > 0 && (
                  <TotalsRow discount>
                    <TotalsLabel>
                      Discount applied
                      <span style={{ fontSize: 11, color: '#8c8c8c', marginLeft: 6 }}>
                        {discountType === 'percentage'
                          ? `(${watch('discountValue') || 0}%)`
                          : '(fixed)'}
                      </span>
                    </TotalsLabel>
                    <TotalsValue>− <Rupee>₹ </Rupee>{discountAmount.toLocaleString('en-IN',{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TotalsValue>
                  </TotalsRow>
                )}

                {/* Paid Amount — show only when > 0 */}
                {(watch('paidAmount') || 0) > 0 && (
                  <TotalsRow highlight>
                    <TotalsLabel>Paid Amount</TotalsLabel>
                    <TotalsValue style={{ color: '#237804' }}>
                      − <Rupee>₹ </Rupee>{(watch('paidAmount') || 0).toLocaleString('en-IN',{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TotalsValue>
                  </TotalsRow>
                )}

                {/* Balance Due — always show */}
                <TotalsRow style={{
                  background: Math.max(0, totalAmount - (watch('paidAmount') || 0)) === 0 ? '#f6ffed' : '#fff1f0'
                }}>
                  <TotalsLabel style={{ fontWeight: 600 }}>Balance Due</TotalsLabel>
                  <TotalsValue style={{
                    fontWeight: 700,
                    color: Math.max(0, totalAmount - (watch('paidAmount') || 0)) === 0 ? '#237804' : '#cf1322'
                  }}>
                    <Rupee>₹ </Rupee>
                    {Math.max(0, totalAmount - (watch('paidAmount') || 0)).toLocaleString('en-IN',{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TotalsValue>
                </TotalsRow>

                {/* Grand Total */}
                <TotalsRow grand>
                  <TotalsLabel>Total</TotalsLabel>
                  <TotalsValue><Rupee>₹ </Rupee>{totalAmount.toLocaleString('en-IN',{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TotalsValue>
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
        <Button variant="solid" color="primary" className="w-[150px]" htmlType="submit"
          loading={loading} onClick={handleSubmit(onSubmit, onError)}>
          Save
        </Button>
        <Button variant="outlined" color="danger" className="w-[150px]" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </Footer>
    </Container>
  );
}

// ─── Number to Words Helper ─────────────────────────────────────────────────
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

// ─── Helper: parse size string → sq ft per single tile/unit ─────────────────
function parseSizeToSqFtPerUnit(size: string | undefined | null): number {
  if (!size) return 0;
  const sizeStr = size.toLowerCase().trim();
  const unitMatch = sizeStr.match(/-(in|mm|cm|m)$/);
  const unit = unitMatch ? unitMatch[1] : 'in';
  const cleaned = sizeStr.replace(/-(in|mm|cm|m)$/, '');
  const parts = cleaned
    .split(/[xX×\s]+/)
    .map(s => parseFloat(s.trim()))
    .filter(n => !isNaN(n));
  if (parts.length < 2) return 0;
  let length = parts[0];
  let width = parts[1];
  switch (unit) {
    case 'mm':  length /= 304.8;  width /= 304.8;  break;
    case 'cm':  length /= 30.48;  width /= 30.48;  break;
    case 'm':   length *= 3.28084; width *= 3.28084; break;
    default:    length /= 12;     width /= 12;      break;
  }
  return length * width;
}

// ─── InvoiceItemRow ───────────────────────────────────────────────────────────

const PIECE_BASED_CATEGORIES = ['sanitaryware', 'sanitary ware', 'pieces', 'piece'];

const isSanitaryware = (category?: string): boolean =>
  PIECE_BASED_CATEGORIES.some(c => c === (category || '').toLowerCase().trim());

const calculateSquareFeet = (item: {
  size?: string;
  boxQuantity?: number;
  itemBoxQuantity?: number;
  category?: string;
}): number => {
  if (!item.size) return 0;
  if (isSanitaryware(item.category)) {
    const tilesPerBox = Number(item.itemBoxQuantity) || 0;
    const numberOfBoxes = Number(item.boxQuantity) || 0;
    return tilesPerBox && numberOfBoxes ? tilesPerBox * numberOfBoxes : 0;
  }
  const sizeStr = item.size.toLowerCase().trim();
  const unitMatch = sizeStr.match(/-(in|mm|cm|m)$/);
  const unit = unitMatch ? unitMatch[1] : 'in';
  const cleaned = sizeStr.replace(/-(in|mm|cm|m)$/g, '');
  const parts = cleaned
    .split(/[xX×]/)
    .map(s => parseFloat(s.trim()))
    .filter(n => !isNaN(n));
  if (parts.length < 2) return 0;
  let length = parts[0];
  let width = parts[1];
  switch (unit) {
    case 'mm':  length /= 304.8;  width /= 304.8;  break;
    case 'cm':  length /= 30.48;  width /= 30.48;  break;
    case 'm':   length *= 3.28084; width *= 3.28084; break;
    default:    length /= 12;     width /= 12;      break;
  }
  const sqFtPerTile = length * width;
  const tilesPerBox = Number(item.itemBoxQuantity) || 0;
  const numberOfBoxes = Number(item.boxQuantity) || 0;
  if (!sqFtPerTile || !tilesPerBox || !numberOfBoxes) return 0;
  return sqFtPerTile * tilesPerBox * numberOfBoxes;
};

const InvoiceItemRow = memo(function InvoiceItemRow({
  rowId, index, control, register, setValue, getValues,
  itemOptions, onSearchItems, onScrollItems, onQueueTotals, onRemoveRow, canRemove, calculateLineAmount, calculateSquareFeet,
}: any) {
  const navigate = useNavigate();
  const notificationApi = useNotification();

  const watchedItem = useWatch({ control, name: `items.${index}` });

  const rowCalc = {
    quantity: Number(watchedItem?.quantity) || 0,
    boxQuantity: Number(watchedItem?.boxQuantity) || 0,
    itemBoxQuantity: Number(watchedItem?.itemBoxQuantity) || 0,
    size: watchedItem?.size || '',
    category: watchedItem?.category || '',
    unitPrice: Number(watchedItem?.unitPrice) || 0,
    taxRate: Number(watchedItem?.taxRate) || 0,
    unit: watchedItem?.unit || '',
    availableQty: watchedItem?.availableQty || 0,
  };

  useEffect(() => {
    const amountValue = Number(calculateLineAmount(rowCalc).toFixed(2));
    setValue(`items.${index}.amount`, amountValue, { shouldDirty: false, shouldValidate: false, shouldTouch: false });
  }, [rowCalc.quantity, rowCalc.boxQuantity, rowCalc.unitPrice, rowCalc.taxRate, index, setValue, calculateLineAmount]);

  const amount = calculateLineAmount(rowCalc);
  const squareFeet = calculateSquareFeet(rowCalc);


  return (
    <Draggable draggableId={rowId} index={index}>
      {(dragProvided) => (
        <div
          ref={dragProvided.innerRef}
          {...dragProvided.draggableProps}
          style={{
            display: 'grid',
            gridTemplateColumns: '25px 2.5fr 1.2fr 1.8fr 1.5fr 1.2fr 1.5fr 52px',
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

          {/* Item select */}
          <Controller name={`items.${index}.itemName`} control={control} rules={{ required: 'Item is required' }}
            render={({ field }) => (
              <Select {...field} showSearch allowClear
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
                  const isOutOfStock = item.quantity === 0;
                  const isLowStock = item.quantity > 0 && item.quantity < 10;
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{item.itemName || item.label}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{item.category} • {item.unit}</div>
                        {isOutOfStock && (
                          <div style={{ fontSize: 11, color: '#fff', background: '#ff4d4f', padding: '1px 6px', borderRadius: 3, marginTop: 2 }}>
                            Out of Stock
                          </div>
                        )}
                        {isLowStock && (
                          <div style={{ fontSize: 11, color: '#fff', background: '#faad14', padding: '1px 6px', borderRadius: 3, marginTop: 2 }}>
                            Low Stock: {item.quantity}
                          </div>
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
                  setValue(`items.${index}.itemCode`,    option?.itemCode || '');
                  setValue(`items.${index}.unit`,        nextUnit);
                  setValue(`items.${index}.unitPrice`,   sellingPrice);
                  setValue(`items.${index}.taxRate`,     taxRate);
                  setValue(`items.${index}.availableQty`, availableQty);
                  setValue(`items.${index}.size`,        option?.size || '');
                  setValue(`items.${index}.itemBoxQuantity`, option?.itemBoxQuantity || 0);
                  setValue(`items.${index}.category`,    option?.category || '');
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
                    const nextBoxQty = Number(value) || 0;
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
                        showProgress: true,
                        pauseOnHover: true,
                      });
                    }

                    setValue(`items.${index}.quantity`, nextQty, {
                      shouldDirty: false, shouldValidate: false, shouldTouch: false,
                    });
                    field.onChange(nextBoxQty);
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
                  style={{ width: '100%', ...(rowCalc.availableQty === 0 ? { borderColor: '#ff4d4f' } : {}) }}
                  suffix={<span className='text-[11px]'>{rowCalc.unit}</span>}
                  status={rowCalc.availableQty === 0 ? 'error' : undefined}
                  onChange={(value) => {
                    const nextQty = Number(value) || 1;
                    if (rowCalc.availableQty > 0 && nextQty > rowCalc.availableQty) {
                      notificationApi.warning({
                        message: 'Insufficient Stock',
                        description: `Only ${rowCalc.availableQty} ${rowCalc.unit} available in stock.`,
                        showProgress: true,
                        pauseOnHover: true,
                      });
                    }
                    const tilesPerBox = rowCalc.itemBoxQuantity || 0;
                    let derivedBoxQty = 0;
                    if (isSanitaryware(rowCalc.category)) {
                      derivedBoxQty = tilesPerBox > 0
                        ? Math.round((nextQty / tilesPerBox) * 100) / 100
                        : 0;
                    } else {
                      const sqFtPerTile = parseSizeToSqFtPerUnit(rowCalc.size);
                      const sqFtPerBox = sqFtPerTile * tilesPerBox;
                      derivedBoxQty = sqFtPerBox > 0
                        ? Math.round((nextQty / sqFtPerBox) * 100) / 100
                        : 0;
                    }
                    setValue(`items.${index}.boxQuantity`, derivedBoxQty, { shouldDirty: false, shouldValidate: false, shouldTouch: false });
                    field.onChange(nextQty); onQueueTotals();
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
                onChange={value => {
                  const next = Number(value) || 0;
                  field.onChange(next); onQueueTotals();
                }}
              />
            )}
          />

          {/* Tax Rate */}
          <Controller name={`items.${index}.taxRate`} control={control}
            render={({ field }) => (
              <InputNumber {...field} min={0} max={100} style={{ width: '100%' }}
                addonAfter="%"
                onChange={value => {
                  const next = Number(value) || 0;
                  field.onChange(next); onQueueTotals();
                }}
              />
            )}
          />

          {/* Row amount */}
          <div style={{ fontWeight: 600, textAlign: 'right' }}><Rupee>₹</Rupee> {amount.toFixed(2)}</div>

          {/* Remove */}
          <Button type="text" danger onClick={() => onRemoveRow(index)} disabled={!canRemove} icon={<IoTrashBinSharp />} />
        </div>
      )}
    </Draggable>
  );
}, (prev, next) =>
  prev.rowId       === next.rowId     &&
  prev.index       === next.index     &&
  prev.canRemove   === next.canRemove &&
  prev.itemOptions === next.itemOptions &&
  prev.onSearchItems === next.onSearchItems &&
  prev.onScrollItems === next.onScrollItems
);