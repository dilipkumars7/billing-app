import React from 'react'
import '../css/common.css'
import Avatar from './Avatar'

export default function Navbar() {
  return (
    <div className={`tracking-wide h-[56px] z-10 fixed w-full top-0 bg-white`}>
      <header className='nav-header relative flex'>
        <div className='w-full flex gap-5'>
          <div className='flex items-center gap-4'>
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
      </header>
    </div>
  )
}
