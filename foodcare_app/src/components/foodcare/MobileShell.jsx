export function MobileShell({ children }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-[390px] h-[844px] bg-white rounded-[40px] shadow-xl overflow-hidden border border-slate-100 flex flex-col relative">
        {children}
      </div>
    </div>
  );
}