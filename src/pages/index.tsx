import { Routes, Route, Navigate } from "react-router";
import Login from "./login";
import NotFound from "./not-found";
import ProtectedRoute from "../auth/ProtectedRoute";
import Layout from "./layout";
import Dashboard from "./dashboard";


import ItemList from "./item/itemList";
import ItemNew from "./item/new";
import ItemEdit from "./item/edit";
import ItemGet from "./item/get";

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
          
          <Route path="item">
            <Route index element={<ItemList />} />            {/* /item */}
            <Route path="new" element={<ItemNew />} />       {/* /item/new */}
            <Route path="edit/:id" element={<ItemEdit />} /> {/* /item/edit/123 */}
            <Route path=":id" element={<ItemGet />} />        {/* /item/123 */}
          </Route>
          
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
