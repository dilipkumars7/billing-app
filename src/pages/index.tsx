import { Routes, Route, Navigate } from "react-router";
import Login from "./login";
import NotFound from "./not-found";
import ProtectedRoute from "../auth/ProtectedRoute";
import Layout from "./layout";
import Dashboard from "./dashboard";


import ItemList from "./item/itemList";
import ItemNew from "./item/new";
import ItemGet from "./item/getId";
import InvoiceList from "./invoices/invoiceList";
import InvoicegetId from "./invoices/getId";
import InvoiceCreate from "./invoices/new";
import CustomerList from "./customers/List";
import CustomerCreate from "./customers/create";
import CustomerID from "./customers/getID";
import Insights from "./insights/Insights";
import PurchaseList from "./purchase/PurchaseList";
import PurchaseCreate from "./purchase/new";
import SupplierList from "./supplier/supplierList";
import SupplierNew from "./supplier/new";
import ItemEdit from "./item/edit";
import PurchaseGet from "./purchase/getId";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* ✅ Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="insights">
            <Route index element={<Insights />} />
          </Route>

          <Route path="item">
            <Route index element={<ItemList />} />
            <Route path="create" element={<ItemNew />} />
            <Route path=":id/edit" element={<ItemEdit />} />
            <Route path=":id" element={<ItemGet />}>
              <Route path="history" element={<ItemGet />} />
              <Route path="transactions" element={<ItemGet />} />
            </Route>
          </Route>

          <Route path="invoice">
            <Route index element={<InvoiceList />} />
            <Route path="create" element={<InvoiceCreate />} />
            <Route path=":id" element={<InvoicegetId />} />
          </Route>

          <Route path="customer">
            <Route index element={<CustomerList />} />
            <Route path="create" element={<CustomerCreate />} />
            <Route path=":id" element={<CustomerID />} />
          </Route>

          <Route path="supplier">
            <Route index element={<SupplierList />} />
            <Route path="create" element={<SupplierNew />} />
            <Route path=":id" element={<div>Supplier Get ID</div>} />
          </Route>

          <Route path="purchase">
            <Route index element={<PurchaseList />} />
            <Route path="create" element={<PurchaseCreate />} />
            <Route path=":id" element={<PurchaseGet />} />
          </Route>

        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
