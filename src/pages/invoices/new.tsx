import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Form, Input, Select, InputNumber, Button, Divider, DatePicker, Checkbox } from 'antd'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { useApi } from '../../hooks/useApi'
import { PATH } from '../../constants/app.constant'
import { useNotification } from '../../components/provider/NotificationProvider';
import { useNavigate } from 'react-router-dom'
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
  .ant-select-selection-search-input {
    color: #1f2937;
    caret-color: #111827;
  }

  .ant-input,
  .ant-input-affix-wrapper,
  .ant-input-number,
  .ant-select-selector {
    background-color: #fff;
  }

  .ant-input:focus,
  .ant-input-focused,
  .ant-input-affix-wrapper:focus-within,
  .ant-input-number:focus-within,
  .ant-select-focused .ant-select-selector {
    border-color: #1677ff !important;
    box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.18) !important;
  }

  .ant-form-item-has-error .ant-input,
  .ant-form-item-has-error .ant-input-affix-wrapper,
  .ant-form-item-has-error .ant-input-number,
  .ant-form-item-has-error .ant-select-selector {
    background-color: #fff;
  }
`;

const DiscountTypeToggle = styled.div`
  display: inline-flex;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  
  button {
    border: none;
    background: #fff;
    padding: 4px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    transition: all 0.2s;
    
    &:first-of-type {
      border-right: 1px solid #d9d9d9;
    }
    
    &.active {
      background: #1677ff;
      color: #fff;
    }
    
    &:hover:not(.active) {
      background: #f5f5f5;
    }
  }
`;

const Rupee = styled.span`
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

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
  unit: string;
  unitPrice: number;
  taxRate: number;
  discount: number;
  amount: number;
}

type DiscountType = 'percentage' | 'amount';

export default function InvoiceCreate() {
  const companyId = CookieService.get('companyId') || '';

  const { control, handleSubmit, formState: { errors }, register, setValue, getValues, watch, setFocus } = useForm({
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
      items: [
        { itemCode: '', itemName: '', description: '', quantity: 1, unit: '', unitPrice: 0, taxRate: 0, discount: 0, amount: 0 }
      ] as InvoiceItem[],
      discountType: 'percentage' as DiscountType,
      discountValue: 0,
      notes: '',
      termsAndConditions: '',
      paymentMethod: '',
      customFields: {} as Record<string, any>,
      companyId: companyId,
      // Calculated fields
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 0,
    }
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'items'
  });

  const notificationApi = useNotification();
  const navigate = useNavigate();

  // State
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customerOptions, setCustomerOptions] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);

  // API Hooks
  const { data: customFieldsData } = useApi<CustomField[]>(
    `${PATH.CUSTOM_FIELDS_DATA}/company/${companyId}/table/invoices/active`,
    { method: "GET" }
  );

  const { data: customersData, loading: customersLoading } = useApi<any[]>(
    `${PATH.CUSTOMERS_DATA}/all/${companyId}`,
    { method: "GET" }
  );

  const { data: itemsData } = useApi<any[]>(
    `${PATH.GET_ITEMS_DATA}/all/${companyId}`,
    { method: "GET", showOverlay: true }
  );

  const { data, loading, error, refetch } = useApi<any>(
    PATH.INVOICES_DATA,
    { method: 'POST', autoFetch: false }
  );

  // Populate data
  useEffect(() => {
    if (customFieldsData) {
      setCustomFields(customFieldsData);
      const defaults: Record<string, any> = {};
      customFieldsData.forEach(field => {
        if (field.fieldDefaultValue) {
          defaults[field.fieldName] = field.fieldDefaultValue;
        }
      });
      if (Object.keys(defaults).length > 0) {
        setValue('customFields', defaults);
      }
    }
  }, [customFieldsData, setValue]);

  useEffect(() => {
    if (customersData) {
      setCustomerOptions(customersData.map(c => ({
        label: `${c.customerFirstName} ${c.customerLastName || ''} (${c.customerCode})`,
        value: c.customerCode,
        ...c
      })));
    }
  }, [customersData]);

  useEffect(() => {
    if (itemsData) {
      setItems(itemsData);
    }
  }, [itemsData]);

  useEffect(() => {
    if (data) {
      notificationApi.success({
        message: 'Success',
        description: `Invoice ${data.invoiceNumber} created successfully`,
        showProgress: true,
        pauseOnHover: true,
      });
      setTimeout(() => {
        navigate('/invoice');
      }, 500);
    }
    if (error) {
      notificationApi.error({
        message: 'Error',
        description: error?.message || 'Failed to create invoice. Please try again.',
        showProgress: true,
        pauseOnHover: true,
      });
    }
  }, [data, error, navigate, notificationApi]);

  // Item options for select
  const itemOptions = React.useMemo(() => {
    if (!items?.length) return [];
    return items.map((item: any) => ({
      label: item?.name || item?.itemName || '',
      value: item?.itemCode || '',
      itemName: item?.name || item?.itemName || '',
      category: item?.category || '',
      unit: item?.unit || '',
      itemCode: item?.itemCode || '',
      sellingPrice: item?.sellingPrice || 0,
      taxRate: item?.taxRate || 0
    }));
  }, [items]);

  // Calculate totals with discount
  const calculateTotals = useCallback((itemsList: InvoiceItem[], discType: DiscountType, discValue: number) => {
    let subtotal = 0;
    let taxAmount = 0;

    for (const item of itemsList) {
      const qty = Number(item?.quantity) || 0;
      const price = Number(item?.unitPrice) || 0;
      const taxRate = Number(item?.taxRate) || 0;
      const lineAmount = qty * price;
      const lineTax = lineAmount * (taxRate / 100);

      subtotal += lineAmount;
      taxAmount += lineTax;
    }

    // Calculate discount based on type
    let discountAmount = 0;
    const discountVal = Number(discValue) || 0;

    if (discType === 'percentage') {
      // Percentage discount: cannot exceed 100%
      const cappedPercentage = Math.min(Math.max(discountVal, 0), 100);
      discountAmount = subtotal * (cappedPercentage / 100);
    } else {
      // Fixed amount discount: cannot exceed subtotal
      discountAmount = Math.min(Math.max(discountVal, 0), subtotal);
    }

    // Calculate total (ensure non-negative)
    const totalAmount = Math.max(0, subtotal + taxAmount - discountAmount);

    setValue("subtotal", Number(subtotal.toFixed(2)), { shouldDirty: false, shouldValidate: false, shouldTouch: false });
    setValue("taxAmount", Number(taxAmount.toFixed(2)), { shouldDirty: false, shouldValidate: false, shouldTouch: false });
    setValue("discountAmount", Number(discountAmount.toFixed(2)), { shouldDirty: false, shouldValidate: false, shouldTouch: false });
    setValue("totalAmount", Number(totalAmount.toFixed(2)), { shouldDirty: false, shouldValidate: false, shouldTouch: false });

    return { subtotal, taxAmount, discountAmount, totalAmount };
  }, [setValue]);

  // Line amount calculator
  const calculateLineAmount = useCallback((item: any) => {
    const qty = Number(item?.quantity) || 0;
    const rate = Number(item?.unitPrice) || 0;
    const tax = Number(item?.taxRate) || 0;
    return qty * rate * (1 + tax / 100);
  }, []);

  // Debounced totals recalculation
  const totalsRecalc$ = useRef(new Subject<{ items: InvoiceItem[], discType: DiscountType, discValue: number }>());

  useEffect(() => {
    const sub = totalsRecalc$.current
      .pipe(debounceTime(120))
      .subscribe(({ items, discType, discValue }) => calculateTotals(items, discType, discValue));
    return () => sub.unsubscribe();
  }, [calculateTotals]);

  const queueTotalsRecalculation = useCallback(() => {
    const currentItems = getValues("items") || [];
    const currentDiscValue = getValues("discountValue") || 0;
    totalsRecalc$.current.next({ items: currentItems, discType: discountType, discValue: currentDiscValue });
  }, [getValues, discountType]);

  // Watch discount value changes
  const watchedDiscountValue = watch('discountValue');
  useEffect(() => {
    queueTotalsRecalculation();
  }, [watchedDiscountValue, discountType, queueTotalsRecalculation]);

  // Watch fields length for recalculation
  useEffect(() => {
    queueTotalsRecalculation();
  }, [fields.length, queueTotalsRecalculation]);

  // Get current totals for display
  const subtotal = watch('subtotal') || 0;
  const taxAmount = watch('taxAmount') || 0;
  const discountAmount = watch('discountAmount') || 0;
  const totalAmount = watch('totalAmount') || 0;

  // Customer selection handler
  const onCustomerSelect = useCallback((value: string, option: any) => {
    setValue('customerCode', option.customerCode);
    setValue('customerName', `${option.customerFirstName} ${option.customerLastName || ''}`);
    setValue('customerEmail', option.customerEmail || '');
    setValue('customerMobile', option.customerMobile || '');
    setValue('customerAddress', option.customerAddress || {});
  }, [setValue]);

  // Drag and drop handler
  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;
    move(result.source.index, result.destination.index);
    queueTotalsRecalculation();
  }, [move, queueTotalsRecalculation]);

  // Add new item row
  const addInvoiceItem = useCallback(() => {
    append({ itemCode: '', itemName: '', description: '', quantity: 1, unit: '', unitPrice: 0, taxRate: 0, discount: 0, amount: 0 });
  }, [append]);

  // Remove item row
  const handleRemoveItem = useCallback((index: number) => {
    remove(index);
  }, [remove]);

  // Handle discount type toggle
  const handleDiscountTypeChange = useCallback((type: DiscountType) => {
    setDiscountType(type);
    setValue('discountType', type);
    // Reset discount value when switching types to avoid confusion
    setValue('discountValue', 0);
    queueTotalsRecalculation();
  }, [setValue, queueTotalsRecalculation]);

  // Submit handler
  const onSubmit = async (formValues: any) => {
    const userName = CookieService.get('user_name') || 'Admin';

    const payload = {
      ...formValues,
      invoiceDate: formValues.invoiceDate?.format?.('YYYY-MM-DD') || formValues.invoiceDate,
      dueDate: formValues.dueDate?.format?.('YYYY-MM-DD') || formValues.dueDate,
      discountPercentage: discountType === 'percentage' ? formValues.discountValue : 0,
      discountAmount: formValues.discountAmount,
      paidAmount: 0,
      balanceDue: formValues.totalAmount,
      createdBy: userName,
      updatedBy: userName
    };

    await refetch({ body: payload });
  };

  const onError = (errors: any) => {
    const errorOrder = ['customerCode', 'invoiceDate', 'dueDate'];
    for (const field of errorOrder) {
      if (errors[field]) {
        setFocus(field as any);
        break;
      }
    }
  };

  const layout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 10 }
  };

  // Navigate to create new customer
  const onAddNewCustomer = useCallback(() => {
    navigate('/customer/create');
  }, [navigate]);

  // Dynamic field renderer
  const renderCustomField = (field: CustomField) => {
    const fieldName = `customFields.${field.fieldName}`;

    switch (field.fieldType) {
      case 'STRING':
        return (
          <Form.Item key={field.id} label={field.fieldLabel} required={field.required}>
            <Controller
              name={fieldName as any}
              control={control}
              rules={field.required ? { required: `${field.fieldLabel} is required` } : undefined}
              render={({ field: f }) => (
                <Input size="large" {...f} placeholder={`Enter ${field.fieldLabel}`} />
              )}
            />
          </Form.Item>
        );
      case 'NUMBER':
        return (
          <Form.Item key={field.id} label={field.fieldLabel} required={field.required}>
            <Controller
              name={fieldName as any}
              control={control}
              rules={field.required ? { required: `${field.fieldLabel} is required` } : undefined}
              render={({ field: f }) => (
                <InputNumber size="large" {...f} style={{ width: '100%' }} placeholder={`Enter ${field.fieldLabel}`} />
              )}
            />
          </Form.Item>
        );
      case 'BOOLEAN':
        return (
          <Form.Item key={field.id} label={field.fieldLabel} required={field.required}>
            <Controller
              name={fieldName as any}
              control={control}
              render={({ field: f }) => (
                <Checkbox checked={f.value} onChange={(e) => f.onChange(e.target.checked)}>
                  {field.fieldLabel}
                </Checkbox>
              )}
            />
          </Form.Item>
        );
      case 'DROPDOWN':
        return (
          <Form.Item key={field.id} label={field.fieldLabel} required={field.required}>
            <Controller
              name={fieldName as any}
              control={control}
              rules={field.required ? { required: `${field.fieldLabel} is required` } : undefined}
              render={({ field: f }) => (
                <Select size="large" {...f} placeholder={`Select ${field.fieldLabel}`}
                  options={field.fieldOptions?.map(opt => ({ label: opt.label, value: opt.value })) || []}
                />
              )}
            />
          </Form.Item>
        );
      case 'MULTISELECT':
        return (
          <Form.Item key={field.id} label={field.fieldLabel} required={field.required}>
            <Controller
              name={fieldName as any}
              control={control}
              rules={field.required ? { required: `${field.fieldLabel} is required` } : undefined}
              render={({ field: f }) => (
                <Select size="large" mode="multiple" {...f} placeholder={`Select ${field.fieldLabel}`}
                  options={field.fieldOptions?.map(opt => ({ label: opt.label, value: opt.value })) || []}
                />
              )}
            />
          </Form.Item>
        );
      case 'DATE':
        return (
          <Form.Item key={field.id} label={field.fieldLabel} required={field.required}>
            <Controller
              name={fieldName as any}
              control={control}
              rules={field.required ? { required: `${field.fieldLabel} is required` } : undefined}
              render={({ field: f }) => (
                <DatePicker size="large" {...f} style={{ width: '100%' }} format="YYYY-MM-DD"
                  value={f.value ? dayjs(f.value) : null}
                  onChange={(date) => f.onChange(date?.format('YYYY-MM-DD'))}
                />
              )}
            />
          </Form.Item>
        );
      case 'DATETIME':
        return (
          <Form.Item key={field.id} label={field.fieldLabel} required={field.required}>
            <Controller
              name={fieldName as any}
              control={control}
              rules={field.required ? { required: `${field.fieldLabel} is required` } : undefined}
              render={({ field: f }) => (
                <DatePicker size="large" showTime {...f} style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss"
                  value={f.value ? dayjs(f.value) : null}
                  onChange={(date) => f.onChange(date?.format('YYYY-MM-DD HH:mm:ss'))}
                />
              )}
            />
          </Form.Item>
        );
      default:
        return (
          <Form.Item key={field.id} label={field.fieldLabel} required={field.required}>
            <Controller
              name={fieldName as any}
              control={control}
              render={({ field: f }) => (
                <Input size="large" {...f} placeholder={`Enter ${field.fieldLabel}`} />
              )}
            />
          </Form.Item>
        );
    }
  };

  return (
    <Container>
      <Header>Create Invoice</Header>
      <Content>
        <FormUxScope>
          <Form {...layout} labelAlign='left'>

            {/* CUSTOMER SELECTION */}
            <Form.Item
              label="Customer"
              required
              validateStatus={errors.customerCode ? 'error' : ''}
              help={<FormErrorMessage message={errors.customerCode?.message as string} />}
            >
              <Controller
                name="customerCode"
                control={control}
                rules={{ required: 'Customer is required' }}
                render={({ field }) => (
                  <Select
                    {...field}
                    size="large"
                    showSearch
                    suffixIcon={<IoIosArrowDown size={20} />}
                    placeholder="Select Customer"
                    loading={customersLoading}
                    options={customerOptions}
                    optionFilterProp="label"
                    onChange={(value, option: any) => {
                      field.onChange(value);
                      onCustomerSelect(value, option);
                    }}
                    optionRender={(option: any) => {
                      const customer = option.data;
                      return (
                        <div className='flex justify-between'>
                          <div style={{ fontWeight: 500 }}>
                            {customer.customerFirstName} {customer.customerLastName || ''}
                          </div>
                          <div style={{ fontSize: 12, color: '#777' }}>
                            {customer.customerCode}
                          </div>
                        </div>
                      );
                    }}
                    popupRender={(menu) => (
                      <>
                        {menu}
                        <Divider style={{ margin: '4px 0' }} />
                        <div className="flex gap-2 items-center justify-center">
                          <Button
                            size="small"
                            type="primary"
                            icon={<MdAddBox size={18} style={{ marginTop: '4px' }} />}
                            onClick={onAddNewCustomer}
                          >
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
            <Form.Item
              label="Invoice Date"
              required
              validateStatus={errors.invoiceDate ? 'error' : ''}
              help={<FormErrorMessage message={errors.invoiceDate?.message as string} />}
            >
              <Controller
                name="invoiceDate"
                control={control}
                rules={{ required: 'Invoice date is required' }}
                render={({ field }) => (
                  <DatePicker {...field} size="large" style={{ width: '100%' }} format="YYYY-MM-DD" />
                )}
              />
            </Form.Item>

            {/* DUE DATE */}
            <Form.Item
              label="Due Date"
              required
              validateStatus={errors.dueDate ? 'error' : ''}
              help={<FormErrorMessage message={errors.dueDate?.message as string} />}
            >
              <Controller
                name="dueDate"
                control={control}
                rules={{ required: 'Due date is required' }}
                render={({ field }) => (
                  <DatePicker {...field} size="large" style={{ width: '100%' }} format="YYYY-MM-DD" />
                )}
              />
            </Form.Item>

            {/* STATUS */}
            <Form.Item label="Status">
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    size="large"
                    options={[
                      { label: 'Draft', value: 'DRAFT' },
                      { label: 'Sent', value: 'SENT' },
                      { label: 'Paid', value: 'PAID' },
                      { label: 'Overdue', value: 'OVERDUE' },
                      { label: 'Cancelled', value: 'CANCELLED' }
                    ]}
                  />
                )}
              />
            </Form.Item>

            <Divider />

            {/* INVOICE ITEMS TABLE - Purchase folder pattern */}
            <div style={{ marginBottom: 12, fontWeight: 600 }}>Invoice Items</div>
            <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
              {/* Table Header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '25px 2fr 1.5fr 1fr 1fr 1fr 1fr 52px',
                  background: '#fafafa',
                  borderBottom: '1px solid #e8e8e8',
                  padding: '10px 12px',
                  fontWeight: 600,
                  fontSize: 12
                }}
              >
                <div />
                <div>ITEM DETAILS</div>
                <div>QUANTITY</div>
                <div>RATE</div>
                <div>TAX %</div>
                <div>DISCOUNT</div>
                <div />
              </div>

              {/* Draggable Rows */}
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="invoice-items-droppable">
                  {(dropProvided) => (
                    <div ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                      {fields.map((item, index) => (
                        <InvoiceItemRow
                          key={item.id}
                          rowId={item.id}
                          index={index}
                          control={control}
                          register={register}
                          setValue={setValue}
                          getValues={getValues}
                          itemOptions={itemOptions}
                          onQueueTotals={queueTotalsRecalculation}
                          onRemoveRow={handleRemoveItem}
                          canRemove={fields.length > 1}
                          calculateLineAmount={calculateLineAmount}
                        />
                      ))}
                      {dropProvided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>

            <div style={{ marginTop: 12 }}>
              <Button icon={<MdAddBox />} onClick={addInvoiceItem}>
                Add New Row
              </Button>
            </div>

            {/* TOTALS SECTION */}
            <div style={{ 
              marginTop: 24, 
              padding: '16px 24px', 
              background: '#fafafa', 
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <div style={{ width: 350 }}>
                {/* Subtotal */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span>Subtotal:</span>
                  <strong><Rupee>₹</Rupee>{subtotal.toFixed(2)}</strong>
                </div>

                {/* Tax */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span>Tax:</span>
                  <strong><Rupee>₹</Rupee>{taxAmount.toFixed(2)}</strong>
                </div>

                {/* Discount with Type Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span>DISCOUNT</span>
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
                          onChange={(value) => {
                            const val = Number(value) || 0;
                            // Validate based on discount type
                            if (discountType === 'percentage') {
                              field.onChange(Math.min(Math.max(val, 0), 100));
                            } else {
                              field.onChange(Math.min(Math.max(val, 0), subtotal + taxAmount));
                            }
                          }}
                        />
                      )}
                    />
                    <DiscountTypeToggle>
                      <button
                        type="button"
                        className={discountType === 'percentage' ? 'active' : ''}
                        onClick={() => handleDiscountTypeChange('percentage')}
                        title="Percentage"
                      >
                        %
                      </button>
                      <button
                        type="button"
                        className={discountType === 'amount' ? 'active' : ''}
                        onClick={() => handleDiscountTypeChange('amount')}
                        title="Fixed Amount"
                      >
                        Rs.
                      </button>
                    </DiscountTypeToggle>
                  </div>
                </div>

                {/* Discount Amount Display */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#52c41a' }}>
                  <span>Discount Applied:</span>
                  <strong>-<Rupee>₹</Rupee>{discountAmount.toFixed(2)}</strong>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>Total:</span>
                  <strong style={{ fontSize: 18, color: '#1677ff' }}><Rupee>₹</Rupee>{totalAmount.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            {/* NOTES */}
            <Form.Item label="Notes" style={{ marginTop: 24 }}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <Input.TextArea {...field} rows={3} placeholder="Additional notes" />
                )}
              />
            </Form.Item>

            {/* TERMS */}
            <Form.Item label="Terms & Conditions">
              <Controller
                name="termsAndConditions"
                control={control}
                render={({ field }) => (
                  <Input.TextArea {...field} rows={3} placeholder="Terms and conditions" />
                )}
              />
            </Form.Item>

            {/* DYNAMIC CUSTOM FIELDS */}
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
        <Button variant="solid" color="primary" className="w-[150px]" htmlType="submit" loading={loading} onClick={handleSubmit(onSubmit, onError)}>
          Save
        </Button>
        <Button variant="outlined" color="danger" className="w-[150px]" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </Footer>
    </Container>
  );
}

// Memoized Invoice Item Row Component (following purchase pattern)
const InvoiceItemRow = memo(function InvoiceItemRow({
  rowId,
  index,
  control,
  register,
  setValue,
  getValues,
  itemOptions,
  onQueueTotals,
  onRemoveRow,
  canRemove,
  calculateLineAmount,
}: any) {
  const navigate = useNavigate();

  const setDerivedAmount = useCallback((calcValues: any) => {
    const amountValue = Number(calculateLineAmount(calcValues).toFixed(2));
    setValue(`items.${index}.amount`, amountValue, {
      shouldDirty: false,
      shouldValidate: false,
      shouldTouch: false,
    });
    return amountValue;
  }, [calculateLineAmount, index, setValue]);

  const [rowCalc, setRowCalc] = useState(() => {
    const row = getValues(`items.${index}`) || {};
    return {
      quantity: Number(row?.quantity) || 1,
      unitPrice: Number(row?.unitPrice) || 0,
      taxRate: Number(row?.taxRate) || 0,
      unit: row?.unit || '',
    };
  });

  useEffect(() => {
    const row = getValues(`items.${index}`) || {};
    const nextRowCalc = {
      quantity: Number(row?.quantity) || 1,
      unitPrice: Number(row?.unitPrice) || 0,
      taxRate: Number(row?.taxRate) || 0,
      unit: row?.unit || '',
    };
    setRowCalc(nextRowCalc);
    setDerivedAmount(nextRowCalc);
  }, [getValues, index, rowId, setDerivedAmount]);

  const amount = calculateLineAmount(rowCalc);

  const onAddNewItem = useCallback(() => {
    navigate('/item/create');
  }, [navigate]);

  return (
    <Draggable draggableId={rowId} index={index}>
      {(dragProvided) => (
        <div
          ref={dragProvided.innerRef}
          {...dragProvided.draggableProps}
          style={{
            display: 'grid',
            gridTemplateColumns: '25px 2fr 1.5fr 1fr 1fr 1fr 1fr 52px',
            padding: '10px 12px',
            borderBottom: '1px solid #f0f0f0',
            alignItems: 'center',
            gap: 8,
            ...dragProvided.draggableProps.style
          }}
        >
          {/* Drag Handle */}
          <div
            {...dragProvided.dragHandleProps}
            style={{ cursor: 'grab', display: 'flex', justifyContent: 'center' }}
          >
            <MdDragIndicator size={18} color="#8c8c8c" />
          </div>

          {/* Item Select */}
          <Controller
            name={`items.${index}.itemName`}
            control={control}
            rules={{ required: 'Item is required' }}
            render={({ field }) => (
              <Select
                {...field}
                showSearch
                allowClear
                suffixIcon={<IoIosArrowDown size={16} />}
                placeholder="Select Item"
                options={itemOptions}
                optionFilterProp="label"
                listHeight={320}
                popupMatchSelectWidth={350}
                optionRender={(option: any) => {
                  const item = option.data;
                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{item.itemName || item.label}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{item.category} • {item.unit}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 500, color: '#1677ff' }}><Rupee>₹</Rupee>{item.sellingPrice || 0}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{item.itemCode}</div>
                      </div>
                    </div>
                  );
                }}
                onChange={(_selectedValue, option: any) => {
                  const selectedName = option?.itemName || '';
                  const nextUnit = option?.unit || '';
                  const code = option?.itemCode || '';
                  const sellingPrice = option?.sellingPrice || 0;
                  const taxRate = option?.taxRate || 0;
                  
                  field.onChange(selectedName);
                  setValue(`items.${index}.itemCode`, code);
                  setValue(`items.${index}.unit`, nextUnit);
                  setValue(`items.${index}.unitPrice`, sellingPrice);
                  setValue(`items.${index}.taxRate`, taxRate);
                  
                  setRowCalc((prev) => {
                    const nextRowCalc = { ...prev, unit: nextUnit, unitPrice: sellingPrice, taxRate };
                    setDerivedAmount(nextRowCalc);
                    return nextRowCalc;
                  });
                  onQueueTotals();
                }}
                value={field.value || undefined}
                popupRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: '4px 0' }} />
                    <div className="flex gap-2 items-center justify-center">
                      <Button
                        size="small"
                        type="primary"
                        icon={<MdAddBox size={18} style={{ marginTop: '4px' }} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddNewItem();
                        }}
                      >
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

          {/* Description */}
          {/* <Controller
            name={`items.${index}.description`}
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="Description" size="small" />
            )}
          /> */}

          {/* Quantity */}
          <Controller
            name={`items.${index}.quantity`}
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                inputMode="numeric"
                min={1}
                style={{ width: '100%' }}
                addonAfter={rowCalc.unit}
                onChange={(value) => {
                  const nextQuantity = Number(value) || 1;
                  setRowCalc((prev) => {
                    const nextRowCalc = { ...prev, quantity: nextQuantity };
                    setDerivedAmount(nextRowCalc);
                    return nextRowCalc;
                  });
                  field.onChange(nextQuantity);
                  onQueueTotals();
                }}
              />
            )}
          />

          {/* Unit Price */}
          <Controller
            name={`items.${index}.unitPrice`}
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                style={{ width: '100%' }}
                inputMode="numeric"
                min={0}
                prefix={<Rupee>₹</Rupee>}
                onChange={(value) => {
                  const nextPrice = Number(value) || 0;
                  setRowCalc((prev) => {
                    const nextRowCalc = { ...prev, unitPrice: nextPrice };
                    setDerivedAmount(nextRowCalc);
                    return nextRowCalc;
                  });
                  field.onChange(nextPrice);
                  onQueueTotals();
                }}
              />
            )}
          />

          {/* Tax Rate */}
          <Controller
            name={`items.${index}.taxRate`}
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                min={0}
                max={100}
                style={{ width: '100%' }}
                addonAfter="%"
                onChange={(value) => {
                  const nextTaxRate = Number(value) || 0;
                  setRowCalc((prev) => {
                    const nextRowCalc = { ...prev, taxRate: nextTaxRate };
                    setDerivedAmount(nextRowCalc);
                    return nextRowCalc;
                  });
                  field.onChange(nextTaxRate);
                  onQueueTotals();
                }}
              />
            )}
          />

          {/* Line Amount */}
          <div style={{ fontWeight: 600, textAlign: 'right' }}><Rupee>₹</Rupee>{amount.toFixed(2)}</div>

          {/* Remove Button */}
          <Button
            type="text"
            danger
            onClick={() => onRemoveRow(index)}
            disabled={!canRemove}
            icon={<IoTrashBinSharp />}
          />
        </div>
      )}
    </Draggable>
  );
}, (prev, next) => {
  return (
    prev.rowId === next.rowId &&
    prev.index === next.index &&
    prev.canRemove === next.canRemove &&
    prev.itemOptions === next.itemOptions
  );
});
