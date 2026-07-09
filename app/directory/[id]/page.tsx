import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function verifyCurrentNumber(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const numberId = formData.get("number_id") as string;
  const worked = formData.get("worked") === "true";

  await supabase.from("verifications").upsert(
    {
      number_id: numberId,
      user_id: user.id,
      worked,
      comment: formData.get("comment") as string,
    },
    { onConflict: "number_id,user_id" }
  );

  if (!worked) {
    await supabase
      .from("numbers")
      .update({ status: "needs_review" })
      .eq("id", numberId);
  }

  redirect(`/directory/${numberId}`);
}

async function suggestReplacement(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const numberId = formData.get("number_id") as string;

  await supabase.from("replacement_suggestions").insert({
    original_number_id: numberId,
    suggested_phone_number: formData.get("suggested_phone_number") as string,
    comment: formData.get("comment") as string,
    suggested_by: user.id,
  });

  redirect(`/directory/${numberId}`);
}

async function deleteReplacementSuggestion(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const suggestionId = formData.get("suggestion_id") as string;
  const numberId = formData.get("number_id") as string;

  await supabase
    .from("replacement_suggestions")
    .delete()
    .eq("id", suggestionId)
    .eq("suggested_by", user.id);

  redirect(`/directory/${numberId}`);
}

async function verifyReplacement(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const suggestionId = formData.get("suggestion_id") as string;
  const numberId = formData.get("number_id") as string;

  await supabase.from("replacement_verifications").upsert(
    {
      suggestion_id: suggestionId,
      user_id: user.id,
      worked: true,
    },
    { onConflict: "suggestion_id,user_id" }
  );

  const { count } = await supabase
    .from("replacement_verifications")
    .select("*", { count: "exact", head: true })
    .eq("suggestion_id", suggestionId)
    .eq("worked", true);

  if ((count ?? 0) >= 2) {
    const { data: suggestion } = await supabase
      .from("replacement_suggestions")
      .select("*")
      .eq("id", suggestionId)
      .single();

    if (suggestion) {
      await supabase
        .from("numbers")
        .update({
          phone_number: suggestion.suggested_phone_number,
          status: "verified",
        })
        .eq("id", numberId);

      await supabase
        .from("replacement_suggestions")
        .update({ status: "approved" })
        .eq("id", suggestionId);
    }
  }

  redirect(`/directory/${numberId}`);
}

export default async function NumberReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: number } = await supabase
    .from("number_directory")
    .select("*")
    .eq("id", id)
    .single();

  const { data: suggestions } = await supabase
    .from("replacement_suggestions")
    .select("*")
    .eq("original_number_id", id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (!number) {
    return <main className="p-6">Number not found.</main>;
  }

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-8">
      <a href="/directory" className="text-blue-600 underline">
        ← Back to directory
      </a>

      <section className="border rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-4">{number.label}</h1>

        <p className="text-sm text-gray-500 mb-2">Current number:</p>
        <p className="text-4xl font-mono mb-4">{number.phone_number}</p>

        <p className="mb-2">👍 {number.verified_count} verified</p>
        <p className="mb-4">👎 {number.failed_count} reported incorrect</p>

        <form action={verifyCurrentNumber} className="space-y-3">
          <input type="hidden" name="number_id" value={number.id} />

          <textarea
            name="comment"
            placeholder="Optional comment"
            className="border rounded p-2 w-full"
          />

          <button
            name="worked"
            value="true"
            className="bg-green-600 text-white px-4 py-2 rounded-lg mr-2"
          >
            👍 This worked
          </button>

          <button
            name="worked"
            value="false"
            className="bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            👎 This is incorrect
          </button>
        </form>
      </section>

      {suggestions?.map((s) => (
        <section key={s.id} className="border rounded-lg p-6 bg-yellow-50">
          <p className="text-sm text-gray-600 mb-2">Suggested replacement:</p>
          <p className="text-3xl font-mono mb-4">{s.suggested_phone_number}</p>

          <p className="mb-4">
            Needs 2 confirmations before replacing the current number.
          </p>

          {s.comment && <p className="mb-4">Comment: {s.comment}</p>}

          <form action={verifyReplacement}>
            <input type="hidden" name="number_id" value={number.id} />
            <input type="hidden" name="suggestion_id" value={s.id} />

            <button className="bg-green-600 text-white px-4 py-2 rounded-lg">
              👍 Verify suggested replacement
            </button>
          </form>

          <form action={deleteReplacementSuggestion} className="mt-3">
            <input type="hidden" name="number_id" value={number.id} />
            <input type="hidden" name="suggestion_id" value={s.id} />

            <button className="bg-red-600 text-white px-4 py-2 rounded-lg">
              Delete suggestion
            </button>
          </form>
        </section>
      ))}

      <section className="border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Suggest a replacement number</h2>

        <form action={suggestReplacement} className="space-y-3">
          <input type="hidden" name="number_id" value={number.id} />

          <input
            name="suggested_phone_number"
            required
            placeholder="New number"
            className="border rounded p-2 w-full"
          />

          <textarea
            name="comment"
            placeholder="Why is this the correct replacement?"
            className="border rounded p-2 w-full"
          />

          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            Submit replacement suggestion
          </button>
        </form>
      </section>
    </main>
  );
}