import { useEffect, useState } from 'react'
import { Form, Input, Select, InputNumber, Button, Divider, Modal } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { useApi } from '../../hooks/useApi'   // ⭐ YOUR HOOK
import { PATH } from '../../constants/app.constant'
import { useNotification } from '../../components/provider/NotificationProvider';
import { useNavigate } from 'react-router-dom'
import { CookieService } from '../../store/Cookie'
import { IoIosArrowDown } from 'react-icons/io'
import FormErrorMessage from '../../components/FormErrorMessage'
import { IoTrashBinSharp } from "react-icons/io5";
import { MdAddBox } from "react-icons/md";
import '../../css/common.css';
import styled from "@emotion/styled";

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

export default function ItemNew() {
  const { control, handleSubmit, formState: { errors }, reset, watch } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      itemCode: '',
      name: '',
      category: '',
      unit: '',
      quantity: 0,
      costPrice: 0,
      sellingPrice: 0,
      taxRate: 0,
      size: '',
      companyId: CookieService.get('companyId') || '',
    }
  })

  const { control: controlDyn, handleSubmit: handleSubmitDyn, formState: { errors: errorsDyn }, reset: resetDyn } = useForm({
    defaultValues: {
      name: '',
      subname: '',
    }
  })

  const selectedUnit = watch("unit");

  const notificationApi = useNotification();

  const { data:DropDownUnit, loading:DropLoadUnit, refetch: reloadUnits } = useApi<any[]>(`${PATH.GET_DROP_DOWN}/Unit`, { method: "GET", showOverlay: true });
  const { data:DropDownCat, loading:DropLoadCat, refetch: reloadCategories } = useApi<any[]>(`${PATH.GET_DROP_DOWN}/Category`, { method: "GET", showOverlay: true });
  const { data:DropDownSize, loading:DropLoadSize, refetch: reloadSize } = useApi<any[]>(`${PATH.GET_DROP_DOWN}/Size`, { method: "GET", showOverlay: true });
  const { data:DropDown, loading:DropLoad, refetch:DropRefetch } = useApi<any[]>(`${PATH.POST_DROP_DOWN}`, { method: "POST", autoFetch: false });
  const { data:DropDelDown, loading:DropDelLoad, refetch:DropDelRefetch } = useApi<any[]>(`${PATH.POST_DROP_DOWN}`, { method: "DELETE", autoFetch: false });

  // ⭐ API Hook for POST
  // const createItemApi = useApi(PATH.GET_ITEMS_DATA, { method: 'POST' }, false)

  const { data, loading, error, refetch } = useApi<any>(
    PATH.GET_ITEMS_DATA,
    { method: 'POST', autoFetch: false }
  );

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
        navigate('/item');
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

  const onSubmit = async (formValues) => {
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

  type DropdownItem = {
    label: string;
    value: string | number;
  };

  const [units, setUnits] = useState<DropdownItem[]>([]);
  const [categories, setCategories] = useState<DropdownItem[]>([]);
  const [sizes, setSizes] = useState<DropdownItem[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [modalType, setModalType] = useState<"category" | "unit" | "size" | null>(null);

  useEffect(() => {
    if (DropDownUnit) {
      setUnits(
        DropDownUnit.map((u) => ({
          label: `${u.dropdownLabel} - ${u.dropdownValue}`,
          value: u.dropdownValue,
          code: u.dropdownCode,
        }))
      );
    }
    if (DropDownCat) {
      setCategories(
        DropDownCat.map((c) => ({
          label: `${c.dropdownLabel} - ${c.dropdownValue}`,
          value: c.dropdownValue,
          code: c.dropdownCode,
        }))
      );
    }
    if (DropDownSize) {
      setSizes(
        DropDownSize.map((c) => ({
          label: `${c.dropdownValue}`,
          value: c.dropdownValue,
          code: c.dropdownCode,
        }))
      );
    }
  }, [DropDownUnit, DropDownCat, DropDownSize]);

  const deleteUnit = async (value:string) => {
    try {
      await DropDelRefetch({
        path:`/${value}`,
        method: "DELETE"
      })
      reloadCategories();
      reloadUnits();
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

  const deleteCategory = async (value:string) => {
    try {
      await DropDelRefetch({
        path:`/${value}`,
        method: "DELETE"
      })
      reloadCategories();
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
  }

  const onSubmitDyn = async (values: any) => {
    try {
      if (modalType === "category") {
        await DropRefetch({
          body: {
            dropdownName: "Category",
            dropdownLabel: values.name,
            dropdownValue: values.subname,
          },
        });

        reloadCategories(); // ⭐ refresh category list
      }

      if (modalType === "unit") {
        await DropRefetch({
          body: {
            dropdownName: "Unit",
            dropdownLabel: values.name,
            dropdownValue: values.subname,
          },
        });

        reloadUnits(); // ⭐ refresh unit list
      }

      if (modalType === "size") {
        await DropRefetch({
          body: {
            dropdownName: "Size",
            dropdownLabel: values.name,
            dropdownValue: values.subname,
          },
        });

        reloadSize(); // ⭐ refresh unit list
      }

      closeModal(); // Close modal after success
      resetDyn();   // Clear modal fields

      notificationApi.success({
        message: "Success",
        description: `${modalType === "category" ? "Category" : "Unit"} added successfully`
      });

    } catch (err) {
      notificationApi.error({
        message: "Error",
        description: "Failed to save data. Try again."
      });
    }
  };



  const handleOpenModal = (type: "category" | "unit" | "size") => {
    setModalType(type);
    resetDyn();     
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setModalType(null);
    resetDyn();
  };


  return (
    <Container>
      <Header>Create Item</Header>
      <Content>
        <FormUxScope>
        <Form {...layout} labelAlign='left'>

          {/* NAME */}
          <Form.Item
            label="Name"
            required
            validateStatus={errors.name ? 'error' : ''}
            help={<FormErrorMessage message={errors.name?.message} />}
          >
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Name is required' }}
              render={({ field }) => <Input size="large" {...field} placeholder="Item name" />}
            />
          </Form.Item>

          {/* CATEGORY */}
          <Form.Item
            label="Category"
            required
            validateStatus={errors.category ? 'error' : ''}
            help={<FormErrorMessage message={errors.category?.message} />}
          >
            <Controller
              name="category"
              control={control}
              rules={{ required: 'Category is required' }}
              render={({ field }) => (
                SelectFun(field, categories, deleteCategory, handleOpenModal, "category") 
              )}
            />
          </Form.Item>

          {/* UNIT */}
          <Form.Item
            label="Unit"
            required
            validateStatus={errors.unit ? 'error' : ''}
            help={<FormErrorMessage message={errors.unit?.message} />}
          >
            <Controller
              name="unit"
              control={control}
              rules={{ required: 'Unit is required' }}
              render={({ field }) => (
                SelectFun(field, units, deleteUnit, handleOpenModal, "unit") 
              )}
            />
          </Form.Item>

          {/* UNIT */}
          <Form.Item
            label="Size"
            required
            validateStatus={errors.size ? 'error' : ''}
            help={<FormErrorMessage message={errors.size?.message} />}
          >
            <Controller
              name="size"
              control={control}
              rules={{ required: 'Size is required' }}
              render={({ field }) => (
                SelectFun(field, sizes, deleteUnit, handleOpenModal, "size") 
              )}
            />
          </Form.Item>

          {/* QUANTITY */}
          <Form.Item
            label="Quantity"
            validateStatus={errors.quantity ? 'error' : ''}
            help={<FormErrorMessage message={errors.quantity?.message} />}
          >
            <Controller
              name="quantity"
              control={control}
              render={({ field }) => (
                <InputNumber size="large" inputMode="numeric" {...field} style={{ width: '100%' }} suffix={`${selectedUnit}`} />
              )}
            />
          </Form.Item>

          {/* COST PRICE */}
          <Form.Item
            label="Cost Price"
            validateStatus={errors.costPrice ? 'error' : ''}
            help={<FormErrorMessage message={errors.costPrice?.message} />}
          >
            <Controller
              name="costPrice"
              control={control}
              rules={{
                required: 'Cost Price is required',
                min: { value: 0, message: 'Value cannot be negative' },
              }}
              render={({ field }) => (
                <InputNumber prefix="₹" size="large" {...field} min={0} style={{ width: '100%' }} suffix="INR" />
              )}
            />
          </Form.Item>

          {/* SELLING PRICE */}
          <Form.Item
            label="Selling Price"
            validateStatus={errors.sellingPrice ? 'error' : ''}
            help={<FormErrorMessage message={errors.sellingPrice?.message} />}
          >
            <Controller
              name="sellingPrice"
              control={control}
              rules={{
                required: 'Selling Price is required',
                min: { value: 0, message: 'Value cannot be negative' },
              }}
              render={({ field }) => (
                <InputNumber prefix="₹" size="large" {...field} min={0} style={{ width: '100%' }} suffix="INR" />
              )}
            />
          </Form.Item>

          {/* TAX RATE */}
          <Form.Item
            label="Tax Rate (%)"
            validateStatus={errors.taxRate ? 'error' : ''}
            help={<FormErrorMessage message={errors.taxRate?.message} />}
          >
            <Controller
              name="taxRate"
              control={control}
              rules={{
                required: 'Tax Rate is required',
                min: { value: 0, message: 'Tax cannot be negative' },
                max: { value: 100, message: 'Tax cannot exceed 100%' },
              }}
              render={({ field }) => (
                <InputNumber size="large" {...field} min={0} max={100} style={{ width: '100%' }} suffix="%" />
              )}
            />
          </Form.Item>

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

      <Modal title={modalType === "category" ? "Add Category" : modalType === "size" ? "Add Size" : "Add Unit"}  open={openModal} onOk={handleSubmitDyn(onSubmitDyn)} onCancel={closeModal} okText="Save">
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

              <Form.Item
                label="Sub Name"
                required
                validateStatus={errorsDyn.name ? 'error' : ''}
                help={<FormErrorMessage message={errorsDyn.name?.message} />}
              >
                <Controller
                  name="name"
                  control={controlDyn}
                  rules={{ required: 'Sub Name is required' }}
                  render={({ field }) => <Input size="large" {...field} placeholder="Enter" />}
                />
              </Form.Item>
           </Form>
        </div>
      </Modal>
    </Container>
  )
}
  

function SelectFun(field:any, Items:any, onDelete:any, onAddNew: (type: string) => void, type: "category" | "unit" | "size") {
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

