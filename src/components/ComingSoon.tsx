export default function ComingSoon({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="text-4xl">{icon}</p>
      <h1 className="mt-4 text-xl font-semibold">{title}</h1>
      <p className="mt-2 text-slate-500">This feature is coming soon.</p>
    </div>
  );
}
