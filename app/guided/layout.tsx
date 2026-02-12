export default function GuidedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      {children}
    </div>
  );
}
