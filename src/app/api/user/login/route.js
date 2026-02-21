import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import bcrypt from "bcrypt";
import { signJWT } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function POST(req) {
  const data = await req.json();
  const { email, password } = data;
  if (!email || !password) {
    return NextResponse.json({ message: "Missing email or password" }, { status: 400, headers: corsHeaders });
  }
  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");
    const user = await db.collection("user").findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401, headers: corsHeaders });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401, headers: corsHeaders });
    }
    const token = signJWT({ id: user._id.toString(), email: user.email, username: user.username });
    const response = NextResponse.json({ message: "Login successful" }, { status: 200, headers: corsHeaders });
    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (exception) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}
