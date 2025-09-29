import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  try {
    // Await params
    const resolvedParams = await params;
    const testId = resolvedParams.testId; // Changed from testid to testId

    console.log("PUT request - Test ID:", testId);

    if (!testId || testId === "undefined") {
      return NextResponse.json({ error: "Invalid test ID" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, instructions, status } = body;

    const { data, error } = await supabase
      .from("tests")
      .update({
        name: body.name,
        description: body.description,
        instructions: body.instructions,
        status: body.status,
        messages: body.messages || undefined,
        conversation_history: body.conversation_history || undefined,
        execution_results: body.execution_results || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", testId)
      .eq("user_id", userData.user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating test:", error);
      return NextResponse.json(
        { error: "Failed to update test" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in PUT /api/tests/[testId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
