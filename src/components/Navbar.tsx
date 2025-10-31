import '../css/common.css'
import Avatar from './Avatar'
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";
import Button from './button'

interface NavbarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Navbar({ isOpen, onToggle }: NavbarProps) {
  const handleToggleClick = () => {
    onToggle();
  };

  return (
    <>
      <div className='w-full flex gap-5'>
        <div className='flex items-center gap-4'>
          <Button 
            icon={isOpen ? GoSidebarExpand : GoSidebarCollapse} 
            onClick={handleToggleClick}
          />
          <span className='text-lg font-bold'>Logo</span>
        </div>
        <div className='flex items-center gap-4'>
          <button className='font-bold'>Home</button>
          <button className='font-bold'>About</button>
          <button className='font-bold'>Create</button>
        </div>
      </div>
      <div className='flex items-center h-full gap-4'>
        <Avatar size={34} email="Dilip.Sivam@gmail.com" />
      </div>
    </>
  )
}