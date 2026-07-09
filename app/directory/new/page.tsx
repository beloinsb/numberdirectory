import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function addNumber(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const label = formData.get("label") as string;
  const phone_number = formData.get("phone_number") as string;
  const department = formData.get("department") as string;
  const location = formData.get("location") as string;
  const notes = formData.get("notes") as string;

  await supabase.from("numbers").insert({
    label,
    phone_number,
    department,
    location,
    notes,
    created_by: user.id,
    status: "pending",
  });

  redirect("/directory");
}

export default function NewNumberPage() {
  return (
    <main className="p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Add New Number</h1>

      <form action={addNumber} className="space-y-4">
        <input
          name="label"
          required
          placeholder="ED Team A"
          className="border rounded p-2 w-full"
        />

        <input
          name="phone_number"
          required
          placeholder="2415"
          className="border rounded p-2 w-full"
        />

        <input
          name="department"
          placeholder="Emergency Department"
          className="border rounded p-2 w-full"
        />

        <input
          name="location"
          placeholder="Main Hospital"
          className="border rounded p-2 w-full"
        />

        <textarea
          name="notes"
          placeholder="Optional notes"
          className="border rounded p-2 w-full"
        />

        <button className="border rounded px-4 py-2">
          Add Number
        </button>
      </form>
    </main>
  );
}