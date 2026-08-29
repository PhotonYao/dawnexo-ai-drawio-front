import DrawIoEditor from "./components/DrawIoEditor";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          AI Draw.io 编辑器
        </h1>
      </header>
      <main className="flex min-h-0 flex-1 flex-col p-6">
        <DrawIoEditor />
      </main>
    </div>
  );
}
