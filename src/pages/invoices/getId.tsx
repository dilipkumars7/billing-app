import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Table, Tag, Button, Divider, Spin, Modal, InputNumber, Select, Input } from 'antd'
import { useApi } from '../../hooks/useApi'
import { PATH } from '../../constants/app.constant'
import { useNotification } from '../../components/provider/NotificationProvider'
import { CookieService } from '../../store/Cookie'
import styled from '@emotion/styled'
import dayjs from 'dayjs'

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
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid #e8e8e8;
  font-weight: 600;
  font-size: 16px;
`;

const Content = styled.div`
  background: #f5f5f5;
  width: 100%;
  overflow-y: auto;
  padding: 20px;
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

const Rupee = styled.span`
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

interface CustomField {
  id: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
}

const statusColors: Record<string, string> = {
  'DRAFT': 'default',
  'SENT': 'processing',
  'PAID': 'success',
  'PARTIALLY_PAID': 'warning',
  'OVERDUE': 'error',
  'CANCELLED': 'default'
};

export default function InvoiceGetId() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const notificationApi = useNotification();
  const companyId = CookieService.get('companyId') || '';

  const { data: invoiceData, loading: invoiceLoading, refetch: refetchInvoice } = useApi<any>(
    `${PATH.INVOICES_DATA}/${id}`,
    { method: 'GET' }
  );

  const { data: paymentHistoryData, loading: paymentHistoryLoading, refetch: refetchPaymentHistory } = useApi<any>(
    `${PATH.INVOICES_DATA}/${id}/payments`,
    { method: 'GET' }
  );

  const { data: paymentResult, loading: paymentLoading, refetch: recordPayment } = useApi<any>(
    `${PATH.INVOICES_DATA}/${id}/payment`,
    { method: 'POST', autoFetch: false }
  );

  const { data: statusResult, loading: statusLoading, refetch: updateStatus } = useApi<any>(
    `${PATH.INVOICES_DATA}/${id}/status`,
    { method: 'PUT', autoFetch: false }
  );

  const { data: deleteResult, loading: deleteLoading, refetch: deleteInvoice } = useApi<any>(
    `${PATH.INVOICES_DATA}/${id}`,
    { method: 'DELETE', autoFetch: false }
  );

  const [invoice, setInvoice] = useState<any>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  useEffect(() => {
    if (invoiceData) {
      setInvoice(invoiceData);
    }
  }, [invoiceData]);

  useEffect(() => {
    if (paymentHistoryData) {
      setPaymentHistory(paymentHistoryData);
    }
  }, [paymentHistoryData]);


  useEffect(() => {
    if (paymentResult) {
      notificationApi.success({
        message: 'Payment Recorded',
        description: `Payment of ₹ ${paymentAmount} recorded successfully`
      });
      setPaymentModalOpen(false);
      refetchInvoice();
      refetchPaymentHistory();
    }
  }, [paymentResult]);

  useEffect(() => {
    if (statusResult) {
      notificationApi.success({
        message: 'Status Updated',
        description: 'Invoice status updated successfully'
      });
      refetchInvoice();
    }
  }, [statusResult]);

  useEffect(() => {
    if (deleteResult) {
      notificationApi.success({
        message: 'Invoice Deleted',
        description: 'Invoice deleted successfully'
      });
      navigate('/invoice');
    }
  }, [deleteResult]);

  const handleRecordPayment = async () => {
    if (paymentAmount <= 0) {
      notificationApi.error({
        message: 'Invalid Amount',
        description: 'Please enter a valid payment amount'
      });
      return;
    }

    await recordPayment({
      body: {
        amount: paymentAmount,
        paymentMethod: paymentMethod
      }
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    await updateStatus({
      body: { status: newStatus }
    });
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Invoice',
      content: `Are you sure you want to delete invoice ${invoice?.invoiceNumber}?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        await deleteInvoice();
      }
    });
  };

  const itemColumns = [
    { title: 'Item', dataIndex: 'itemName', key: 'itemName' },
    { title: 'Boxes', dataIndex: 'boxQuantity', key: 'boxQuantity' },
    { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Unit', dataIndex: 'unit', key: 'unit' },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (val: number) => `₹ ${(val || 0).toLocaleString('en-IN',{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    {
      title: 'Tax Rate',
      dataIndex: 'taxRate',
      key: 'taxRate',
      render: (val: number) => `${val || 0}%`
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (val: number) => `₹ ${(val || 0).toLocaleString('en-IN',{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  ];

  if (invoiceLoading) {
    return (
      <Container>
        <Header>
          <span>Invoice Details</span>
        </Header>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" />
        </Content>
        <Footer>
          <Button onClick={() => navigate(-1)}>Back</Button>
        </Footer>
      </Container>
    );
  }

  if (!invoice) {
    return (
      <Container>
        <Header>
          <span>Invoice Details</span>
        </Header>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div>Invoice not found</div>
        </Content>
        <Footer>
          <Button onClick={() => navigate(-1)}>Back</Button>
        </Footer>
      </Container>
    );
  }

  const renderCustomFieldValue = (fieldName: string, fieldType: string) => {
    const value = invoice.customFields?.[fieldName];
    if (value === undefined || value === null) return '-';

    switch (fieldType) {
      case 'BOOLEAN':
        return value ? 'Yes' : 'No';
      case 'DATE':
      case 'DATETIME':
        return dayjs(value).format("MMMM D, YYYY [at] h:mm A");
      case 'MULTISELECT':
        return Array.isArray(value) ? value.join(', ') : value;
      default:
        return String(value);
    }
  };

  return (
    <Container>
      <Header>
        <span>Invoice #{invoice.invoiceNumber}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Tag color={statusColors[invoice.status] || 'default'}>
            {invoice.status}
          </Tag>
          {/* <Select
            size="small"
            value={invoice.status}
            onChange={handleStatusChange}
            loading={statusLoading}
            style={{ width: 140 }}
            options={[
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Sent', value: 'SENT' },
              { label: 'Paid', value: 'PAID' },
              { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
              { label: 'Overdue', value: 'OVERDUE' },
              { label: 'Cancelled', value: 'CANCELLED' }
            ]}
          /> */}
        </div>
      </Header>

      <Content>
        <Card title="Invoice Information" style={{ marginBottom: 16 }}>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Invoice Number">{invoice.invoiceNumber}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColors[invoice.status] || 'default'}>{invoice.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Invoice Date">
              {invoice.invoiceDate ? dayjs(invoice.invoiceDate).format('DD-MM-YYYY') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Due Date">
              {invoice.dueDate ? dayjs(invoice.dueDate).format('DD-MM-YYYY') : '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Customer Information" style={{ marginBottom: 16 }}>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Customer Name">{invoice.customerName || '-'}</Descriptions.Item>
            <Descriptions.Item label="Customer Code">{invoice.customerCode || '-'}</Descriptions.Item>
            <Descriptions.Item label="Email">{invoice.customerEmail || '-'}</Descriptions.Item>
            <Descriptions.Item label="Mobile">{invoice.customerMobile || '-'}</Descriptions.Item>
            <Descriptions.Item label="Address" span={2}>
              {invoice.customerAddress ? (
                <>
                  {invoice.customerAddress.addressLine1 && <div>{invoice.customerAddress.addressLine1}</div>}
                  {invoice.customerAddress.addressLine2 && <div>{invoice.customerAddress.addressLine2}</div>}
                  {invoice.customerAddress.city && <span>{invoice.customerAddress.city}, </span>}
                  {invoice.customerAddress.district && <span>{invoice.customerAddress.district}, </span>}
                  {invoice.customerAddress.state && <span>{invoice.customerAddress.state} </span>}
                  {invoice.customerAddress.pincode && <span>- {invoice.customerAddress.pincode}</span>}
                </>
              ) : '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="Invoice Items" style={{ marginBottom: 16 }}>
          <Table
            dataSource={invoice.items || []}
            columns={itemColumns}
            pagination={false}
            size="small"
            rowKey={(record, index) => `item-${index}`}
          />
        </Card>

        <Card title="Payment Summary" style={{ marginBottom: 16 }}>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Subtotal"><Rupee>₹</Rupee> {(invoice.subtotal || 0).toLocaleString('en-IN',{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Descriptions.Item>
            <Descriptions.Item label="Tax Amount"><Rupee>₹</Rupee> {(invoice.taxAmount || 0).toLocaleString('en-IN',{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Descriptions.Item>
            <Descriptions.Item label="Discount">
              {invoice.discountPercentage ? `${invoice.discountPercentage}% - ` : ''}
              <Rupee>₹</Rupee> {(invoice.discountAmount || 0).toLocaleString('en-IN',{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Descriptions.Item>
            <Descriptions.Item label="Total Amount">
              <strong style={{ color: '#1677ff', fontSize: 16 }}>
                <Rupee>₹</Rupee> {(invoice.totalAmount || 0).toLocaleString('en-IN',{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </Descriptions.Item>
            <Descriptions.Item label="Paid Amount">
              <span style={{ color: 'green' }}><Rupee>₹</Rupee> {(invoice.paidAmount || 0).toLocaleString('en-IN',{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Balance Due">
              <strong style={{ color: invoice.balanceDue > 0 ? 'red' : 'green' }}>
                <Rupee>₹</Rupee> {(invoice.balanceDue || 0).toLocaleString('en-IN',{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </Descriptions.Item>
            {invoice.paymentMethod && (
              <Descriptions.Item label="Payment Method">{invoice.paymentMethod}</Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {invoice.notes && (
          <Card title="Notes" style={{ marginBottom: 16 }}>
            <p>{invoice.notes}</p>
          </Card>
        )}

        {invoice.termsAndConditions && (
          <Card title="Terms & Conditions" style={{ marginBottom: 16 }}>
            <p>{invoice.termsAndConditions}</p>
          </Card>
        )}

        {/* Custom Fields */}
        {customFields.length > 0 && invoice.customFields && Object.keys(invoice.customFields).length > 0 && (
          <Card title="Additional Information" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="small">
              {customFields.map(field => (
                <Descriptions.Item key={field.id} label={field.fieldLabel}>
                  {renderCustomFieldValue(field.fieldName, field.fieldType)}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </Card>
        )}

        <Card title="Audit Information">
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Created By">{invoice.createdBy || '-'}</Descriptions.Item>
            <Descriptions.Item label="Created On">
              {invoice.createdOn ? dayjs(invoice.createdOn).format("MMMM D, YYYY [at] h:mm A") : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Updated By">{invoice.updatedBy || '-'}</Descriptions.Item>
            <Descriptions.Item label="Updated On">
              {invoice.updatedOn ? dayjs(invoice.updatedOn).format("MMMM D, YYYY [at] h:mm A") : '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {paymentHistory.length > 0 && (
          <Card title="Payment History" style={{ marginTop: 16 }}>
            <Table
              dataSource={paymentHistory}
              pagination={false}
              size="small"
              rowKey="id"
              columns={[
                {
                  title: 'Date',
                  dataIndex: 'paymentDate',
                  key: 'paymentDate',
                  render: (date: string) => date ? dayjs(date).format("MMMM D, YYYY [at] h:mm A") : '-'
                },
                {
                  title: 'Amount',
                  dataIndex: 'paymentAmount',
                  key: 'paymentAmount',
                  render: (val: number) => `₹ ${(val || 0).toLocaleString('en-IN',{ minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                },
                {
                  title: 'Method',
                  dataIndex: 'paymentMethod',
                  key: 'paymentMethod'
                }
              ]}
            />
          </Card>
        )}
      </Content>

      <Footer>
        <Button type="primary" onClick={() => setPaymentModalOpen(true)} disabled={invoice.balanceDue <= 0}>
          Record Payment
        </Button>
        {/* <Button onClick={() => navigate(`/invoice/edit/${id}`)}>Edit</Button> */}
        <Button danger onClick={handleDelete} loading={deleteLoading}>
          Delete
        </Button>
        <Button onClick={() => navigate(-1)}>Back</Button>
      </Footer>

      <Modal
        title="Record Payment"
        open={paymentModalOpen}
        onOk={handleRecordPayment}
        onCancel={() => setPaymentModalOpen(false)}
        confirmLoading={paymentLoading}
      >
        <div style={{ marginBottom: 16 }}>
          <label>Payment Amount</label>
          <InputNumber
            value={paymentAmount}
            onChange={(val) => setPaymentAmount(val || 0)}
            style={{ width: '100%', marginTop: 8 }}
            prefix={<Rupee>₹</Rupee>}
            min={0}
            max={invoice.balanceDue}
          />
          <div style={{ color: '#888', marginTop: 4 }}>
            Balance Due: <Rupee>₹</Rupee>{(invoice.balanceDue || 0).toFixed(2)}
          </div>
        </div>
        <div>
          <label>Payment Method</label>
          <Select
            value={paymentMethod}
            onChange={setPaymentMethod}
            style={{ width: '100%', marginTop: 8 }}
            options={[
              { label: 'Cash', value: 'CASH' },
              { label: 'Bank Transfer', value: 'BANK_TRANSFER' },
              { label: 'Credit Card', value: 'CREDIT_CARD' },
              { label: 'Debit Card', value: 'DEBIT_CARD' },
              { label: 'UPI', value: 'UPI' },
              { label: 'Cheque', value: 'CHEQUE' }
            ]}
          />
        </div>
      </Modal>
    </Container>
  );
}