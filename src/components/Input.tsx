import React, { forwardRef } from "react";
import "../css/common.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  variant?: string;
  error?: string;
  icon?: React.ReactNode;
}

const SdkInput = forwardRef<HTMLInputElement, InputProps>(
  ({ type, label, variant, error, icon, ...rest }, ref) => {
    const inputClassName = `input ${error ? "invalid" : ""}`;

    if (variant === "login") {
      return (
        <div className="input-wrapper">
          <input className={`${inputClassName}`} type={type} placeholder=" " ref={ref} {...rest}  />
          <span className={`placeholder ${error ? "text-red-500" : ""}`}>{label}</span>
          {icon && <span className="inputicon">{icon}</span>}

          {error &&  
          <p className="text-[#da2020] text-[12px] mt-1 absolute flex items-center error">
            <svg width="18" height="20" viewBox="0 0 24 24" role="presentation"><g fillRule="evenodd"><path fill="currentcolor" d="M13.416 4.417a2 2 0 0 0-2.832 0l-6.168 6.167a2 2 0 0 0 0 2.833l6.168 6.167a2 2 0 0 0 2.832 0l6.168-6.167a2 2 0 0 0 0-2.833z"></path><path fill="#ffff" d="M12 14a1 1 0 0 1-1-1V8a1 1 0 0 1 2 0v5a1 1 0 0 1-1 1m0 3a1 1 0 0 1 0-2 1 1 0 0 1 0 2"></path></g></svg> 
            {error}
          </p>
          }
        </div>
      );
    }

     if (variant === "login-select") {
      return (
        <div className="input-wrapper">
          <select className={`${inputClassName}`} ref={ref} {...rest}>
            {rest.children}
          </select>
          <span className={`placeholder ${error ? "text-red-500" : ""}`}>{label}</span>
          {icon && <span className="inputicon">{icon}</span>}

          {error && (
            <p className="text-[#da2020] text-[12px] mt-1 absolute flex items-center error">
              <svg width="18" height="20" viewBox="0 0 24 24" role="presentation"><g fillRule="evenodd"><path fill="currentcolor" d="M13.416 4.417a2 2 0 0 0-2.832 0l-6.168 6.167a2 2 0 0 0 0 2.833l6.168 6.167a2 2 0 0 0 2.832 0l6.168-6.167a2 2 0 0 0 0-2.833z"></path><path fill="#ffff" d="M12 14a1 1 0 0 1-1-1V8a1 1 0 0 1 2 0v5a1 1 0 0 1-1 1m0 3a1 1 0 0 1 0-2 1 1 0 0 1 0 2"></path></g></svg> 
              {error}
            </p>
          )}
        </div>
      );
    }


    return null;
  }
);

SdkInput.displayName = "SdkInput";
export default SdkInput;