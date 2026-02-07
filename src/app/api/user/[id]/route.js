import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

// helper: accept plain 24-hex, {"$oid":"..."} or { $oid: "..." }
function parseToObjectId(raw) {
  if (!raw) throw new Error("missing id");
  if (typeof raw === "object" && raw.$oid) return new ObjectId(raw.$oid);
  if (typeof raw === "string") {
    const s = raw.trim();
    if (/^[0-9a-fA-F]{24}$/.test(s)) return new ObjectId(s);
    try {
      const parsed = JSON.parse(s);
      if (parsed && parsed.$oid && /^[0-9a-fA-F]{24}$/.test(parsed.$oid)) return new ObjectId(parsed.$oid);
    } catch (e) {
      // ignore JSON parse error
    }
  }
  return new ObjectId(String(raw));
}

// fallback: try to extract id from request URL when params.id is missing
function extractIdFromReq(req) {
  try {
    const url = typeof req?.url === "string" ? req.url : "";
    if (!url) return undefined;
    // url like "http://localhost:3000/api/user/<id>" -> split and take last part
    const parts = url.split("/");
    let last = parts.pop() || parts.pop(); // handle possible trailing slash
    if (last && last.includes("?")) last = last.split("?")[0];
    return last;
  } catch (e) {
    return undefined;
  }
}

function getId(req, params) {
  if (params && params.id) return params.id;
  return extractIdFromReq(req);
}

export async function GET(req, { params }) {
  try {
    const idRaw = getId(req, params);
    console.log("GET /api/user/:id raw ->", idRaw);
    const client = await getClientPromise();
    const db = client.db("wad-01");
    const objectId = parseToObjectId(idRaw);
    const user = await db.collection("user").findOne({ _id: objectId }, { projection: { password: 0 } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404, headers: corsHeaders });
    return NextResponse.json(user, { headers: corsHeaders });
  } catch (err) {
    console.log("GET user exception", err?.toString?.() || err);
    return NextResponse.json({ message: err?.toString?.() || "Error" }, { status: 400, headers: corsHeaders });
  }
}

export async function PATCH(req, { params }) {
  try {
    const idRaw = getId(req, params);
    console.log("PATCH /api/user/:id raw ->", idRaw);
    const data = await req.json();
    const partialUpdate = {};
    if (data.username != null) partialUpdate.username = data.username;
    if (data.email != null) partialUpdate.email = data.email;
    if (data.firstname != null) partialUpdate.firstname = data.firstname;
    if (data.lastname != null) partialUpdate.lastname = data.lastname;
    if (data.status != null) partialUpdate.status = data.status;
    if (data.password != null && data.password !== "") partialUpdate.password = await bcrypt.hash(data.password, 10);

    const client = await getClientPromise();
    const db = client.db("wad-01");
    const objectId = parseToObjectId(idRaw);
    const result = await db.collection("user").updateOne({ _id: objectId }, { $set: partialUpdate });

    if (result.matchedCount === 0) return NextResponse.json({ message: "User not found" }, { status: 404, headers: corsHeaders });
    return NextResponse.json({ matchedCount: result.matchedCount, modifiedCount: result.modifiedCount }, { headers: corsHeaders });
  } catch (err) {
    console.log("PATCH user exception", err?.toString?.() || err);
    return NextResponse.json({ message: err?.toString?.() || "Error" }, { status: 400, headers: corsHeaders });
  }
}

export async function DELETE(req, { params }) {
  try {
    const idRaw = getId(req, params);
    console.log("DELETE /api/user/:id raw ->", idRaw);
    const client = await getClientPromise();
    const db = client.db("wad-01");
    const objectId = parseToObjectId(idRaw);
    const result = await db.collection("user").deleteOne({ _id: objectId });
    if (result.deletedCount === 0) return NextResponse.json({ message: "User not found" }, { status: 404, headers: corsHeaders });
    return NextResponse.json({ deletedCount: result.deletedCount }, { headers: corsHeaders });
  } catch (err) {
    console.log("DELETE user exception", err?.toString?.() || err);
    return NextResponse.json({ message: err?.toString?.() || "Error" }, { status: 400, headers: corsHeaders });
  }
}