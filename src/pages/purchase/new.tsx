import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { CookieService } from '../../store/Cookie'
import { Controller, useForm, useFieldArray } from 'react-hook-form'
import { useApi } from '../../hooks/useApi'
import { PATH } from '../../constants/app.constant'
import { useNavigate } from 'react-router'
import { useNotification } from '../../components/provider/NotificationProvider'
import styled from '@emotion/styled'
import { Button, Divider, Form, Input, InputNumber, Modal, Select } from 'antd'
import FormErrorMessage from '../../components/FormErrorMessage'
import { MdAddBox } from 'react-icons/md'
import { IoIosArrowDown } from 'react-icons/io'
import { IoTrashBinSharp } from 'react-icons/io5'
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd'
import { MdDragIndicator } from 'react-icons/md'
import { Subject } from 'rxjs'
import { debounceTime } from 'rxjs/operators'
export default function PurchaseCreate() {  

  const { control, handleSubmit, formState: { errors }, register, setValue, getValues } = useForm({
    defaultValues: {
      purchaseCode: '',
      supplierId:'',
      purchaseItems:[
        {itemCode:'', name:'', category:'', unit: '', quantity:0, costPrice:0, taxRate:0.00, amount:0.00}
      ],
      purchaseAccount:'',
      purchaseTotalCost:0,
      purchaseTotalItems:0,
      purchaseTaxRate:0,
      companyId: CookieService.get('companyId') || '',
    }
  })

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "purchaseItems"
  });


  const { control: controlDyn, handleSubmit: handleSubmitDyn, formState: { errors: errorsDyn }, reset: resetDyn } = useForm({
    defaultValues: {
      name: '',
      subname: '',
    }
  })

  const notificationApi = useNotification();

  const { data:DropDownAccount, loading:DropLoadAccount, refetch: reloadAccount } = useApi<any[]>(`${PATH.GET_DROP_DOWN}/accountType`, { method: "GET", showOverlay: true });
  const { data:DropDown, loading:DropLoad, refetch:DropRefetch } = useApi<any[]>(`${PATH.POST_DROP_DOWN}`, { method: "POST", autoFetch: false });
  const { data:DropDelDown, loading:DropDelLoad, refetch:DropDelRefetch } = useApi<any[]>(`${PATH.POST_DROP_DOWN}`, { method: "DELETE", autoFetch: false });

  const { data, loading, error, refetch } = useApi<any>(
    PATH.PURCHASE_DATA,
    { method: 'POST', autoFetch: false }
  );

  const { data: itemsAllData, loading: itemsAllLoading, error: itemsAllError, refetch:reloadAllData } =
      useApi<any[]>(`${PATH.GET_ITEMS_DATA}/all/${CookieService.get('companyId')}`, { method: "GET", showOverlay:true });

  const { data: suppliersData, loading: suppliersLoading, error: suppliersError, refetch:reloadData } =
        useApi<any[]>(`${PATH.SUPPLIERS_DATA}/all/${CookieService.get('companyId')}`, { method: "GET", autoFetch:true, showOverlay: true  });

  const navigate = useNavigate();

  useEffect(() => {
    if (data) {
      notificationApi.success({
        message: `${data.error}`,
        description: `${data?.message}`,
        showProgress: true,
        pauseOnHover: true,
      });
      setTimeout(() => {
        navigate('/purchase');
      }, 500);
    }
    if (error) {
      notificationApi.error({
        message: error.error,
        description: `${error?.message || 'Login failed. Please try again.'}`,
        showProgress: true,
        pauseOnHover: true,
      });
    }
  }, [data, error]);

  const [accountType, setAccountType] = useState<DropdownItem[]>([]);
  const [modalType, setModalType] = useState<"account" | "unit" | "size" | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [items, setItems] = useState<any[]>([])

  useEffect(()=>{
    if(itemsAllData){
      setItems(itemsAllData)
    }
  }, [itemsAllData])

  const onSubmit = async (formValues:any) => {
    const userName = CookieService.get('user_name')
    const payload = {
      ...formValues,
      createdBy: userName,
      updatedBy: userName,
    }
    refetch({body:payload})
  }

  const layout = {
    labelCol: { span: 6 },
    wrapperCol:{ span: 8 }
  };

  const ModelLayout={
    labelCol: { span: 6 },
    wrapperCol:{ span: 16 }
  }


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
    display: unset;
    align-items: center;
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

  .ant-form-item-has-error .ant-input,
  .ant-form-item-has-error .ant-input-number-input,
  .ant-form-item-has-error .ant-input-affix-wrapper input,
  .ant-form-item-has-error .ant-select-selection-search-input {
    color: #1f2937;
    caret-color: #111827;
  }
`;

  type DropdownItem = {
    label: string;
    value: string | number;
  };


  useEffect(() => {
    if (DropDownAccount) {
      setAccountType(
        DropDownAccount.map((u) => ({
          label: `${u.dropdownValue}`,
          value: u.dropdownValue,
          code: u.dropdownCode,
        }))
      );
    }
  }, [DropDownAccount])

  const calculateTotals = (items: any[]) => {
    let totalCost = 0;
    let totalItems = 0;
    let totalTaxAmount = 0;

    for (let i = 0; i < items.length; i++) {
      const qty = Number(items[i]?.quantity) || 0;
      const price = Number(items[i]?.costPrice) || 0;
      const taxRate = Number(items[i]?.taxRate) || 0;
      const lineAmount = qty * price;
      const lineTax = lineAmount * (taxRate / 100);

      totalCost += lineAmount + lineTax;
      totalItems += qty;
      totalTaxAmount += lineTax;
    }

    setValue("purchaseTotalCost", Number(totalCost.toFixed(3)), {
      shouldDirty: false,
      shouldValidate: false,
      shouldTouch: false,
    });

    setValue("purchaseTotalItems", totalItems, {
      shouldDirty: false,
      shouldValidate: false,
      shouldTouch: false,
    });

    const subTotal = totalCost - totalTaxAmount;
    const effectiveTaxRate = subTotal > 0 ? (totalTaxAmount / subTotal) * 100 : 0;
    setValue("purchaseTaxRate", Number(effectiveTaxRate.toFixed(3)), {
      shouldDirty: false,
      shouldValidate: false,
      shouldTouch: false,
    });
  };

  const calculateLineAmount = (item: any) => {
    const qty = Number(item?.quantity) || 0;
    const rate = Number(item?.costPrice) || 0;
    const tax = Number(item?.taxRate) || 0;
    return qty * rate * (1 + tax / 100);
  };

  const totalsRecalc$ = useRef(new Subject<any[]>());

  useEffect(() => {
    const sub = totalsRecalc$.current
      .pipe(debounceTime(120))
      .subscribe((items) => calculateTotals(items));
    return () => sub.unsubscribe();
  }, []);

  // Debounce only expensive aggregate totals, not per-row amount updates.
  const queueTotalsRecalculation = useCallback(() => {
    totalsRecalc$.current.next(getValues("purchaseItems") || []);
  }, [getValues]);

  const deleteAccount = async (value:string) => {
    try {
      await DropDelRefetch({
        path:`/${value}`,
        method: "DELETE"
      })
      reloadAccount();
      notificationApi.success({
        message: "Deleted!",
        description: `Unit "${value}" removed.`,
      });
    } catch (err) {
      notificationApi.error({
        message: "Error",
        description: "Failed to delete category. It might be in use.",
      });
      return;
    }
  };

  const onSubmitDyn = async (values: any) => {
    try {
      if(modalType === "account"){
         await DropRefetch({
          body: {
            dropdownName: "accountType",
            dropdownLabel: values.name,
            dropdownValue: values.subname,
          },
        });
        reloadAccount()
      }
      closeModal();
      resetDyn();
    }
    catch (err) {
      notificationApi.error({
        message: "Error",
        description: "Failed to save data. Try again."
      });
    }
  }

  const handleOpenModal = (type: "account" | "unit") => {
    setModalType(type);
    resetDyn();     
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setModalType(null);
    resetDyn();
  };

  const supplierOptions = React.useMemo(() => {
    if (!suppliersData) return [];
      return suppliersData
  }, [suppliersData]);

  const itemOptions = React.useMemo(() => {
    if (!items?.length) return [];
    return items.map((item: any) => ({
      label: item?.name || item?.itemName || '',
      value: item?.itemCode || '',
      itemName: item?.name || item?.itemName || '',
      category: item?.category || '',
      unit: item?.unit || '',
      itemCode: item?.itemCode || ''
    }));
  }, [items]);

  const onAddNewSupplier =()=>{
    navigate('/supplier/create')
  }

  const addPurchaseItem = () => {
    const newItem = { name: '', category: '', unit: '', quantity: 0, costPrice: 0, taxRate: 0.0, amount:0 };
    append(newItem);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;
    move(result.source.index, result.destination.index);
    queueTotalsRecalculation();
  };

  const handleRemoveItem = useCallback((index: number) => {
    remove(index);
  }, [remove]);

  useEffect(() => {
    queueTotalsRecalculation();
  }, [fields.length, queueTotalsRecalculation]);

  return (
    <Container>
      <Header>Create Purchase</Header>
      <Content>
        <FormUxScope>
        <Form {...layout} labelAlign='left'>
            {/* NAME */}
            <Form.Item
              label="Supplier"
              required
              validateStatus={errors.supplierId ? 'error' : ''}
              help={<FormErrorMessage message={errors.supplierId?.message} />}
            >
              <Controller
                name="supplierId"
                control={control}
                rules={{ required: 'Supplier is required' }}
                render={({ field }) => 
                  <Select {...field} 
                    showSearch
                    suffixIcon={<IoIosArrowDown size={20} />}
                    size="large"
                    fieldNames={{
                      label: 'supplierName',
                      value: 'supplierCode',
                    }}
                    options={supplierOptions}
                    optionRender={(option: any) => {
                      const supplier = option.data;
                      console.log(option)
                      return (
                        <div className='flex justify-between'>
                          <div style={{ fontWeight: 500 }}>
                            {supplier.supplierName}
                          </div>
                          <div style={{ fontSize: 12, color: '#777' }}>
                            {supplier.supplierCompanyName}
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
                            onClick={onAddNewSupplier}
                            >
                            Create
                          </Button>
                        </div>
                      </>
                    )}
                    filterOption={(input, option: any) =>
                      option?.data?.supplierName
                        ?.toLowerCase()
                        .includes(input.toLowerCase()) ||
                      option?.data?.supplierCompanyName
                        ?.toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                }
              />
            </Form.Item>

            {/* UNIT */}
            <Form.Item
              label="Account Type"
              required
              validateStatus={errors.purchaseAccount ? 'error' : ''}
              help={<FormErrorMessage message={errors.purchaseAccount?.message} />}
            >
              <Controller
                name="purchaseAccount"
                control={control}
                rules={{ required: 'Account is required' }}
                render={({ field }) => (
                  SelectFun(field, accountType, deleteAccount, handleOpenModal, "account") 
                )}
              />
            </Form.Item>

            <Divider />
            <div style={{ marginBottom: 12, fontWeight: 600 }}>Item to purchase</div>
            <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '25px 2.5fr 2.5fr 1.5fr 1.5fr 1.5fr 52px',
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
                <div>AMOUNT</div>
                <div />
              </div>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="purchase-items-droppable">
                  {(dropProvided) => (
                    <div ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                      {fields.map((item, index) => (
                        <PurchaseItemRow
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
              <Button icon={<MdAddBox />} onClick={addPurchaseItem}>
                Add New Row
              </Button>
            </div>

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

      <Modal title={modalType === "account" ? "Add Account Type" : modalType === "size" ? "Add Size" : "Add Unit"}  open={openModal} onOk={handleSubmitDyn(onSubmitDyn)} onCancel={closeModal} okText="Save">
        <div>
           <Form {...ModelLayout} labelAlign='left'>
              <Form.Item
                label="Name"
                required
                validateStatus={errorsDyn.subname ? 'error' : ''}
                help={<FormErrorMessage message={errorsDyn.subname?.message} />}
              >
                <Controller
                  name="subname"
                  control={controlDyn}
                  rules={{ required: 'Name is required' }}
                  render={({ field }) => <Input size="large" {...field} placeholder="Enter" />}
                />
              </Form.Item>
           </Form>
        </div>
      </Modal>

    </Container>
  )
}

const PurchaseItemRow = memo(function PurchaseItemRow({
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
  const setDerivedAmount = useCallback((calcValues: any) => {
    const amountValue = Number(calculateLineAmount(calcValues).toFixed(3));
    setValue(`purchaseItems.${index}.amount`, amountValue, {
      shouldDirty: false,
      shouldValidate: false,
      shouldTouch: false,
    });
    return amountValue;
  }, [calculateLineAmount, index, setValue]);

  const [rowCalc, setRowCalc] = useState(() => {
    const row = getValues(`purchaseItems.${index}`) || {};
    return {
      quantity: Number(row?.quantity) || 0,
      costPrice: Number(row?.costPrice) || 0,
      taxRate: Number(row?.taxRate) || 0,
      unit: row?.unit || '',
    };
  });

  useEffect(() => {
    const row = getValues(`purchaseItems.${index}`) || {};
    const nextRowCalc = {
      quantity: Number(row?.quantity) || 0,
      costPrice: Number(row?.costPrice) || 0,
      taxRate: Number(row?.taxRate) || 0,
      unit: row?.unit || '',
    };
    setRowCalc(nextRowCalc);
    setDerivedAmount(nextRowCalc);
  }, [getValues, index, rowId, setDerivedAmount]);

  const amount = calculateLineAmount(rowCalc);
  const navigate = useNavigate(); 

  const onAddNewItem = () =>{
    navigate('/item/create')
  }

  return (
    <Draggable draggableId={rowId} index={index}>
      {(dragProvided) => (
        <div
          ref={dragProvided.innerRef}
          {...dragProvided.draggableProps}
          style={{
            display: 'grid',
            gridTemplateColumns: '25px 2.5fr 2.5fr 1.5fr 1.5fr 1.5fr 52px',
            padding: '10px 12px',
            borderBottom: '1px solid #f0f0f0',
            alignItems: 'center',
            gap: 8,
            ...dragProvided.draggableProps.style
          }}
        >
          <div
            {...dragProvided.dragHandleProps}
            style={{ cursor: 'grab', display: 'flex', justifyContent: 'center' }}
          >
            <MdDragIndicator size={18} color="#8c8c8c" />
          </div>
          <Controller
            name={`purchaseItems.${index}.name`}
            control={control}
            rules={{ required: 'Item is required' }}
            render={({ field }) => (
              <Select
                {...field}
                showSearch
                allowClear
                suffixIcon={<IoIosArrowDown size={20} />}
                placeholder="Select Item"
                options={itemOptions}
                optionFilterProp="label"
                onChange={(_selectedValue, option: any) => {
                  const selectedName = option?.itemName || '';
                  const nextUnit = option?.unit || '';
                  const Code = option?.itemCode || 'null';
                  field.onChange(selectedName);
                  setValue(`purchaseItems.${index}.category`, option?.category || '');
                  setValue(`purchaseItems.${index}.itemCode`, Code);
                  setValue(`purchaseItems.${index}.unit`, nextUnit);
                  setRowCalc((prev) => ({ ...prev, unit: nextUnit }));
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
          <input type="hidden" {...register(`purchaseItems.${index}.category`)} />
          <input type="hidden" {...register(`purchaseItems.${index}.unit`)} />
          <input type="hidden" {...register(`purchaseItems.${index}.amount`)} />
          <Controller
            name={`purchaseItems.${index}.quantity`}
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                inputMode="numeric"
                style={{ width: '100%' }}
                addonAfter={rowCalc.unit}
                onChange={(value) => {
                  const nextQuantity = Number(value) || 0;
                  // Update only this row's derived amount immediately.
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
          <Controller
            name={`purchaseItems.${index}.costPrice`}
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                style={{ width: '100%' }}
                inputMode="numeric"
                onChange={(value) => {
                  const nextCostPrice = Number(value) || 0;
                  setRowCalc((prev) => {
                    const nextRowCalc = { ...prev, costPrice: nextCostPrice };
                    setDerivedAmount(nextRowCalc);
                    return nextRowCalc;
                  });
                  field.onChange(nextCostPrice);
                  onQueueTotals();
                }}
              />
            )}
          />
          <Controller
            name={`purchaseItems.${index}.taxRate`}
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                min={0}
                style={{ width: '100%' }}
                value={field.value}
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
          <div style={{ fontWeight: 600 }}>{amount.toFixed(3)} </div>
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
  // Keep untouched rows from re-rendering; edit path updates only the active row.
  return (
    prev.rowId === next.rowId &&
    prev.index === next.index &&
    prev.canRemove === next.canRemove &&
    prev.itemOptions === next.itemOptions
  );
});


function SelectFun(field:any, Items:any, onDelete:any, onAddNew: (type: string) => void, type: "account" | "unit") {
  return (
    <Select
      size="large"
      {...field}
      placeholder="Select value"
      suffixIcon={<IoIosArrowDown size={20} />}
      showSearch
      optionLabelProp="title"
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
                onAddNew(type);
              }}
            >
              Add New
            </Button>
          </div>
        </>
      )}
      options={Items.map((item) => ({
        value: item.value,
        label: (
          <div className="flex justify-between items-center w-full">
            <span>{item.label}</span>
            {/* Delete Icon */}
            <IoTrashBinSharp
              size={18}
              color="red"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.code);
              }}
              title='Delete'
              style={{ cursor: "pointer", opacity: 0.4 }}
            />
          </div>
        ),
      }))}
    />
  );
}
