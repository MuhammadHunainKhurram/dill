import MessyDataAgent from '@/components/MessyDataAgent';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';

export default function DataAgentPage() {
  return (
    <>
      <main className="min-h-screen bg-[#0f1f1b] text-emerald-100">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <h1 className="text-3xl font-semibold">Data Agent</h1>
          <p className="mt-2 text-sm text-emerald-200/75">
            Upload messy CSV/Excel files, let AI clean, analyze, and visualize.
          </p>

          <section className="mt-6 rounded-2xl border border-[#e3efe9] bg-white p-2 text-[#0f1f1b] shadow-sm">
            <MessyDataAgent />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
