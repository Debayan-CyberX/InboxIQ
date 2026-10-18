import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

export function PasswordField({ label, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-password-field">
      <label className="form-field">
        <span>{label}</span>
        <input
          {...props}
          className="form-input"
          type={visible ? "text" : "password"}
        />
      </label>
      <button
        type="button"
        className="auth-password-toggle"
        aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
        aria-pressed={visible}
        disabled={props.disabled}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? (
          <EyeOff size={17} aria-hidden="true" />
        ) : (
          <Eye size={17} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
