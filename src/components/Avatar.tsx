import { useEffect, useRef } from 'react';
import '../css/common.css'

interface AvatarProps {
  email?: string;
  name?: string;
  imgSrc?: string;
  size: number;
}

export default function Avatar({ size, email, name, imgSrc }: AvatarProps) {

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    generateAvatar();
  }, [size, email, name, imgSrc]);

  const generateAvatar = () => {
    const initials = getInitials(email, name);
    const colours = [
      '#e53935', '#d81b60', '#8e24aa', '#5e35b1', '#3949ab',
      '#1e88e5', '#039be5', '#00acc1', '#00897b', '#43a047',
      '#7cb342', '#c0ca33', '#fdd835', '#ffb300', '#fb8c00',
      '#f4511e', '#6d4c41', '#757575', '#546e7a'
    ];

    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        const charIndex = (initials === '?' ? 72 : initials.charCodeAt(0)) - 64;
        const colourIndex = charIndex % colours.length;
        canvas.width = size;
        canvas.height = size;
        context.fillStyle = colours[colourIndex - 1];
        context.fillRect(0, 0, size, size);
        context.font = `${Math.round(size / 2.2)}px "DKSans"`;
        context.textAlign = 'center';
        context.fillStyle = '#FFF';
        context.fillText(initials, size / 2, size / 1.5);
      }
    }
  };

  const getInitials = (email?: string, name?: string) => {
    if (name) {
      const nameParts = name.split(' ');
      return nameParts.map(part => part.charAt(0)).slice(0, 2).join('').toUpperCase();
    }
    if (email) {
      const emailParts = email.split('@')[0].split('.');
      let initials = '';
      if (emailParts.length >= 2) {
        initials = emailParts[0].charAt(0) + emailParts[1].charAt(0);
      } else if (emailParts.length === 1) {
        initials = emailParts[0].charAt(0);
      } else {
        initials = '?';
      }
      return initials.toUpperCase();
    }
    return '?';
  };

  return <canvas className='rounded-full' ref={canvasRef} />;
  
}