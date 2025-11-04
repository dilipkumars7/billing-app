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

interface IconButtonProps {
  icon: React.ComponentType; // The icon component
  onClick?: React.MouseEventHandler<HTMLButtonElement>; // Optional click handler
}

export default function IconButton({ icon: Icon, onClick }: IconButtonProps) {
  return (
    <StyledButton onClick={onClick}>
      <Icon />
    </StyledButton>
  );
}
