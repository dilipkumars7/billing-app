// ─── ItemNew.tsx ──────────────────────────────────────────────────────────────
// Changes from original:
//  • Removed inline Upload button from the form.
//  • Added "Upload Image" button that opens <ImageUploadModal>.
//  • On confirm the raw File is converted to a Base64 string and sent as
//    `imageData` (+ `imageContentType`) in the POST body.
//  • The backend stores the bytes in the DB and returns a URL in GET responses.
//  • Google Drive upload logic has been removed (no longer needed).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback, useRef } from 'react'
import { Form, Input, Select, InputNumber, Button, Divider, Modal, DatePicker } from 'antd'
import type { UploadFile } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { useApi } from '../../hooks/useApi'
import { PATH } from '../../constants/app.constant'
import { useNotification } from '../../components/provider/NotificationProvider'
import { useNavigate } from 'react-router-dom'
import { CookieService } from '../../store/Cookie'
import { IoIosArrowDown } from 'react-icons/io'
import FormErrorMessage from '../../components/FormErrorMessage'
import { IoTrashBinSharp } from 'react-icons/io5'
import { MdAddBox } from 'react-icons/md'
import { FiImage, FiUploadCloud } from 'react-icons/fi'
import '../../css/common.css'
import styled from '@emotion/styled'
import CustomFieldsDrawer from '../../components/CustomFieldsDrawer'
import { CustomField, customFieldsApi } from '../../api/customFieldsApi'
import ImageUploadModal from '../../components/ImageUploadModal'   // ← new modal

// ─── Styled Components ────────────────────────────────────────────────────────

const Container = styled.div`
  display: grid;
  grid-template-rows: 40px 1fr 60px;
  height: calc(100vh - 65px);
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
`
const Header = styled.div`
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
  border-bottom: 1px solid #e8e8e8;
  padding: 0 20px;
`
const Content = styled.div`
  background: #fff;
  width: 100%;
  overflow-y: auto;
  padding: 10px 40px;
`
const Footer = styled.div`
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: left;
  border-top: 1px solid #e8e8e8;
  padding: 23px 20px;
  gap: 10px;
`
const FormUxScope = styled.div`
  .ant-input, .ant-input-number-input,
  .ant-input-affix-wrapper input,
  .ant-select-selection-search-input { color: #1f2937; caret-color: #111827; }
  .ant-input, .ant-input-affix-wrapper,
  .ant-input-number, .ant-select-selector { background-color: #fff; }
  .ant-input:focus, .ant-input-focused,
  .ant-input-affix-wrapper:focus-within,
  .ant-input-number:focus-within,
  .ant-select-focused .ant-select-selector {
    border-color: #1677ff !important;
    box-shadow: 0 0 0 2px rgba(22,119,255,0.18) !important;
  }

  /* ── File card shown in the form after modal confirm ── */
  .drive-file-item {
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1.5px solid #ff4d4f;
    border-radius: 8px;
    padding: 8px 12px;
    margin-top: 8px;
    background: #fff;
    max-width: 360px;
  }
  .drive-file-item .thumb {
    width: 36px;
    height: 36px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid #f0f0f0;
    flex-shrink: 0;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .drive-file-item .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 4px;
  }
  .drive-file-item .filename {
    flex: 1;
    font-size: 13px;
    color: #ff4d4f;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .drive-file-item .del-btn {
    cursor: pointer;
    color: #ff4d4f;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 2px;
    border-radius: 4px;
    &:hover { background: #fff1f0; }
  }
`

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a File to a Base64-encoded string (without the data-URL prefix). */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// ─── Base form defaults ───────────────────────────────────────────────────────

const BASE_DEFAULTS = {
  itemCode   : '',
  name       : '',
  category   : '',
  unit       : '',
  quantity   : 0,
  boxQuantity: null,
  costPrice  : 0,
  sellingPrice: 0,
  taxRate    : 0,
  size       : '',
  companyId  : CookieService.get('companyId') || '',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ItemNew() {
  const companyId       = CookieService.get('companyId') || ''
  const notificationApi = useNotification()
  const navigate        = useNavigate()

  // Custom fields
  const [customFields, setCustomFields]                   = useState<CustomField[]>([])
  const [customFieldsLoading, setCustomFieldsLoading]     = useState(false)
  const [customFieldsDrawerOpen, setCustomFieldsDrawerOpen] = useState(false)

  // ── Image upload state ────────────────────────────────────────────────────
  const [imageModalOpen, setImageModalOpen]   = useState(false)
  const [committedFile, setCommittedFile]     = useState<UploadFile | null>(null)
  const pendingRawFileRef                     = useRef<File | null>(null)

  // Dropdowns
  type DropdownItem = { label: string; value: string | number; code?: string }
  const [units, setUnits]           = useState<DropdownItem[]>([])
  const [categories, setCategories] = useState<DropdownItem[]>([])
  const [sizes, setSizes]           = useState<DropdownItem[]>([])
  const [openModal, setOpenModal]   = useState(false)
  const [modalType, setModalType]   = useState<'category' | 'unit' | 'size' | null>(null)

  // ── Main form ──────────────────────────────────────────────────────────────
  const {
    control, handleSubmit,
    formState: { errors },
    reset, watch, getValues,
  } = useForm({ mode: 'onChange', reValidateMode: 'onChange', defaultValues: BASE_DEFAULTS as Record<string, any> })

  const selectedUnit     = watch('unit')
  const selectedCategory = watch('category')

  const TILE_CATEGORIES = ['tile', 'tiles', 'granite']
  const isTileCategory  = (cat: string) =>
    TILE_CATEGORIES.some(t => (cat ?? '').trim().toLowerCase().includes(t))

  // ── Modal form (category / unit / size) ───────────────────────────────────
  const {
    control: controlDyn, handleSubmit: handleSubmitDyn,
    formState: { errors: errorsDyn }, reset: resetDyn,
  } = useForm({ defaultValues: { name: '', subname: '' } })

  // ── APIs ───────────────────────────────────────────────────────────────────
  const { data: DropDownUnit, refetch: reloadUnits }      = useApi<any[]>(`${PATH.GET_DROP_DOWN}/Unit`,     { method: 'GET', showOverlay: true })
  const { data: DropDownCat,  refetch: reloadCategories } = useApi<any[]>(`${PATH.GET_DROP_DOWN}/Category`, { method: 'GET', showOverlay: true })
  const { data: DropDownSize, refetch: reloadSize }       = useApi<any[]>(`${PATH.GET_DROP_DOWN}/Size`,     { method: 'GET', showOverlay: true })
  const { refetch: DropRefetch }    = useApi<any[]>(PATH.POST_DROP_DOWN, { method: 'POST',   autoFetch: false })
  const { refetch: DropDelRefetch } = useApi<any[]>(PATH.POST_DROP_DOWN, { method: 'DELETE', autoFetch: false })
  const { data, loading, error, refetch } = useApi<any>(PATH.GET_ITEMS_DATA, { method: 'POST', autoFetch: false })

  // ── Custom fields ──────────────────────────────────────────────────────────
  const fetchAndApplyCustomFields = useCallback(async () => {
    if (!companyId) return
    setCustomFieldsLoading(true)
    try {
      const fields: CustomField[] = await customFieldsApi.getCustomFields('items', companyId)
      const active = fields.filter(f => f.active)
      setCustomFields(active)
      const current = getValues()
      const newDefaults: Record<string, any> = {}
      active.forEach(f => { const key = `custom_${f.id}`; if (!(key in current)) newDefaults[key] = '' })
      if (Object.keys(newDefaults).length) reset({ ...current, ...newDefaults })
    } catch {
      notificationApi.error({ message: 'Error', description: 'Failed to load custom fields.' })
    } finally {
      setCustomFieldsLoading(false)
    }
  }, [companyId, getValues, reset, notificationApi])

  useEffect(() => { fetchAndApplyCustomFields() }, [])

  const handleFieldsChange = useCallback((_f: CustomField[]) => {
    fetchAndApplyCustomFields()
  }, [fetchAndApplyCustomFields])

  // ── Dropdown mapping ───────────────────────────────────────────────────────
  useEffect(() => {
    if (DropDownUnit) setUnits(DropDownUnit.map(u => ({ label: `${u.dropdownLabel} - ${u.dropdownValue}`, value: u.dropdownValue, code: u.dropdownCode })))
    if (DropDownCat)  setCategories(DropDownCat.map(c => ({ label: `${c.dropdownLabel} - ${c.dropdownValue}`, value: c.dropdownValue, code: c.dropdownCode })))
    if (DropDownSize) setSizes(DropDownSize.map(c => ({ label: `${c.dropdownValue} ${c.dropdownLabel}`, value: `${c.dropdownValue}-${c.dropdownLabel}`, code: c.dropdownCode })))
  }, [DropDownUnit, DropDownCat, DropDownSize])

  // ── After item is saved ────────────────────────────────────────────────────
  useEffect(() => {
    if (!data) return
    notificationApi.success({
      message: `${data.error}`,
      description: `${data?.message}`,
      showProgress: true,
      pauseOnHover: true,
    })
    setTimeout(() => navigate('/item'), 500)
  }, [data])

  useEffect(() => {
    if (error) {
      notificationApi.error({
        message: error.error,
        description: `${error?.message || 'Save failed.'}`,
        showProgress: true,
        pauseOnHover: true,
      })
    }
  }, [error])

  // ── Image modal handlers ───────────────────────────────────────────────────

  /** Called when user clicks Confirm inside the image modal */
  const handleImageConfirm = (file: File | null, preview: UploadFile | null) => {
    pendingRawFileRef.current = file
    setCommittedFile(preview)
  }

  const handleRemoveImage = () => {
    pendingRawFileRef.current = null
    setCommittedFile(null)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (formValues: Record<string, any>) => {
    const userName = CookieService.get('user_name')

    const customFieldsPayload: Record<string, any> = {}
    customFields.forEach(field => {
      const raw = formValues[`custom_${field.id}`]
      if (field.fieldType === 'NUMBER')     customFieldsPayload[field.fieldName] = (raw !== '' && raw != null) ? Number(raw) : null
      else if (field.fieldType === 'DATE')  customFieldsPayload[field.fieldName] = raw ? (raw.toISOString?.() ?? raw) : null
      else                                  customFieldsPayload[field.fieldName] = raw ?? ''
    })

    const basePayload = { ...formValues }
    customFields.forEach(f => delete basePayload[`custom_${f.id}`])

    // Convert image File → Base64 if one was selected
    let imageData: string | null        = null
    let imageContentType: string | null = null

    if (pendingRawFileRef.current) {
      try {
        imageData        = await fileToBase64(pendingRawFileRef.current)
        imageContentType = pendingRawFileRef.current.type
      } catch {
        notificationApi.warning({ message: 'Warning', description: 'Could not read image file. Item will be saved without an image.' })
      }
    }

    refetch({
      body: {
        ...basePayload,
        createdBy       : userName,
        updatedBy       : userName,
        customFields    : customFieldsPayload,
        // Image bytes sent as Base64 — backend decodes and stores as byte[]
        imageData,
        imageContentType,
      },
    })
  }

  // ── Modal helpers (category / unit / size) ────────────────────────────────
  const handleOpenModal = (type: 'category' | 'unit' | 'size') => { setModalType(type); resetDyn(); setOpenModal(true) }
  const closeModal = () => { setOpenModal(false); setModalType(null); resetDyn() }

  const deleteUnit = async (code: string) => {
    try { await DropDelRefetch({ path: `/${code}`, method: 'DELETE' }); reloadUnits(); notificationApi.success({ message: 'Deleted!', description: `"${code}" removed.` }) }
    catch { notificationApi.error({ message: 'Error', description: 'Failed to delete. It might be in use.' }) }
  }
  const deleteCategory = async (code: string) => {
    try { await DropDelRefetch({ path: `/${code}`, method: 'DELETE' }); reloadCategories(); notificationApi.success({ message: 'Deleted!', description: `"${code}" removed.` }) }
    catch { notificationApi.error({ message: 'Error', description: 'Failed to delete category.' }) }
  }
  const deleteSize = async (code: string) => {
    try { await DropDelRefetch({ path: `/${code}`, method: 'DELETE' }); reloadSize(); notificationApi.success({ message: 'Deleted!', description: `"${code}" removed.` }) }
    catch { notificationApi.error({ message: 'Error', description: 'Failed to delete. It might be in use.' }) }
  }

  const onSubmitDyn = async (values: any) => {
    const nameMap: Record<string, string> = { category: 'Category', unit: 'Unit', size: 'Size' }
    try {
      await DropRefetch({ body: { dropdownName: nameMap[modalType!], dropdownLabel: values.name, dropdownValue: values.subname } })
      if (modalType === 'category') reloadCategories()
      if (modalType === 'unit')     reloadUnits()
      if (modalType === 'size')     reloadSize()
      closeModal()
      notificationApi.success({ message: 'Success', description: `${nameMap[modalType!]} added successfully` })
    } catch { notificationApi.error({ message: 'Error', description: 'Failed to save. Try again.' }) }
  }

  const layout      = { labelCol: { span: 6 }, wrapperCol: { span: 8 } }
  const ModelLayout = { labelCol: { span: 6 }, wrapperCol: { span: 16 } }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Container>
        <Header>
          <span>Create Item</span>
          <Button type="primary" onClick={() => setCustomFieldsDrawerOpen(true)}>
            Custom Fields{customFieldsLoading ? ' …' : ''}
          </Button>
        </Header>

        <Content>
          <FormUxScope>
            <Form {...layout} labelAlign="left">

              {/* ── ITEM IMAGE ───────────────────────────────────────────── */}
              <Form.Item
                label="Item Image"
              >
                {/* Button opens the dedicated upload modal */}
                <Button
                  icon={<FiUploadCloud size={16} style={{ marginTop: 2 }} />}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  onClick={() => setImageModalOpen(true)}
                >
                  {committedFile ? 'Change Image' : 'Upload Image'}
                </Button>

                {/* Committed file card — same red-border style as screenshot */}
                {committedFile && (
                  <div
                    className="drive-file-item"
                    role="listitem"
                    aria-label={`Selected: ${committedFile.name}`}
                  >
                    <div className="thumb">
                      {committedFile.thumbUrl
                        ? <img src={committedFile.thumbUrl} alt="" />
                        : <FiImage size={16} color="#9ca3af" />
                      }
                    </div>
                    <span className="filename" title={committedFile.name}>
                      {committedFile.name}
                    </span>
                    <span
                      className="del-btn"
                      role="button"
                      tabIndex={0}
                      aria-label={`Remove ${committedFile.name}`}
                      onClick={handleRemoveImage}
                      onKeyDown={(e) => e.key === 'Enter' && handleRemoveImage()}
                    >
                      <IoTrashBinSharp size={18} />
                    </span>
                  </div>
                )}
              </Form.Item>

              {/* NAME */}
              <Form.Item label="Name" required validateStatus={errors.name ? 'error' : ''} help={<FormErrorMessage message={errors.name?.message} />}>
                <Controller name="name" control={control} rules={{ required: 'Name is required' }} render={({ field }) => <Input size="large" {...field} placeholder="Item name" />} />
              </Form.Item>

              {/* CATEGORY */}
              <Form.Item label="Category" required validateStatus={errors.category ? 'error' : ''} help={<FormErrorMessage message={errors.category?.message} />}>
                <Controller name="category" control={control} rules={{ required: 'Category is required' }} render={({ field }) => SelectFun(field, categories, deleteCategory, handleOpenModal, 'category')} />
              </Form.Item>

              {/* UNIT */}
              <Form.Item label="Unit" required validateStatus={errors.unit ? 'error' : ''} help={<FormErrorMessage message={errors.unit?.message} />}>
                <Controller name="unit" control={control} rules={{ required: 'Unit is required' }} render={({ field }) => SelectFun(field, units, deleteUnit, handleOpenModal, 'unit')} />
              </Form.Item>

              {/* SIZE */}
              <Form.Item
                label="Size"
                required={isTileCategory(selectedCategory)}
                validateStatus={errors.size ? 'error' : ''}
                help={<FormErrorMessage message={errors.size?.message} />}
              >
                <Controller
                  name="size"
                  control={control}
                  rules={{ required: isTileCategory(selectedCategory) ? 'Size is required' : false }}
                  render={({ field }) => SelectFun(field, sizes, deleteSize, handleOpenModal, 'size')}
                />
              </Form.Item>

              {/* PIECES PER BOX */}
              <Form.Item label="Pieces Per Box" required validateStatus={errors.boxQuantity ? 'error' : ''} help={<FormErrorMessage message={errors.boxQuantity?.message} />}>
                <Controller name="boxQuantity" control={control} rules={{ required: 'Pieces Per Box is required' }} render={({ field }) => <InputNumber size="large" inputMode="numeric" placeholder="Pieces per box" {...field} style={{ width: '100%' }} />} />
              </Form.Item>

              {/* QUANTITY */}
              <Form.Item label="Quantity" validateStatus={errors.quantity ? 'error' : ''} help={<FormErrorMessage message={errors.quantity?.message} />}>
                <Controller name="quantity" control={control} render={({ field }) => <InputNumber size="large" inputMode="numeric" {...field} style={{ width: '100%' }} suffix={`${selectedUnit}`} />} />
              </Form.Item>

              {/* COST PRICE */}
              <Form.Item label="Cost Price" validateStatus={errors.costPrice ? 'error' : ''} help={<FormErrorMessage message={errors.costPrice?.message} />}>
                <Controller name="costPrice" control={control} rules={{ min: { value: 0, message: 'Cannot be negative' } }} render={({ field }) => <InputNumber prefix="₹" size="large" {...field} min={0} style={{ width: '100%' }} suffix="INR" />} />
              </Form.Item>

              {/* SELLING PRICE */}
              <Form.Item label="Selling Price" validateStatus={errors.sellingPrice ? 'error' : ''} help={<FormErrorMessage message={errors.sellingPrice?.message} />}>
                <Controller name="sellingPrice" control={control} rules={{ min: { value: 0, message: 'Cannot be negative' } }} render={({ field }) => <InputNumber prefix="₹" size="large" {...field} min={0} style={{ width: '100%' }} suffix="INR" />} />
              </Form.Item>

              {/* TAX RATE */}
              <Form.Item label="Tax Rate (%)" validateStatus={errors.taxRate ? 'error' : ''} help={<FormErrorMessage message={errors.taxRate?.message} />}>
                <Controller name="taxRate" control={control} rules={{ min: { value: 0, message: 'Cannot be negative' }, max: { value: 100, message: 'Cannot exceed 100%' } }} render={({ field }) => <InputNumber size="large" {...field} min={0} max={100} style={{ width: '100%' }} suffix="%" />} />
              </Form.Item>

              {/* ── DYNAMIC CUSTOM FIELDS ────────────────────────────────── */}
              {customFieldsLoading && (
                <Form.Item wrapperCol={{ offset: 6, span: 8 }}>
                  <span style={{ color: '#999', fontSize: 13 }}>Loading custom fields…</span>
                </Form.Item>
              )}

              {customFields.map((field) => (
                <Form.Item
                  key={field.id}
                  label={field.fieldLabel || field.fieldName}
                  required={field.required}
                  validateStatus={(errors as any)[`custom_${field.id}`] ? 'error' : ''}
                  help={<FormErrorMessage message={(errors as any)[`custom_${field.id}`]?.message} />}
                >
                  <Controller
                    name={`custom_${field.id}` as any}
                    control={control}
                    rules={field.required ? { required: `${field.fieldLabel || field.fieldName} is required` } : {}}
                    render={({ field: ff }) => {
                      switch (field.fieldType) {
                        case 'NUMBER':
                          return <InputNumber size="large" value={ff.value} onChange={ff.onChange} style={{ width: '100%' }} placeholder={field.fieldLabel || field.fieldName} />
                        case 'DATE':
                          return <DatePicker size="large" value={ff.value} onChange={ff.onChange} style={{ width: '100%' }} placeholder={field.fieldLabel || field.fieldName} />
                        case 'PARAGRAPH':
                          return <Input.TextArea {...ff} placeholder={field.fieldLabel || field.fieldName} autoSize={{ minRows: 2, maxRows: 5 }} />
                        case 'DROPDOWN':
                          return (
                            <Select size="large" suffixIcon={<IoIosArrowDown size={20} />} value={ff.value} onChange={ff.onChange} placeholder={`Select ${field.fieldLabel || field.fieldName}`} style={{ width: '100%' }}>
                              {field.fieldOptions?.map((opt, idx) => (
                                <Select.Option key={idx} value={opt.value}>{opt.label}</Select.Option>
                              ))}
                            </Select>
                          )
                        default:
                          return <Input size="large" {...ff} placeholder={field.fieldLabel || field.fieldName} />
                      }
                    }}
                  />
                </Form.Item>
              ))}
            </Form>
          </FormUxScope>
        </Content>

        <Footer>
          <Button
            variant="solid" color="primary" className="w-[150px]"
            htmlType="submit"
            loading={loading}
            onClick={handleSubmit(onSubmit)}
          >
            Save
          </Button>
          <Button variant="outlined" color="danger" className="w-[150px]" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </Footer>

        {/* ── Category / Unit / Size modal ─────────────────────────────── */}
        <Modal
          title={modalType === 'category' ? 'Add Category' : modalType === 'size' ? 'Add Size' : 'Add Unit'}
          open={openModal} onOk={handleSubmitDyn(onSubmitDyn)} onCancel={closeModal} okText="Save"
        >
          <Form {...ModelLayout} labelAlign="left">
            <Form.Item label={modalType === 'size' ? 'Size' : 'Name'} required validateStatus={errorsDyn.subname ? 'error' : ''} help={<FormErrorMessage message={errorsDyn.subname?.message} />}>
              <Controller name="subname" control={controlDyn} rules={{ required: 'Name is required' }} render={({ field }) => <Input size="large" {...field} placeholder={modalType === 'size' ? 'Length x Width' : 'Enter name'} />} />
            </Form.Item>
            <Form.Item label={modalType === 'size' ? 'Unit' : 'Sub Name'} required validateStatus={errorsDyn.name ? 'error' : ''} help={<FormErrorMessage message={errorsDyn.name?.message} />}>
              <Controller name="name" control={controlDyn} rules={{ required: 'Sub Name is required' }} render={({ field }) => <Input size="large" {...field} placeholder="Enter" />} />
              {modalType === 'size' && <span style={{ fontSize: 12, color: '#666' }}>e.g. mm, in, cm, m</span>}
            </Form.Item>
          </Form>
        </Modal>
      </Container>

      {/* ── Image Upload Modal ────────────────────────────────────────── */}
      <ImageUploadModal
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        onConfirm={handleImageConfirm}
        existingFile={committedFile}
      />

      {/* ── Custom Fields Drawer ──────────────────────────────────────── */}
      <CustomFieldsDrawer
        open={customFieldsDrawerOpen}
        onClose={() => setCustomFieldsDrawerOpen(false)}
        onFieldsChange={handleFieldsChange}
      />
    </>
  )
}

// ─── SelectFun helper ─────────────────────────────────────────────────────────

function SelectFun(
  field: any,
  Items: { label: string; value: string | number; code?: string }[],
  onDelete: (code: string) => void,
  onAddNew: (type: string) => void,
  type: 'category' | 'unit' | 'size',
) {
  return (
    <Select
      size="large" {...field}
      placeholder="Select value"
      suffixIcon={<IoIosArrowDown size={20} />}
      showSearch allowClear
      optionLabelProp="title"
      popupRender={(menu) => (
        <>
          {menu}
          <Divider style={{ margin: '4px 0' }} />
          <div className="flex gap-2 items-center justify-center">
            <Button size="small" type="primary" icon={<MdAddBox size={18} style={{ marginTop: 4 }} />} onClick={(e) => { e.stopPropagation(); onAddNew(type); }}>
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
            <IoTrashBinSharp size={18} color="red" title="Delete" style={{ cursor: 'pointer', opacity: 0.4 }}
              onClick={(e) => { e.stopPropagation(); onDelete(item.code ?? String(item.value)); }}
            />
          </div>
        ),
      }))}
    />
  )
}