/** Keep plain email text escaped and formatted, while making web addresses usable. */
export default function EmailBodyText({ text }: { text: string }) {
  return text.split(/(https?:\/\/[^\s<>]+)/g).map((part, index) => {
    if (!/^https?:\/\//.test(part)) return part;
    const address = part.replace(/[.,;:!?)\]]+$/, "");
    return (
      <span key={index}>
        <a href={address} target="_blank" rel="noopener noreferrer">
          {address}
        </a>
        {part.slice(address.length)}
      </span>
    );
  });
}
