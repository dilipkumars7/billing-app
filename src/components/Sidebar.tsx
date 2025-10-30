/** @jsxImportSource @emotion/react */
import React from "react";
import '../css/common.css'
import styled from "@emotion/styled";
import { css } from "@emotion/react";
import { NavLink } from "react-router-dom";
import { SIDEBAR_DATA } from "../constants/sidebarData";

export default function Sidebar() {
  return (
    <SidebarContainer>
      <SidebarNav>
        <SidebarItemContainer>
          {SIDEBAR_DATA.map((item) => {
            const IconComponent = item.icon;
            return (
              <StyledNavLink key={item.name} to={item.path} end>
                {({ isActive }) => (
                  <div className="flex items-center gap-2">
                    {IconComponent && (
                      <IconWrapper isActive={isActive}>
                        <IconComponent
                          size="18"
                          variant="Outline"
                        />
                      </IconWrapper>
                    )}
                    <Label>{item.name}</Label>
                  </div>
                )}
              </StyledNavLink>
            );
          })}
        </SidebarItemContainer>
      </SidebarNav>
    </SidebarContainer>
  );
}

/* Sidebar layout */
const SidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const SidebarNav = styled.nav`
  flex-basis: 0%;
  overflow: auto;
  flex-grow: 1;
  flex-shrink: 1;
`;

const SidebarItemContainer = styled.div`
  width: 100%;
  padding-block-end: var(--ds-space-150, 9pt);
  padding-block-start: var(--ds-space-150, 9pt);
  padding-inline-start: var(--ds-space-200, 7pt);
  padding-inline-end: var(--ds-space-200, 7pt);
`;

/* Base item styles (Emotion CSS block) */
const baseItem = css`
  display: flex;
  align-items: center;
  position: relative;
  padding: 6px 8px 6px 8px;
  border-radius: 4px;
  margin-top: 5px;
  font-size: 14px;
  color: #172b4d;
  text-decoration: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  gap: 0.3rem;

  &:hover {
    background-color: #ebecf0;
  }
`;

/* Styled NavLink using Emotion + route awareness */
const StyledNavLink = styled(NavLink)`
  ${baseItem};

  &.active {
    background-color: #deebff;
    color: #0c66e4;

    &::before {
      content: "";
      position: absolute;
      left: 1px;
      top: 33%;
      bottom: 4px;
      width: 2px;
      height: 11px;
      background-color: #0c66e4;
      border-radius: 20px;
    }

    &:hover {
      background-color: #deebff;
    }
  }
`;

const IconWrapper = styled.span<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;

  svg {
    path,
    line,
    polyline,
    rect,
    circle {
      stroke-width: ${({ isActive }) => (isActive ? 0.5 : 0.2)}; /* 👈 Thicker stroke via CSS */
      stroke: ${({ isActive }) => (isActive ? "#0C66E4" : "#172B4D")};
      transition: stroke 0.2s ease, stroke-width 0.2s ease;
    }
  }
`;

const Label = styled.span`
  color: inherit;
`;