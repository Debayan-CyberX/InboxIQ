export default function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 28 28" fill="none">
          <path d="M5 6.5h18v15H5z" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="m5 7 9 7 9-7M5 16h5l2 3h4l2-3h5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="brand-name">
        Inbox<span className="font-normal">IQ</span>
      </span>
    </span>
  );
}
