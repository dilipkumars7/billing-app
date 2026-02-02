
import { TbChartDots3, TbInvoice, TbLayoutGrid, TbLayoutList, TbUserHexagon, TbTag, TbUserStar  } from "react-icons/tb";

export const SIDEBAR_DATA = [
  { name: "Dashboard", path: "/dashboard", icon: TbLayoutGrid, exact:false },
  { name: "Insights", path: "/insights", icon: TbChartDots3, exact:true },
  { name: "Item", path: "/item", icon: TbLayoutList, exact:true },
  { name: "Customer", path: "/customer", icon: TbUserHexagon, exact:true },
  { name: "Purchase", path: "/purchase", icon: TbTag, exact:true },
  { name: "Supplier", path: "/supplier", icon: TbUserStar, exact:true },
  { name: "Invoice", path: "/invoice", icon: TbInvoice, exact:true },
  
]