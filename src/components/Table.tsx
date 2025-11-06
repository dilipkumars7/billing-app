import React, { useState, useEffect, useRef } from "react";
import styled from "@emotion/styled";
import { Button, Dropdown, MenuProps } from "antd";
import { HiArrowNarrowUp, HiArrowNarrowDown } from "react-icons/hi";
import { RxDotsHorizontal } from "react-icons/rx";
import { IoClose } from "react-icons/io5";
import { MdCheck } from "react-icons/md";
import { Editable } from './ui/editable';
import "../css/common.css";

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

const Row = styled.div`
  display: flex;
  width: 100%;
  font-size: 13px;
  &:hover {
    background-color: #f0f0f0;
  }
`;

const Cell = styled.div<{ isHovered: boolean; isHeaserCell: boolean }>`
  ${(props) =>
    props.isHeaserCell &&
    `display: flex;
    align-items: center;
    background-color: #f8fbff;
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
  min-width: 150px;
  text-overflow: ellipsis;
  border-right: ${(props) =>
    props.isHovered ? "3px solid #408CF9" : "1px solid #091E4224"};
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
  /* 👇 Hide by default; show only when hovered or sorted */
  visibility: ${(props) => (props.isHovered || props.isSorted ? "visible" : "hidden")};
  transition: visibility 0.2s ease-in-out;
`;

interface TableProps {
  TableHeader: { headerName: string; defaultWidth: string; field: string; type?: "text" | "number" | "date" | "select" | "dropdown"; options?: { [key: string]: any }[]; }[];
  TableData: { [key: string]: any }[];
  onRowChange?: (rowIndex: number, updatedRow: Record<string, any>) => void
}

export default function Table({ TableHeader, TableData, onRowChange }: TableProps) {
  const [originalData] = useState(TableData);
  const [sortedData, setSortedData] = useState(TableData);

  const columnWidthsRef = useRef(
    TableHeader.map((item) => Number(item.defaultWidth) || 150)
  );
  const [columnWidths, setColumnWidths] = useState(columnWidthsRef.current);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [headerLeft, setHeaderLeft] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC" | null>(
    null
  );

  const scrollableBodyRef = useRef<HTMLDivElement>(null);

  // --- Initialize sort state from URL ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSortBy = params.get("sortBy");
    const urlDirection = params.get("direction") as "ASC" | "DESC" | null;

    if (urlSortBy && urlDirection) {
      setSortBy(urlSortBy);
      setSortDirection(urlDirection);
    }
  }, []);

  // --- Update URL when sort state changes ---
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

  // --- Apply sorting logic ---
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

  // --- Scroll synchronization ---
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

  // --- Column resizing ---
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

      // 🟢 Emit the full updated row to parent
      if (onRowChange) {
        onRowChange(rowIndex, updatedData[rowIndex]);
      }

      return updatedData;
    });
  };

  // --- Sort handlers ---
  const handleSort = (field: string, direction: "ASC" | "DESC") => {
    setSortBy(field);
    setSortDirection(direction);
  };

  const handleClearSort = () => {
    setSortBy(null);
    setSortDirection(null);
  };

  // --- Dropdown items ---
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

  const totalWidth = columnWidths.reduce((acc, w) => acc + w, 0);

  return (
    <TableContainer>
      <HeaderScrollContainer>
        <HeaderWrapper style={{ left: `${headerLeft}px`, width: `${totalWidth}px` }}>
          <HeaderRow isScrolled={isScrolled}>
            {TableHeader.map((item, index) => (
              <Cell
                key={index}
                style={{ width: `${columnWidths[index]}px` }}
                isHovered={hoveredColumn === index}
                onMouseEnter={() => setSortColumn(index)}
                onMouseLeave={() => setSortColumn(null)}
                isHeaserCell={true}
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
            <Row key={rowIndex}>
              {TableHeader.map((header, colIndex) => (
                <Cell
                  key={colIndex}
                  style={{ width: `${columnWidths[colIndex]}px` }}
                  isHovered={hoveredColumn === colIndex}
                  isHeaserCell={false}
                >
                  <EditableCell
                    value={item[header.field]}
                    rowIndex={rowIndex}
                    field={header.field}
                    type={header.type || "text"} // 👈 New property in TableHeader
                    options={header.options}     // 👈 For select/dropdown fields
                    onValueChange={handleCellValueChange}
                  />
                </Cell>
              ))}
            </Row>
          ))}
        </BodyWrapper>
      </ScrollableBody>
    </TableContainer>
  );

  function SortFunction(index: number, item: { headerName: string; defaultWidth: string; field: string; }) {
    return <SortSpacer isHovered={sortColumn === index} isSorted={sortBy === item.field}>
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
    </SortSpacer>;
  }
}


function EditableCell({
  value,
  rowIndex,
  field,
  type,
  options,
  onValueChange,
}: {
  value: any;
  rowIndex: number;
  field: string;
  type: "text" | "number" | "date" | "select" | "dropdown";
  options?: { [key: string]: any }[] | string[];
  onValueChange: (rowIndex: number, field: string, newValue: any) => void;
}) {
  const [localValue, setLocalValue] = useState(
    value !== null && value !== undefined ? String(value) : ""
  );

  useEffect(() => {
    setLocalValue(value !== null && value !== undefined ? String(value) : "");
  }, [value]);

  const handleChange = (newVal: any) => {
    setLocalValue(newVal);
    let parsedValue: any = newVal;
    if (type === "number") parsedValue = newVal === "" ? null : Number(newVal);
    if (type === "date") parsedValue = newVal ? new Date(newVal) : null;
    onValueChange(rowIndex, field, parsedValue);
  };

  // ✅ Format date for display
  const formatDate = (val: any) => {
    if (!val) return "—";
    const dateObj = new Date(val);
    if (isNaN(dateObj.getTime())) return val; // invalid date, return raw
    return dateObj.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  return (
    <Editable.Root
      value={localValue ?? ""}
      onValueChange={(e) => handleChange(e.value ?? "")}
      placeholder="Click to edit"
      autoFocus
      selectOnFocus
      className="w-full"
    >
      <Editable.Area className="flex items-center w-full">
        {/* Preview Mode */}
        <Editable.Preview className="truncate w-full cursor-text text-[13px] text-gray-800">
          {type === "date" ? formatDate(value) : localValue?.toString() || "—"}
        </Editable.Preview>

        {/* Edit Mode */}
        <Editable.Input asChild>
          {(() => {
            switch (type) {
              case "number":
                return (
                  <input
                    type="number"
                    autoFocus
                    defaultValue=""
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleChange(e.target.value)}
                    className="w-full border border-blue-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                );
              case "date":
                return (
                  <input
                    type="date"
                    autoFocus
                    defaultValue=""
                    onChange={(e) => handleChange(e.target.value)}
                    className="w-full border border-blue-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                );
              case "select":
              case "dropdown":
                return (
                  <select
                    autoFocus
                    defaultValue=""
                    onChange={(e) => handleChange(e.target.value)}
                    className="w-full border border-blue-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select</option>
                    {options?.map((opt: any) => {
                      const label =
                        typeof opt === "string" ? opt : opt.label ?? opt.value;
                      const val =
                        typeof opt === "string" ? opt : opt.value ?? opt.label;
                      return (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                );
              default:
                return (
                  <input
                    type="text"
                    autoFocus
                    defaultValue=""
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleChange(e.target.value)}
                    className="w-full border border-blue-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                );
            }
          })()}
        </Editable.Input>
      </Editable.Area>
    </Editable.Root>
  );
}
