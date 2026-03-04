import { use, useEffect, useState } from "react";
import { Steps, Button, Input as AInput, Divider } from 'antd';
import PhoneInput from "react-phone-input-2";
import { Controller, useForm } from "react-hook-form";
import "react-phone-input-2/lib/material.css";
import Input from "../components/Input";
import { useApi } from "../hooks/useApi";
import { PATH } from "../constants/app.constant";
import { useNotification } from "../components/provider/NotificationProvider";
import "../css/login.css";
import { MdOutlineAlternateEmail } from "react-icons/md";
import { LuCircleUser } from "react-icons/lu";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth"
import { auth } from "../firebase/setup"
import type { GetProps } from 'antd';
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { MdLockOutline } from "react-icons/md";
import { CookieService } from "../store/Cookie";


type OTPProps = GetProps<typeof Input.OTP>;

const { Step } = Steps;


const phoneRegex = /^\+?[1-9]\d{6,14}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegistrationFormData = {
  userMobileNumber: string;
  userEmail: string;
  userName: string;
  userPassword: string;
  companyName?: string;
  userRole: string;
};

type RegisterProps = {
  isRegister: boolean;
  setIsRegister: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function Register({ isRegister, setIsRegister }: RegisterProps) {
  const [current, setCurrent] = useState(0);
  const notificationApi = useNotification();
  const [showOTP, setshowOTP] = useState(false)
  const [showEmailOTP, setshowEmailOTP] = useState(false)
  const [loadRecaptcha, setLoadRecaptcha] = useState(false)
  const [loadOptVerify, setLoadOptVerify] = useState(false)
  const [otp, setOtp] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const[mobile,setMobile]=useState("");
  const[email,setEmail]=useState("");


  const { refetch: registerUser, loading, data: registerData, error: registerError } = useApi<any>(PATH.REGISTER, {
    method: "POST",
    autoFetch: false,
  });

  // ✅ RHF without Zod
  const {
    handleSubmit,
    control,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    mode: "onChange",
    shouldUnregister: false,
    defaultValues: {
      userMobileNumber: "",
      userEmail: "",
      userName: "",
      userPassword: "",
      companyName: "",
      userRole:"ADMIN"
    },
  });

  const userMobileNumber = watch("userMobileNumber");
  const userEmail = watch("userEmail");

  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  const { refetch: checkMobile } = useApi<{ valid: boolean; message: string }>(
    PATH.MOBILE + `/${(userMobileNumber || "").slice(2)}`,
    { method: "GET", autoFetch: false }
  );

  const { data: emailVerificationData, loading: emailVerificationLoading, error: emailVerificationError, refetch: verifyEmail } = useApi<any>(
    PATH.USER_EMAIL_VERIFY,
    { method: "GET", autoFetch: false }
  );

  const { data: emailOtpData, loading: emailOtpLoading, error: emailOtpError, refetch: verifyEmailOtp } = useApi<any>(
    PATH.EMAIL_OTP_VERIFY,
    { method: "POST", autoFetch: false }
  );

  useEffect(() => {
    return () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear(); // Clean up reCAPTCHA on unmount
        setRecaptchaVerifier(null);
      }
    };
  }, []);

  useEffect(() => {
    if (registerData) {
      notificationApi.success({
        message: "Registration Successful 🎉",
        description: "You have been successfully registered.",
      });
      CookieService.set('user', registerData.user.userId);
      CookieService.set('authToken', registerData.user.userAuthToken);
      CookieService.set('email', registerData.user.userEmail);
      CookieService.set('role', registerData.user.userRole);
      CookieService.set('user_name', registerData.user.userName);    
      CookieService.set('user_id', registerData.user.userCode);
      CookieService.set('companyId', registerData.company.companyCode);
      CookieService.set('company_name', registerData.company.companyName);
    }
    if (registerError) {
      notificationApi.error({
        message: registerError.error || "Registration Failed ❌",  
        description: registerError.message || "An error occurred during registration. Please try again.",
      });
    }
  }, [registerData, registerError]);

  // ✅ Step 1 handler
  const handlePhoneNext = async () => {
    const isValid = await trigger("userMobileNumber");
    if (!isValid) return
    setLoadRecaptcha(true);
    const response = await checkMobile();
    if (!response.valid) {
      notificationApi.error({
        message: "Phone Already Registered 🚫",
        description: response.message || "Please use a different number.",
        showProgress: true,
        pauseOnHover: true,
      });
      setLoadRecaptcha(false);
      return;
    }

    try{
      const phone = userMobileNumber.startsWith("+")
      ? userMobileNumber
      : `+${userMobileNumber}`;
      
      
       let verifier = recaptchaVerifier;
      if (!verifier) {
          verifier = new RecaptchaVerifier(auth, "recaptcha", { size: "invisible" });
          setRecaptchaVerifier(verifier);
      }
      const confirmation = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmationResult(confirmation);
      console.log("📱 OTP Sent Successfully:", confirmation);
      notificationApi.success({
        message: "OTP Sent ✅",
        description: `A verification code has been sent to ${phone}`,
        showProgress: true,
        pauseOnHover: true,
      });
      setLoadRecaptcha(false);
      setshowOTP(true)
    }catch(err){
      console.log("err",err)
      notificationApi.error({
        message: "Verification Failed",
        description: err.message || "Invalid phone number. Please try again.",
      });
      setshowOTP(false)
      setLoadRecaptcha(false);
    }
  
  };

  const handleVerifyOTP = async () => {
    if (!confirmationResult) {
      notificationApi.error({
        message: "No verification session found",
        description: "Please request a new OTP.",
      });
      return;
    }

    if (!otp || otp.length !== 6) {
      notificationApi.warning({
        message: "Invalid OTP",
        description: "Please enter a 6-digit code.",
      });
      return;
    }

    try {
      setLoadOptVerify(true);
      const result = await confirmationResult.confirm(otp);
      let phoneNumber: string | "" = result.user.phoneNumber || "";
      notificationApi.success({
        message: "Phone Verified ✅",
        description: "OTP verified successfully!",
      });
      setshowOTP(false);
       if (phoneNumber.startsWith("+91")) {
        phoneNumber = phoneNumber.slice(3); // remove first 3 chars: +91
      }
      setMobile(phoneNumber);
      setCurrent(1);
      setLoadOptVerify(false);
    } catch (err: any) {
      notificationApi.error({
        message: "Invalid OTP",
        description: err.message || "Please try again.",
      });
      setLoadOptVerify(false);
    }
  };

  // ✅ Step 2 handler
  const handleEmailNext = async () => {
    const isValid = await trigger("userEmail");
    if (isValid) {
      verifyEmail({
        path:`/${userEmail}`
      })
    }
  };

  const handleVerifyEmailOTP = async () => {
    verifyEmailOtp({
      body:{
        email: userEmail,
        otp: emailOtp
      }
    })
  }

  useEffect(() => {
    if (emailVerificationData) {
      setshowEmailOTP(true);
      notificationApi.success({
        message: "Email Verification OTP Sent ✅",
        description: `An OTP has been sent to ${userEmail}. Please check your inbox.`,
      })
    }
    if (emailVerificationError) {
      notificationApi.error({
        message: "Email Verification Failed ❌",
        description: emailVerificationError.message || "Please try again.",
      })
    }
  }, [emailVerificationData, emailVerificationError]);

  useEffect(() => {
    if (emailOtpData) {
      setValue("userEmail", userEmail, { shouldValidate: true });
      setEmail(userEmail);
      setCurrent(2);
      notificationApi.success({
        message: "Email Verified ✅",
        description: "Your email has been successfully verified.",
      })
    }
    if (emailOtpError) {
      notificationApi.error({
        message: "Email OTP Verification Failed ❌",
        description: emailOtpError.message || "Please try again.",
      })
    }
  }, [emailOtpData, emailOtpError]);

  // ✅ Step 3 submit
  const handleRegister = async (data: RegistrationFormData) => {
    console.log("📤 Register Request Body:", data, mobile, email);
    registerUser({ body: {...data, userMobileNumber: mobile, userEmail: email} });
  };

  const PassIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={22} height={22} color={"#9ca3af"} fill={"none"}>
      <path d="M12 16.5V14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4.2678 18.8447C4.49268 20.515 5.87612 21.8235 7.55965 21.9009C8.97626 21.966 10.4153 22 12 22C13.5847 22 15.0237 21.966 16.4403 21.9009C18.1239 21.8235 19.5073 20.515 19.7322 18.8447C19.8789 17.7547 20 16.6376 20 15.5C20 14.3624 19.8789 13.2453 19.7322 12.1553C19.5073 10.485 18.1239 9.17649 16.4403 9.09909C15.0237 9.03397 13.5847 9 12 9C10.4153 9 8.97626 9.03397 7.55965 9.09909C5.87612 9.17649 4.49268 10.485 4.2678 12.1553C4.12104 13.2453 3.99999 14.3624 3.99999 15.5C3.99999 16.6376 4.12104 17.7547 4.2678 18.8447Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.5 9V6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  // ✅ Steps UI
  const steps = [
    {
      title: "Phone Verification",
      content: (
        PhoneVerification()
      ),
    },
    {
      title: "Email Verification",
      content: (
        EmailVerification()
      ),
    },
    {
      title: "Account Setup",
      content: (
        <div className="flex flex-col gap-9 w-[80%] mx-auto p-4">
          <Controller
            name="userName"
            control={control}
            rules={{
              required: "Full name is required",
              minLength: { value: 2, message: "Name must have 2+ characters" },
            }}
            render={({ field }) => (
              <Input
                label="Full Name"
                type="text"
                variant="login"
                value={field.value}
                onChange={field.onChange}
                error={errors.userName?.message}
                icon={<LuCircleUser size={20} color="#9ca3af"/>}
              />
            )}
          />
          <Controller
            name="userPassword"
            control={control}
            rules={{
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            }}
            render={({ field }) => (
              <Input
                label="Create Password"
                type="password"
                variant="login"
                value={field.value}
                onChange={field.onChange}
                error={errors.userPassword?.message}
                icon={PassIcon}
              />
            )}
          />

          <Controller
            name="companyName"
            control={control}
            rules={{
              required: "Company name is required",
              minLength: { value: 3, message: "Company name must be at least 3 characters" }
            }}
            render={({ field }) => (
              <Input
                label="Company Name"
                type="text"
                variant="login"
                value={field.value}
                onChange={field.onChange}
                error={errors.companyName?.message}
                icon={<HiOutlineBuildingOffice2 size={20} color="#9ca3af"/>}
              />
            )}
          />

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="mt-5"
          >
            Register Account
          </Button>
        </div>
      ),
    }
  ];

  const stepStyle = current === 2 ? { maxHeight: "calc(100vh - 235px)", overflowY: "auto", paddingRight: "8px" } : {};

  return (
    <div className="h-[100%] w-full flex flex-col items-center justify-center">
      <div className="w-[100%] h-full bg-white rounded-lg px-9 py-5 items-center">
        <h1 className="text-xl font-bold mb-8 text-center">
          Create Your Account
        </h1>
        <div className="w-full h-full flex flex-col justify-center relative">
          <div className="fixed top-[90px]">
              <Steps current={current} >
                {steps.map((item) => (
                  <Step key={item.title} title={item.title} />
                ))}
              </Steps>
          </div>

          <form onSubmit={handleSubmit(handleRegister)}>
            <div className="mt-1" style={stepStyle}>{steps[current].content}</div>
          </form>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 mb-5 z-10">
        <span>Already have an account?</span>
        <span
          className="text-[14px] underline text-[var(--ds-text-accent-blue)] cursor-pointer select-none"
          onClick={() => {
            setIsRegister(false);
              const url = new URL(window.location.href);
              url.searchParams.delete("app");
              window.history.pushState({}, "", url);
            }}
          >
          Login
        </span>
      </div>
    </div>
  );

  function EmailVerification() {
    return <div className="flex flex-col gap-6 w-[80%] mx-auto relative">
      <Controller
        name="userEmail"
        control={control}
        rules={{
          required: "Email is required",
          pattern: { value: emailRegex, message: "Enter a valid email" },
        }}
        render={({ field }) => (
          <Input
            label="Email"
            type="email"
            variant="login"
            value={field.value}
            onChange={field.onChange}
            error={errors.userEmail?.message}
            icon={<MdOutlineAlternateEmail size={20} color="#9ca3af" />} />
        )} />

        {showEmailOTP && (
          <div className="flex items-center justify-center mt-2 flex-col">
            <label className="mb-1">Enter Otp</label>
            <AInput.OTP onChange={(v) => setEmailOtp(v)} value={emailOtp} length={6} />
          </div>
        )}

        {!showEmailOTP ? (
          <Button loading={emailVerificationLoading} disabled={emailVerificationLoading} className="mt-5" type="primary" onClick={handleEmailNext}>
            Sent OTP
          </Button>
        ) : (
          <Button loading={emailOtpLoading} disabled={emailOtpLoading} className="mt-5" type="primary" onClick={handleVerifyEmailOTP}>
            Verify OTP
          </Button>
        )}
      
    </div>;
  }

  function PhoneVerification() {
    return <div className="flex flex-col gap-6 w-[80%] mx-auto relative">
      <Controller
        name="userMobileNumber"
        control={control}
        rules={{
          required: "Phone number is required",
          minLength: { value: 10, message: "Must be at least 10 digits" },
          validate: (val) => phoneRegex.test(val) || "Enter a valid phone number format",
        }}
        render={({ field }) => (
          <PhoneInput
            country="in"
            onlyCountries={["in"]}
            disableDropdown={true}
            value={field.value}
            onChange={field.onChange}
            inputProps={{
              name: "userMobileNumber",
              required: true,
            }}
            inputStyle={{
              width: "100%",
              borderRadius: "6px",
              fontSize: "15px",
              padding: "12px 55px",
            }} />
        )} />
      {errors.userMobileNumber && (
        // <p className="text-red-500 text-sm">
        //   {errors.userMobileNumber.message}
        // </p>
        <p className="text-[#da2020] text-[12px] top-[23%] absolute flex items-center error mt-4">
          <svg width="18" height="20" viewBox="0 0 24 24" role="presentation"><g fillRule="evenodd"><path fill="currentcolor" d="M13.416 4.417a2 2 0 0 0-2.832 0l-6.168 6.167a2 2 0 0 0 0 2.833l6.168 6.167a2 2 0 0 0 2.832 0l6.168-6.167a2 2 0 0 0 0-2.833z"></path><path fill="#ffff" d="M12 14a1 1 0 0 1-1-1V8a1 1 0 0 1 2 0v5a1 1 0 0 1-1 1m0 3a1 1 0 0 1 0-2 1 1 0 0 1 0 2"></path></g></svg>
          {errors.userMobileNumber.message}
        </p>
      )}

      {showOTP && (
        <div className="flex items-center justify-center mt-2 flex-col">
          <label className="mb-1">Enter Otp</label>
          <AInput.OTP onChange={(v) => setOtp(v)} value={otp} length={6} />
        </div>
      )}

      <div id="recaptcha"></div>
      {!showOTP ? (
        <Button loading={loadRecaptcha} disabled={loadRecaptcha} className="mt-5" type="primary" onClick={handlePhoneNext}>
          Send OTP
        </Button>
      ) : (
        <Button loading={loadOptVerify} disabled={loadOptVerify} className="mt-5" type="primary" onClick={handleVerifyOTP}>
          Verify OTP
        </Button>
      )}
    </div>;
  }
}
