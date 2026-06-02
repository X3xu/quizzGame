/* Shared decorative background — rendered once per screen. aria-hidden. */
export default function PageBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      {/* Primary violet — top-left bloom */}
      <div className="absolute -top-48 -left-24 h-[800px] w-[800px] rounded-full bg-violet-600/20 blur-[140px]" />
      {/* Cyan — bottom-right bloom */}
      <div className="absolute -bottom-32 -right-24 h-[700px] w-[700px] rounded-full bg-cyan-500/15 blur-[120px]" />
      {/* Centre warm spotlight — anchors the content */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      h-[600px] w-[1100px] rounded-full bg-violet-900/30 blur-[180px]" />
      {/* Bottom-left indigo accent */}
      <div className="absolute -bottom-10 -left-10 h-[400px] w-[400px] rounded-full bg-indigo-700/12 blur-[100px]" />
      {/* Top-right subtle violet */}
      <div className="absolute -top-20 right-1/4 h-[350px] w-[350px] rounded-full bg-violet-500/8 blur-[90px]" />
    </div>
  );
}
