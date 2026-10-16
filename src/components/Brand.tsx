import { ArrowUpRight } from "lucide-react";
export default function Brand() {
  return (
    <span className="iq-brand">
      <span className="iq-brand-mark">
        <ArrowUpRight size={22} strokeWidth={2.5} />
      </span>
      Inbox<span style={{ color: "#bda5fb", marginLeft: -9 }}>IQ</span>
    </span>
  );
}
