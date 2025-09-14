export default function BusinessPage() {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-semibold">Business</h1>
        <p className="mt-2 text-gray-600">
          PDF/CSV analysis, trends and discrepancies, and slide generation. We’ll add the CSV/PDF uploader and
          results UI next.
        </p>
        {/* Placeholder. We’ll wire MessyDataAgent + PDF flow in the next step. */}
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
          Coming next: CSV/PDF upload and analysis
        </div>
      </main>
    );
  }
  