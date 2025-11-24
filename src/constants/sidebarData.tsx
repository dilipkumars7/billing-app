
import { TbLayoutGrid, TbLayoutList  } from "react-icons/tb";

export const SIDEBAR_DATA = [
  { name: "Dashboard", path: "/dashboard", icon: TbLayoutGrid, exact:false },
  { name: "List", path: "/item", icon: TbLayoutList, exact:true },
]