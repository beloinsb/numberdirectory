import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function updateNumber(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("numbers")
    .update({
      label: formData.get("label") as string,
      phone_number: formData.get("phone_number") as string,
      department: formData.get("department") as string,
      location: formData.get("location") as string,
      notes: formData.get("notes") as string,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(`Unable to update contact: ${error.message}`);
  }

  revalidatePath("/directory");
  revalidatePath(`/directory/${id}`);

  redirect(`/directory/${id}`);
}

async function deleteNumber(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const id = formData.get("id") as string;
  const confirmation = formData.get("confirmation") as string;

  if (confirmation !== "DELETE") {
    throw new Error('Type "DELETE" to confirm deletion.');
  }

  const { error } = await supabase.from("numbers").delete().eq("id", id);

  if (error) {
    throw new Error(`Unable to delete contact: ${error.message}`);
  }

  revalidatePath("/directory");

  redirect("/directory");
}

export default async function EditNumberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: number, error } = await supabase
    .from("numbers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !number) {
    return <main className="p-6">Contact not found.</main>;
  }

  return (
    <main className="p-6 max-w-xl mx-auto">
      <a href={`/directory/${id}`} className="text-blue-600 underline">
        ← Back to review
      </a>

      <h1 className="text-3xl font-bold mt-6 mb-6">Edit Contact</h1>

      <form action={updateNumber} className="space-y-4">
        <input type="hidden" name="id" value={number.id} />

        <div>
          <label className="block text-sm font-medium mb-1">Label</label>
          <input
            name="label"
            required
            defaultValue={number.label}
            className="border rounded-lg p-3 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Phone Number
          </label>
          <input
            name="phone_number"
            required
            defaultValue={number.phone_number}
            className="border rounded-lg p-3 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Department</label>
          <input
            name="department"
            defaultValue={number.department ?? ""}
            className="border rounded-lg p-3 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            name="location"
            defaultValue={number.location ?? ""}
            className="border rounded-lg p-3 w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            name="notes"
            defaultValue={number.notes ?? ""}
            rows={4}
            className="border rounded-lg p-3 w-full"
          />
        </div>

        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-medium">
          Save Changes
        </button>
      </form>

      <section className="border border-red-300 bg-red-50 rounded-lg p-5 mt-10">
        <h2 className="text-xl font-bold text-red-800">Delete Contact</h2>

        <p className="text-red-700 mt-2">
          This permanently removes the contact and its associated verification
          history and replacement suggestions.
        </p>

        <form action={deleteNumber} className="mt-4 space-y-3">
          <input type="hidden" name="id" value={number.id} />

          <label className="block text-sm font-medium text-red-800">
            Type DELETE to confirm
          </label>

          <input
            name="confirmation"
            required
            autoComplete="off"
            placeholder="DELETE"
            className="border border-red-300 rounded-lg p-3 w-full"
          />

          <button className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-lg font-medium">
            Permanently Delete Contact
          </button>
        </form>
      </section>
    </main>
  );
}