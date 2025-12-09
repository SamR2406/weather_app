import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const fmtDate = (date) => date.toISOString().slice(0, 10);

export async function GET() {
  const apiKey = process.env.NASA_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "NASA_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  const today = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 2);

  const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${fmtDate(today)}&end_date=${fmtDate(end)}&api_key=${apiKey}`;

  try {
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      const details = await res.text();
      return NextResponse.json(
        { error: "NASA feed request failed.", details: details?.slice(0, 300) },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "NASA feed request threw an error.", details: err?.message },
      { status: 500 }
    );
  }
}
