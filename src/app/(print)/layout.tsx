export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-muted/30 print:bg-white">
      {children}
    </div>
  );
}
