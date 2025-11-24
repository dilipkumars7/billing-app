import React, { useState, useEffect, useRef } from "react";
import styled from "@emotion/styled";
import { Button, Dropdown, MenuProps, Checkbox, Tag } from "antd";
import { HiArrowNarrowUp, HiArrowNarrowDown } from "react-icons/hi";
import { RxDotsHorizontal } from "react-icons/rx";
import { IoClose } from "react-icons/io5";
import { MdCheck } from "react-icons/md";
import "../css/common.css";
import "../css/table.css";
import { Input, InputNumber, DatePicker, Select } from "antd";
import dayjs from "dayjs";
import { IoIosArrowDown } from "react-icons/io";
import { useNavigate } from "react-router-dom";


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

const Row = styled.div<{ isEditing?: boolean }>`
  display: flex;
  width: 100%;
  font-size: 13px;
  background-color: ${(props) => props.isEditing ? "#f0f8ff" : "transparent"};
  border-left: ${(props) => props.isEditing ? "4px solid #1890ff" : "4px solid transparent"};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${(props) => props.isEditing ? "#e6f4ff" : "#f0f0f0"};
  }
`;

const Cell = styled.div<{ isHovered: boolean; isHeaderCell: boolean; isCheckbox?: boolean; isEditing?: boolean }>`
  ${(props) =>
    props.isHeaderCell &&
    `display: flex;
    align-items: center;
    background-color: #f0f1f2;
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
  padding: 9px;
  border-left: 1px solid #091E4224;
  border-bottom: 1px solid #091E4224;
  overflow: hidden;
  white-space: nowrap;
  text-align: left;
  box-sizing: border-box;
  flex-shrink: 0;
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

interface TableHeaderConfig {
  headerName: string;
  defaultWidth: string;
  field: string;
  type?: "text" | "number" | "date" | "select" | "dropdown";
  options?: { [key: string]: any }[];
  isEditable?: boolean | ((row: any, field: string) => boolean);
  displayAsChip?: boolean;
}

interface TableProps {
  TableHeader: TableHeaderConfig[];
  TableData: { [key: string]: any }[];
  onRowChange?: (rowIndex: number, updatedRow: Record<string, any>) => void;
  checkbox?: boolean;
  onSelectionChange?: (selectedRows: any[]) => void;
}

export default function Table({ 
  TableHeader, 
  TableData, 
  onRowChange,
  checkbox = false,
  onSelectionChange
}: TableProps) {
  const [originalData] = useState(TableData);
  const [sortedData, setSortedData] = useState(TableData);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());

  const checkboxWidth = 10;
  const columnWidthsRef = useRef(
    TableHeader.map((item) => Number(item.defaultWidth) || 150)
  );
  const [columnWidths, setColumnWidths] = useState(columnWidthsRef.current);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [headerLeft, setHeaderLeft] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC" | null>(null);
  const [editingCells, setEditingCells] = useState<Set<string>>(new Set());

  const scrollableBodyRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  // Emit selected rows whenever selection changes
  useEffect(() => {
    if (onSelectionChange) {
      const selected = sortedData.filter((_, index) => selectedRows.has(index));
      onSelectionChange(selected);
    }
  }, [selectedRows, sortedData, onSelectionChange]);

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

  // Update URL when sort state changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (sortBy && sortDirection) {
      params.set("sortBy", sortBy);
      params.set("direction", sortDirection);
    } else {
      params.delete("sortBy");
      params.delete("direction");
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState(null, "", newUrl);
  }, [sortBy, sortDirection]);

  // Apply sorting logic
  useEffect(() => {
    if (!sortBy || !sortDirection) {
      setSortedData(originalData);
      return;
    }

    const sorted = [...originalData].sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];

      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === "string" && typeof valB === "string") {
        return sortDirection === "ASC"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "ASC" ? valA - valB : valB - valA;
      }

      return 0;
    });

    setSortedData(sorted);
  }, [sortBy, sortDirection, originalData]);

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
  const resizingIndex = useRef<number | null>(null);
  const resizeOffset = useRef(0);

  const handleMouseMove = (event: MouseEvent) => {
    if (resizingIndex.current === null) return;
    requestAnimationFrame(() => {
      const newWidths = [...columnWidthsRef.current];
      const newWidth = Math.max(
        50,
        newWidths[resizingIndex.current!] + event.clientX - resizeOffset.current
      );
      newWidths[resizingIndex.current!] = newWidth;
      columnWidthsRef.current = newWidths;
      setColumnWidths(newWidths);
      resizeOffset.current = event.clientX;
    });
  };

  const handleMouseUp = () => {
    resizingIndex.current = null;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMouseDown = (index: number, event: React.MouseEvent) => {
    resizingIndex.current = index;
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
      setSelectedRows(new Set(sortedData.map((_, i) => i)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleRowSelect = (rowIndex: number, checked: boolean) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(rowIndex);
      } else {
        newSet.delete(rowIndex);
      }
      return newSet;
    });
  };

  const handleEditStart = (rowIndex: number, colIndex: number) => {
    setEditingRows((prev) => new Set(prev).add(`${rowIndex}-${colIndex}`));
  };

  const handleEditEnd = (rowIndex: number, colIndex: number) => {
    setEditingRows((prev) => {
      const newSet = new Set(prev);
      newSet.delete(`${rowIndex}-${colIndex}`);
      return newSet;
    });
  };

  const activateCell = (rowIndex: number, colIndex: number) => {
    setEditingCells(new Set([`${rowIndex}-${colIndex}`])); // allow 1 active at a time
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

  const totalWidth = columnWidths.reduce((acc, w) => acc + w, 0) + (checkbox ? checkboxWidth : 0);
  const isAllSelected = sortedData.length > 0 && selectedRows.size === sortedData.length;
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < sortedData.length;

  return (
    <TableContainer>
      <HeaderScrollContainer>
        <HeaderWrapper style={{ left: `${headerLeft}px`, width: `${totalWidth}px` }}>
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
                style={{ width: `${columnWidths[index]}px` }}
                isHovered={hoveredColumn === index}
                onMouseEnter={() => setSortColumn(index)}
                onMouseLeave={() => setSortColumn(null)}
                isHeaderCell={true}
              >
                <div>{item.headerName}</div>
                {SortFunction(index, item)}
                <Resizer
                  onMouseDown={(event) => handleMouseDown(index, event)}
                  onMouseEnter={() => setHoveredColumn(index)}
                  onMouseLeave={() => setHoveredColumn(null)}
                />
              </Cell>
            ))}
          </HeaderRow>
        </HeaderWrapper>
      </HeaderScrollContainer>

      <ScrollableBody ref={scrollableBodyRef}>
        <BodyWrapper style={{ width: `${totalWidth}px` }}>
          {sortedData.map((item, rowIndex) => (
            <Row key={rowIndex} isEditing={editingRows.has(rowIndex)}>
              {checkbox && (
                <Cell
                  isHovered={false}
                  isHeaderCell={false}
                  isCheckbox={true}
                  style={{ width: `${checkboxWidth}px` }}
                >
                  <Checkbox
                    checked={selectedRows.has(rowIndex)}
                    onChange={(e) => handleRowSelect(rowIndex, e.target.checked)}
                  />
                </Cell>
              )}
              {TableHeader.map((header, colIndex) => {
                 const cellKey = `${rowIndex}-${colIndex}`;
                 const isEditing = editingCells.has(cellKey);
                const isCellEditable = typeof header.isEditable === "function"
                  ? header.isEditable(item, header.field)
                  : header.isEditable !== false;

                return (
                  <Cell
                    key={colIndex}
                    style={{ width: `${columnWidths[colIndex]}px` }}
                    isHovered={hoveredColumn === colIndex}
                    isHeaderCell={false}
                    isEditing={isEditing}
                    onClick={() => activateCell(rowIndex, colIndex)} 
                  >
                    {header.isEditable && (


                      <EditableCell
                        value={item[header.field]}
                        rowIndex={rowIndex}
                        colIndex={colIndex}
                        field={header.field}
                        type={header.type || "text"}
                        options={header.options}
                        onValueChange={handleCellValueChange}
                        isEditable={isCellEditable}
                        displayAsChip={header.displayAsChip}
                        onDeactivate={() => deactivateCell(rowIndex, colIndex)}
                        isActive={isEditing}  
                      />
                    )}
                    {!header.isEditable && (
                      header.field.toLowerCase().includes("code") ? (
                        <div
                          onClick={() => navigate(`/item/${item[header.field]}`)}
                          className="text-[#1868DB] underline cursor-pointer hover:text-blue-800 select-none"
                        >
                          {item[header.field]}
                        </div>
                      ) : (
                        <span className="select-none">{item[header.field]}</span>
                      )
                    )}
                  </Cell>
                );
              })}
            </Row>
          ))}
        </BodyWrapper>
      </ScrollableBody>
    </TableContainer>
  );


  function SortFunction(index: number, item: TableHeaderConfig) {
    return (
      <SortSpacer isHovered={sortColumn === index} isSorted={sortBy === item.field}>
        {(sortColumn === index || sortBy === item.field) && (
          <Button
            type="text"
            style={{ padding: 0 }}
            onClick={() => handleSort(
              item.field,
              sortBy === item.field && sortDirection === "ASC" ? "DESC" : "ASC"
            )}
            variant={`${sortBy === item.field ? "text" : "filled"}`}
            color={`${sortBy === item.field ? "primary" : "default"}`}
          >
            {sortBy === item.field ? (
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
          menu={{ items: generateMenuItems(item.field) }}
          trigger={["click"]}
          overlayStyle={{ width: "160px" }}
        >
          <Button type="text" style={{ padding: 0 }}>
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
  isActive = false,               // <-- new prop
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

  // READ-ONLY preview (show when NOT active)
  if (!isActive) {
    const display = type === "date" ? formatDate(value) : localValue || "—";
    if (displayAsChip && localValue) {
      return <Tag color="blue" style={{ margin: 0 }}>{display}</Tag>;
    }
    return <div className="text-[13px] select-none">{display}</div>;
  } 


  // ACTIVE EDIT MODE: render the input only
  return (
    <div style={{ width: "100%" }}>
      {type === "number" && (
        <InputNumber
          autoFocus
          variant="borderless"
          value={localValue !== "" ? Number(localValue) : null}
          onChange={(v) => handleChange(v ?? "")}
          onBlur={handleBlur}
          controls={false}
          // optional: prevent wheel from accidentally changing value
          onWheel={(e) => (e.currentTarget as HTMLElement).blur()}
          precision={0}
          onKeyPress={(event) => {
            if (!/[0-9]/.test(event.key)) { // Allows only digits
              event.preventDefault();
            }
          }}
        />
      )}

      {type === "date" && (
        <DatePicker
          autoFocus
          variant="borderless"
          value={localValue ? dayjs(localValue) : null}
          onChange={(d) => handleChange(d)}
          onBlur={handleBlur as any}
          style={{
            width: "100%",
            border: "none",
            background: "transparent",
          }}
        />
      )}

      {(type === "select" || type === "dropdown") && (
        <Select
          variant="borderless"
          autoFocus
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
