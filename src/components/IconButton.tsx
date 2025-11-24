/** @jsxImportSource @emotion/react */
import styled from "@emotion/styled";
import { ReactNode, MouseEventHandler, ComponentType } from "react";

interface ButtonProps {
  active?: boolean;
}

interface IconButtonProps {
  icon: ReactNode | ComponentType;
  text?: string;
  active?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

const ButtonWrapper = styled.button<ButtonProps>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid ${({ active }) => (active ? "#1A73E8" : "#ddd")};
  background: ${({ active }) => (active ? "#E8F0FE" : "#fff")};
  color: ${({ active }) => (active ? "#1A73E8" : "#555")};
  cursor: pointer;
  transition: 0.2s ease all;

  &:hover {
    background: ${({ active }) => (active ? "#D7E6FD" : "#f5f5f5")};
  }
`;

export default function IconButton({
  icon,
  text,
  active = false,
  onClick,
}: IconButtonProps) {
  const IconComp = icon as ComponentType;

  return (
    <ButtonWrapper active={active} onClick={onClick}>
      {typeof icon === "function" ? <IconComp size={22} /> : icon}
      {text && <span>{text}</span>}
    </ButtonWrapper>
  );
}
