/** @jsxImportSource @emotion/react */
import styled from "@emotion/styled";
import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  const isOpened = localStorage.getItem("isOpen");
  const [isOpen, setIsOpen] = useState<boolean>(
    isOpened === "true" // ✅ convert string → boolean
  );

  const handleToggle = () => {
    const newValue = !isOpen;
    setIsOpen(newValue);
    localStorage.setItem("isOpen", String(newValue));
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("isOpen", "false");
  };

  return (
    <LayoutGrid isOpen={isOpen}>
      <NavbarWrapper>
        <Navbar isOpen={isOpen} onToggle={handleToggle} />
      </NavbarWrapper>
      
      {/* Backdrop - only visible on mobile when sidebar is open */}
      {isOpen && <Backdrop onClick={handleClose} />}
      
      <SidebarWrapper isOpen={isOpen}>
        <Sidebar />
      </SidebarWrapper>
      
      <MainContent isOpen={isOpen}>
        <Outlet />
      </MainContent>
    </LayoutGrid>
  );
}

const LayoutGrid = styled.div<{ isOpen: boolean }>`
  display: grid;
  height: 100vh;
  width: 100%;
  grid-template-areas:
    "navbar navbar"
    "sidebar main";
  grid-template-columns: ${({ isOpen }) => (isOpen ? "240px" : "0px")} 1fr;
  grid-template-rows: 60px 1fr;
  transition: grid-template-columns 0.3s ease-in-out;


  @media (max-width: 968px) {
    grid-template-areas:
      "navbar"
      "main";
    grid-template-columns: 1fr;
    transition: none;
  }
`;

const NavbarWrapper = styled.header`
  grid-area: navbar;
  background-color: #ffff;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-block-end: 1px solid var(--sdk-border, #EBECF0);
  padding-inline-end: var(--sdk-space-150, 12px);
  padding-inline-start: var(--sdk-space-150, 12px);
  -webkit-box-align: center;
  color: var(--sdk-text-high-emphasis, #172B4D);
`;

const Backdrop = styled.div`
  display: none;

  @media (max-width: 968px) {
    display: block;
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999;
  }
`;

const SidebarWrapper = styled.aside<{ isOpen: boolean }>`
  grid-area: sidebar;
  background-color: #ffff;
  border-right: 1px solid var(--sdk-border, #EBECF0);
  overflow-y: auto;
  width: 240px;
  opacity: ${({ isOpen }) => (isOpen ? "1" : "0")};
  transition: opacity 0.3s ease-in-out;

  @media (max-width: 968px) {
    position: fixed;
    top: 60px;
    left: 0;
    bottom: 0;
    width: 260px;
    z-index: 1000;
    transform: translateX(${({ isOpen }) => (isOpen ? "0" : "-100%")});
    opacity: 1;
    transition: transform 0.3s ease-in-out;
    box-shadow: ${({ isOpen }) => (isOpen ? "2px 0 8px rgba(0, 0, 0, 0.15)" : "none")};
  }
`;

const MainContent = styled.main<{ isOpen: boolean }>`
  grid-area: main;
  background-color: #FFFFFF;
  overflow-y: auto;
  width: 100%;
  transition: width 0.3s ease-in-out;

  @media (max-width: 968px) {
    width: 100%;
    transition: none;
  }
`;