import React, { useState, useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Switch, Space, Divider, message, Modal } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { customFieldsApi, CustomField } from '../api/customFieldsApi';
import { CookieService } from '../store/Cookie';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { IoIosArrowDown } from 'react-icons/io';

interface CustomFieldsDrawerProps {
  open: boolean;
  onClose: () => void;
  onFieldsChange?: (fields: CustomField[]) => void;
}

interface CreateFieldForm {
  fieldName: string;
  fieldLabel: string;
  fieldType: 'TEXT' | 'DROPDOWN' | 'NUMBER' | 'DATE' | 'PARAGRAPH';
  required: boolean;
  options: { label: string; value: string }[];
}

const CustomFieldsDrawer: React.FC<CustomFieldsDrawerProps> = ({ open, onClose, onFieldsChange }) => {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const companyId = CookieService.get('companyId') || '';

  const { control, handleSubmit, reset, watch, setValue } = useForm<CreateFieldForm>({
    defaultValues: {
      fieldName: '',
      fieldLabel: '',
      fieldType: 'TEXT',
      required: false,
      options: [{ label: '', value: '' }],
    },
  });

  const fieldType = watch('fieldType');

  // ✅ FIX: Directly call the API instead of using useApi with autoFetch: false
  const fetchCustomFields = async () => {
    if (!companyId) return;
    setFieldsLoading(true);
    try {
      const data = await customFieldsApi.getCustomFields('items', companyId);
      setCustomFields(data);
      onFieldsChange?.(data);
    } catch (error) {
      message.error('Failed to load custom fields');
    } finally {
      setFieldsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCustomFields();
    }
  }, [open]);

  const onSubmitCreateField = async (data: CreateFieldForm) => {
    setLoading(true);
    try {
      const payload = {
        companyId,
        fieldTable: 'items',
        fieldName: data.fieldName,
        fieldLabel: data.fieldLabel,
        fieldType: data.fieldType,
        required: data.required,
        fieldOptions: data.fieldType === 'DROPDOWN' ? data.options.filter(opt => opt.label && opt.value) : undefined,
        createdBy: CookieService.get('user_name'),
        updatedBy: CookieService.get('user_name'),
      };

      await customFieldsApi.createCustomField(payload);
      message.success('Custom field created successfully');
      reset();
      fetchCustomFields();
    } catch (error) {
      message.error('Failed to create custom field');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    try {
      await customFieldsApi.deleteCustomField(fieldId);
      message.success('Custom field deleted successfully');
      fetchCustomFields();
    } catch (error) {
      message.error('Failed to delete custom field');
    }
  };

  const handleEditField = (field: CustomField) => {
    setEditingField(field);
    setValue('fieldName', field.fieldName);
    setValue('fieldLabel', field.fieldLabel || '');
    setValue('fieldType', field.fieldType);
    setValue('required', field.required || false);
    setValue('options', field.fieldOptions?.length ? field.fieldOptions : [{ label: '', value: '' }]);
    setEditModalOpen(true);
  };

  const handleUpdateField = async (data: CreateFieldForm) => {
    if (!editingField) return;

    setLoading(true);
    try {
      const payload = {
        fieldName: data.fieldName,
        fieldLabel: data.fieldLabel,
        fieldType: data.fieldType,
        required: data.required,
        fieldOptions: data.fieldType === 'DROPDOWN' ? data.options.filter(opt => opt.label && opt.value) : undefined,
        updatedBy: CookieService.get('user_name'),
      };

      await customFieldsApi.updateCustomField(editingField.id!, payload);
      message.success('Custom field updated successfully');
      reset();
      setEditingField(null);
      setEditModalOpen(false);
      fetchCustomFields();
    } catch (error) {
      message.error('Failed to update custom field');
    } finally {
      setLoading(false);
    }
  };

  const addOption = () => {
    const currentOptions = watch('options') || [];
    setValue('options', [...currentOptions, { label: '', value: '' }]);
  };

  const removeOption = (index: number) => {
    const currentOptions = watch('options') || [];
    setValue('options', currentOptions.filter((_, i) => i !== index));
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingField(null);
    reset();
  };

  return (
    <Drawer
      title="Custom Fields"
      placement="right"
      onClose={onClose}
      open={open}
      width={400}
    >
      <div style={{ padding: '16px 0' }}>
        {/* Create Field Form */}
        <Form layout="vertical" onFinish={handleSubmit(onSubmitCreateField)}>
          <Form.Item label="Field Type" required>
            <Controller
              name="fieldType"
              control={control}
              rules={{ required: 'Field type is required' }}
              render={({ field }) => (
                <Select {...field} placeholder="Select field type" suffixIcon={<IoIosArrowDown size={20} />}>
                  <Select.Option value="TEXT">Text</Select.Option>
                  <Select.Option value="DROPDOWN">Dropdown</Select.Option>
                  <Select.Option value="NUMBER">Number</Select.Option>
                  <Select.Option value="DATE">Date</Select.Option>
                  <Select.Option value="PARAGRAPH">Paragraph</Select.Option>
                </Select>
              )}
            />
          </Form.Item>

          <Form.Item label="Field Name" required>
            <Controller
              name="fieldName"
              control={control}
              rules={{ required: 'Field name is required' }}
              render={({ field }) => <Input {...field} placeholder="Enter field name" />}
            />
          </Form.Item>

          <Form.Item label="Field Label">
            <Controller
              name="fieldLabel"
              control={control}
              render={({ field }) => <Input {...field} placeholder="Enter field label" />}
            />
          </Form.Item>

          <Form.Item label="Required">
            <Controller
              name="required"
              control={control}
              render={({ field }) => <Switch {...field} checked={field.value} />}
            />
          </Form.Item>

          {fieldType === 'DROPDOWN' && (
            <Form.Item label="Options">
              <Controller
                name="options"
                control={control}
                render={({ field }) => (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {field.value?.map((option, index) => (
                      <Space key={index} style={{ width: '100%' }}>
                        <Input
                          placeholder="Label"
                          value={option.label}
                          onChange={(e) => {
                            const newOptions = [...field.value];
                            newOptions[index].label = e.target.value;
                            field.onChange(newOptions);
                          }}
                        />
                        <Input
                          placeholder="Value"
                          value={option.value}
                          onChange={(e) => {
                            const newOptions = [...field.value];
                            newOptions[index].value = e.target.value;
                            field.onChange(newOptions);
                          }}
                        />
                        <Button
                          type="text"
                          danger
                          onClick={() => removeOption(index)}
                          disabled={field.value.length === 1}
                        >
                          Remove
                        </Button>
                      </Space>
                    ))}
                    <Button type="dashed" onClick={addOption} block>
                      Add Option
                    </Button>
                  </Space>
                )}
              />
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button onClick={() => reset()}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Create Field
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Divider />

        {/* Existing Fields */}
        <div>
          <h4>Existing Custom Fields</h4>
          {fieldsLoading ? (
            <div>Loading...</div>
          ) : customFields.length === 0 ? (
            <div style={{ color: '#999', textAlign: 'center', padding: '16px' }}>No custom fields found</div>
          ) : (
            customFields.map((field) => (
              <div
                key={field.id}
                style={{ marginBottom: '16px', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{field.fieldLabel || field.fieldName}</strong>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Type: {field.fieldType} | Required: {field.required ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <Space>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEditField(field)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteField(field.id!)}
                    >
                      Delete
                    </Button>
                  </Space>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Field Modal */}
      <Modal
        title="Edit Custom Field"
        open={editModalOpen}
        onCancel={closeEditModal}
        footer={[
          <Button key="cancel" onClick={closeEditModal}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleSubmit(handleUpdateField)}
          >
            Update Field
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Field Type" required>
            <Controller
              name="fieldType"
              control={control}
              rules={{ required: 'Field type is required' }}
              render={({ field }) => (
                <Select {...field} placeholder="Select field type">
                  <Select.Option value="TEXT">Text</Select.Option>
                  <Select.Option value="DROPDOWN">Dropdown</Select.Option>
                  <Select.Option value="NUMBER">Number</Select.Option>
                  <Select.Option value="DATE">Date</Select.Option>
                  <Select.Option value="PARAGRAPH">Paragraph</Select.Option>
                </Select>
              )}
            />
          </Form.Item>

          <Form.Item label="Field Name" required>
            <Controller
              name="fieldName"
              control={control}
              rules={{ required: 'Field name is required' }}
              render={({ field }) => <Input {...field} placeholder="Enter field name" disabled />}
            />
          </Form.Item>

          <Form.Item label="Field Label">
            <Controller
              name="fieldLabel"
              control={control}
              render={({ field }) => <Input {...field} placeholder="Enter field label" />}
            />
          </Form.Item>

          <Form.Item label="Required">
            <Controller
              name="required"
              control={control}
              render={({ field }) => <Switch {...field} checked={field.value} />}
            />
          </Form.Item>

          {watch('fieldType') === 'DROPDOWN' && (
            <Form.Item label="Options">
              <Controller
                name="options"
                control={control}
                render={({ field }) => (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {field.value?.map((option, index) => (
                      <Space key={index} style={{ width: '100%' }}>
                        <Input
                          placeholder="Label"
                          value={option.label}
                          onChange={(e) => {
                            const newOptions = [...field.value];
                            newOptions[index].label = e.target.value;
                            field.onChange(newOptions);
                          }}
                        />
                        <Input
                          placeholder="Value"
                          value={option.value}
                          onChange={(e) => {
                            const newOptions = [...field.value];
                            newOptions[index].value = e.target.value;
                            field.onChange(newOptions);
                          }}
                        />
                        <Button
                          type="text"
                          danger
                          onClick={() => removeOption(index)}
                          disabled={field.value.length === 1}
                        >
                          Remove
                        </Button>
                      </Space>
                    ))}
                    <Button type="dashed" onClick={addOption} block>
                      Add Option
                    </Button>
                  </Space>
                )}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Drawer>
  );
};

export default CustomFieldsDrawer;