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
import { Data } from '../../constants/IndianStateDistrictsData';

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

export default function SupplierNew() {
  const { control, handleSubmit, formState: { errors }, reset, watch } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      supplierCode: '',
      supplierName: '',
      supplierCompanyName: '',
      supplierMobile: '',
      supplierEmail: '',
      supplierGstNo: '',
      supplierAddress: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        district: '',
        country: 'India',
        state: '',
        pincode: '',
      },
      companyId: CookieService.get('companyId') || '',
    }
  })

  const notificationApi = useNotification();
  const selectedState = watch("supplierAddress.state");
  const [districtOptions, setDistrictOptions] = useState<string[]>([]);

  useEffect(() => {
    if (selectedState) {
      const stateObj = Data.states.find((s) => s.state === selectedState);
      setDistrictOptions(stateObj?.districts || []);
    } else {
      setDistrictOptions([]);
    }
  }, [selectedState]);

  // ⭐ API Hook for POST
  // const createItemApi = useApi(PATH.GET_ITEMS_DATA, { method: 'POST' }, false)

  const { data, loading, error, refetch } = useApi<any>(
    PATH.SUPPLIERS_DATA,
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
        navigate('/supplier');
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
    await refetch({body:payload})
  }

  const layout = {
    labelCol: { span: 6 },
    wrapperCol:{ span: 8 }
  };

  const ModelLayout={
    labelCol: { span: 6 },
    wrapperCol:{ span: 16 }
  }

  return (
    <Container>
      <Header>Create Supplier</Header>
      <Content>
        <FormUxScope>
        <Form {...layout} labelAlign='left'>

          {/* NAME */}
          <Form.Item
            label="Name"
            required
            validateStatus={errors.supplierName ? 'error' : ''}
            help={<FormErrorMessage message={errors.supplierName?.message} />}
          >
            <Controller
              name="supplierName"
              control={control}
              rules={{ required: 'Name is required' }}
              render={({ field }) => <Input size="large" {...field} placeholder="Supplier Name" />}
            />
          </Form.Item>

          {/* COMPANY NAME */}
          <Form.Item
            label="Company Name"
            required
            validateStatus={errors.supplierCompanyName ? 'error' : ''}
            help={<FormErrorMessage message={errors.supplierCompanyName?.message} />}
          >
            <Controller
              name="supplierCompanyName"
              control={control}
              rules={{ required: 'Company Name is required' }}
              render={({ field }) => <Input size="large" {...field} placeholder="Company" />}
            />
          </Form.Item>

          {/* MOBILE */}
          <Form.Item
            label="Mobile"
            required
            validateStatus={errors.supplierMobile ? 'error' : ''}
            help={<FormErrorMessage message={errors.supplierMobile?.message} />}
          >
            <Controller
              name="supplierMobile"
              control={control}
              rules={{
                required: 'Mobile number is required',
                pattern: {
                  value: /^[6-9]\d{9}$/,
                  message: 'Enter a valid 10 digit mobile number',
                },
              }}
               render={({ field }) => (
              <Input
                {...field}
                size="large"
                placeholder="10 digit mobile number"
                maxLength={10}
                addonBefore="+91"
                inputMode="numeric"
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  field.onChange(value);
                }}
              />
            )}
            />
          </Form.Item>

          {/* EMAIL */}
          <Form.Item
            label="Email"
            validateStatus={errors.supplierEmail ? 'error' : ''}
            help={<FormErrorMessage message={errors.supplierEmail?.message} />}
          >
            <Controller
              name="supplierEmail"
              control={control}
              rules={{
                validate: (value) =>
                  !value ||
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ||
                  'Please enter a valid email address',
              }}
              render={({ field }) => <Input size="large" {...field} placeholder="example@gmail.com" />}
            />
          </Form.Item>

          {/* COMPANY NAME */}
          <Form.Item
            label="GST No"
            required
            validateStatus={errors.supplierGstNo ? 'error' : ''}
            help={<FormErrorMessage message={errors.supplierGstNo?.message} />}
          >
            <Controller
              name="supplierGstNo"
              control={control}
              rules={{ required: 'GST No is required' }}
              render={({ field }) => <Input size="large" {...field} placeholder="27ABCDE1234F2Z5" />}
            />
          </Form.Item>

          <Divider orientation="center">Address</Divider>

          {/* ADDRESS LINE 1 */}
          <Form.Item
            label="Address Line 1"
            required
            validateStatus={errors?.supplierAddress?.addressLine1 ? 'error' : ''}
            help={
              <FormErrorMessage
                message={errors?.supplierAddress?.addressLine1?.message}
              />
            }
          >
            <Controller
              name="supplierAddress.addressLine1"
              control={control}
              rules={{ required: 'Address Line 1 is required' }}
              render={({ field }) => (
                <Input size="large" {...field} placeholder="House no, Street name" />
              )}
            />
            </Form.Item>

          {/* ADDRESS LINE 2 */}
          <Form.Item
            label="Address Line 2"
            validateStatus={errors?.supplierAddress?.addressLine2 ? 'error' : ''}
            help={
              <FormErrorMessage
                message={errors?.supplierAddress?.addressLine2?.message}
              />
            }
          >
            <Controller
              name="supplierAddress.addressLine2"
              control={control}
              render={({ field }) => (
                <Input size="large" {...field} placeholder="Landmark, Area (optional)" />
              )}
            />
          </Form.Item>

          {/* STATE */}
          <Form.Item
            label="State"
            required
            validateStatus={errors?.supplierAddress?.state ? 'error' : ''}
            help={
              <FormErrorMessage
                message={errors?.supplierAddress?.state?.message}
              />
            }
          >
            <Controller
              name="supplierAddress.state"
              control={control}
              rules={{ required: 'State is required' }}
              render={({ field }) => (
                <Select
                  size="large"
                  {...field}
                  placeholder="Select State"
                  showSearch
                  options={Data.states.map((s) => ({
                    label: s.state,
                    value: s.state,
                  }))}
                  onChange={(value) => {
                    field.onChange(value);
                    // Reset district whenever state changes
                    reset({
                      ...watch(),
                      supplierAddress: { ...watch().supplierAddress, district: '' }
                    });
                  }}
                />
              )}
            />
          </Form.Item>

           {/* DISTRICT */}
          <Form.Item
            label="District"
            required
            validateStatus={errors?.supplierAddress?.district ? 'error' : ''}
            help={
              <FormErrorMessage
                message={errors?.supplierAddress?.state?.message}
              />
            }
          >
            <Controller
              name="supplierAddress.district"
              control={control}
              rules={{ required: 'District is required' }}
              render={({ field }) => (
                <Select
                  size="large"
                  {...field}
                  placeholder="Select District"
                  showSearch
                  options={districtOptions.map((district) => ({
                    label: district,
                    value: district,
                  }))}
                  onChange={(value) => field.onChange(value)}
                />
              )}
            />
          </Form.Item>

          {/* CITY */}
          <Form.Item
            label="City"
            required
            validateStatus={errors?.supplierAddress?.city ? 'error' : ''}
            help={
              <FormErrorMessage
                message={errors?.supplierAddress?.city?.message}
              />
            }
          >
            <Controller
              name="supplierAddress.city"
              control={control}
              rules={{ required: 'City is required' }}
              render={({ field }) => (
                <Input size="large" {...field} placeholder="City" />
              )}
            />
          </Form.Item>


          {/* PINCODE */}
          <Form.Item
            label="Pincode"
            required
            validateStatus={errors?.supplierAddress?.pincode ? 'error' : ''}
            help={
              <FormErrorMessage
                message={errors?.supplierAddress?.pincode?.message}
              />
            }
          >
            <Controller
              name="supplierAddress.pincode"
              control={control}
              rules={{
                required: 'Pincode is required',
                pattern: {
                  value: /^[0-9]{6}$/,
                  message: 'Enter a valid 6-digit pincode',
                },
              }}
              render={({ field }) => (
                <Input
                  size="large"
                  {...field}
                  placeholder="6-digit pincode"
                  maxLength={6}
                />
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

    </Container>
  )
}
  

function SelectFun(field:any, Items:any, onDelete:any, onAddNew: (type: string) => void, type: "category" | "unit") {
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

