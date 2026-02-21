import corsHeaders from "@/lib/cors";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { NextResponse } from "next/server";

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("pass");

  if (!challenge) {
    return NextResponse.json({ message: "Invalid usage" }, { status: 400, headers: corsHeaders });
  }

  const pass = process.env.ADMIN_SETUP_PASS;
  if (!pass || challenge !== pass) {
    return NextResponse.json({ message: "Admin password incorrect" }, { status: 400, headers: corsHeaders });
  }

  try {
    await ensureIndexes();
    return NextResponse.json({ message: "Indexes ensured" }, { status: 200, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ message: error.toString() }, { status: 500, headers: corsHeaders });
  }
}