import { createClient } from "@/lib/supabase/server";

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const { q } = await searchParams;

  let query = supabase.from("number_directory").select("*").order("label");

  if (q && q.trim() !== "") {
    query = query.or(
      `label.ilike.%${q}%,phone_number.ilike.%${q}%,department.ilike.%${q}%,location.ilike.%${q}%`
    );
  }

  const { data: numbers, error } = await query;

  if (error) {
    return <main className="p-6">Error: {error.message}</main>;
  }

  return (
    <main className="p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold flex items-center gap-3">
          🏥 GWUH Numbers Directory
        </h1>

        <p className="text-gray-600 mt-2">
          Community-maintained • Verified by staff • Updated in real time
        </p>

        <div className="flex gap-3 mt-6">
          <a
            href="/directory/new"
            className="inline-block bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            + Add New Number
          </a>

          <a
            href="/directory/pending"
            className="inline-block bg-yellow-100 text-yellow-800 px-5 py-3 rounded-lg hover:bg-yellow-200 font-medium"
          >
            Pending Reviews
          </a>
        </div>
      </div>

      <form className="mb-6">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by label, number, department, or location..."
          className="border border-gray-300 rounded-lg p-3 w-full max-w-xl"
        />
      </form>

      <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr className="border-b">
            <th className="text-left p-3">Label</th>
            <th className="text-left p-3">Number</th>
            <th className="text-left p-3">Department</th>
            <th className="text-left p-3">Location</th>
            <th className="text-left p-3">Actions</th>
          </tr>
        </thead>

        <tbody>
          {numbers?.map((n) => (
            <tr key={n.id} className="border-b hover:bg-gray-50">
              <td className="p-3">{n.label}</td>
              <td className="p-3 font-mono">{n.phone_number}</td>
              <td className="p-3">{n.department}</td>
              <td className="p-3">{n.location}</td>
              <td className="p-3">
                <a
                  href={`/directory/${n.id}`}
                  className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-lg text-sm"
                >
                  Review
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}