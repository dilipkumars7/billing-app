import React from "react";
import styled from "@emotion/styled";
import { css } from "@emotion/react";

const baseItem = css`
  display: flex;
  align-items: center;
  position: relative;
  padding: 6px 8px;
  border-radius: 4px;
  margin-top: 5px;
  font-size: 14px;
  color: #172b4d;
  text-decoration: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  gap: 0.3rem;
  background: transparent;
  border: none;

  &:hover {
    background-color: #ebecf0;
  }
`;

const StyledButton = styled.button`
  ${baseItem}
`;

export default function IconButton({ icon: Icon, onClick }) {
  return (
    <StyledButton onClick={onClick}>
      {Icon && <Icon size="23" />}
    </StyledButton>
  );
}
