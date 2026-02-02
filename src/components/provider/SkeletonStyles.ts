/** @jsxImportSource @emotion/react */
import { css, keyframes } from "@emotion/react";

const shimmer = keyframes`
  0% { background-position: -468px 0; }
  100% { background-position: 468px 0; }
`;

const shimmerGradient = `
  background: linear-gradient(
    to right,
    rgba(130,130,130,0.2) 8%,
    rgba(130,130,130,0.3) 18%,
    rgba(130,130,130,0.2) 33%
  );
  background-size: 800px 100px;
`;

export const tableContainer = css`
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow-x: auto;
  background: white;
`;

export const tableHeader = css`
  display: grid;
  grid-template-columns: 40px 250px 250px 170px 150px 150px 150px 150px 150px 150px;
  background: #f9fafb;
  padding: 12px 10px;
  border-bottom: 1px solid #e5e7eb;
`;

export const tableRow = css`
  display: grid;
  grid-template-columns: 40px 250px 250px 170px 150px 150px 150px;
  padding: 10px;
  border-bottom: 1px solid #e5e7eb;
`;

export const skeletonBlock = css`
  height: 20px;
  border-radius: 4px;
  ${shimmerGradient}
  animation: ${shimmer} 2s infinite ease-out;
  margin-right: 10px;
`;

export const skeletonCheckbox = css`
  width: 16px;
  height: 16px;
  border-radius: 3px;
  ${shimmerGradient}
  animation: ${shimmer} 2s infinite ease-out;
`;

export const headerBlock = css`
  height: 16px;
  width: 80%;
  border-radius: 4px;
  background: #d1d5db;
`;
