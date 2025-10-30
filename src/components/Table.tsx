import React, { useState, useEffect, useRef } from "react";
import styled from "@emotion/styled";

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

const Cell = styled.div<{ isHovered: boolean }>`
  position: relative;
  padding: 10px;
  border-left: 1px solid #091E4224;
  border-bottom: 1px solid #091E4224;
  overflow: hidden;
  white-space: nowrap;
  text-align: left;
  box-sizing: border-box;
  flex-shrink: 0;
  min-width: 150px;
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

interface TableProps {
  TableHeader: { headerName: string; defaultWidth: string; field: string }[];
  TableData: { [key: string]: any }[];
}

export default function Table({ TableHeader, TableData }: TableProps) {
  const columnWidthsRef = useRef(
    TableHeader.map((item) => Number(item.defaultWidth) || 150)
  );
  const [columnWidths, setColumnWidths] = useState(columnWidthsRef.current);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [headerLeft, setHeaderLeft] = useState(0);

  const scrollableBodyRef = useRef<HTMLDivElement>(null);
  const headerWrapperRef = useRef<HTMLDivElement>(null);

  // --- Scroll synchronization ---
  useEffect(() => {
    const body = scrollableBodyRef.current;

    if (!body) return;

    const handleBodyScroll = () => {
      const scrollLeft = body.scrollLeft;
      const scrollTop = body.scrollTop;
      
      setIsScrolled(scrollTop > 0);
      
      // Move header left by negative scroll amount
      requestAnimationFrame(() => {
        setHeaderLeft(-scrollLeft);
      });
    };

    body.addEventListener("scroll", handleBodyScroll, { passive: true });

    return () => {
      body.removeEventListener("scroll", handleBodyScroll);
    };
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

  // Compute total width dynamically
  const totalWidth = columnWidths.reduce((acc, w) => acc + w, 0);

  return (
    <TableContainer>
      {/* Fixed Header with left positioning */}
      <HeaderScrollContainer>
        <HeaderWrapper 
          ref={headerWrapperRef}
          style={{ 
            left: `${headerLeft}px`,
            width: `${totalWidth}px` 
          }}
        >
          <HeaderRow isScrolled={isScrolled}>
            {TableHeader.map((item, index) => (
              <Cell
                key={index}
                style={{ width: `${columnWidths[index]}px` }}
                isHovered={hoveredColumn === index}
              >
                {item.headerName}
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

      {/* Scrollable Body */}
      <ScrollableBody ref={scrollableBodyRef}>
        <BodyWrapper style={{ width: `${totalWidth}px` }}>
          {TableData.map((item, rowIndex) => (
            <Row key={rowIndex}>
              {TableHeader.map((header, colIndex) => (
                <Cell
                  key={colIndex}
                  style={{ width: `${columnWidths[colIndex]}px` }}
                  isHovered={hoveredColumn === colIndex}
                >
                  {item[header.field]}
                </Cell>
              ))}
            </Row>
          ))}
        </BodyWrapper>
      </ScrollableBody>
    </TableContainer>
  );
}