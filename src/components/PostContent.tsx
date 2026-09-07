export default function PostContent({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g);
  return (
    <p className={className}>
      {parts.map((part, i) =>
        /^[#@][a-zA-Z0-9_]+$/.test(part)
          ? <span key={i} className="font-medium text-blue-600">{part}</span>
          : <span key={i}>{part}</span>
      )}
    </p>
  );
}
