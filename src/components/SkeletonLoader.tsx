/** @jsxImportSource @emotion/react */
import React from "react";
import * as S from "./provider/SkeletonStyles";

interface Props {
  rows?: number;
}

const SkeletonTable: React.FC<Props> = ({ rows = 11 }) => {
  return (
    <>

    <div css={S.tableContainer}>
      {/* Table Header */}
      <div css={S.tableHeader}>
        <div css={S.headerBlock} />
        <div css={S.headerBlock} />
        <div css={S.headerBlock} />
        <div css={S.headerBlock} />
        <div css={S.headerBlock} />
        <div css={S.headerBlock} />
        <div css={S.headerBlock} />
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} css={S.tableRow}>
          <div css={S.skeletonCheckbox} />

          <div css={S.skeletonBlock} />
          <div css={S.skeletonBlock} />
          <div css={S.skeletonBlock} />
          <div css={S.skeletonBlock} />
          <div css={S.skeletonBlock} />
          <div css={S.skeletonBlock} />
        </div>
      ))}
    </div>

    </>
  );
};

export default SkeletonTable;
