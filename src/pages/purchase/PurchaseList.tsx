import React, { useEffect, useState, useRef } from "react";
import Table from "../../components/Table";
import { useApi } from "../../hooks/useApi";
import { PATH } from "../../constants/app.constant";
import SkeletonLoader from "../../components/SkeletonLoader";
import Button from '@mui/joy/Button';
import { Button as PButton, Result, Tag, Badge } from "antd";
import Tooltip from '@mui/joy/Tooltip';
import { IoSearchOutline } from "react-icons/io5";
import { IoMdAddCircleOutline } from "react-icons/io";
import { LuSettings2 } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

import { itemUpdateSubject, itemUpdateStream$ } from "../../services/updateStream";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { Modal } from "antd";
import ViewSettingsList from "../../components/ViewSettingsList";
import { CookieService } from "../../store/Cookie";
import { IoClose } from "react-icons/io5";
import { useNotification } from "../../components/provider/NotificationProvider";

export default function PurchaseList() {


  return (
    <div>PurchaseList</div>
  )
}
