import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function updateNumber(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const id = formData.get("id") as string;

  await supabase
    .from("numbers")
    .update({
      label: formData.get("label") as string,
      phone_number: formData.get("phone_number") as string,
      department: formData.get("department") as string,
      location: formData.get("location") as string,
      notes: formData.get("notes") as string,
      status: "needs_review",
    })
    .eq("id", id);

  redirect(`/directory/${id}`);
}

export default async function EditNumberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: number } = await supabase
    .from("numbers")
    .select("*")
    .eq("id", id)
    .single();

  if (!number) {
    return <main className="p-6">Number not found.</main>;
  }

  return (
    <main className="p-6 max-w-xl mx-auto">
      <a href={`/directory/${id}`} className="text-blue-600 underline">
        ← Back to review
      </a>

      <h1 className="text-3xl font-bold mt-6 mb-6">Edit Number</h1>

      <form action={updateNumber} className="space-y-4">
        <input type="hidden" name="id" value={number.id} />

        <div>
          <label className="block text-sm font-medium mb-1">Label</label>
          <input
            name="label"
            required
            defaultValue={number.label}
            className="border rounded p-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone Number</label>
          <input
            name="phone_number"
            required
            defaultValue={number.phone_number}
            className="border rounded p-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Department</label>
          <input
            name="department"
            defaultValue={number.department ?? ""}
            className="border rounded p-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            name="location"
            defaultValue={number.location ?? ""}
            className="border rounded p-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            name="notes"
            defaultValue={number.notes ?? ""}
            className="border rounded p-2 w-full"
          />
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          Save Changes
        </button>
      </form>
    </main>
  );
}