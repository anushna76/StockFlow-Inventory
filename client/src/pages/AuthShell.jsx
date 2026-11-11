export default function AuthShell({ title, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold text-pine-700">StockFlow</h1>
        <p className="mb-6 text-sm text-gray-600">{title}</p>
        <div className="card p-6">{children}</div>
        <p className="mt-4 text-center text-sm text-gray-600">{footer}</p>
      </div>
    </div>
  );
}

