import { useEffect, useRef, useState  } from "react";
import { gsap } from "gsap";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom";;
import Input from "../components/Input";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import '../css/login.css'
import { PATH } from "../constants/app.constant";
import { useApi } from "../hooks/useApi";
import { CookieService } from "../store/Cookie";
import { useNotification } from '../components/provider/NotificationProvider';
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/material.css'
import Register from "./register";
import { useDispatch } from "react-redux";
import { setUserSettings } from "../store/userSettingsSlice";


const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[1-9]\d{6,14}$/;

const baseSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email or phone number is required")
    .refine(
      (value) => emailRegex.test(value) || phoneRegex.test(value),
      (value) => {
        if (!value || value.trim() === "") {
          return { message: "Email or phone number is required" };
        }
        if (value.includes("@")) {
          return { message: "Please enter a valid email address (e.g., user@example.com)" };
        }
        if (/^\d+$/.test(value)) {
          return { message: "Please enter a valid phone number (10 digits minimum)" };
        }
        return { message: "Please enter a valid email address or phone number" };
      }
    ),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof baseSchema>;

export default function Login() {

  const [activeIndex, setActiveIndex] = useState(0);
  const progressCircle = useRef<SVGSVGElement | null>(null);
  const progressContent = useRef<HTMLSpanElement | null>(null);
  const notificationApi = useNotification();

  const [inputType, setInputType] = useState<"email" | "phone">("email");
  const [inputValue, setInputValue] = useState("");
  const [isRegister, setIsRegister] = useState(false); 

  const { data, loading, error, refetch } = useApi<any>(
    PATH.LOGIN,
    { method: 'POST', autoFetch: false }
  );

  const dispatch = useDispatch();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setValue("email", value, { shouldValidate: true });

    // switch modes dynamically
    if (/^\d+$/.test(value) && value.length > 0) {
      setInputType("phone");
    } else {
      setInputType("email");
    }
  };

  const handlePhoneChange = (value: string) => {
    const numericValue = value.replace(/^91/, "");

    if (!numericValue || numericValue.trim() === "") {
      setInputType("email");
      setInputValue("");
      setValue("email", "", { shouldValidate: true });
      return;
    }

    setInputType("phone");
    setInputValue(value);
    setValue("email", value, { shouldValidate: true }); // keep RHF synced
  };


  useEffect(() => {
    if (data) {
      navigate('/dashboard');
      CookieService.set('user', data.userId);
      CookieService.set('authToken', data.authToken);
      CookieService.set('email', data.userEmail);
      CookieService.set('role', data.userRole);
      CookieService.set('user_name', data.userName);    
      CookieService.set('user_id', data.userCode);
      CookieService.set('companyId', data.userCompany);
      setTimeout(() => {
        notificationApi.success({
          message: `Hey ${data.userName}`,
          description: `${data?.message}`,
          showProgress: true,
          pauseOnHover: true,
        });
      }, 900);
      setTimeout(()=>{
        userRefetch();
      }, 2000)
    }
    if (error) {
      notificationApi.error({
        message: error.error,
        description: `${error?.message || 'Login failed. Please try again.'}`,
        showProgress: true,
        pauseOnHover: true,
      });
    }
  }, [data, error]);


  useEffect(()=>{
    const activeSlide = document.querySelector(`.swiper-slide-active`);
    const blobs = activeSlide?.querySelectorAll(".blob") || [];
    if (blobs) {
      gsap.to(blobs, {
        x: (i) => [180, -190, 180, -10, -200][i],
        y: (i) => [-100, 110, 110, -210, -90][i],
        scale: () => gsap.utils.random(1.2, 1.4),
        rotation: () => gsap.utils.random(-360, 360),
        duration: 3,
        ease: "power2.out",
        onComplete: () => {
          blobs.forEach((blob) => {
            gsap.to(blob, {
              x: () => `+=${gsap.utils.random(-10, 10)}`, // Random horizontal drift
              y: () => `+=${gsap.utils.random(-10, 10)}`, // Random vertical drift
              duration: gsap.utils.random(2, 4), // Random duration for smooth float
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1, // Infinite floating
            });
          });
        },
      });
    }
    return () => {
      gsap.killTweensOf(".blob");
      gsap.set(".blob", { x: 0, y: 0, scale: 1, rotation: 0 });
    };
  }, [activeIndex])

  const onAutoplayTimeLeft = (_s:SwiperType, time: number, progress: number) => {
    if (progressCircle.current && progressContent.current) {
      progressCircle.current.style.setProperty("--progress", (1 - progress).toString());
      progressContent.current.textContent = `${Math.ceil(time / 1000)}s`;
    }
  };

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(baseSchema),
    mode: "onChange",
  });

  const navigate = useNavigate();

  const onSubmit = (formData: FormData) => {
    const finalInput = inputValue || formData.email.trim();

    const isPhone = phoneRegex.test(finalInput);
    const isEmail = emailRegex.test(finalInput);

    // extra runtime guard
    if (!isPhone && !isEmail) {
      notificationApi.error({
        message: "Invalid Input",
        description: "Please enter a valid email address or phone number.",
        showProgress: true,
        pauseOnHover: true,
      });
      return;
    }

    const body = isPhone
      ? { phone: finalInput.replace(/^91/, ""), password: formData.password }
      : { email: finalInput, password: formData.password };

    refetch({ body });
  };

  const EmailIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={22} height={22} color={"#31304D"} fill={"none"}>
      <path d="M15.6 8.40033V12.9003C15.6 14.3915 16.8088 15.6003 18.3 15.6003C19.7912 15.6003 21 14.3915 21 12.9003V12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C14.0265 21 15.8965 20.3302 17.4009 19.2M15.6 12.0003C15.6 13.9886 13.9882 15.6003 12 15.6003C10.0118 15.6003 8.4 13.9886 8.4 12.0003C8.4 10.0121 10.0118 8.40033 12 8.40033C13.9882 8.40033 15.6 10.0121 15.6 12.0003Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  const PassIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={22} height={22} color={"#31304D"} fill={"none"}>
      <path d="M12 16.5V14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4.2678 18.8447C4.49268 20.515 5.87612 21.8235 7.55965 21.9009C8.97626 21.966 10.4153 22 12 22C13.5847 22 15.0237 21.966 16.4403 21.9009C18.1239 21.8235 19.5073 20.515 19.7322 18.8447C19.8789 17.7547 20 16.6376 20 15.5C20 14.3624 19.8789 13.2453 19.7322 12.1553C19.5073 10.485 18.1239 9.17649 16.4403 9.09909C15.0237 9.03397 13.5847 9 12 9C10.4153 9 8.97626 9.03397 7.55965 9.09909C5.87612 9.17649 4.49268 10.485 4.2678 12.1553C4.12104 13.2453 3.99999 14.3624 3.99999 15.5C3.99999 16.6376 4.12104 17.7547 4.2678 18.8447Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.5 9V6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSignUpClick = () => {
    setIsRegister(true);
    const url = new URL(window.location.href);
    url.searchParams.set("app", "register");
    window.history.pushState({}, "", url);
  };

  const handleLoginClick = () => {
    setIsRegister(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("app"); // remove the "app" query param
    window.history.pushState({}, "", url);
  };

  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const appParam = params.get("app");
      setIsRegister(appParam === "register");
    };

    // Run initially
    handleUrlChange();

    // Listen for back/forward navigation
    window.addEventListener("popstate", handleUrlChange);

    return () => window.removeEventListener("popstate", handleUrlChange);
  }, []);
  
  return (
    <>
      <div className="grid grid-cols-[60%_40%] gap-4 w-full overflow-hidden">

        <div className="h-[100vh] w-full anime-bg p-10 relative">

          <div className="grainy-bg"></div>
          <svg width="0" height="0" className="-z-10">
            <filter id="grainy" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency=".777"></feTurbulence>
              <feColorMatrix type="saturate" values="0"></feColorMatrix>
              <feBlend mode="multiply" in="SourceGraphic"></feBlend>
            </filter>
          </svg>
          <Swiper className={`h-full w-full flex items-center justify-center`} centeredSlides={true} spaceBetween={100} slidesPerView={1} effect="fade" navigation={false}
            modules={[Autoplay, Pagination, Navigation]} onAutoplayTimeLeft={onAutoplayTimeLeft}
            onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)} 
            // autoplay={true}
            autoplay={{
              delay: 10000,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
              type: "custom",
              renderCustom: (_swiper, current, total) => {
                return Array.from({ length: total }, (_, i) =>
                  `<span class="custom-bullet ${i + 1 === current ? "active" : ""}" data-index="${i}"></span>`
                ).join("");
              },
            }}
          >
            <SwiperSlide>
              <div className='h-full w-full flex justify-center items-center relative z-10'>
                <svg className="blob absolute" width="18" height="18" viewBox="0 0 200 200" fill="#F9B21D"> <g clipPath="url(#clip0_105_323)"> <path fillRule="evenodd" clipRule="evenodd" d="M106.973 87.6003C103.915 93.0385 96.0852 93.0385 93.027 87.6003L50.4686 11.9213C47.4696 6.58851 51.3234 7.97602e-06 57.4416 5.67316e-06L142.558 0C148.677 -5.34872e-07 152.53 6.58849 149.531 11.9213L106.973 87.6003ZM87.6003 106.973C93.0385 103.915 93.0385 96.0851 87.6003 93.0269L11.9213 50.4685C6.58848 47.4696 -1.12708e-05 51.3233 -1.15382e-05 57.4415L-1.52588e-05 142.558C-1.55262e-05 148.677 6.58849 152.53 11.9213 149.531L87.6003 106.973ZM106.973 112.4C103.915 106.961 96.0852 106.962 93.027 112.4L50.4686 188.079C47.4697 193.412 51.3234 200 57.4416 200H142.558C148.677 200 152.53 193.411 149.531 188.079L106.973 112.4ZM112.4 93.027C106.961 96.0853 106.961 103.915 112.4 106.973L188.079 149.531C193.412 152.53 200 148.677 200 142.558V57.4417C200 51.3235 193.411 47.4697 188.079 50.4687L112.4 93.027Z" fill="url(#paint0_linear_105_323)"/> </g> <defs> <linearGradient id="paint0_linear_105_323" x1="100" y1="0" x2="100" y2="200" gradientUnits="userSpaceOnUse"> <stop stopColor="#F9B21D"/> <stop offset="1" stopColor="#F9B21D"/> </linearGradient> <clipPath id="clip0_105_323"> <rect width="200" height="200" fill="white"/> </clipPath> </defs> </svg>
                <svg className="blob absolute" width="20" height="20" viewBox="0 0 200 200" fill="#F95454"> <g clipPath="url(#clip0_119_289)"> <path d="M99.552 18.9087C99.552 -35.1254 133.316 41.4697 119.834 64.8658C133.34 41.4697 216.568 32.4143 169.764 59.4373C216.568 32.4143 167.116 100.002 140.104 100.002C167.116 100.002 216.568 167.553 169.764 140.566C216.568 167.589 133.34 158.534 119.834 135.138C133.34 158.534 99.552 235.129 99.552 181.095C99.552 235.129 65.7762 158.534 79.2698 135.138C65.7642 158.534 -17.4643 167.589 29.3398 140.566C-17.4643 167.589 31.9884 100.002 59.0114 100.002C31.9884 100.002 -17.4643 32.4501 29.3398 59.4373C-17.4643 32.4143 65.7642 41.4697 79.2698 64.8658C65.7762 41.4458 99.552 -35.1254 99.552 18.9087Z" fill="url(#paint0_linear_119_289)"/> </g> <defs> <linearGradient id="paint0_linear_119_289" x1="151.045" y1="32" x2="38.0152" y2="135.004" gradientUnits="userSpaceOnUse"> <stop offset="0.0509862" stopColor="#F95454"/> <stop offset="1" stopColor="#F95454"/> </linearGradient> <clipPath id="clip0_119_289"> <rect width="200" height="200" fill="white"/> </clipPath> </defs> </svg>
                <svg className="blob absolute" width="18" height="18" viewBox="0 0 200 200" fill="#ffde4d"> <path fillRule="evenodd" clipRule="evenodd" d="M128.603 16.3347C115.825 -5.44489 84.3365 -5.4449 71.5579 16.3347L71.0938 17.1257C65.1986 27.1733 54.4518 33.378 42.8027 33.4596L41.8856 33.466C16.6346 33.6428 0.890585 60.9123 13.3629 82.8687L13.8159 83.6661C19.5698 93.7953 19.5698 106.205 13.8159 116.334L13.3629 117.131C0.890586 139.088 16.6346 166.357 41.8856 166.534L42.8027 166.54C54.4517 166.622 65.1986 172.827 71.0938 182.874L71.5579 183.665C84.3365 205.445 115.825 205.445 128.603 183.665L129.067 182.874C134.963 172.827 145.709 166.622 157.358 166.54L158.276 166.534C183.527 166.357 199.271 139.088 186.798 117.131L186.345 116.334C180.591 106.205 180.591 93.7953 186.345 83.6661L186.798 82.8687C199.271 60.9123 183.527 33.6428 158.276 33.466L157.358 33.4596C145.709 33.378 134.963 27.1733 129.067 17.1257L128.603 16.3347ZM100.081 149.604C127.476 149.604 149.685 127.396 149.685 100C149.685 72.6042 127.476 50.3955 100.081 50.3955C72.6848 50.3955 50.4761 72.6042 50.4761 100C50.4761 127.396 72.6848 149.604 100.081 149.604Z" fill="url(#paint0_linear_104_76)"/> <defs> <linearGradient id="paint0_linear_104_76" x1="100.081" y1="0" x2="100.081" y2="200" gradientUnits="userSpaceOnUse"> <stop stopColor="#ffde4d"/> <stop offset="1" stopColor="#ffde4d"/> </linearGradient> </defs> </svg>
                <svg className="blob absolute" width="18" height="18" viewBox="0 0 200 200" fill="#B1D690"> <g clipPath="url(#clip0_103_9)"> <path d="M89.9318 6.12863C94.1569 -2.04288 105.843 -2.04288 110.068 6.12863L136.973 58.1644C138.051 60.2496 139.75 61.9486 141.836 63.0268L193.871 89.9318C202.043 94.1569 202.043 105.843 193.871 110.068L141.836 136.973C139.75 138.051 138.051 139.75 136.973 141.836L110.068 193.871C105.843 202.043 94.1569 202.043 89.9318 193.871L63.0268 141.836C61.9486 139.75 60.2496 138.051 58.1644 136.973L6.12863 110.068C-2.04288 105.843 -2.04288 94.1569 6.12863 89.9318L58.1644 63.0268C60.2496 61.9486 61.9486 60.2496 63.0268 58.1644L89.9318 6.12863Z" fill="url(#paint0_linear_103_9)"/> </g> <defs> <linearGradient id="paint0_linear_103_9" x1="100" y1="0" x2="100" y2="200" gradientUnits="userSpaceOnUse"> <stop stopColor="#B1D690"/> <stop offset="1" stopColor="#B1D690"/> </linearGradient> <clipPath id="clip0_103_9"> <rect width="200" height="200" fill="white"/> </clipPath> </defs> </svg>
                <svg className="blob absolute" width="18" height="18" viewBox="0 0 200 200" fill="#b771e5"> <g clipPath="url(#clip0_119_318)"> <path fillRule="evenodd" clipRule="evenodd" d="M99.9942 183.711C106.781 191.856 113.567 200 127.14 200C158.384 200 167.409 158.444 167.421 127.156C167.421 113.584 175.565 106.798 183.71 100.012C191.855 93.2255 200 86.4395 200 72.8675C200 41.6139 158.384 32.5774 127.151 32.5774C113.579 32.5774 106.792 24.4331 100.006 16.2887C93.2194 8.14435 86.433 0 72.8602 0C41.6048 0 32.5678 41.6139 32.5678 72.8445C32.5678 86.4165 24.4259 93.2025 16.2839 99.9885C8.14196 106.775 0 113.561 0 127.133C0 158.386 41.6048 167.423 72.8487 167.423C86.4215 167.423 93.2079 175.567 99.9942 183.711ZM100 137C120.435 137 137 120.435 137 100C137 79.5655 120.435 63 100 63C79.5655 63 63 79.5655 63 100C63 120.435 79.5655 137 100 137Z" fill="url(#paint0_linear_119_318)"/> </g> <defs> <linearGradient id="paint0_linear_119_318" x1="100" y1="0" x2="100" y2="200" gradientUnits="userSpaceOnUse"> <stop stopColor="#b771e5"/> <stop offset="1" stopColor="#b771e5"/> </linearGradient> <clipPath id="clip0_119_318"> <rect width="200" height="200" fill="white"/> </clipPath> </defs> </svg>
                <div className="relative flex w-[220px] flex-col rounded-xl bg-white bg-clip-border text-gray-700 shadow-md">
                  <div className="relative mx-4 -mt-6 h-40 overflow-hidden rounded-xl bg-blue-gray-500 bg-clip-border text-white shadow-lg shadow-blue-gray-500/40 bg-gradient-to-r from-blue-500 to-blue-600">
                  </div>
                  <div className={`p-4`}>
                    <h5 className="mb-2 block text-xl font-semibold leading-snug tracking-normal text-blue-gray-900 antialiased">
                      Precision invoicing at its best.
                    </h5>
                  </div>
                </div>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className='h-full w-full flex justify-center items-center relative z-10'>
                <svg className="blob absolute" width="15" height="15" viewBox="0 0 200 200" fill="#B3FFAE"> <g clipPath="url(#clip0_234_943)"> <path fillRule="evenodd" clipRule="evenodd" d="M200 50V4.37114e-06L100 0V49.9803C99.9893 22.3751 77.6077 4.37114e-06 50 4.37114e-06H2.18557e-06V100H50C22.3858 100 -1.20706e-06 122.386 0 150L2.18557e-06 200H100L100 150C100 177.614 122.386 200 150 200H200L200 100H150.02C177.625 99.9893 200 77.6077 200 50Z" fill="url(#paint0_linear_234_943)"/> </g> <defs> <linearGradient id="paint0_linear_234_943" x1="27.5" y1="19" x2="149" y2="174.5" gradientUnits="userSpaceOnUse"> <stop stopColor="#B3FFAE"/> <stop offset="1" stopColor="#B3FFAE"/> </linearGradient> <clipPath id="clip0_234_943"> <rect width="200" height="200" fill="white"/> </clipPath> </defs> </svg>
                <svg className="blob absolute" width="18" height="18" viewBox="0 0 200 200" fill="#31E1F7"> <g clipPath="url(#clip0_238_1331)"> <path fillRule="evenodd" clipRule="evenodd" d="M146.371 34.5888C147.629 31.5563 148.272 28.3046 148.265 25.0218C148.267 20.0831 146.806 15.2545 144.066 11.1455C141.326 7.03648 137.431 3.83135 132.871 1.9347C128.311 0.038053 123.291 -0.465076 118.445 0.488832C113.6 1.44274 109.145 3.81092 105.644 7.29439L100.004 12.5471L94.4021 7.31163C89.7108 2.62604 83.3503 -0.00403591 76.7198 4.64873e-06C70.0894 0.00404521 63.7321 2.64187 59.0465 7.33318C54.3609 12.0245 51.7308 18.385 51.7348 25.0155C51.7389 31.6459 54.3767 38.0032 59.068 42.6888L97.5477 81.7374C97.8685 82.0631 98.2508 82.3217 98.6725 82.4983C99.0941 82.6748 99.5467 82.7658 100.004 82.7658C100.461 82.7658 100.914 82.6748 101.335 82.4983C101.757 82.3217 102.139 82.0631 102.46 81.7374L140.94 42.6888C143.268 40.3744 145.114 37.6213 146.371 34.5888ZM53.6286 165.411C52.3712 168.444 51.7276 171.695 51.7349 174.978C51.7327 179.917 53.1938 184.746 55.9336 188.855C58.6735 192.964 62.5693 196.169 67.1293 198.065C71.6892 199.962 76.7089 200.465 81.5546 199.511C86.4003 198.557 90.8547 196.189 94.3556 192.706L99.9961 187.453L105.598 192.688C110.289 197.374 116.65 200.004 123.28 200C129.911 199.996 136.268 197.358 140.954 192.667C145.639 187.976 148.269 181.615 148.265 174.985C148.261 168.354 145.623 161.997 140.932 157.311L102.452 118.263C102.132 117.937 101.749 117.678 101.327 117.502C100.906 117.325 100.453 117.234 99.9961 117.234C99.539 117.234 99.0864 117.325 98.6647 117.502C98.2431 117.678 97.8607 117.937 97.54 118.263L59.0603 157.311C56.7321 159.626 54.8859 162.379 53.6286 165.411ZM174.978 148.266C171.695 148.273 168.444 147.629 165.411 146.372C162.379 145.115 159.626 143.268 157.311 140.94L118.263 102.461C117.937 102.14 117.678 101.757 117.502 101.336C117.325 100.914 117.234 100.462 117.234 100.004C117.234 99.5473 117.325 99.0947 117.502 98.6731C117.678 98.2514 117.937 97.869 118.263 97.5483L157.311 59.0686C161.997 54.3773 168.354 51.7394 174.985 51.7354C181.615 51.7314 187.976 54.3614 192.667 59.047C197.358 63.7326 199.996 70.0899 200 76.7204C200.004 83.3509 197.374 89.7114 192.688 94.4027L187.453 100.004L192.706 105.645C196.189 109.146 198.557 113.6 199.511 118.446C200.465 123.292 199.962 128.311 198.065 132.871C196.169 137.431 192.964 141.327 188.855 144.067C184.746 146.807 179.917 148.268 174.978 148.266ZM34.5888 53.628C31.5563 52.3706 28.3046 51.727 25.0218 51.7343C20.0831 51.7321 15.2544 53.1932 11.1455 55.933C7.03647 58.6729 3.83134 62.5687 1.9347 67.1287C0.0380524 71.6887 -0.465076 76.7083 0.488831 81.554C1.44274 86.3997 3.81091 90.8542 7.29439 94.355L12.5471 99.9956L7.31163 105.597C2.62603 110.289 -0.00403599 116.649 4.64892e-06 123.28C0.00404529 129.91 2.64186 136.267 7.33317 140.953C12.0245 145.639 18.385 148.269 25.0155 148.265C31.6459 148.261 38.0032 145.623 42.6888 140.931L81.7373 102.452C82.063 102.131 82.3217 101.749 82.4982 101.327C82.6748 100.905 82.7657 100.453 82.7657 99.9955C82.7657 99.5384 82.6748 99.0858 82.4982 98.6642C82.3217 98.2425 82.063 97.8602 81.7373 97.5394L42.6888 59.0597C40.3744 56.7315 37.6213 54.8853 34.5888 53.628Z" fill="url(#paint0_linear_238_1331)"/> </g> <defs> <linearGradient id="paint0_linear_238_1331" x1="177" y1="-9.23648e-06" x2="39.5" y2="152.5" gradientUnits="userSpaceOnUse"> <stop stopColor="#31E1F7"/> <stop offset="1" stopColor="#31E1F7"/> </linearGradient> <clipPath id="clip0_238_1331"> <rect width="200" height="200" fill="white"/> </clipPath> </defs> </svg>
                <svg className="blob absolute" width="18" height="18" viewBox="0 0 200 200" fill="#FEDB39"> <g clipPath="url(#clip0_104_69)"> <path fillRule="evenodd" clipRule="evenodd" d="M120 14.2857C120 6.39593 113.604 0 105.714 0H94.2857C86.3959 0 80 6.39594 80 14.2857V17.2269C80 29.9541 64.6123 36.3279 55.6128 27.3284L53.533 25.2487C47.9541 19.6698 38.9089 19.6698 33.3299 25.2487L25.2487 33.3299C19.6698 38.9088 19.6698 47.954 25.2487 53.533L27.3285 55.6128C36.328 64.6123 29.9542 80 17.227 80H14.2857C6.39593 80 0 86.3959 0 94.2857V105.714C0 113.604 6.39593 120 14.2857 120H17.2269C29.9542 120 36.328 135.388 27.3285 144.387L25.2487 146.467C19.6698 152.046 19.6698 161.091 25.2487 166.67L33.3299 174.751C38.9089 180.33 47.9541 180.33 53.533 174.751L55.6128 172.671C64.6122 163.672 80 170.046 80 182.773V185.714C80 193.604 86.3959 200 94.2857 200H105.714C113.604 200 120 193.604 120 185.714V182.773C120 170.046 135.388 163.672 144.387 172.671L146.467 174.751C152.046 180.33 161.091 180.33 166.67 174.751L174.751 166.67C180.33 161.091 180.33 152.046 174.751 146.467L172.672 144.387C163.672 135.388 170.046 120 182.773 120H185.714C193.604 120 200 113.604 200 105.714V94.2857C200 86.3959 193.604 80 185.714 80H182.773C170.046 80 163.672 64.6123 172.671 55.6128L174.751 53.5329C180.33 47.954 180.33 38.9088 174.751 33.3299L166.67 25.2487C161.091 19.6697 152.046 19.6697 146.467 25.2487L144.387 27.3284C135.388 36.3279 120 29.9541 120 17.2269V14.2857Z" fill="url(#paint0_linear_104_69)"/> </g> <defs> <linearGradient id="paint0_linear_104_69" x1="14" y1="26" x2="179" y2="179.5" gradientUnits="userSpaceOnUse"> <stop stopColor="#FEDB39"/> <stop offset="1" stopColor="#FEDB39"/> </linearGradient> <clipPath id="clip0_104_69"> <rect width="200" height="200" fill="white"/> </clipPath> </defs> </svg>
                <svg className="blob absolute" width="18" height="18" viewBox="0 0 200 200" fill="#FF5403"> <g clipPath="url(#clip0_119_275)"> <path d="M127.14 200C99.9942 200 99.9943 167.423 72.8487 167.423C41.6048 167.423 0 158.386 0 127.133C0 99.9885 32.5678 99.9885 32.5678 72.8445C32.5678 41.6139 41.6048 0 72.8602 0C100.006 0 100.006 32.5774 127.151 32.5774C158.384 32.5774 200 41.6139 200 72.8675C200 100.012 167.421 100.012 167.421 127.156C167.409 158.444 158.384 200 127.14 200Z" fill="url(#paint0_linear_119_275)"/> </g> <defs> <linearGradient id="paint0_linear_119_275" x1="100" y1="0" x2="100" y2="200" gradientUnits="userSpaceOnUse"> <stop stopColor="#FF5403"/> <stop offset="1" stopColor="#FF5403"/> </linearGradient> <clipPath id="clip0_119_275"> <rect width="200" height="200" fill="white"/> </clipPath> </defs> </svg>
                <svg className="blob absolute" width="15" height="15" viewBox="0 0 200 200" fill="#FF8E00"> <g clipPath="url(#clip0_133_2)"> <path fillRule="evenodd" clipRule="evenodd" d="M50.7143 0H0.71429V50C0.71429 75.462 19.7466 96.4788 44.361 99.6002C19.4015 102.402 4.22025e-06 123.578 2.18557e-06 149.286L0 199.286H50C75.462 199.286 96.4788 180.253 99.6002 155.639C102.402 180.599 123.578 200 149.286 200H199.286V150C199.286 124.538 180.253 103.521 155.639 100.4C180.599 97.5984 200 76.422 200 50.7143V0.714286L150 0.714284C124.538 0.714282 103.521 19.7466 100.4 44.361C97.5984 19.4015 76.422 0 50.7143 0Z" fill="url(#paint0_linear_133_2)"/> </g> <defs> <linearGradient id="paint0_linear_133_2" x1="27.5" y1="19" x2="149" y2="174.5" gradientUnits="userSpaceOnUse"> <stop stopColor="#FF8E00"/> <stop offset="1" stopColor="#FF8E00"/> </linearGradient> <clipPath id="clip0_133_2"> <rect width="200" height="200" fill="white"/> </clipPath> </defs> </svg>
              </div>
            </SwiperSlide>
            <SwiperSlide>
              <div className='h-full w-full flex justify-center items-center relative z-10'>
                <svg className="blob absolute" width="18" height="18" viewBox="0 0 200 200" fill="#F9B21D"> <g clipPath="url(#clip0_104_61)"> <path d="M100 200C93.4028 200 87.3264 198.351 81.7708 195.052C76.3889 191.927 72.0486 187.674 68.75 182.292C65.625 176.736 64.0625 170.66 64.0625 164.062C64.0625 155.729 65.9722 148.785 69.7917 143.229C73.6111 137.674 79.5139 131.163 87.5 123.698C93.4028 118.316 96.3542 113.194 96.3542 108.333V103.646H91.6667C86.2847 103.646 78.9062 109.028 69.5312 119.792C60.3299 130.556 49.1319 135.937 35.9375 135.937C29.3403 135.937 23.2639 134.375 17.7083 131.25C12.3264 127.951 7.98611 123.611 4.6875 118.229C1.5625 112.674 0 106.597 0 100C0 93.4028 1.5625 87.4132 4.6875 82.0312C7.98611 76.4757 12.3264 72.1354 17.7083 69.0104C23.2639 65.7118 29.3403 64.0625 35.9375 64.0625C48.9583 64.0625 60.0694 69.3576 69.2708 79.9479C78.4722 90.5382 85.9375 95.8333 91.6667 95.8333H96.3542V91.6667C96.3542 86.8055 93.4028 81.684 87.5 76.3021L81.5104 70.8333C77.1701 66.8403 73.1771 62.066 69.5312 56.5104C65.8854 50.7812 64.0625 43.9236 64.0625 35.9375C64.0625 29.3403 65.625 23.3507 68.75 17.9688C72.0486 12.4132 76.3889 8.07292 81.7708 4.94791C87.3264 1.6493 93.4028 0 100 0C106.597 0 112.587 1.6493 117.969 4.94791C123.524 8.24652 127.865 12.5868 130.99 17.9688C134.288 23.3507 135.937 29.3403 135.937 35.9375C135.937 48.9583 130.642 60.0694 120.052 69.2708C109.462 78.4722 104.167 85.9375 104.167 91.6667V95.8333H108.333C114.236 95.8333 121.701 90.5382 130.729 79.9479C139.583 69.3576 150.694 64.0625 164.063 64.0625C170.66 64.0625 176.649 65.7118 182.031 69.0104C187.587 72.1354 191.927 76.3889 195.052 81.7708C198.351 87.1528 200 93.2292 200 100C200 106.597 198.351 112.674 195.052 118.229C191.927 123.611 187.587 127.951 182.031 131.25C176.649 134.375 170.66 135.937 164.063 135.937C155.903 135.937 148.872 133.941 142.969 129.948C137.24 125.955 130.816 120.139 123.698 112.5C118.316 106.597 113.194 103.646 108.333 103.646H104.167V108.333C104.167 114.757 109.462 122.222 120.052 130.729C130.642 139.236 135.937 150.347 135.937 164.062C135.937 170.66 134.288 176.736 130.99 182.292C127.865 187.674 123.611 191.927 118.229 195.052C112.847 198.351 106.771 200 100 200Z" fill="url(#paint0_linear_104_61)"/> </g> <defs> <linearGradient id="paint0_linear_104_61" x1="100" y1="0" x2="100" y2="200" gradientUnits="userSpaceOnUse"> <stop stopColor="#F9B21D"/> <stop offset="1" stopColor="#F9B21D"/> </linearGradient> <clipPath id="clip0_104_61"> <rect width="200" height="200" fill="white"/> </clipPath> </defs> </svg>
                <svg className="blob absolute" width="18" height="18" viewBox="0 0 200 200" fill="#FFBF00"> <g clipPath="url(#clip0_236_1056)"> <path fillRule="evenodd" clipRule="evenodd" d="M100 0C72.3858 0 50 22.3858 50 50C22.3858 50 2.18557e-06 72.3858 0 100C0 127.614 22.3858 150 50 150C50 177.614 72.3858 200 100 200C127.614 200 150 177.614 150 150C177.614 150 200 127.614 200 100C200 72.3858 177.614 50 150 50C150 22.3858 127.614 0 100 0ZM140.306 59.6939C140.306 37.4334 122.26 19.3878 100 19.3878C77.7395 19.3878 59.6939 37.4334 59.6939 59.6939C37.4334 59.6939 19.3878 77.7395 19.3878 100C19.3878 122.26 37.4334 140.306 59.6939 140.306C59.6939 162.567 77.7395 180.612 100 180.612C122.26 180.612 140.306 162.567 140.306 140.306C162.567 140.306 180.612 122.26 180.612 100C180.612 77.7395 162.567 59.6939 140.306 59.6939ZM69.3878 69.3878C69.3878 52.4811 83.0933 38.7755 100 38.7755C116.907 38.7755 130.612 52.4811 130.612 69.3878C147.519 69.3878 161.224 83.0933 161.224 100C161.224 116.907 147.519 130.612 130.612 130.612C130.612 147.519 116.907 161.224 100 161.224C83.0933 161.224 69.3878 147.519 69.3878 130.612C52.4811 130.612 38.7755 116.907 38.7755 100C38.7755 83.0933 52.4811 69.3877 69.3878 69.3878Z" fill="url(#paint0_linear_236_1056)"/> </g> <defs> <linearGradient id="paint0_linear_236_1056" x1="14" y1="26" x2="179" y2="179.5" gradientUnits="userSpaceOnUse"> <stop stopColor="#FFBF00"/> <stop offset="1" stopColor="#FFBF00"/> </linearGradient> <clipPath id="clip0_236_1056"> <rect width="200" height="200" fill="white"/> </clipPath> </defs> </svg>
                <svg className="blob absolute" width="18" height="18" viewBox="0 0 200 200" fill="#FE6244"> <g clipPath="url(#clip0_105_480)"> <path fillRule="evenodd" clipRule="evenodd" d="M124.899 4.91713L105.8 85.9981L149.627 15.16C150.985 12.9661 154.033 12.6119 155.857 14.4361L185.564 44.1427C187.388 45.9669 187.034 49.0153 184.84 50.3727L114.002 94.2004L195.083 75.101C197.594 74.5095 200 76.4147 200 78.9945V121.006C200 123.586 197.594 125.491 195.083 124.899L114.002 105.8L184.84 149.628C187.034 150.985 187.388 154.033 185.564 155.858L155.857 185.564C154.033 187.388 150.985 187.034 149.627 184.84L105.8 114.002L124.899 195.083C125.491 197.594 123.585 200 121.006 200H78.9943C76.4145 200 74.5094 197.594 75.1009 195.083L94.2003 114.002L50.3726 184.84C49.0153 187.034 45.9668 187.388 44.1426 185.564L14.4361 155.857C12.6119 154.033 12.9661 150.985 15.16 149.627L85.9975 105.8L4.91714 124.899C2.40606 125.491 0 123.586 0 121.006V78.9944C1.94914e-06 76.4146 2.40605 74.5095 4.91714 75.101L85.998 94.2003L15.16 50.3728C12.9661 49.0154 12.6119 45.9669 14.4361 44.1427L44.1426 14.4362C45.9668 12.612 49.0153 12.9662 50.3726 15.1601L94.2003 85.9983L75.1009 4.91714C74.5094 2.40606 76.4145 3.89828e-06 78.9943 3.67275e-06L121.006 0C123.586 0 125.491 2.40605 124.899 4.91713ZM100 111.429C106.312 111.429 111.429 106.312 111.429 100C111.429 93.6882 106.312 88.5714 100 88.5714C93.6882 88.5714 88.5714 93.6882 88.5714 100C88.5714 106.312 93.6882 111.429 100 111.429Z" fill="url(#paint0_linear_105_480)"/> </g> <defs> <linearGradient id="paint0_linear_105_480" x1="14" y1="26" x2="179" y2="179.5" gradientUnits="userSpaceOnUse"> <stop stopColor="#FE6244"/> <stop offset="1" stopColor="#FE6244"/> </linearGradient> <clipPath id="clip0_105_480"> <rect width="200" height="200" fill="white"/> </clipPath> </defs> </svg>
                <svg className="blob absolute" width="15" height="15" viewBox="0 0 200 200" fill="#ffde4d"> <g clipPath="url(#clip0_119_236)"> <path d="M100.019 138.694C14.5644 254.761 -54.7168 185.48 61.3282 99.9966C-54.77 14.5263 14.5112 -54.7279 100.019 61.3122C185.473 -54.7678 254.754 14.5263 138.709 99.9966C254.701 185.48 185.42 254.761 100.019 138.694Z" fill="url(#paint0_linear_119_236)"/> </g> <defs> <linearGradient id="paint0_linear_119_236" x1="27.5" y1="19" x2="149" y2="174.5" gradientUnits="userSpaceOnUse"> <stop stopColor="#ffde4d"/> <stop offset="1" stopColor="#ffde4d"/> </linearGradient> <clipPath id="clip0_119_236"> <rect width="200" height="200" fill="white"/> </clipPath> </defs> </svg>
                <svg className="blob absolute" width="20" height="20" viewBox="0 0 200 200" fill="#3EC70B"> <path fillRule="evenodd" clipRule="evenodd" d="M184.977 80.047C175.962 89.6912 161.187 97.0302 146.171 100C161.187 102.97 175.962 110.309 184.976 119.953L195.21 130.902L180.495 133.744C167.533 136.247 151.266 133.5 137.372 127.076C147.774 138.306 155.414 152.927 157.039 166.028L158.883 180.901L145.308 174.552C133.35 168.959 121.805 157.174 114.34 143.81C116.155 159.009 113.742 175.329 107.355 186.883L100.105 200L92.8549 186.883C86.4684 175.329 84.0549 159.009 85.8707 143.81C78.4056 157.174 66.8605 168.958 54.9023 174.552L41.327 180.901L43.1712 166.028C44.7958 152.927 52.4358 138.306 62.8386 127.076C48.9442 133.5 32.6772 136.248 19.7153 133.744L5 130.902L15.2344 119.953C24.2493 110.308 39.0247 102.97 54.0409 100C39.0242 97.0298 24.2493 89.6912 15.2344 80.047L5 69.0981L19.7153 66.2558C32.6772 63.7526 48.9447 66.5 62.8386 72.9237C52.4358 61.6944 44.7958 47.0726 43.1712 33.9716L41.327 19.0981L54.9028 25.4484C66.8609 31.0414 78.4061 42.826 85.8712 56.1898C84.0554 40.9907 86.4688 24.6707 92.8553 13.1167L100.106 0L107.356 13.1167C113.743 24.6707 116.156 40.9907 114.34 56.1898C121.806 42.826 133.351 31.0419 145.309 25.4484L158.885 19.0981L157.04 33.9716C155.416 47.0726 147.776 61.6944 137.373 72.9237C151.267 66.5 167.534 63.7521 180.496 66.2558L195.212 69.0981L184.977 80.047ZM81.2543 118.696C91.5325 128.974 108.197 128.974 118.475 118.696C128.753 108.418 128.753 91.7533 118.475 81.4751C108.197 71.1969 91.5325 71.1969 81.2543 81.4751C70.9761 91.7533 70.9761 108.418 81.2543 118.696Z" fill="url(#paint0_linear_116_134)"/> <defs> <linearGradient id="paint0_linear_116_134" x1="100.106" y1="0" x2="100.106" y2="200" gradientUnits="userSpaceOnUse"> <stop stopColor="#3EC70B"/> <stop offset="1" stopColor="#3EC70B"/> </linearGradient> </defs> </svg>
              </div>
            </SwiperSlide>
            <div className="autoplay-progress" slot="container-end">
              <svg viewBox="0 0 48 48" ref={progressCircle}>
                <circle cx="24" cy="24" r="15"></circle>
              </svg>
              <span className='text-[12px]' ref={progressContent}></span>
            </div>
          </Swiper>

        </div>

        {!isRegister ? LoginFormFunction() : <Register isRegister={isRegister} setIsRegister={setIsRegister} />}

      </div>
    </>
  );

  function LoginFormFunction() {
    return <div className="h-full w-full flex items-center justify-center flex-col">
      <div className="mb-10 w-full text-center">
        <h1 className="text-4xl font-bold mb-2">Welcome Back</h1>
        <p className="text-gray-600">Please login to your account</p>
      </div>
      <form className={`w-[85%] flex items-center justify-center flex-col gap-10 relative p-10`} onSubmit={handleSubmit(onSubmit)} autoComplete="off">
        {/* <Input type="email" label="Email" variant="login" {...register("email")} error={errors.email?.message} icon={EmailIcon}></Input> */}
        {inputType === "phone" ? (
          <div className="w-full">
            <PhoneInput
              country={"in"} // Default to India
              onlyCountries={["in"]}
              value={inputValue}
              onChange={handlePhoneChange}
              disableDropdown={true}
              placeholder="Enter phone number"
              specialLabel="Email or Phone"
              inputProps={{
                name: "email",
                autoComplete: "off",
                autofocus: true,
              }}
              inputStyle={{
                width: "100%",
                borderRadius: "1px",
                fontSize: "15px",
                padding: "12px 55px",
              }} />
          </div>
        ) : (
          <Input
            type="text"
            label="Email or Phone"
            variant="login"
            {...register("email")}
            onChange={handleInputChange}
            value={inputValue}
            error={errors.email?.message}
            icon={EmailIcon} />
        )}

        <Input type={showPassword ? "text" : "password"} label="Password" variant="login" {...register("password")} error={errors.password?.message} icon={PassIcon}></Input>
        <span onClick={togglePasswordVisibility} className="absolute right-13 top-[48%] transform -translate-y-1/2 cursor-pointer">
          {showPassword ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"#000000"} fill={"none"}>
              <path d="M22 8C22 8 18 14 12 14C6 14 2 8 2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M15 13.5L16.5 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 11L22 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 13L4 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 13.5L7.5 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"#000000"} fill={"none"}>
              <path d="M21.544 11.045C21.848 11.4713 22 11.6845 22 12C22 12.3155 21.848 12.5287 21.544 12.955C20.1779 14.8706 16.6892 19 12 19C7.31078 19 3.8221 14.8706 2.45604 12.955C2.15201 12.5287 2 12.3155 2 12C2 11.6845 2.15201 11.4713 2.45604 11.045C3.8221 9.12944 7.31078 5 12 5C16.6892 5 20.1779 9.12944 21.544 11.045Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12Z" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          )}
        </span>
        <span className='absolute top-[60%] right-10 text-[12.5px] underline text-[var(--ds-text-accent-blue)] cursor-pointer select-none'>Forgot Password?</span>
        <button type="submit" className={`button-65 mt-5`} role="button">
          {(loading) ? (
            <svg aria-hidden="true" role="status" className="inline mt-2 w-6 h-6 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"></path>
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"></path>
            </svg>
          ) : 'Login'}
        </button>
      </form>
      <div className='mt-6 flex items-center justify-center gap-2'>
        <span>Create Account</span><span onClick={handleSignUpClick} className='text-[14px] underline text-[var(--ds-text-accent-blue)] cursor-pointer select-none'>Sign up</span>
      </div>
    </div>;
  }

  
}

