import { MessageIcon } from '@/components/icons/UiIcons';

export default function MessagesPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="text-slate-700">
        <MessageIcon size={48} />
      </div>
      <h1 className="mt-4 text-xl font-semibold">Messages</h1>
      <p className="mt-2 text-slate-500">Coming soon — chat with other users here.</p>
    </div>
  );
}
