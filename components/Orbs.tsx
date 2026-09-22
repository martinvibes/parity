/** The three drifting light pools behind the hero. */
export default function Orbs() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-white/[0.02] rounded-full blur-[100px] animate-float-delayed" />
      <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-white/[0.02] rounded-full blur-[80px] animate-pulse-slow" />
    </div>
  );
}
