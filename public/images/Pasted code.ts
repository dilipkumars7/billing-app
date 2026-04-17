// ItemList.tsx - INFINITE SCROLL + CARD / TABLE VIEW TOGGLE + URL-SYNCED FILTERS
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Table from "../../components/Table";
import { useApi } from "../../hooks/useApi";
import { PATH } from "../../constants/app.constant";
import SkeletonLoader from "../../components/SkeletonLoader";
import {
  Button as PButton, Result, Tag, Badge,
  Tooltip as AntTooltip, Drawer, Select,
  Slider, Divider as AntDivider, Modal as AntModal,
} from "antd";
import { IoSearchOutline } from "react-icons/io5";
import { IoMdAddCircleOutline } from "react-icons/io";
import { LuSettings2, LuSlidersHorizontal } from "react-icons/lu";
import { BsGrid, BsListUl } from "react-icons/bs";
import { useNavigate, useSearchParams } from "react-router-dom";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

import { itemUpdateSubject, itemUpdateStream$ } from "../../services/updateStream";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { Modal } from "antd";
import ViewSettingsList from "../../components/ViewSettingsList";
import { CookieService } from "../../store/Cookie";
import { IoClose } from "react-icons/io5";
import { useNotification } from '../../components/provider/NotificationProvider';
import { websocketService } from "../../services/websocketService";

const PAGE_SIZE = 15;

// ─── Keyframes ────────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ─── Card Grid ────────────────────────────────────────────────────────────────

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  padding: 4px 2px 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  @media (max-width: 340px) {
    grid-template-columns: 1fr;
  }
`;

const CardItem = styled('div', {
  shouldForwardProp: (prop) => prop !== 'animDelay',
})<{ animDelay: number }>`
  background: #fff;
  border: 1px solid #e8edf3;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  animation: ${fadeUp} 0.3s ease both;
  animation-delay: ${({ animDelay }) => animDelay}ms;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(22,119,255,0.13);
    border-color: #91caff;
  }
  &:active { transform: translateY(-1px); }
  &:hover .card-img { transform: scale(1.04); }
`;

const CardImageWrap = styled.div`
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-bottom: 1px solid #f0f0f0;
`;

const CardImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.25s ease;
`;

const NoImageBox = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(135deg, #f8f9fb 0%, #eef1f6 100%);
`;

const CardBody = styled.div`
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
`;

const CardName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
`;

const CardCode = styled.div`
  font-size: 11px;
  color: #9ca3af;
  font-family: 'SFMono-Regular', Consolas, monospace;
  letter-spacing: 0.3px;
`;

const CardMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
  flex-wrap: wrap;
  gap: 4px;
`;

const CardPrice = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #1677ff;
`;

const CardCategory = styled.div`
  font-size: 11px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Rupee = styled.span`
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
`;

// ─── View Toggle ──────────────────────────────────────────────────────────────

const ViewToggleWrap = styled.div`
  display: flex;
  border: 1.5px solid #e0e6ef;
  border-radius: 8px;
  overflow: hidden;
`;

const ToggleBtn = styled('button', {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active: boolean }>`
  padding: 5px 10px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
  background: ${({ active }) => (active ? '#1677ff' : '#fff')};
  color:      ${({ active }) => (active ? '#fff'    : '#6b7280')};
  &:hover { background: ${({ active }) => (active ? '#1677ff' : '#f0f5ff')}; }
  & + & { border-left: 1.5px solid #e0e6ef; }
`;

// ─── Filter badge on the filter button ───────────────────────────────────────

const FilterBtnWrap = styled.div`
  position: relative;
  display: inline-flex;
`;

const FilterDot = styled.span`
  position: absolute;
  top: -3px;
  right: -3px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1677ff;
  border: 1.5px solid #fff;
`;

// ─── Filter Drawer styles ─────────────────────────────────────────────────────

const FilterSection = styled.div`
  margin-bottom: 20px;
`;

const FilterLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const SliderWrap = styled.div`
  padding: 0 4px;

  /* Value labels above the slider */
  .price-range-labels {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .price-label {
    font-size: 12px;
    font-weight: 600;
    color: #1677ff;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 5px;
    padding: 2px 8px;
    min-width: 70px;
    text-align: center;
  }

  /* Override Ant Design slider track colour */
  .ant-slider-track {
    background-color: #1677ff !important;
  }
  .ant-slider-handle::after {
    box-shadow: 0 0 0 2px #1677ff !important;
  }
  .ant-slider:hover .ant-slider-track {
    background-color: #4096ff !important;
  }
`;

const ActiveFilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 0 2px;
`;

// ─── Infinite scroll ──────────────────────────────────────────────────────────

const LoadMoreSentinel = styled.div`height: 1px; width: 100%;`;

const LoadMoreText = styled.div`
  text-align: center;
  padding: 14px;
  font-size: 12px;
  color: #9ca3af;
`;

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'table' | 'card';

interface FilterState {
  categories : string[];   // multi-select
  sizes      : string[];   // multi-select
  priceMin   : number | null;
  priceMax   : number | null;
}

const EMPTY_FILTER: FilterState = {
  categories: [],
  sizes     : [],
  priceMin  : null,
  priceMax  : null,
};

// ─── URL ↔ FilterState helpers ────────────────────────────────────────────────

function filtersFromParams(params: URLSearchParams): FilterState {
  return {
    categories: params.getAll('category'),
    sizes      : params.getAll('size'),
    priceMin   : params.get('priceMin')  ? Number(params.get('priceMin'))  : null,
    priceMax   : params.get('priceMax')  ? Number(params.get('priceMax'))  : null,
  };
}

function filtersToParams(f: FilterState, base: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(base);
  // Remove all filter keys first
  next.delete('category');
  next.delete('size');
  next.delete('priceMin');
  next.delete('priceMax');
  f.categories.forEach(c => next.append('category', c));
  f.sizes.forEach(s      => next.append('size', s));
  if (f.priceMin  != null) next.set('priceMin',  String(f.priceMin));
  if (f.priceMax  != null) next.set('priceMax',  String(f.priceMax));
  return next;
}

function hasActiveFilters(f: FilterState): boolean {
  return f.categories.length > 0 || f.sizes.length > 0 || f.priceMin != null || f.priceMax != null;
}

/** Client-side filter applied to the in-memory dataset */
function applyFilters(data: any[], f: FilterState): any[] {
  return data.filter(item => {
    if (f.categories.length && !f.categories.includes(item.category)) return false;
    if (f.sizes.length      && !f.sizes.includes(item.size))          return false;
    const price = Number(item.sellingPrice ?? 0);
    if (f.priceMin != null && price < f.priceMin) return false;
    if (f.priceMax != null && price > f.priceMax) return false;
    return true;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

const ItemList: React.FC = () => {

  const notificationApi          = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate                 = useNavigate();
  const companyId                = CookieService.get('companyId') || '';

  // ── View mode ─────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    (localStorage.getItem('itemListViewMode') as ViewMode) ?? 'table'
  );
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('itemListViewMode', mode);
  };

  // ── Filter drawer state ───────────────────────────────────────────────────
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Filters live in URL; draft lives in drawer until "Apply"
  const activeFilters  = useMemo(() => filtersFromParams(searchParams), [searchParams]);
  const [draftFilters, setDraftFilters] = useState<FilterState>(activeFilters);

  // Sync draft when drawer opens
  useEffect(() => {
    if (filterDrawerOpen) setDraftFilters(activeFilters);
  }, [filterDrawerOpen]);

  // ── Build filter query string from a FilterState ─────────────────────────
  // Includes sortBy/direction from the URL so filter results respect active sort.
  const buildFilterQuery = useCallback((f: FilterState): string => {
    const params = new URLSearchParams();
    params.set('companyId', companyId);
    f.categories.forEach(c => params.append('category', c));
    f.sizes.forEach(s      => params.append('size', s));
    if (f.priceMin != null) params.set('priceMin', String(f.priceMin));
    if (f.priceMax != null) params.set('priceMax', String(f.priceMax));
    // Pass sort params so the backend can honour the active sort
    const sortBy    = searchParams.get('sortBy');
    const direction = searchParams.get('direction');
    if (sortBy && direction) {
      params.set('sortBy',    sortBy);
      params.set('direction', direction);
    }
    return `?${params.toString()}`;
  }, [companyId, searchParams]);

  // Prevents the sort effect from reacting to URL changes caused by filter/clear actions
  const suppressSortRefireRef = useRef(false);

  const handleApplyFilters = () => {
    // 1. Write filters to URL — suppress sort effect from reacting to this change
    suppressSortRefireRef.current = true;
    const next = filtersToParams(draftFilters, searchParams);
    next.delete('page');
    setSearchParams(next, { replace: true });
    setFilterDrawerOpen(false);

    if (!hasActiveFilters(draftFilters)) {
      setIsFilterMode(false);
      suppressSortRefireRef.current = false;
      return;
    }

    // 2. Fire the server-side filter request directly
    setIsFilterMode(true);
    reloadFilterData({ path: buildFilterQuery(draftFilters) });
    suppressSortRefireRef.current = false;
  };

  const handleClearFilters = () => {
    suppressSortRefireRef.current = true;
    setDraftFilters(EMPTY_FILTER);
    const next = filtersToParams(EMPTY_FILTER, searchParams);
    next.delete('page');
    setSearchParams(next, { replace: true });
    setFilterDrawerOpen(false);
    setIsFilterMode(false);
    suppressSortRefireRef.current = false;
  };

  const removeActiveFilter = (type: 'category' | 'size' | 'priceMin' | 'priceMax', value?: string) => {
    const updated: FilterState = { ...activeFilters };
    if (type === 'category' && value) updated.categories = updated.categories.filter(c => c !== value);
    if (type === 'size'     && value) updated.sizes      = updated.sizes.filter(s => s !== value);
    if (type === 'priceMin') updated.priceMin = null;
    if (type === 'priceMax') updated.priceMax = null;

    suppressSortRefireRef.current = true;
    setSearchParams(filtersToParams(updated, searchParams), { replace: true });

    if (!hasActiveFilters(updated)) {
      setIsFilterMode(false);
    } else {
      setIsFilterMode(true);
      reloadFilterData({ path: buildFilterQuery(updated) });
    }
    suppressSortRefireRef.current = false;
  };

  // ── Pagination state ──────────────────────────────────────────────────────
  const [currentPage,    setCurrentPage]    = useState(0);
  const [hasMore,        setHasMore]        = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const allDataRef = useRef<any[]>([]);

  // Sentinel ref used for BOTH card-view IntersectionObserver infinite scroll
  const cardSentinelRef = useRef<HTMLDivElement | null>(null);

  // ── APIs ──────────────────────────────────────────────────────────────────
  const {
    data: itemsPageData,
    loading: itemsPageLoading,
    error: itemsAllError,
    refetch: reloadPageData,
  } = useApi<{ content: any[]; totalElements: number; last: boolean }>(
    `${PATH.GET_ITEMS_DATA}/all/${companyId}`,
    { method: "GET" }
  );

  const { data: itemsSearchData, loading: itemsSearchLoading, error: itemsSearchError, refetch: reloadSearchData } =
    useApi<any[]>(`${PATH.GET_ITEMS_DATA}/search`, { method: "GET", autoFetch: false });

  // Filter API — GET /api/items/filter?companyId=&category=&size=&priceMin=&priceMax=
  const {
    data: itemsFilterData,
    loading: itemsFilterLoading,
    error: itemsFilterError,
    refetch: reloadFilterData,
  } = useApi<any[]>(`${PATH.GET_ITEMS_DATA}/filter`, { method: "GET", autoFetch: false });

  const { data: headersData, loading: headersLoading, error: headersError } =
    useApi<any[]>(PATH.GET_CONFIG_HEADER + '/items', { method: "GET" });

  const { data: Settings, loading: SettingsLoading, error: SettingsError, refetch: SettingsRefetch } =
    useApi<any[]>(`${PATH.USER_SETTINGS}/${CookieService.get('user_id')}`, { method: "PUT", autoFetch: false });

  const { data: DeleteData, error: DeleteError, refetch: DeleteRefetch } =
    useApi<any[]>(`${PATH.GET_ITEMS_DATA}`, { method: "DELETE", autoFetch: false });

  // ── Search state ──────────────────────────────────────────────────────────
  const [searchQuery,  setSearchQuery]  = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  // Initialize isFilterMode from URL so hard refresh restores filter state
  const [isFilterMode, setIsFilterMode] = useState(() => hasActiveFilters(filtersFromParams(new URLSearchParams(window.location.search))));
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Table / UI state ──────────────────────────────────────────────────────
  const [units,      setUnits]      = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [sizes,      setSizes]      = useState<any[]>([]);
  const [wsConnected,      setWsConnected]      = useState(false);
  const [openModal,        setOpenModal]        = useState(false);
  const [tableHeader,      setTableHeader]      = useState<any[]>([]);
  const [tableData,        setTableData]        = useState<any[]>([]);
  const [viewSettings,     setViewSettings]     = useState<any[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRows,     setSelectedRows]     = useState<any[]>([]);
  const [deleteLoad,       setDeleteLoad]       = useState(false);
  const [bulkActionModalOpen, setBulkActionModalOpen] = useState(false);

  const initialDataLoaded          = useRef(false);
  const wsEventBuffer              = useRef<{ type: 'create' | 'update' | 'delete'; payload: any }[]>([]);
  const pendingDeleteConfirmations = useRef<Record<string, number>>({});

  const userSettings = useSelector((state: RootState) => state.userSettings.settings);

  // ── Dropdown data ─────────────────────────────────────────────────────────
  const { data: DropDownUnit } = useApi<any[]>(`${PATH.GET_DROP_DOWN}/Unit`,     { method: "GET", showOverlay: true });
  const { data: DropDownCat  } = useApi<any[]>(`${PATH.GET_DROP_DOWN}/Category`, { method: "GET", showOverlay: true });
  const { data: DropDownSize } = useApi<any[]>(`${PATH.GET_DROP_DOWN}/Size`,     { method: "GET", showOverlay: true });

  useEffect(() => {
    if (DropDownUnit) setUnits(DropDownUnit.map(u => ({ label: `${u.dropdownLabel} - ${u.dropdownValue}`, value: u.dropdownValue, code: u.dropdownCode })));
    if (DropDownCat)  setCategories(DropDownCat.map(c => ({ label: c.dropdownValue, value: c.dropdownValue, code: c.dropdownCode })));
    if (DropDownSize) setSizes(DropDownSize.map(c => ({ label: `${c.dropdownValue} ${c.dropdownLabel}`, value: `${c.dropdownValue}-${c.dropdownLabel}`, code: c.dropdownCode })));
  }, [DropDownUnit, DropDownCat, DropDownSize]);

  // ── Sort via URL params ───────────────────────────────────────────────────
  // Only track sortBy + direction — filter/search params must NOT trigger this.
  // On mount: skip if no sort (initial-page-load handles that).
  // When sort changes while filter is active: re-fire filter with new sort.
  // When sort changes while search is active: re-fire search with new sort.
  const lastSortKeyRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // Skip if this URL change was caused by a filter/clear action, not a sort change
    if (suppressSortRefireRef.current) return;

    const sortBy    = searchParams.get("sortBy");
    const direction = searchParams.get("direction");
    const key = sortBy && direction ? `${sortBy}_${direction}` : null;

    // Skip on first render when there is no sort — initial load handles that
    if (lastSortKeyRef.current === undefined && key === null) {
      lastSortKeyRef.current = null;
      return;
    }
    if (key === lastSortKeyRef.current) return;
    lastSortKeyRef.current = key;

    if (isFilterMode) {
      // Re-fire filter with updated sort
      const filters = filtersFromParams(searchParams);
      reloadFilterData({ path: buildFilterQuery(filters) });
      return;
    }

    if (isSearchMode && searchQuery.trim()) {
      // Re-fire search with updated sort
      reloadSearchData({
        path: `?q=${encodeURIComponent(searchQuery.trim())}&companyId=${encodeURIComponent(companyId)}`,
      });
      return;
    }

    // Normal paginated mode: reset and reload from page 0
    resetPagination();
    const sortQuery = sortBy && direction
      ? `?page=0&size=${PAGE_SIZE}&sortBy=${sortBy}&direction=${direction}`
      : `?page=0&size=${PAGE_SIZE}`;
    reloadPageData({ path: sortQuery });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("sortBy"), searchParams.get("direction")]);

  // ── WebSocket connection ──────────────────────────────────────────────────
  useEffect(() => {
    websocketService.ItemWsconnect('items');
    return () => { websocketService.disconnect(); };
  }, []);

  // ── Pagination helpers ────────────────────────────────────────────────────
  // requestToken: incremented on every reset so stale responses are discarded
  const requestTokenRef = useRef(0);

  const resetPagination = useCallback(() => {
    requestTokenRef.current += 1;   // invalidate any in-flight responses
    allDataRef.current = [];
    setTableData([]);               // clear React state immediately so no stale rows show
    setCurrentPage(0);
    setHasMore(true);
    setIsFetchingMore(false);
    initialDataLoaded.current = false;
  }, []);

  // ── Header-field shape helpers ────────────────────────────────────────────
  const applyHeaderFilter = useCallback((items: any[]) => {
    if (!tableHeader.length) return items;
    const fields = tableHeader.map(h => h.field);
    return items.map(item => {
      const out: any = { itemCode: item.itemCode, imageUrl: item.imageUrl };
      fields.forEach(field => { out[field] = item[field]; });
      return out;
    });
  }, [tableHeader]);

  const filterItemByHeaders = useCallback((item: any) => {
    if (!tableHeader.length) return item;
    const fields = tableHeader.map(h => h.field);
    const out: any = { itemCode: item.itemCode, imageUrl: item.imageUrl };
    fields.forEach(field => { out[field] = item[field]; });
    return out;
  }, [tableHeader]);

  // ── Filtered display data ─────────────────────────────────────────────────
  // When a filter API call is active, show those results.
  // Otherwise show the full paginated dataset.
  const displayData = isFilterMode && itemsFilterData != null
    ? applyHeaderFilter(itemsFilterData)
    : tableData;

  // Max selling price — used as slider ceiling.
  // On hard refresh with filter active, allDataRef is empty so fall back to itemsFilterData.
  const sliderMax = useMemo(() => {
    const source = allDataRef.current.length
      ? allDataRef.current
      : (itemsFilterData ?? []);
    if (!source.length) return 100000;
    const max = Math.max(...source.map((i: any) => Number(i.sellingPrice ?? 0)));
    return 200
  }, [tableData, itemsFilterData]); // re-derive when either dataset changes


  // Slider step: 100 for prices < 10 000, else 500
  const sliderStep = 5;

  // ── WebSocket real-time updates ───────────────────────────────────────────
  useEffect(() => {
    const unsubConnection = websocketService.onConnectionChange(setWsConnected);

    const applyOrBuffer = (type: 'create' | 'update' | 'delete', payload: any) => {
      if (!initialDataLoaded.current) { wsEventBuffer.current.push({ type, payload }); return; }
      if (type === 'create') {
        const fp = filterItemByHeaders(payload);
        setTableData(prev => prev.some(i => i.itemCode === payload.itemCode) ? prev : [...prev, fp]);
        allDataRef.current = [...allDataRef.current, fp];
      } else if (type === 'update') {
        const fp = filterItemByHeaders(payload);
        setTableData(prev => {
          if (!prev.some(i => i.itemCode === payload.itemCode)) return prev;
          return prev.map(i => i.itemCode === payload.itemCode ? { ...i, ...fp } : i);
        });
        allDataRef.current = allDataRef.current.map(i => i.itemCode === payload.itemCode ? { ...i, ...fp } : i);
      } else if (type === 'delete') {
        if (pendingDeleteConfirmations.current[payload]) {
          clearTimeout(pendingDeleteConfirmations.current[payload]);
          delete pendingDeleteConfirmations.current[payload];
        }
        setTableData(prev => prev.filter(i => i.itemCode !== payload));
        allDataRef.current = allDataRef.current.filter(i => i.itemCode !== payload);
      }
    };

    const unsubCreated = websocketService.onItemCreated(item => applyOrBuffer('create', item));
    const unsubUpdated = websocketService.onItemUpdated(item => applyOrBuffer('update', item));
    const unsubDeleted = websocketService.onItemDeleted(code => applyOrBuffer('delete', code));

    return () => { unsubConnection(); unsubCreated(); unsubUpdated(); unsubDeleted(); };
  }, [tableHeader, filterItemByHeaders]);

  // ── RxJS local edit stream ────────────────────────────────────────────────
  useEffect(() => {
    const sub = itemUpdateStream$.subscribe({ next: r => r, error: e => e });
    return () => sub.unsubscribe();
  }, []);

  // ── Transform headers ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!headersData || headersData.length === 0) return;
    const getDefaultWidth = (key: string) => Math.min(Math.max(120 + key.length * 7, 120), 400);
    let storedSettings: any = {};
    try { storedSettings = JSON.parse(localStorage.getItem("settingsConfig") || "{}"); }
    catch { localStorage.setItem("settingsConfig", "{}"); }

    const columnConfig    = storedSettings?.tableRowOrder?.itemTable ?? [];
    const columnConfigMap = new Map(columnConfig.map((col: any) => [col.name, col]));
    const optionsMap: Record<string, any[]> = { Unit: units, Category: categories, Size: sizes };

    const formattedHeaders = headersData
      .map((header: any) => {
        const stored = columnConfigMap.get(header.field) as any;
        return {
          headerName:   header.headerName,
          field:        header.field,
          defaultWidth: stored?.width || getDefaultWidth(header.headerName),
          type:         header.type,
          isEditable:   header.isEditable,
          isVisible:    stored?.isVisible !== undefined ? stored.isVisible : true,
          options:      optionsMap[header.headerName] ?? header.options ?? [],
        };
      })
      .filter((h: any) => h.isVisible)
      .sort((a: any, b: any) => {
        const iA = columnConfig.findIndex((c: any) => c.name === a.field);
        const iB = columnConfig.findIndex((c: any) => c.name === b.field);
        return (iA === -1 ? Infinity : iA) - (iB === -1 ? Infinity : iB);
      });
    setTableHeader(formattedHeaders);
  }, [headersData, userSettings, units, categories, openModal]);

  // ── Initial page load ─────────────────────────────────────────────────────
  // Runs once when tableHeader is ready.
  // If the URL already has filter params (e.g. hard refresh with ?category=X),
  // fire the filter API instead of the paginated endpoint.
  useEffect(() => {
    if (!tableHeader.length) return;
    if (allDataRef.current.length === 0 && !initialDataLoaded.current) {
      const urlFilters = filtersFromParams(searchParams);

      if (hasActiveFilters(urlFilters)) {
        // URL has filter params — restore filter mode and fire the filter API
        setIsFilterMode(true);
        reloadFilterData({ path: buildFilterQuery(urlFilters) });
        // Mark as loaded so WS buffer can flush when filter results arrive
        initialDataLoaded.current = true;
      } else {
        // No filters — normal paginated load
        const sortBy    = searchParams.get("sortBy");
        const direction = searchParams.get("direction");
        const sortQuery = sortBy && direction
          ? `?page=0&size=${PAGE_SIZE}&sortBy=${sortBy}&direction=${direction}`
          : `?page=0&size=${PAGE_SIZE}`;
        reloadPageData({ path: sortQuery });
      }
    }
  }, [tableHeader]);

  // ── Handle paginated API response ─────────────────────────────────────────
  useEffect(() => {
    // Guard: ignore responses that arrived while search or filter mode is active
    if (!itemsPageData || isSearchMode || isFilterMode) return;

    const incoming   = itemsPageData.content ?? (Array.isArray(itemsPageData) ? itemsPageData : []);
    const isLastPage = itemsPageData.last ?? (incoming.length < PAGE_SIZE);
    const filtered   = applyHeaderFilter(incoming);

    // page 0 means a fresh load (reset / sort change / hard refresh) — REPLACE, never append
    const isPageZero = (itemsPageData as any)?.number === 0
      || currentPage === 0
      || allDataRef.current.length === 0;

    if (isPageZero) {
      // Replace: start from scratch with just this page's data
      allDataRef.current = filtered;
    } else {
      // Subsequent pages: append, but deduplicate by itemCode
      const existingCodes = new Set(allDataRef.current.map((i: any) => i.itemCode));
      const newItems = filtered.filter((i: any) => !existingCodes.has(i.itemCode));
      allDataRef.current = [...allDataRef.current, ...newItems];
    }

    setTableData([...allDataRef.current]);
    setHasMore(!isLastPage);
    setIsFetchingMore(false);

    if (!initialDataLoaded.current) {
      initialDataLoaded.current = true;
      if (wsEventBuffer.current.length > 0) {
        wsEventBuffer.current.forEach(({ type, payload }) => {
          const fp = filterItemByHeaders(payload);
          if      (type === 'create') { if (!allDataRef.current.some((i: any) => i.itemCode === payload.itemCode)) allDataRef.current = [...allDataRef.current, fp]; }
          else if (type === 'update') { allDataRef.current = allDataRef.current.map((i: any) => i.itemCode === payload.itemCode ? { ...i, ...fp } : i); }
          else if (type === 'delete') { allDataRef.current = allDataRef.current.filter((i: any) => i.itemCode !== payload); }
        });
        wsEventBuffer.current = [];
        setTableData([...allDataRef.current]);
      }
    }
  }, [itemsPageData, isSearchMode, isFilterMode]);

  // ── Search results ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSearchMode) return;
    if (itemsSearchError) {
      notificationApi.error({ message: 'Search failed', description: (itemsSearchError as any)?.message || 'Could not fetch search results.' });
      setIsSearchMode(false);
      setTableData([...allDataRef.current]);
      return;
    }
    if (itemsSearchData !== undefined && itemsSearchData !== null) {
      setTableData(applyHeaderFilter(itemsSearchData));
    }
  }, [itemsSearchData, itemsSearchError, isSearchMode]);

  // ── Filter results ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isFilterMode) return;
    if (itemsFilterError) {
      notificationApi.error({
        message    : 'Filter failed',
        description: (itemsFilterError as any)?.message || 'Could not apply filters. Please try again.',
      });
      setIsFilterMode(false);
    }
    // itemsFilterData is used directly via `displayData` — no extra state needed
  }, [itemsFilterData, itemsFilterError, isFilterMode]);

  // ── loadNextPage ──────────────────────────────────────────────────────────
  const loadNextPage = useCallback(() => {
    if (!hasMore || isFetchingMore || isSearchMode || isFilterMode || itemsPageLoading) return;
    setIsFetchingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    const sortBy    = searchParams.get("sortBy");
    const direction = searchParams.get("direction");
    const sortQuery = sortBy && direction
      ? `?page=${nextPage}&size=${PAGE_SIZE}&sortBy=${sortBy}&direction=${direction}`
      : `?page=${nextPage}&size=${PAGE_SIZE}`;
    reloadPageData({ path: sortQuery });
  }, [hasMore, isFetchingMore, isSearchMode, isFilterMode, itemsPageLoading, currentPage, searchParams, reloadPageData]);

  // ── IntersectionObserver for card-view infinite scroll ────────────────────
  // Re-attaches whenever loadNextPage identity changes (memoized on its deps)
  // so the observer never holds a stale closure over hasMore / isFetchingMore.
  // rootMargin: '200px' fires the fetch 200 px before the sentinel enters the
  // viewport, eliminating the visible loading pause at the bottom of the grid.
  useEffect(() => {
    if (viewMode !== 'card') return;
    const sentinel = cardSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadNextPage(); },
      { rootMargin: '200px', threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [viewMode, loadNextPage]);

  // ── Settings / delete side-effects ────────────────────────────────────────
  useEffect(() => {
    if (Settings)      setOpenModal(false);
    if (SettingsError) console.error("Error fetching User Settings:", SettingsError);
    if (DeleteData && !deleteLoad) notificationApi.success({ message: DeleteData.error, description: DeleteData.message });
    if (DeleteError && !deleteLoad) notificationApi.error({ message: "Error deleting items", description: JSON.stringify(DeleteError) });
  }, [Settings, SettingsError, DeleteData, DeleteError, deleteLoad, notificationApi]);

  // ── Search handler ────────────────────────────────────────────────────────
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!value.trim()) {
      setIsSearchMode(false);
      // Restore from the in-memory ref — this is always the ground truth
      setTableData([...allDataRef.current]);
      return;
    }
    debounceTimer.current = setTimeout(() => {
      setIsSearchMode(true);
      reloadSearchData({ path: `?q=${encodeURIComponent(value.trim())}&companyId=${encodeURIComponent(companyId)}` });
    }, 350);
  }, [companyId, reloadSearchData]);

  const clearSearch = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setSearchQuery('');
    setIsSearchMode(false);
    // Restore the full dataset from in-memory ref — no re-fetch needed
    setTableData([...allDataRef.current]);
  }, []);

  useEffect(() => () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); }, []);

  // ── Misc handlers ─────────────────────────────────────────────────────────
  const OnEditChange = (updateData: any) => {
    itemUpdateSubject.next(updateData);
    if (updateData?.itemCode) {
      setTableData(prev => prev.map(r => r.itemCode === updateData.itemCode ? { ...r, ...updateData } : r));
      allDataRef.current = allDataRef.current.map(r => r.itemCode === updateData.itemCode ? { ...r, ...updateData } : r);
    }
  };

  const handleNew = () => navigate("/item/create");

  if (itemsAllError || headersError)
    return <div style={{ color: "red", whiteSpace: "pre-wrap" }}>{JSON.stringify(itemsAllError || headersError, null, 2)}</div>;

  // ── View settings modal ───────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!openModal || !headersData) return;
    const stored     = JSON.parse(localStorage.getItem("settingsConfig") || "{}");
    const savedOrder = stored?.tableRowOrder?.itemTable || [];
    const map        = new Map(savedOrder.map((c: any) => [c.name, c]));
    const merged     = headersData.map((h: any) => {
      const saved = map.get(h.field) as any;
      return { name: h.field, headerName: h.headerName, isVisible: saved?.isVisible ?? true, width: saved?.width ?? 150 };
    });
    const ordered = savedOrder.length
      ? savedOrder.map((s: any) => merged.find((m: any) => m.name === s.name)).filter(Boolean)
          .concat(merged.filter((m: any) => !map.has(m.name)))
      : merged;
    setViewSettings(ordered);
  }, [openModal, headersData]);

  const closeModal = () => setOpenModal(false);

  const OnSaveView = () => {
    const stored = JSON.parse(localStorage.getItem("settingsConfig") || "{}");
    stored.tableRowOrder = stored.tableRowOrder || {};
    stored.tableRowOrder.itemTable = viewSettings.map(v => ({ name: v.name, isVisible: v.isVisible, width: v.width }));
    localStorage.setItem("settingsConfig", JSON.stringify(stored));
    SettingsRefetch({ body: { settingsConfig: stored, pageAccess: [] } });
  };

  const closeDeleteDialog = () => { setDeleteDialogOpen(false); setSelectedRows([]); };

  const DeleteItem = async () => {
    if (selectedRows.length === 0) return;
    const codes = selectedRows.map(r => r.itemCode);
    setDeleteLoad(true);
    try {
      const deletePromises = codes.map(code => {
        pendingDeleteConfirmations.current[code] = window.setTimeout(() => {}, 5000);
        return DeleteRefetch({ path: `/${code}` });
      });
      await Promise.all(deletePromises);
      await new Promise(resolve => setTimeout(resolve, 1200));
      const pendingLeft = Object.keys(pendingDeleteConfirmations.current);
      if (pendingLeft.length > 0) {
        pendingLeft.forEach(code => { clearTimeout(pendingDeleteConfirmations.current[code]); delete pendingDeleteConfirmations.current[code]; });
        resetPagination();
        reloadPageData({ path: `?page=0&size=${PAGE_SIZE}` });
      }
      closeDeleteDialog();
    } catch (err) {
      notificationApi.error({ message: 'Error deleting items', description: JSON.stringify(err) });
    } finally {
      setDeleteLoad(false);
    }
  };

  const handleBulkActionClick = () => {
    setBulkActionModalOpen(true);
  };

  const handleBulkActionSelect = (type: 'purchase' | 'invoice') => {
    setBulkActionModalOpen(false);
    console.log("Item Selected", selectedRows);
    const selectedItems = selectedRows.map((item) => {
      console.log("Selected item:", item);
      return {
        itemCode: item.itemCode || item.itemId,
        itemName: item.name || item.itemName || '',
        name: item.name || item.itemName || '',
        category: item.category || '',
        unit: item.unit || '',
        size: item.size || '',
        quantity: item.quantity || 0,
        sellingPrice: item.sellingPrice || 0,
        costPrice: item.costPrice || 0,
        taxRate: item.taxRate || 0,
        boxQuantity: item.boxQuantity || 0,
        itemBoxQuantity: item.boxQuantity || 0,
        amount: 0,
        squareFeet: 0,
      };
    });

    if (type === 'purchase') {
      navigate('/purchase/create', { state: { preSelectedItems: selectedItems } });
    } else {
      navigate('/invoice/create', { state: { preSelectedItems: selectedItems } });
    }

    closeDeleteDialog();
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const isInitialLoading = itemsPageLoading && !initialDataLoaded.current && headersLoading;
  const searchLoading    = isSearchMode && itemsSearchLoading;
  const filterLoading    = isFilterMode && itemsFilterLoading;
  const filterActive     = hasActiveFilters(activeFilters);

  // True whenever any data-fetching operation is in flight (sort, filter, search, page load).
  // Used as the DataLoading prop so the table always shows a skeleton/spinner inside
  // itself rather than being unmounted and remounted.
  const isDataLoading =
    (itemsPageLoading)          ||   // paginated load / sort reload
    (isSearchMode && itemsSearchLoading) ||   // search in flight
    (isFilterMode && itemsFilterLoading);     // filter in flight

  // Only show the empty-state Result when:
  //  • headers are ready (table can be shown)
  //  • nothing is loading (avoid flash before results arrive)
  //  • displayData really is empty (genuine no-results)
  const showEmptyState =
    !isInitialLoading &&
    !isDataLoading &&
    tableHeader.length > 0 &&
    displayData.length === 0;

  // ── Card view renderer ────────────────────────────────────────────────────
  // NOTE: The LoadMoreSentinel is rendered OUTSIDE this function (always mounted
  // in the DOM when viewMode === 'card') so the IntersectionObserver always has
  // a DOM node to attach to, even during loading states when displayData is empty.
  const renderCardView = () => (
    <>
      <CardGrid>
        {displayData.map((item, index) => (
          <CardItem
            key={item.itemCode}
            animDelay={Math.min(index * 30, 300)}
            onClick={() => navigate(`/item/${item.itemCode}`)}
            title={item.name}
          >
            <CardImageWrap>
              {item.imageUrl ? (
                <CardImg
                  className="card-img"
                  src={item.imageUrl}
                  alt={item.name}
                  loading="lazy"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <NoImageBox>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c8d0dc" strokeWidth="1.4">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span style={{ fontSize: 10, color: '#b0b8c4', letterSpacing: '0.5px' }}>NO IMAGE</span>
                </NoImageBox>
              )}
            </CardImageWrap>
            <CardBody>
              <CardName>{item.name}</CardName>
              <CardCode>{item.itemCode}</CardCode>
              {item.category && <CardCategory>{item.category}</CardCategory>}
              <CardMeta>
                <CardPrice>
                  {item.sellingPrice != null ? <><Rupee>₹</Rupee>{Number(item.sellingPrice).toLocaleString('en-IN')}</> : 'N/A'}
                  {item.unit ? <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af' }}> / {item.unit}</span> : null}
                </CardPrice>
              </CardMeta>
              {item.size && (
                <CardMeta>
                  <Tag color="geekblue" variant="filled" style={{ marginBottom: 0 }}>{item.size}</Tag>
                </CardMeta>
              )}
            </CardBody>
          </CardItem>
        ))}
      </CardGrid>

      {/* End-of-list message — only shown when all pages are loaded */}
      {!hasMore && displayData.length > 0 && !isSearchMode && (
        <LoadMoreText>
          {filterActive
            ? `${displayData.length} of ${tableData.length} items (filtered)`
            : `All items loaded · ${tableData.length} total`}
        </LoadMoreText>
      )}
    </>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-[12px]">
      {tableHeader.length !== 0 && (
        <>
          {/* ── Toolbar ── */}
          <div className="flex items-center justify-between px-1 py-2">

            {/* Search */}
            <div className="flex items-center w-[15rem] pr-3 gap-2 bg-white border-gray-500/30 border-2 hover:border-[#357DE8] focus-within:border-[#357DE8] h-[39px] rounded-[5px] overflow-hidden">
              <input
                className="w-full h-full pl-5 outline-none placeholder-gray-500 text-sm"
                placeholder="Search for Items"
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchLoading
                ? <span className="pr-1 text-gray-400 text-xs animate-pulse">…</span>
                : searchQuery
                  ? <IoClose size={20} color="#6a7282" className="cursor-pointer flex-shrink-0 mr-1" onClick={clearSearch} />
                  : <IoSearchOutline size={25} color="#6a7282" className="flex-shrink-0" />
              }
            </div>

            <div className="flex gap-2 items-center">
              {/* <Badge status={wsConnected ? "processing" : "default"} text={wsConnected ? "Live" : "Offline"} /> */}

              {/* ── Filter button ── */}
              <AntTooltip title="Filters">
                <FilterBtnWrap>
                  <PButton
                    variant={filterActive ? 'solid' : 'outlined'}
                    color={filterActive ? 'primary' : 'default'}
                    icon={<LuSlidersHorizontal size={15} />}
                    loading={filterLoading}
                    onClick={() => setFilterDrawerOpen(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    Filter
                  </PButton>
                  {filterActive && !filterLoading && <FilterDot />}
                </FilterBtnWrap>
              </AntTooltip>

              <AntTooltip title="Add Products">
                <PButton variant="solid" color="primary" onClick={handleNew}><IoMdAddCircleOutline size={25} /></PButton>
              </AntTooltip>

              {viewMode === 'table' && (
                <AntTooltip title="View Settings">
                  <PButton variant="outlined" onClick={() => setOpenModal(true)}><LuSettings2 size={20} /></PButton>
                </AntTooltip>
              )}

              {/* View toggle */}
              <AntTooltip title="Switch view">
                <ViewToggleWrap>
                  <ToggleBtn active={viewMode === 'table'} onClick={() => handleViewModeChange('table')} aria-label="Table view">
                    <BsListUl size={16} />
                  </ToggleBtn>
                  <ToggleBtn active={viewMode === 'card'} onClick={() => handleViewModeChange('card')} aria-label="Card view">
                    <BsGrid size={15} />
                  </ToggleBtn>
                </ViewToggleWrap>
              </AntTooltip>
            </div>
          </div>

          {/* ── Active filter chips ── */}
          {filterActive && (
            <ActiveFilterBar>
              {activeFilters.categories.map(c => (
                <Tag
                  key={c}
                  color="blue"
                  closable
                  onClose={() => removeActiveFilter('category', c)}
                >
                  Category: {c}
                </Tag>
              ))}
              {activeFilters.sizes.map(s => (
                <Tag
                  key={s}
                  color="geekblue"
                  closable
                  onClose={() => removeActiveFilter('size', s)}
                >
                  Size: {s}
                </Tag>
              ))}
              {(activeFilters.priceMin != null || activeFilters.priceMax != null) && (
                <Tag
                  color="cyan"
                  closable
                  onClose={() => {
                    removeActiveFilter('priceMin');
                    removeActiveFilter('priceMax');
                  }}
                >
                  ₹{(activeFilters.priceMin ?? 0).toLocaleString('en-IN')}
                  {' — '}
                  ₹{(activeFilters.priceMax ?? sliderMax).toLocaleString('en-IN')}
                </Tag>
              )}
              <Tag
                style={{ cursor: 'pointer', borderStyle: 'dashed' }}
                onClick={handleClearFilters}
              >
                Clear all
              </Tag>
            </ActiveFilterBar>
          )}
        </>
      )}

      {isInitialLoading && <SkeletonLoader />}

      {/* ── Card view ──────────────────────────────────────────────────────────
          The sentinel (`cardSentinelRef`) is ALWAYS mounted here (whenever
          viewMode === 'card' and the initial skeleton is done) so the
          IntersectionObserver always has a DOM node to attach to regardless of
          whether displayData is populated yet.

          Layout inside the wrapper:
            1. Card grid   — rendered only when displayData is non-empty
            2. Loading spinner — shown while a fetch is in flight and data is empty
            3. Sentinel    — always present; 200 px rootMargin triggers loadNextPage early
            4. "Loading more…" text — shown while isFetchingMore is true
      ──────────────────────────────────────────────────────────────────────── */}
      {viewMode === 'card' && !isInitialLoading && (
        <>
          {/* Cards — only when there is data to show */}
          {displayData.length > 0 && renderCardView()}

          {/* Spinner — while a filter/search/sort/page reload is in flight and the grid is empty */}
          {isDataLoading && displayData.length === 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <span style={{ color: '#9ca3af', fontSize: 13 }}>Loading…</span>
            </div>
          )}

          {/* Sentinel — always in DOM so the observer never loses its target.
              Placed after the grid so it sits just below the last card row.
              rootMargin: '200px' in the observer fires loadNextPage 200 px early. */}
          <LoadMoreSentinel ref={cardSentinelRef} />

          {/* "Loading more…" indicator — visible while the next page is fetching */}
          {isFetchingMore && <LoadMoreText>Loading more…</LoadMoreText>}
        </>
      )}

      {/* Table view — always render once headers are ready so the table is never
          unmounted during sort / filter / search. DataLoading drives the internal
          skeleton; the table stays mounted and shows its own loading indicator. */}
      {viewMode === 'table' && !isInitialLoading && (isDataLoading || displayData.length > 0) && (
        <Table
          TableName="itemTable"
          Idlinkpath="item"
          idkey="itemId"
          TableHeader={tableHeader}
          TableData={displayData}
          HeaderLoading={headersLoading}
          DataLoading={isDataLoading}
          checkbox={true}
          selectedRows={selectedRows}
          onSelectionChange={rows => { setSelectedRows(rows); setDeleteDialogOpen(rows.length > 0); }}
          onRowChange={(_rowIndex, updatedRow) => OnEditChange(updatedRow)}
          onSortClear={() => { resetPagination(); reloadPageData({ path: `?page=0&size=${PAGE_SIZE}` }); }}
          hasMore={hasMore && !isSearchMode && !isFilterMode}
          isFetchingMore={isFetchingMore}
          onLoadMore={loadNextPage}
        />
      )}

      {/* Empty state — only shown when loading is fully done and data is genuinely empty */}
      {showEmptyState && (
        <Result
          status="404"
          title={
            searchQuery.trim()
              ? `No results for "${searchQuery}"`
              : filterActive
                ? 'No items match the current filters'
                : 'NO PRODUCTS FOUND'
          }
          subTitle=""
          extra={
            searchQuery.trim()
              ? <PButton type="default" onClick={clearSearch}>Clear Search</PButton>
              : filterActive
                ? <PButton type="default" onClick={handleClearFilters}>Clear Filters</PButton>
                : <PButton type="primary" onClick={handleNew}>Create</PButton>
          }
        />
      )}

      {/* ── Filter Drawer ── */}
      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>Filter Items</span>
            <PButton size="small" type="link" danger onClick={handleClearFilters}>
              Reset all
            </PButton>
          </div>
        }
        placement="right"
        width={320}
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <PButton onClick={() => setFilterDrawerOpen(false)}>Cancel</PButton>
            <PButton type="primary" loading={filterLoading} onClick={handleApplyFilters}>
              Apply Filters
            </PButton>
          </div>
        }
      >
        {/* Category */}
        <FilterSection>
          <FilterLabel>Category</FilterLabel>
          <Select
            mode="multiple"
            allowClear
            placeholder="Select categories…"
            style={{ width: '100%' }}
            value={draftFilters.categories}
            onChange={vals => setDraftFilters(f => ({ ...f, categories: vals }))}
            options={categories.map(c => ({ label: c.label, value: c.value }))}
            maxTagCount="responsive"
          />
        </FilterSection>

        <AntDivider style={{ margin: '4px 0 16px' }} />

        {/* Size */}
        <FilterSection>
          <FilterLabel>Size</FilterLabel>
          <Select
            mode="multiple"
            allowClear
            placeholder="Select sizes…"
            style={{ width: '100%' }}
            value={draftFilters.sizes}
            onChange={vals => setDraftFilters(f => ({ ...f, sizes: vals }))}
            options={sizes.map(s => ({ label: s.label, value: s.value }))}
            maxTagCount="responsive"
          />
        </FilterSection>

        <AntDivider style={{ margin: '4px 0 16px' }} />

        {/* Price Range */}
        <FilterSection>
          <FilterLabel>Price Range (₹)</FilterLabel>
          <SliderWrap>
            {/* Value labels */}
            <div className="price-range-labels">
              <span className="price-label">
                ₹{(draftFilters.priceMin ?? 0).toLocaleString('en-IN')}
              </span>
              <span className="price-label">
                ₹{(draftFilters.priceMax ?? sliderMax).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Double-handle range slider */}
            <Slider
              range
              min={0}
              max={sliderMax}
              step={sliderStep}
              value={[
                draftFilters.priceMin  ?? 0,
                draftFilters.priceMax  ?? sliderMax,
              ]}
              onChange={(vals: number[]) =>
                setDraftFilters(f => ({
                  ...f,
                  priceMin: vals[0] === 0         ? null : vals[0],
                  priceMax: vals[1] === sliderMax ? null : vals[1],
                }))
              }
              tooltip={{
                formatter: (val?: number) =>
                  val != null ? `₹${val.toLocaleString('en-IN')}` : '',
              }}
            />

            {/* Min / Max legend */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 2,
              fontSize: 11,
              color: '#9ca3af',
            }}>
              <span>₹0</span>
              <span>₹{sliderMax.toLocaleString('en-IN')}</span>
            </div>
          </SliderWrap>
        </FilterSection>
      </Drawer>

      {/* View settings modal */}
      <Modal
        title="View Settings"
        open={openModal}
        onOk={OnSaveView}
        onCancel={closeModal}
        style={{ top: 20 }}
        okText="Save"
        maskClosable={!SettingsLoading}
        closable={!SettingsLoading}
        confirmLoading={SettingsLoading}
      >
        <ViewSettingsList columns={viewSettings} onChange={setViewSettings} />
      </Modal>

      {/* Delete confirmation bar */}
      <Modal
        open={deleteDialogOpen}
        title={null}
        wrapClassName="delete-nonblocking-modal"
        okText="Delete"
        style={{ top: 550 }}
        okButtonProps={{ danger: true }}
        closable={false}
        mask={false}
        maskClosable={false}
        keyboard={false}
        footer={null}
      >
        <div className="flex items-center justify-between w-full">
          <span style={{ marginRight: "auto" }}>
            Selected&nbsp;<Tag color="geekblue">{selectedRows.length}</Tag>
          </span>
          <div className="flex items-center gap-2">
            <PButton variant="solid" color="primary" onClick={handleBulkActionClick}>Bulk Action</PButton>
            <PButton variant="solid" color="danger" onClick={DeleteItem} loading={deleteLoad}>Delete</PButton>
            <PButton variant="outlined" color="default" onClick={closeDeleteDialog}><IoClose /></PButton>
          </div>
        </div>
      </Modal>

      {/* Bulk Action Type Selection Modal */}
      <AntModal
        title="Select Action Type"
        open={bulkActionModalOpen}
        onCancel={() => setBulkActionModalOpen(false)}
        footer={null}
        centered
        width={400}
      >
        <div style={{ padding: '10px 0' }}>
          <p style={{ marginBottom: 20, color: '#666' }}>
            Choose where to add the selected <Tag color="geekblue">{selectedRows.length}</Tag> items:
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <PButton
              variant="solid"
              color="primary"
              size="large"
              style={{ flex: 1, height: 60, fontSize: 15 }}
              onClick={() => handleBulkActionSelect('purchase')}
            >
              Purchase
            </PButton>
            <PButton
              variant="solid"
              color="default"
              size="large"
              style={{ flex: 1, height: 60, fontSize: 15 }}
              onClick={() => handleBulkActionSelect('invoice')}
            >
              Invoice
            </PButton>
          </div>
        </div>
      </AntModal>
    </div>
  );
};

export default ItemList;