// app/api/run-test/route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

    // Call your Render API
    const response = await fetch(
      `${process.env.PUPPETEER_API_URL}/api/run-test`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    // Revalidate the dashboard to show the new test immediately
    revalidatePath("/dashboard");

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to connect to test runner" },
      { status: 500 }
    );
  }
}
