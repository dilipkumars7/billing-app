import { useState } from "react";
import { Steps, Button, Input as AInput } from 'antd';
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

type OTPProps = GetProps<typeof Input.OTP>;

const { Step } = Steps;


const phoneRegex = /^\+?[1-9]\d{6,14}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegistrationFormData = {
  userMobileNumber: string;
  userEmail: string;
  userName: string;
  userPassword: string;
};

type RegisterProps = {
  isRegister: boolean;
  setIsRegister: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function Register({ isRegister, setIsRegister }: RegisterProps) {
  const [current, setCurrent] = useState(0);
  const notificationApi = useNotification();
  const [showOTP, setshowOTP] = useState(false)
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const { refetch: registerUser, loading } = useApi(PATH.REGISTER, {
    method: "POST",
    autoFetch: false,
  });

  // ✅ RHF without Zod
  const {
    handleSubmit,
    control,
    trigger,
    watch,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    mode: "onChange",
    defaultValues: {
      userMobileNumber: "",
      userEmail: "",
      userName: "",
      userPassword: "",
    },
  });

  const userMobileNumber = watch("userMobileNumber");
  const userEmail = watch("userEmail");

  const { refetch: checkMobile } = useApi<{ valid: boolean; message: string }>(
    PATH.MOBILE+`/${userMobileNumber.slice(2)}`,
    { method: "GET", autoFetch: false }
  );

  // ✅ Step 1 handler
  const handlePhoneNext = async () => {
    const isValid = await trigger("userMobileNumber");
    if (!isValid) return

    const response = await checkMobile();
    console.log("response", response)
    if (!response.valid) {
      notificationApi.error({
        message: "Phone Already Registered 🚫",
        description: response.message || "Please use a different number.",
        showProgress: true,
        pauseOnHover: true,
      });
      return; // Stop OTP flow
    }

    try{
      const phone = userMobileNumber.startsWith("+")
      ? userMobileNumber
      : `+${userMobileNumber}`;
      const recaptcha = new RecaptchaVerifier(auth, "recaptcha", { size: "invisible"});
      const confirmation = await signInWithPhoneNumber(auth, phone, recaptcha);
      setConfirmationResult(confirmation);
      console.log("📱 OTP Sent Successfully:", confirmation);
      notificationApi.success({
        message: "OTP Sent ✅",
        description: `A verification code has been sent to ${phone}`,
        showProgress: true,
        pauseOnHover: true,
      });
      setshowOTP(true)
    }catch(err){
      console.log("err",err)
      notificationApi.error({
        message: "Verification Failed",
        description: err.message || "Invalid phone number. Please try again.",
      });
      setshowOTP(false)
    }
    
    // const isValid = await trigger("userMobileNumber");
    // if (isValid) {
    //   notificationApi.success({
    //     message: "Phone Verified ✅",
    //     description: `OTP sent to ${userMobileNumber}`,
    //   });
    //   setCurrent(1);
    // }
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
      const result = await confirmationResult.confirm(otp);
      console.log("✅ User verified:", result.user);

      notificationApi.success({
        message: "Phone Verified ✅",
        description: "OTP verified successfully!",
      });

      setshowOTP(false);
      // setCurrent(1); // Move to next step (Email)
    } catch (err: any) {
      console.error("❌ OTP Verification Failed:", err);
      notificationApi.error({
        message: "Invalid OTP",
        description: err.message || "Please try again.",
      });
    }
  };

  // ✅ Step 2 handler
  const handleEmailNext = async () => {
    const isValid = await trigger("userEmail");
    if (isValid) {
      notificationApi.success({
        message: "Email Verified 📧",
        description: `Verification successful for ${userEmail}`,
      });
      setCurrent(2);
    }
  };

  // ✅ Step 3 submit
  const handleRegister = async (data: RegistrationFormData) => {
    const body = {
      userName: data.userName,
      userEmail: data.userEmail,
      userPassword: data.userPassword,
      userMobileNumber: Number(data.userMobileNumber),
      userRole: "USER",
    };

    console.log("📤 Register Request Body:", body);

    const response = await registerUser({ body });

    if (response?.success) {
      notificationApi.success({
        message: "Registration Successful 🎉",
        description: "You can now log in with your new account.",
      });
      setIsRegister(false);
      const url = new URL(window.location.href);
      url.searchParams.delete("app");
      window.history.pushState({}, "", url);
    } else {
      notificationApi.error({
        message: "Registration Failed",
        description: response?.message || "Please try again later.",
      });
    }
  };

  // ✅ Steps UI
  const steps = [
    {
      title: "Phone Verification",
      content: (
        <div className="flex flex-col gap-6 w-[80%] mx-auto relative">
          <Controller
            name="userMobileNumber"
            control={control}
            rules={{
              required: "Phone number is required",
              minLength: { value: 10, message: "Must be at least 10 digits" },
              validate: (val) =>
                phoneRegex.test(val) || "Enter a valid phone number format",
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
                }}
              />
            )}
          />
          {errors.userMobileNumber && (
            // <p className="text-red-500 text-sm">
            //   {errors.userMobileNumber.message}
            // </p>
            <p className="text-[#da2020] text-[12px] top-[23%] absolute flex items-center error">
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
            <Button className="mt-5" type="primary" onClick={handlePhoneNext}>
              Send OTP
            </Button>
          ) : (
            <Button className="mt-5" type="primary" onClick={handleVerifyOTP}>
              Verify OTP
            </Button>
          )}
        </div>
      ),
    },
    {
      title: "Email Verification",
      content: (
        <div className="flex flex-col gap-6 w-[80%] mx-auto">
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
                icon={<MdOutlineAlternateEmail size={20} color="#9ca3af"/>}
              />
            )}
          />
          <Button className="mt-5" type="primary" onClick={handleEmailNext}>
            Verify Email
          </Button>
        </div>
      ),
    },
    {
      title: "Account Setup",
      content: (
        <div className="flex flex-col gap-10 w-[80%] mx-auto">
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
                label="Password"
                type="password"
                variant="login"
                value={field.value}
                onChange={field.onChange}
                error={errors.userPassword?.message}
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
    },
  ];

  return (
    <div className="h-[100%] w-full flex flex-col items-center justify-center">
      <div className="w-[100%] bg-white rounded-lg px-9">
        <h1 className="text-xl font-bold mb-8 text-center">
          Create Your Account
        </h1>

        <Steps current={current}>
          {steps.map((item) => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>

        <form onSubmit={handleSubmit(handleRegister)}>
          <div className="mt-10">{steps[current].content}</div>

          {current > 0 && (
            <div className="mt-6 flex justify-between">
              <Button onClick={() => setCurrent(current - 1)}>Back</Button>
            </div>
          )}
        </form>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
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
}
