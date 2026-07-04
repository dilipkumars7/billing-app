import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import styled from '@emotion/styled';
import { FiPlus, FiCalendar, FiMapPin } from 'react-icons/fi';
import type { DashboardWelcome } from '../../types/dashboard.types';
import Avatar from '../Avatar';

interface Props {
  data: DashboardWelcome | null;
  loading: boolean;
}

const Card = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(130deg, #ffffff 0%, #eff1ff 45%, #f3f0ff 100%);
  min-height: 128px;
  box-shadow: 0 1px 20px rgba(99, 102, 241, 0.08);

  @media (max-width: 600px) {
    padding: 22px 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 18px;
  }
`;

const BlobBase = styled.div`
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  will-change: transform;
`;

const BlobLavender = styled(BlobBase)`
  width: 260px;
  height: 260px;
  right: 80px;
  top: -80px;
  background: radial-gradient(circle, #a78bfa 0%, #c4b5fd 60%, transparent 100%);
  filter: blur(55px);
  opacity: 0.45;
`;

const BlobBlue = styled(BlobBase)`
  width: 200px;
  height: 200px;
  right: -30px;
  top: -30px;
  background: radial-gradient(circle, #93c5fd 0%, #bfdbfe 70%, transparent 100%);
  filter: blur(45px);
  opacity: 0.5;
`;

const BlobYellow = styled(BlobBase)`
  width: 140px;
  height: 140px;
  right: 20px;
  bottom: -40px;
  background: radial-gradient(circle, #fde68a 0%, #fef3c7 70%, transparent 100%);
  filter: blur(40px);
  opacity: 0.55;
`;

const BlobPurpleLeft = styled(BlobBase)`
  width: 120px;
  height: 120px;
  left: -20px;
  bottom: -30px;
  background: radial-gradient(circle, #c4b5fd 0%, #ddd6fe 70%, transparent 100%);
  filter: blur(35px);
  opacity: 0.3;
`;

const LeftSection = styled.div`
  position: relative;
  z-index: 1;
`;

const GreetingText = styled.p`
  font-size: 0.82rem;
  font-weight: 500;
  color: #6b7280;
  margin: 0 0 4px;
  letter-spacing: 0.02em;
`;

const UserName = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 14px;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 1.4rem;
  }

  @media (max-width: 480px) {
    font-size: 1.2rem;
  }
`;

const Pills = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const Pill = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 99px;
  padding: 4px 12px 4px 10px;
  font-size: 0.775rem;
  color: #4338ca;
  font-weight: 500;
  white-space: nowrap;
`;

const RightSection = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;

  @media (max-width: 600px) {
    width: 100%;
    justify-content: flex-end;
  }
`;


const NewBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
  transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;

  &:hover {
    opacity: 0.92;
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(79, 70, 229, 0.45);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 3px 10px rgba(79, 70, 229, 0.3);
  }
`;

const Skeleton = styled.div`
  border-radius: 10px;
  height: 128px;
  background: linear-gradient(130deg, #f5f5ff 0%, #ede9fe 100%);

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  animation: pulse 1.5s ease-in-out infinite;
`;

export default function WelcomeCard({ data, loading }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const blobLavenderRef = useRef<HTMLDivElement>(null);
  const blobBlueRef = useRef<HTMLDivElement>(null);
  const blobYellowRef = useRef<HTMLDivElement>(null);
  const blobPurpleRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Lavender blob — large slow drift, diagonal
      gsap.to(blobLavenderRef.current, {
        x: -30,
        y: 25,
        scale: 1.12,
        duration: 7,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      });

      // Blue blob — drift upward + left, slight scale
      gsap.to(blobBlueRef.current, {
        x: -20,
        y: 18,
        scale: 1.08,
        duration: 5.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: 0.8,
      });

      // Yellow blob — rises upward, breathes
      gsap.to(blobYellowRef.current, {
        x: -18,
        y: -22,
        scale: 1.15,
        duration: 6.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: 0.4,
      });

      // Purple left blob — drifts right + up
      gsap.to(blobPurpleRef.current, {
        x: 20,
        y: -16,
        scale: 1.1,
        duration: 8,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: 1.2,
      });
    },
    { scope: cardRef }
  );

  if (loading) return <Skeleton />;

  return (
    <Card ref={cardRef}>
      <BlobLavender ref={blobLavenderRef} />
      <BlobBlue ref={blobBlueRef} />
      <BlobYellow ref={blobYellowRef} />
      <BlobPurpleLeft ref={blobPurpleRef} />

      <LeftSection>
        <GreetingText>{data?.greeting}</GreetingText>
        <UserName>{data?.userName ?? '—'}</UserName>
        <Pills>
          <Pill>
            <FiMapPin size={11} />
            {data?.companyName ?? '—'}
          </Pill>
          <Pill>
            <FiCalendar size={11} />
            {data?.currentDate}
          </Pill>
        </Pills>
      </LeftSection>

      <RightSection>
        <Avatar size={45} name={data?.userName}></Avatar>
        <NewBtn>
          <FiPlus size={15} />
          New Invoice
        </NewBtn>
      </RightSection>
    </Card>
  );
}
