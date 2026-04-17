import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import styled from "@emotion/styled";
import { Button, Dropdown, MenuProps, Checkbox, Tag, Spin } from "antd";
import { HiArrowNarrowUp, HiArrowNarrowDown } from "react-icons/hi";
import { RxDotsHorizontal } from "react-icons/rx";
import { IoClose } from "react-icons/io5";
import { MdCheck } from "react-icons/md";
import "../css/common.css";
import "../css/table.css";
import { Input, InputNumber, DatePicker, Select } from "antd";
import dayjs from "dayjs";
import { IoIosArrowDown } from "react-icons/io";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as S from "../components/provider/SkeletonStyles";
import { css } from "@emotion/react";


const TableContainer = styled.div`
  width: 100%;
  border: 1.5px solid #091E4224;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fff;
`;

const HeaderScrollContainer = styled.div`
  overflow: hidden;
  position: relative;
  width: 100%;
`;

const HeaderWrapper = styled.div`
  position: relative;
  transition: left 0s;
  will-change: left;
`;

const HeaderRow = styled.div<{ isScrolled: boolean }>`
  display: flex;
  width: 100%;
  font-size: 14px;
  font-weight: bold;
  background-color: var(--ds-surface-sunken, #f7f8f9);
  z-index: 2;
  user-select: none;
  box-shadow: ${(props) =>
    props.isScrolled ? "rgba(0, 0, 0, 0.09) 0px 3px 12px;" : "none"};
`;

const ScrollableBody = styled.div`
  max-height: 70vh;
  overflow-y: auto;
  overflow-x: auto;
  position: relative;
`;

const BodyWrapper = styled.div`
  display: inline-block;
  vertical-align: top;
`;

const Row = styled.div<{ isEditing?: boolean, isCheckbox?: boolean }>`
  display: flex;
  width: 100%;
  font-size: 13px;
  background-color: ${(props) => props.isEditing ? "#f0f8ff" : "transparent"};
  border-left: ${(props) => props.isEditing ? "4px solid #1890ff" : "4px solid transparent"};
  transition: all 0.2s ease;

  /* Border-left logic */
  ${(props) =>
    !props.isCheckbox
      ? css`
          border-left: unset;
        `
      : css`
          border-left: ${props.isEditing 
            ? "4px solid #1890ff" 
            : "4px solid transparent"};
        `}
  
  &:hover {
    background-color: ${(props) => props.isEditing ? "#e6f4ff" : "#f0f0f0"};
  }
`;

const Cell = styled.div<{ isHovered: boolean; isHeaderCell: boolean; isCheckbox?: boolean; isEditing?: boolean }>`
  ${(props) =>
    props.isHeaderCell &&
    `display: flex;
    align-items: center;
    background-color: #F8F8F8;
    Height: 40px;
    color: #505258;
    font-size: 13.5px;
    padding:2px;
    `}
  ${(props) =>
    props.isCheckbox &&
    `display: flex;
    justify-content: center;
    border-left: unset !important;
    `}
 ${(props) =>
    (!props.isHeaderCell && props.isCheckbox) &&
    `display: flex;
    align-items: center;
    min-width:47px !important;
    `}
    
  ${(props) =>
    props.isEditing &&
    ` outline: 3px solid #1890ff !important;
      outline-offset: -3px;
      z-index: 10;
      background: #fff;
    `}
  position: relative;
  padding: 6px;
  border-left: 1px solid #091E4224;
  border-bottom: 1px solid #091E4224;
  overflow: hidden;
  white-space: nowrap;
  text-align: left;
  box-sizing: border-box;
  flex-shrink: 0;
  max-height: 40px;
  text-overflow: ellipsis;
  min-width: ${(props) => props.isCheckbox ? "50px" : "150px"};
  text-overflow: ellipsis;
  border-right: ${(props) =>
    props.isHovered ? "3px solid #408CF9" : "1px solid #091E4224"};
  transition: all 0.2s ease;
`;

const Resizer = styled.div`
  position: absolute;
  right: -5px;
  top: 0;
  bottom: 0;
  width: 8px;
  cursor: col-resize;
  background-color: transparent;
  z-index: 1;
  user-select: none;
  &:hover {
    background-color: #408CF9;
  }
`;

const SortSpacer = styled.div<{ isHovered: boolean; isSorted: boolean }>`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  visibility: ${(props) => (props.isHovered || props.isSorted ? "visible" : "hidden")};
  transition: visibility 0.2s ease-in-out;
`;

// ── Infinite scroll sentinel + loader ────────────────────────────────────────

/**
 * A thin invisible div placed at the very bottom of the scroll container.
 * IntersectionObserver fires `onVisible` when it enters the viewport.
 */
const InfiniteScrollSentinel: React.FC<{
  onVisible: () => void;
  isFetchingMore: boolean;
  hasMore: boolean;
  totalWidth: number;
}> = ({ onVisible, isFetchingMore, hasMore, totalWidth }) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onVisible();
        }
      },
      {
        // Fire when sentinel is 200px away from the bottom edge of the scroll container
        rootMargin: "0px 0px 200px 0px",
        threshold: 0,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisible, hasMore]);

  return (
    <>
      {/* Invisible trigger element */}
      <div ref={sentinelRef} style={{ height: 1, width: "100%" }} />

      {/* Visible loading indicator */}
      {isFetchingMore && (
        <div
          style={{
            width: `${totalWidth}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px 0",
            gap: 8,
            borderBottom: "1px solid #091E4224",
            color: "#6a7282",
            fontSize: 13,
          }}
        >
          <Spin size="small" />
          <span>Loading more items…</span>
        </div>
      )}

      {/* End-of-data indicator */}
      {!hasMore && (
        <div
          style={{
            width: `${totalWidth}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px 0",
            color: "#b0b8c1",
            fontSize: 12,
            borderBottom: "1px solid #091E4224",
            gap: 6,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 40,
              height: 1,
              background: "#d9d9d9",
              verticalAlign: "middle",
            }}
          />
          All items loaded
          <span
            style={{
              display: "inline-block",
              width: 40,
              height: 1,
              background: "#d9d9d9",
              verticalAlign: "middle",
            }}
          />
        </div>
      )}
    </>
  );
};

interface TableHeaderConfig {
  headerName: string;
  defaultWidth: string;
  field: string;
  type?: "text" | "number" | "date" | "select" | "dropdown";
  options?: { [key: string]: any }[];
  isEditable?: boolean | ((row: any, field: string) => boolean);
  displayAsChip?: boolean;
  isTag?: boolean;
  tagColor?: string | ((value: any, row?: any) => string);
}

interface TableProps {
  TableHeader: TableHeaderConfig[];
  TableData: { [key: string]: any }[];
  onRowChange?: (rowIndex: number, updatedRow: Record<string, any>) => void;
  checkbox?: boolean;
  onSelectionChange?: (selectedRows: any[]) => void;
  onSortClear?: () => void;
  selectedRows?: any[];
  TableName?: string;
  Idlinkpath?: string;
  idkey?: string;
  HeaderLoading?: boolean;
  DataLoading?: boolean;
  // ── Infinite scroll props ──────────────────────────────────────────────────
  hasMore?: boolean;
  isFetchingMore?: boolean;
  onLoadMore?: () => void;
}

export default function Table({ 
  TableHeader, 
  TableData, 
  onRowChange,
  checkbox = false,
  onSelectionChange,
  onSortClear,
  selectedRows,
  TableName,
  Idlinkpath,
  HeaderLoading,
  DataLoading,
  idkey,
  // Infinite scroll
  hasMore = false,
  isFetchingMore = false,
  onLoadMore,
}: TableProps) {
  const [sortedData, setSortedData] = useState(TableData);
  const checkboxWidth = 10;
  const columnWidthsRef = useRef<Record<string, number>>({});
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());

  useEffect(() => {
    TableHeader.forEach(h => {
      if (!(h.field in columnWidthsRef.current)) {
        columnWidthsRef.current[h.field] =
          Number(h.defaultWidth) || 150;
      }
    });
  }, [TableHeader]);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    TableHeader.forEach(h => {
      initial[h.field] = Number(h.defaultWidth) || 150;
    });
    return initial;
  });

  useEffect(() => {
    columnWidthsRef.current = columnWidths;
  }, [columnWidths]);

  useEffect(() => {
    if (!selectedRows || selectedRows.length === 0) {
      setSelectedIndexes(new Set());
    }
  }, [selectedRows]);

  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  const [HeaderHoverdColumn, setHeaderHoveredColumn] = useState<string | null>(null);
  const [headerLeft, setHeaderLeft] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC" | null>(null);
  const [editingCells, setEditingCells] = useState<Set<string>>(new Set());
  const [searchParams, setSearchParams] = useSearchParams();

  const scrollableBodyRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Initialize sort state from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSortBy = params.get("sortBy");
    const urlDirection = params.get("direction") as "ASC" | "DESC" | null;

    if (urlSortBy && urlDirection) {
      setSortBy(urlSortBy);
      setSortDirection(urlDirection);
    }
  }, []);

  useEffect(() => {
    if (!sortBy || !sortDirection) return;

    const params = new URLSearchParams(searchParams);
    params.set("sortBy", sortBy);
    params.set("direction", sortDirection);

    setSearchParams(params, { replace: true });
  }, [sortBy, sortDirection]);

  useEffect(() => {
    setSortedData(TableData);
  }, [TableData]);

  // Scroll synchronization
  useEffect(() => {
    const body = scrollableBodyRef.current;
    if (!body) return;

    const handleBodyScroll = () => {
      const scrollLeft = body.scrollLeft;
      const scrollTop = body.scrollTop;
      setIsScrolled(scrollTop > 0);
      requestAnimationFrame(() => setHeaderLeft(-scrollLeft));
    };

    body.addEventListener("scroll", handleBodyScroll, { passive: true });
    return () => body.removeEventListener("scroll", handleBodyScroll);
  }, []);

  // Column resizing
  const resizingFieldRef = useRef<string | null>(null);
  const resizeOffset = useRef(0);

  const handleMouseMove = (event: MouseEvent) => {
    const field = resizingFieldRef.current;
    if (!field) return;

    const prevWidth = columnWidthsRef.current[field] ?? 150;
    const newWidth = Math.max(150, prevWidth + event.clientX - resizeOffset.current);

    const next = { ...columnWidthsRef.current, [field]: newWidth };
    columnWidthsRef.current = next;
    setColumnWidths(next);
    saveColumnWidthsToLocalStorage(field, newWidth);

    resizeOffset.current = event.clientX;
  };

  const saveColumnWidthsToLocalStorage = (field: string, width: number) => {
    let config: any = {};
    try {
      const raw = localStorage.getItem("settingsConfig");
      config = raw ? JSON.parse(raw) : {};
    } catch (err) {
      console.error("Corrupted settingsConfig — clearing and resetting.", err);
      localStorage.removeItem("settingsConfig");
      config = { tableRowOrder: {} };
      localStorage.setItem("settingsConfig", JSON.stringify(config));
    }

    if (!config.tableRowOrder) config.tableRowOrder = {};
    if (!config.tableRowOrder[TableName]) config.tableRowOrder[TableName] = [];

    const existing = config.tableRowOrder[TableName].find((col: any) => col.name === field);

    if (existing) {
      existing.width = width;
    } else {
      config.tableRowOrder[TableName].push({ name: field, isVisible: true, width });
    }

    localStorage.setItem("settingsConfig", JSON.stringify(config));
  };

  const handleMouseUp = () => {
    resizingFieldRef.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMouseDown = (field: string, event: React.MouseEvent) => {
    resizingFieldRef.current = field;
    resizeOffset.current = event.clientX;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleCellValueChange = (rowIndex: number, field: string, newValue: any) => {
    setSortedData((prev) => {
      const updatedData = prev.map((row, i) =>
        i === rowIndex ? { ...row, [field]: newValue } : row
      );

      if (onRowChange) {
        onRowChange(rowIndex, updatedData[rowIndex]);
      }

      return updatedData;
    });
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIndexes = new Set(sortedData.map((_, i) => i));
      setSelectedIndexes(allIndexes);
      onSelectionChange?.(sortedData);
    } else {
      setSelectedIndexes(new Set());
      onSelectionChange?.([]);
    }
  };

  const handleRowSelect = (rowIndex: number, checked: boolean) => {
    setSelectedIndexes(prev => {
      const next = new Set(prev);
      checked ? next.add(rowIndex) : next.delete(rowIndex);
      onSelectionChange?.([...next].map(i => sortedData[i]));
      return next;
    });
  };

  const activateCell = (rowIndex: number, colIndex: string) => {
    setEditingCells(new Set([`${rowIndex}-${colIndex}`]));
  };

  const deactivateCell = (rowIndex: number, colIndex: number) => {
    setEditingCells(prev => {
      const next = new Set(prev);
      next.delete(`${rowIndex}-${colIndex}`);
      return next;
    });
  };

  // Sort handlers
  const handleSort = (field: string, direction: "ASC" | "DESC") => {
    setSortBy(field);
    setSortDirection(direction);
  };

  const handleClearSort = () => {
    setSortBy(null);
    setSortDirection(null);
    const params = new URLSearchParams(searchParams);
    params.delete("sortBy");
    params.delete("direction");
    setSearchParams(params, { replace: true });
    onSortClear?.();
  };

  // Dropdown items
  const generateMenuItems = (field: string): MenuProps["items"] => [
    {
      label: (
        <div className="w-full flex items-center gap-2">
          <HiArrowNarrowUp size={15} />
          <span>Sort A - Z</span>
        </div>
      ),
      key: "asc",
      onClick: () => handleSort(field, "ASC"),
      extra:
        sortBy === field && sortDirection === "ASC" ? (
          <MdCheck size={18} color="#0052CC" />
        ) : undefined,
    },
    {
      label: (
        <div className="w-full flex items-center gap-2">
          <HiArrowNarrowDown size={15} />
          <span>Sort Z - A</span>
        </div>
      ),
      key: "desc",
      onClick: () => handleSort(field, "DESC"),
      extra:
        sortBy === field && sortDirection === "DESC" ? (
          <MdCheck size={18} color="#0052CC" />
        ) : undefined,
    },
    {
      type: "divider",
    },
    {
      label: (
        <div className="w-full flex items-center gap-2">
          <IoClose size={15} />
          <span>Clear Sort</span>
        </div>
      ),
      key: "clear",
      onClick: handleClearSort,
      danger: true,
      disabled: sortBy !== field
    },
  ];

  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!tableRef.current) return;
      const target = e.target as Node;
      const isClickInsideTable = tableRef.current.contains(target);

      const isClickOnDropdown =
        (target as Element).closest?.(".ant-select-dropdown") ||
        (target as Element).closest?.(".ant-picker-dropdown") ||
        (target as Element).closest?.(".ant-dropdown") ||
        (target as Element).closest?.(".ant-cascader-dropdown");

      if (!isClickInsideTable && !isClickOnDropdown) {
        setEditingCells(new Set());
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalWidth =
    TableHeader.reduce((sum, h) => sum + (columnWidths[h.field] || 150), 0) +
    (checkbox ? checkboxWidth : 0);

  const isAllSelected    = sortedData.length > 0 && selectedIndexes.size === sortedData.length;
  const isIndeterminate  = selectedIndexes.size > 0 && selectedIndexes.size < sortedData.length;

  // ── onLoadMore guard: stable callback ref so IntersectionObserver doesn't re-register ──
  const onLoadMoreRef = useRef(onLoadMore);
  useEffect(() => { onLoadMoreRef.current = onLoadMore; }, [onLoadMore]);
  const stableLoadMore = useCallback(() => { onLoadMoreRef.current?.(); }, []);

  return (
    <TableContainer ref={tableRef}>
      <HeaderScrollContainer>
        <HeaderWrapper style={{ left: `${headerLeft}px`, width: `${totalWidth}px` }}>
          {HeaderLoading ? (
            <HeaderSkeleton checkbox={checkbox} />
          ) : (
            <HeaderRow isScrolled={isScrolled}>
              {checkbox && (
                <Cell
                  isHovered={false}
                  isHeaderCell={true}
                  isCheckbox={true}
                  style={{ width: `${checkboxWidth}px` }}
                >
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </Cell>
              )}
              {TableHeader.map((item, index) => (
                <Cell
                  key={index}
                  style={{ width: `${columnWidths[item.field]}px` }}
                  isHovered={hoveredColumn === item.field}
                  onMouseEnter={() => setHeaderHoveredColumn(item.field)}
                  onMouseLeave={() => setHeaderHoveredColumn(null)}
                  isHeaderCell={true}
                >
                  <div>{item.headerName}</div>
                  {SortFunction(item)}
                  <Resizer
                    onMouseDown={(event) => handleMouseDown(item.field, event)}
                    onMouseEnter={() => setHoveredColumn(item.field)}
                    onMouseLeave={() => setHoveredColumn(null)}
                  />
                </Cell>
              ))}
            </HeaderRow>
          )}
        </HeaderWrapper>
      </HeaderScrollContainer>

      <ScrollableBody ref={scrollableBodyRef}>
        <BodyWrapper style={{ width: `${totalWidth}px` }}>
          {DataLoading ? (
            <BodySkeleton
              checkbox={checkbox}
              headers={TableHeader}
              columnWidths={columnWidths}
            />
          ) : (
            sortedData.map((item, rowIndex) => (
              <Row key={rowIndex} isEditing={editingCells.has(`${rowIndex}-${item.field}`)} isCheckbox={checkbox}>
                {checkbox && (
                  <Cell
                    isHovered={false}
                    isHeaderCell={false}
                    isCheckbox={true}
                    style={{ width: `${checkboxWidth}px` }}
                  >
                    <Checkbox
                      checked={selectedIndexes.has(rowIndex)}
                      onChange={(e) => handleRowSelect(rowIndex, e.target.checked)}
                    />
                  </Cell>
                )}
                {TableHeader.map((header, colIndex) => {
                  const isEditing = editingCells.has(`${rowIndex}-${header.field}`);
                  const isCellEditable = typeof header.isEditable === "function"
                    ? header.isEditable(item, header.field)
                    : header.isEditable !== false;

                  return (
                    <Cell
                      key={header.field}
                      style={{ width: `${columnWidths[header.field]}px` }}
                      isHovered={hoveredColumn === header.field}
                      isHeaderCell={false}
                      isEditing={isEditing}
                      onClick={() => activateCell(rowIndex, header.field)} 
                    >
                      {header.isEditable && (
                        <EditableCell
                          value={item[header.field]}
                          rowIndex={rowIndex}
                          colIndex={colIndex}
                          field={header.field}
                          type={header.type || "text"}
                          isTag={header.isTag || false}
                          tagColor={typeof header.tagColor === "function" 
                            ? header.tagColor(item[header.field], item) 
                            : header.tagColor || "blue"}
                          options={header.options}
                          onValueChange={handleCellValueChange}
                          isEditable={isCellEditable}
                          displayAsChip={header.displayAsChip}
                          onDeactivate={() => deactivateCell(rowIndex, colIndex)}
                          isActive={isEditing}  
                        />
                      )}
                      {!header.isEditable && (
                        (header.field.toLowerCase().includes("code") || header.field.toLowerCase().includes("number")) ? (
                          <div
                            onClick={() => navigate(`/${Idlinkpath}/${item[header.field]}`)}
                            className="text-[#1868DB] underline cursor-pointer hover:text-blue-800 select-none"
                          >
                            {item[header.field]}
                          </div>
                        ) : (
                          <span className="select-none">
                            {header.isTag ? (
                              <Tag variant="outlined"
                                color={typeof header.tagColor === "function" 
                                  ? header.tagColor(item[header.field], item) 
                                  : header.tagColor || "blue"} 
                                style={{ marginLeft: 8 }}
                              >
                                {item[header.field]}
                              </Tag>
                            ): (
                              item[header.field]
                            )}
                          </span>
                        )
                      )}
                    </Cell>
                  );
                })}
              </Row>
            ))
          )}

          {/* ── Infinite scroll sentinel (outside DataLoading guard) ──── */}
          {!DataLoading && onLoadMore && (
            <InfiniteScrollSentinel
              onVisible={stableLoadMore}
              isFetchingMore={isFetchingMore}
              hasMore={hasMore}
              totalWidth={totalWidth}
            />
          )}
        </BodyWrapper>
      </ScrollableBody>
    </TableContainer>
  );


  function SortFunction(item: TableHeaderConfig) {
    const field = item.field;
    const isHovered = HeaderHoverdColumn === field;
    const isSorted = sortBy === field;

    return (
      <SortSpacer isHovered={isHovered} isSorted={isSorted}>
        {(isHovered || isSorted) && (
          <Button
            type="text"
            style={{ padding: "5px" }}
            onClick={() =>
              handleSort(
                field,
                sortBy === field && sortDirection === "ASC" ? "DESC" : "ASC"
              )
            }
          >
            {isSorted ? (
              sortDirection === "ASC" ? (
                <HiArrowNarrowUp size={16} />
              ) : (
                <HiArrowNarrowDown size={16} />
              )
            ) : (
              <HiArrowNarrowUp size={16} className="opacity-50" />
            )}
          </Button>
        )}

        <Dropdown
          menu={{ items: generateMenuItems(field) }}
          trigger={["click"]}
          overlayStyle={{ width: "160px" }}
        >
          <Button type="text" style={{ padding: "5px" }}>
            <RxDotsHorizontal size={16} />
          </Button>
        </Dropdown>
      </SortSpacer>
    );
  }

}

function EditableCell({
  value,
  rowIndex,
  colIndex,
  field,
  type,
  options,
  onValueChange,
  isEditable = true,
  displayAsChip = false,
  onDeactivate,
  isActive = false,
  isTag = false,
  tagColor = "blue",
}: {
  value: any;
  rowIndex: number;
  colIndex: number;
  field: string;
  type: "text" | "number" | "date" | "select" | "dropdown";
  options?: { [key: string]: any }[] | string[];
  onValueChange: (rowIndex: number, field: string, newValue: any) => void;
  isEditable?: boolean;
  displayAsChip?: boolean;
  onDeactivate?: (rowIndex: number, colIndex: number) => void;
  isActive?: boolean;
  isTag?: boolean;
  tagColor?: string;
}) {
  const [localValue, setLocalValue] = useState(
    value !== null && value !== undefined ? String(value) : ""
  );

  useEffect(() => {
    setLocalValue(value !== null && value !== undefined ? String(value) : "");
  }, [value]);

  const handleChange = (newVal: any) => {
    setLocalValue(newVal === null || newVal === undefined ? "" : String(newVal));
    let parsed: any = newVal;
    if (type === "number") parsed = newVal === "" || newVal == null ? null : Number(newVal);
    if (type === "date") parsed = newVal ? newVal.toDate() : null;
    onValueChange(rowIndex, field, parsed);
  };

  const handleBlur = () => {
    onDeactivate?.(rowIndex, colIndex);
  };

  const formatDate = (val: any) => {
    if (!val) return "—";
    const dt = new Date(val);
    return isNaN(dt.getTime()) ? val : dt.toISOString().split("T")[0];
  };

  if (!isActive) {
    const display = type === "date" ? formatDate(value) : localValue || "—";
    if (displayAsChip && localValue) {
      return <Tag color={tagColor} style={{ margin: 0 }}>{display}</Tag>;
    }
    return <div className="text-[13px] select-none">
      {isTag ? (
        <Tag color={tagColor} variant="outlined" style={{ margin: 0 }}>
          {display}
        </Tag>
      ) : (
        display
      )}
    </div>;
  } 

  return (
    <div style={{ width: "100%" }}>
      {type === "number" && (
        <InputNumber
          autoFocus
          size="small"
          variant="borderless"
          value={localValue !== "" ? Number(localValue) : null}
          onChange={(v) => handleChange(v ?? "")}
          onBlur={handleBlur}
          controls={false}
          precision={2} 
          inputMode="numeric"
          onWheel={(e) => (e.currentTarget as HTMLElement).blur()}
        />
      )}

      {type === "date" && (
        <DatePicker
          autoFocus
          variant="borderless"
          size="small"
          value={localValue ? dayjs(localValue) : null}
          onChange={(d) => handleChange(d)}
          onBlur={handleBlur as any}
          style={{ width: "100%", border: "none", background: "transparent" }}
        />
      )}

      {(type === "select" || type === "dropdown") && (
        <Select
          variant="borderless"
          autoFocus
          size="small"
          showSearch
          value={localValue || undefined}
          options={options?.map((opt: any) => ({
            label: typeof opt === "string" ? opt : opt.label ?? opt.value,
            value: typeof opt === "string" ? opt : opt.value ?? opt.label,
          }))}
          onChange={(v) => handleChange(v)}
          onBlur={handleBlur}
          style={{ width: "100%" }}
          suffixIcon={<IoIosArrowDown size={20} />}
        />
      )}

      {type === "text" && (
        <Input
          variant="borderless"
          size="small"
          type="text"
          autoFocus
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
        />
      )}
    </div>
  );
}


const HeaderSkeleton = ({ checkbox }: { checkbox?: boolean }) => (
  <HeaderRow isScrolled={false}>
    <div css={S.tableHeader}>
      <div css={S.headerBlock} />
      <div css={S.headerBlock} />
      <div css={S.headerBlock} />
      <div css={S.headerBlock} />
      <div css={S.headerBlock} />
      <div css={S.headerBlock} />
      <div css={S.headerBlock} />
      <div css={S.headerBlock} />
      <div css={S.headerBlock} />
      <div css={S.headerBlock} />
    </div>
  </HeaderRow>
);

/** @jsxImportSource @emotion/react */
const BodySkeleton = ({
  rows = 15,
  headers,
  checkbox,
  columnWidths,
}: {
  rows?: number;
  headers: TableHeaderConfig[];
  checkbox?: boolean;
  columnWidths: Record<string, number>;
}) => (
  <>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <Row key={rowIndex}>
        {checkbox && (
          <Cell
            isHovered={false}
            isHeaderCell={false}
            isCheckbox
            style={{ width: "50px" }}
          >
            <div css={S.skeletonCheckbox} />
          </Cell>
        )}

        {headers.map((header) => (
          <Cell
            key={header.field}
            isHovered={false}
            isHeaderCell={false}
            style={{ width: `${(columnWidths[header.field]) ?? 150}px` }}
          >
            <div css={S.skeletonBlock} />
          </Cell>
        ))}
      </Row>
    ))}
  </>
);