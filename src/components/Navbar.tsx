import '../css/common.css'
import Avatar from './Avatar'
import { GoSidebarCollapse, GoSidebarExpand } from "react-icons/go";
import { Button, Dropdown, MenuProps } from 'antd'
import { CookieService } from '../store/Cookie';
import { PiUserCircleCheckDuotone, PiGearFineDuotone } from "react-icons/pi";
import { BiLogOutCircle } from "react-icons/bi";

interface NavbarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Navbar({ isOpen, onToggle }: NavbarProps) {
  const handleToggleClick = () => {
    onToggle();
  };

  const logout =()=>{
    CookieService.removeAll();
  }

  const email = CookieService.get('email');
  const name = CookieService.get('user_name');

  const generateMenuItems = (): MenuProps["items"] => [
    {
      label: (
        <div className="w-full h-[10vh] p-2 flex items-center gap-3">
          <Avatar name={email || 'User'} size={50} />
          <div className='w-full flex flex-col'>
            <span className='font-bold'>{name || 'User Name'}</span>
            <span className=''>{email || 'User'}</span>
          </div>
        </div>
      ),
      key: "loga",
      // onClick: () => handleSort(field, "ASC"),
    },
    {
      label: (
        <div className="w-full flex items-center gap-2 px-1 py-1">
          <PiUserCircleCheckDuotone size={25} />
          <span className="text-[14px]">Profile</span>
        </div>
      ),
      key: "pro",
      // onClick: () => handleSort(field, "ASC"),
    },
    {
      label: (
        <div className="w-full flex items-center gap-2 p-1">
          <PiGearFineDuotone size={25}/>
          <span className="text-[14px]">Account Settings</span>
        </div>
      ),
      key: "sec",
      // onClick: () => handleSort(field, "ASC"),
    },
    {
      label: (
        <div className="w-full flex items-center gap-2 p-1">
          <BiLogOutCircle size={20} />
          <span>Log Out</span>
        </div>
      ),
      key: "log",
      onClick: logout,
      danger: true
    },
  ];

  return (
    <>
      <div className='w-full flex gap-5'>
        <div className='flex items-center gap-4'>
          <Button
            type="text"
            icon={isOpen ? <GoSidebarCollapse size={20} /> : <GoSidebarExpand size={20} />}
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
        <Dropdown
          menu={{ items: generateMenuItems() }}
          trigger={["click"]}
          overlayStyle={{ width: "20%" }}
        >
          <Button type="text" style={{ padding: 0 }}>
            <Avatar name={email || 'User'} size={30} />
          </Button>
        </Dropdown>
      </div>
    </>
  )
}