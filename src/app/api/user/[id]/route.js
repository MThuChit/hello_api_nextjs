import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

function normalizeId(id) {
  if (!id) return { filter: null, clean: null };
  const clean = id.toString().trim();
  if (ObjectId.isValid(clean)) {
    return { filter: { _id: new ObjectId(clean) }, clean };
  }
  const match = clean.match(/[a-fA-F0-9]{24}/);
  if (match && ObjectId.isValid(match[0])) {
    return { filter: { _id: new ObjectId(match[0]) }, clean: match[0] };
  }
  return { filter: { _id: clean }, clean };
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function GET(req, { params }) {
  const { id } = await params;
  const { filter } = normalizeId(id);
  if (!filter) {
    return NextResponse.json({ message: "Invalid user id" }, { status: 400, headers: corsHeaders });
  }
  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");
    const result = await db.collection("user").findOne(filter, { projection: { password: 0 } });
    if (!result) {
      return NextResponse.json({ message: "User not found" }, { status: 404, headers: corsHeaders });
    }
    const normalized = { ...result, _id: result._id.toString() };
    return NextResponse.json(normalized, { headers: corsHeaders });
  } catch (exception) {
    const errorMsg = exception.toString();
    return NextResponse.json({ message: errorMsg }, { status: 400, headers: corsHeaders });
  }
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  const { filter } = normalizeId(id);
  if (!filter) {
    return NextResponse.json({ message: "Invalid user id" }, { status: 400, headers: corsHeaders });
  }
  const data = await req.json();
  const updateDoc = {};
  if (data.username != null) updateDoc.username = data.username;
  if (data.email != null) updateDoc.email = data.email;
  if (data.firstname != null) updateDoc.firstname = data.firstname;
  if (data.lastname != null) updateDoc.lastname = data.lastname;
  if (data.status != null) updateDoc.status = data.status;
  if (data.password != null) {
    updateDoc.password = await bcrypt.hash(data.password, 10);
  }
  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");
    const updatedResult = await db.collection("user").updateOne(filter, { $set: updateDoc });
    return NextResponse.json(updatedResult, { status: 200, headers: corsHeaders });
  } catch (exception) {
    const errorMsg = exception.toString();
    return NextResponse.json({ message: errorMsg }, { status: 400, headers: corsHeaders });
  }
}

export async function PUT(req, { params }) {
  const { id } = await params;
  const { filter } = normalizeId(id);
  if (!filter) {
    return NextResponse.json({ message: "Invalid user id" }, { status: 400, headers: corsHeaders });
  }
  const data = await req.json();
  const updateDoc = {};
  if (data.username != null) updateDoc.username = data.username;
  if (data.email != null) updateDoc.email = data.email;
  if (data.firstname != null) updateDoc.firstname = data.firstname;
  if (data.lastname != null) updateDoc.lastname = data.lastname;
  if (data.status != null) updateDoc.status = data.status;
  if (data.password != null) {
    updateDoc.password = await bcrypt.hash(data.password, 10);
  }
  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");
    const updatedResult = await db.collection("user").updateOne(filter, { $set: updateDoc });
    return NextResponse.json(updatedResult, { status: 200, headers: corsHeaders });
  } catch (exception) {
    const errorMsg = exception.toString();
    return NextResponse.json({ message: errorMsg }, { status: 400, headers: corsHeaders });
  }
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  const { filter } = normalizeId(id);
  if (!filter) {
    return NextResponse.json({ message: "Invalid user id" }, { status: 400, headers: corsHeaders });
  }
  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");
    const deleteResult = await db.collection("user").deleteOne(filter);
    return NextResponse.json(deleteResult, { status: 200, headers: corsHeaders });
  } catch (exception) {
    const errorMsg = exception.toString();
    return NextResponse.json({ message: errorMsg }, { status: 400, headers: corsHeaders });
  }
}