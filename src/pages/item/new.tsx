import { useEffect } from 'react'
import { Form, Input, Select, InputNumber, Button } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { useApi } from '../../hooks/useApi'   // ⭐ YOUR HOOK
import { PATH } from '../../constants/app.constant'
import { useNotification } from '../../components/provider/NotificationProvider';
import { useNavigate } from 'react-router-dom'
import { CookieService } from '../../store/Cookie'
import { IoIosArrowDown } from 'react-icons/io'
import FormErrorMessage from '../../components/FormErrorMessage'

export default function ItemNew() {
  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      itemCode: '',
      name: '',
      category: '',
      unit: '',
      quantity: 0,
      costPrice: 0,
      sellingPrice: 0,
      taxRate: 0,
    }
  })

  const notificationApi = useNotification();

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

  return (
    <div className='flex'>
      <div className='w-[100%]'>
      
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>

          {/* NAME */}
          <Form.Item
            label="Name"
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
            validateStatus={errors.category ? 'error' : ''}
            help={<FormErrorMessage message={errors.category?.message} />}
          >
            <Controller
              name="category"
              control={control}
              rules={{ required: 'Category is required' }}
              render={({ field }) => (
                <Select
                 size="large"
                  {...field}
                  placeholder="Select category"
                  options={[
                    { label: 'Fruit', value: 'Fruit' },
                    { label: 'Vegetable', value: 'Vegetable' },
                    { label: 'Dairy', value: 'Dairy' },
                  ]}
                  suffixIcon={<IoIosArrowDown size={20} />}
                />
              )}
            />
          </Form.Item>

          {/* UNIT */}
          <Form.Item
            label="Unit"
            validateStatus={errors.unit ? 'error' : ''}
            help={<FormErrorMessage message={errors.unit?.message} />}
          >
            <Controller
              name="unit"
              control={control}
              rules={{ required: 'Unit is required' }}
              render={({ field }) => (
                <Select
                  size="large"
                  {...field}
                  placeholder="Select unit"
                  options={[
                    { label: 'DOX', value: 'DOX' },
                    { label: 'KG', value: 'KG' },
                    { label: 'LTR', value: 'LTR' },
                  ]}
                  suffixIcon={<IoIosArrowDown size={20} />}
                />
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
              rules={{
                required: 'Quantity is required',
                min: { value: 1, message: 'Quantity must be at least 1' },
              }}
              render={({ field }) => (
                <InputNumber size="large" {...field} min={1} style={{ width: '100%' }} />
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
                <InputNumber size="large" {...field} min={0} style={{ width: '100%' }} />
              )}
            />
          </Form.Item>

          {/* SELLING PRICE */}
          <Form.Item
            label="Selling Price"
            validateStatus={errors.sellingPrice ? 'error' : ''}
            help={errors.sellingPrice?.message}
          >
            <Controller
              name="sellingPrice"
              control={control}
              rules={{
                required: 'Selling Price is required',
                min: { value: 0, message: 'Value cannot be negative' },
              }}
              render={({ field }) => (
                <InputNumber size="large" {...field} min={0} style={{ width: '100%' }} />
              )}
            />
          </Form.Item>

          {/* TAX RATE */}
          <Form.Item
            label="Tax Rate (%)"
            validateStatus={errors.taxRate ? 'error' : ''}
            help={errors.taxRate?.message}
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
                <InputNumber size="large" {...field} min={0} max={100} style={{ width: '100%' }} />
              )}
            />
          </Form.Item>

          {/* SUBMIT BUTTON */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              Create Item
            </Button>
          </Form.Item>

        </Form>
      </div>

      <div className='w-[100%]'>
        
      </div>
    </div>
  )
}
