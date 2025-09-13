export default function Footer() {
    return (
      <footer className="mt-16 border-t border-gray-200/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} PDF Locker</p>
          <p>Built with Next.js + Supabase</p>
        </div>
      </footer>
    );
  }
  