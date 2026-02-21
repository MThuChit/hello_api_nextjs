import { getUserFilterFromToken, signJWT, verifyJWT } from "@/lib/auth";
import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

function toSafeProfile(userDoc) {
  if (!userDoc) return null;
  const { password, ...rest } = userDoc;
  return { ...rest, _id: userDoc._id?.toString?.() ?? userDoc._id };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function GET(req) {
  const tokenPayload = verifyJWT(req);
  if (!tokenPayload) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  const userFilter = getUserFilterFromToken(tokenPayload);
  if (!userFilter) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");
    const profile = await db.collection("user").findOne(userFilter);
    if (!profile) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404, headers: corsHeaders });
    }
    return NextResponse.json(toSafeProfile(profile), { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json({ message: error.toString() }, { status: 500, headers: corsHeaders });
  }
}

export async function PATCH(req) {
  const tokenPayload = verifyJWT(req);
  if (!tokenPayload) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  const userFilter = getUserFilterFromToken(tokenPayload);
  if (!userFilter) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  let data;
  try {
    data = await req.json();
  } catch (error) {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400, headers: corsHeaders });
  }

  const updates = {};
  if (typeof data.firstname === "string") updates.firstname = data.firstname.trim();
  if (typeof data.lastname === "string") updates.lastname = data.lastname.trim();
  if (typeof data.email === "string") {
    const normalizedEmail = data.email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json({ message: "Invalid email format" }, { status: 400, headers: corsHeaders });
    }
    updates.email = normalizedEmail;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: "No profile fields to update" }, { status: 400, headers: corsHeaders });
  }

  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");

    const currentUser = await db.collection("user").findOne(userFilter);
    if (!currentUser) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404, headers: corsHeaders });
    }

    await db.collection("user").updateOne({ _id: currentUser._id }, { $set: updates });
    const updatedUser = await db.collection("user").findOne({ _id: currentUser._id });
    const safeProfile = toSafeProfile(updatedUser);

    const token = signJWT({
      id: safeProfile._id,
      email: safeProfile.email,
      username: safeProfile.username,
    });

    const response = NextResponse.json(safeProfile, { status: 200, headers: corsHeaders });
    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (error) {
    const errorMessage = error?.toString?.() || "Internal server error";
    if (errorMessage.includes("duplicate key") && errorMessage.includes("email")) {
      return NextResponse.json({ message: "Email already exists" }, { status: 400, headers: corsHeaders });
    }
    return NextResponse.json({ message: errorMessage }, { status: 500, headers: corsHeaders });
  }
}
