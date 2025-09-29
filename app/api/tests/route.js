import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, commands, status, executionResults } = body;

    // Validate required fields
    if (!name || !commands || commands.length === 0) {
      return NextResponse.json(
        { error: "Name and commands are required" },
        { status: 400 }
      );
    }

    // Handle screenshot uploads if present
    let processedExecutionResults = executionResults;
    if (
      executionResults &&
      executionResults.screenshots &&
      executionResults.screenshots.length > 0
    ) {
      const uploadedScreenshots = await uploadScreenshots(
        supabase,
        "temp", // We'll update this after insert
        executionResults.screenshots
      );
      processedExecutionResults = {
        ...executionResults,
        screenshots: uploadedScreenshots,
      };
    }

    // Prepare test data
    const testData = {
      user_id: user.id,
      name,
      description: description || "",
      instructions: JSON.stringify(commands),
      status: status || "draft",
      messages: body.messages ? JSON.stringify(body.messages) : null,
      conversation_history: body.conversationHistory
        ? JSON.stringify(body.conversationHistory)
        : null,
      execution_results: processedExecutionResults
        ? JSON.stringify(processedExecutionResults)
        : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert test into database
    const { data: insertedTest, error: insertError } = await supabase
      .from("tests")
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting test:", insertError);
      return NextResponse.json(
        { error: "Failed to save test", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      test: {
        ...insertedTest,
        instructions: JSON.parse(insertedTest.instructions),
        execution_results: insertedTest.execution_results
          ? JSON.parse(insertedTest.execution_results)
          : null,
      },
    });
  } catch (error) {
    console.error("Error saving test:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to upload screenshots to Supabase Storage
async function uploadScreenshots(supabase, testId, screenshots) {
  const uploadedScreenshots = [];

  for (const screenshot of screenshots) {
    try {
      // Screenshot comes from run-test with { filename, data, takenAt, type }
      if (!screenshot.data) {
        console.warn("Screenshot missing data property, skipping");
        continue;
      }

      // Convert base64 data URI to buffer
      const base64Data = screenshot.data.replace(
        /^data:image\/\w+;base64,/,
        ""
      );
      const buffer = Buffer.from(base64Data, "base64");

      // Generate path in storage: testId/timestamp-originalFilename
      const timestamp = Date.now();
      const storagePath = `${testId}/${timestamp}-${screenshot.filename}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("test-screenshots")
        .upload(storagePath, buffer, {
          contentType: "image/png",
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Error uploading screenshot:", error);
        continue;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("test-screenshots").getPublicUrl(storagePath);

      uploadedScreenshots.push({
        filename: screenshot.filename,
        url: publicUrl,
        takenAt: screenshot.takenAt,
        type: screenshot.type || "success",
        storagePath: storagePath,
      });
    } catch (error) {
      console.error("Error processing screenshot:", error);
    }
  }

  return uploadedScreenshots;
}

// GET endpoint to fetch user's tests
export async function GET(request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's tests
    const { data: tests, error: fetchError } = await supabase
      .from("tests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching tests:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch tests" },
        { status: 500 }
      );
    }

    // Parse instructions back to objects
    const parsedTests = tests.map((test) => ({
      ...test,
      instructions: test.instructions ? JSON.parse(test.instructions) : [],
    }));

    return NextResponse.json({
      success: true,
      tests: parsedTests,
    });
  } catch (error) {
    console.error("Error fetching tests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
