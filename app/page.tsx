import DrawIoEditor from "./components/DrawIoEditor";
import ChatPanel from "./components/ChatPanel";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-0 flex-1 flex-row gap-3 p-3">
        <div className="min-w-0 flex-1">
          <DrawIoEditor />
        </div>
        <ChatPanel />
      </main>
    </div>
  );
}
