import { useEffect, useState } from 'react'
import { Form, Input, Select, Button, Divider, Row, Col, Radio } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { useApi } from '../../hooks/useApi'
import { PATH } from '../../constants/app.constant'
import { useNotification } from '../../components/provider/NotificationProvider';
import { useNavigate } from 'react-router-dom'
import { CookieService } from '../../store/Cookie'
import FormErrorMessage from '../../components/FormErrorMessage'
import '../../css/common.css';
import styled from "@emotion/styled";
import { Data } from '../../constants/IndianStateDistrictsData'

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

  .ant-form-item-has-error .ant-input,
  .ant-form-item-has-error .ant-input-number-input,
  .ant-form-item-has-error .ant-input-affix-wrapper input,
  .ant-form-item-has-error .ant-select-selection-search-input {
    color: #1f2937;
    caret-color: #111827;
  }
`;

export default function CustomerCreate() {
  const { control, handleSubmit, formState: { errors }, reset, watch, setFocus } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      customerSalutation: 'Mr.',
      customerFirstName: '',
      customerLastName: '',
      customerMobile: '',
      customerEmail: '',
      customerType: '',
      customerPan: '',
      customerAddress: {
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
  const selectedState = watch("customerAddress.state");
  const [districtOptions, setDistrictOptions] = useState<string[]>([]);

  useEffect(() => {
    if (selectedState) {
      const stateObj = Data.states.find((s) => s.state === selectedState);
      setDistrictOptions(stateObj?.districts || []);
    } else {
      setDistrictOptions([]);
    }
  }, [selectedState]);

  const { data, loading, error, refetch } = useApi<any>(
    PATH.CUSTOMERS_DATA,
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
        navigate('/customer');
      }, 500);
    }
    if (error) {
      notificationApi.error({
        message: error.error,
        description: `${error?.message || 'Failed to create customer. Please try again.'}`,
        showProgress: true,
        pauseOnHover: true,
      });
    }
  }, [data, error]);

  const onSubmit = async (formValues) => {
    const userName = CookieService.get('user_name') || 'Admin';
    const payload = {
      ...formValues,
      createdBy: userName,
      updatedBy: userName
    }
    await refetch({ body: payload })
  }

  const onError = (errors: any) => {
    const errorOrder = [
      'customerType',
      'customerSalutation',
      'customerFirstName',
      'customerLastName',
      'customerMobile',
      'customerEmail',
      'customerPan',
      'customerAddress.addressLine1',
      'customerAddress.city',
      'customerAddress.state',
      'customerAddress.district',
      'customerAddress.pincode',
    ];

    for (const field of errorOrder) {
      const hasError = field.split('.').reduce((obj, key) => obj?.[key], errors);
      if (hasError) {
        setFocus(field as any);
        break;
      }
    }
  };

  const layout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 10 }
  };

  return (
    <Container>
      <Header>Create Customer</Header>
      <Content>
        <FormUxScope>
        <Form {...layout} labelAlign='left'>

          {/* TYPE */}
          <Form.Item
            label="Customer Type"
            required
            validateStatus={errors.customerType ? 'error' : ''}
            help={<FormErrorMessage message={errors.customerType?.message} />}
          >
            <Controller
              name="customerType"
              control={control}
              rules={{ required: 'Type is required' }}
              render={({ field }) => (
                <Radio.Group
                  {...field}
                  size="large"
                  optionType="default"
                >
                  <Radio value="Business">Business</Radio>
                  <Radio value="Individual">Individual</Radio>
                </Radio.Group>
              )}
            />
          </Form.Item>

          {/* NAME ROW */}
          <Form.Item label="Customer Name" required>
            <Row gutter={12}>

              {/* SALUTATION */}
              <Col span={6}>
                <Form.Item
                  validateStatus={errors.customerSalutation ? 'error' : ''}
                  help={<FormErrorMessage message={errors.customerSalutation?.message} />}
                  required
                  style={{ marginBottom: 0 }}
                >
                  <Controller
                    name="customerSalutation"
                    control={control}
                    rules={{ required: 'Required' }}
                    render={({ field }) => (
                      <Select {...field} size="large" placeholder="Salutation">
                        <Select.Option value="Mr.">Mr.</Select.Option>
                        <Select.Option value="Mrs.">Mrs.</Select.Option>
                        <Select.Option value="Ms.">Ms.</Select.Option>
                        <Select.Option value="Dr.">Dr.</Select.Option>
                      </Select>
                    )}
                  />
                </Form.Item>
              </Col>

              {/* FIRST NAME */}
              <Col span={9}>
                <Form.Item
                  validateStatus={errors.customerFirstName ? 'error' : ''}
                  help={<FormErrorMessage message={errors.customerFirstName?.message} />}
                  required
                  style={{ marginBottom: 0 }}
                >
                  <Controller
                    name="customerFirstName"
                    control={control}
                    rules={{ required: 'First Name is required' }}
                    render={({ field }) => (
                      <Input size="large" {...field} placeholder="First Name" />
                    )}
                  />
                </Form.Item>
              </Col>

              {/* LAST NAME */}
              <Col span={9}>
                <Form.Item
                  validateStatus={errors.customerLastName ? 'error' : ''}
                  help={<FormErrorMessage message={errors.customerLastName?.message} />}
                  required
                  style={{ marginBottom: 0 }}
                >
                  <Controller
                    name="customerLastName"
                    control={control}
                    rules={{ required: 'Last Name is required' }}
                    render={({ field }) => (
                      <Input size="large" {...field} placeholder="Last Name" />
                    )}
                  />
                </Form.Item>
              </Col>

            </Row>
          </Form.Item>

          {/* MOBILE */}
          <Form.Item
            label="Mobile"
            required
            validateStatus={errors.customerMobile ? 'error' : ''}
            help={<FormErrorMessage message={errors.customerMobile?.message} />}
          >
            <Controller
              name="customerMobile"
              control={control}
              rules={{
                required: 'Mobile is required',
                pattern: {
                  value: /^[6-9]\d{9}$/,
                  message: 'Valid 10 digit number',
                },
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  size="large"
                  placeholder="9876543210"
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
            validateStatus={errors.customerEmail ? 'error' : ''}
            help={<FormErrorMessage message={errors.customerEmail?.message} />}
          >
            <Controller
              name="customerEmail"
              control={control}
              rules={{
                validate: (value) =>
                  !value ||
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ||
                  'Invalid email',
              }}
              render={({ field }) => <Input size="large" {...field} placeholder="john@example.com" />}
            />
          </Form.Item>

          {/* PAN */}
          <Form.Item
            label="PAN Number"
            validateStatus={errors.customerPan ? 'error' : ''}
            help={<FormErrorMessage message={errors.customerPan?.message} />}
          >
            <Controller
              name="customerPan"
              control={control}
              rules={{
                pattern: {
                  value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                  message: 'Invalid PAN format (e.g. ABCDE1234F)'
                }
              }}
              render={({ field }) => (
                <Input
                  size="large"
                  {...field}
                  placeholder="ABCDE1234F"
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              )}
            />
          </Form.Item>

          <Divider orientation="left">Address</Divider>

          {/* STREET */}
          <Form.Item
            label="AddressLine 1"
            required
            validateStatus={errors?.customerAddress?.addressLine1 ? 'error' : ''}
            help={<FormErrorMessage message={errors?.customerAddress?.addressLine1?.message} />}
          >
            <Controller
              name="customerAddress.addressLine1"
              control={control}
              rules={{ required: 'address is required' }}
              render={({ field }) => <Input size="large" {...field} placeholder="123 Main St" />}
            />
          </Form.Item>

          <Form.Item
            label="AddressLine 2"
          >
            <Controller
              name="customerAddress.addressLine2"
              control={control}
              render={({ field }) => <Input size="large" {...field} placeholder="123 Main St" />}
            />
          </Form.Item>

          {/* CITY */}
          <Form.Item
            label="City"
            required
            validateStatus={errors?.customerAddress?.city ? 'error' : ''}
            help={<FormErrorMessage message={errors?.customerAddress?.city?.message} />}
          >
            <Controller
              name="customerAddress.city"
              control={control}
              rules={{ required: 'City is required' }}
              render={({ field }) => <Input size="large" {...field} placeholder="New York" />}
            />
          </Form.Item>

          {/* STATE */}
          <Form.Item
            label="State"
            required
            validateStatus={errors?.customerAddress?.state ? 'error' : ''}
            help={
              <FormErrorMessage
                message={errors?.customerAddress?.state?.message}
              />
            }
          >
            <Controller
              name="customerAddress.state"
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
                      customerAddress: { ...watch().customerAddress, district: '' }
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
            validateStatus={errors?.customerAddress?.district ? 'error' : ''}
            help={
              <FormErrorMessage
                message={errors?.customerAddress?.state?.message}
              />
            }
          >
            <Controller
              name="customerAddress.district"
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

          {/* ZIP */}
          <Form.Item
            label="Zip / Pincode"
            required
            validateStatus={errors?.customerAddress?.pincode ? 'error' : ''}
            help={<FormErrorMessage message={errors?.customerAddress?.pincode?.message} />}
          >
            <Controller
              name="customerAddress.pincode"
              control={control}
              rules={{ required: 'Zip is required' }}
              render={({ field }) => <Input size="large" {...field} placeholder="xxxxxx" />}
            />
          </Form.Item>

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
  )
}
