import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
export async function OPTIONS(req) {
    return new Response(null, {
        status: 200,
        headers: corsHeaders,
    });
}
export async function GET() {
    const headers = {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        ...corsHeaders
    }
    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");
        const result = await db.collection("item").find({}).toArray();
        console.log("==> result", result);
        return NextResponse.json(result, {
            headers: headers
        });
    }
    catch (exception) {
        console.log("exception", exception.toString());
        const errorMsg = exception.toString();
        return NextResponse.json({
            message: errorMsg
        }, {
            status: 400,
            headers: corsHeaders
        })
    }
}
export async function POST(req) {
    const data = await req.json();
    const itemName = data.name;
    const itemPrice = data.price;
    const itemCategory = data.category;
    try {
        const client = await getClientPromise();
        const db = client.db("wad-01");
        const result = await db.collection("item").insertOne({
            itemName: itemName,
            itemCategory: itemCategory,
            itemPrice: itemPrice,
            status: "ACTIVE"
        });
        return NextResponse.json({
            id: result.insertedId
        }, {
            status: 200,
            headers: corsHeaders
        })
    }
    catch (exception) {
        console.log("exception", exception.toString());
        const errorMsg = exception.toString();
        return NextResponse.json({
            message: errorMsg
        }, {
            status: 400,
            headers: corsHeaders
        })
    }
}
export async function DELETE(req, { params }) {
  try {
    const client = await getClientPromise();
    const db = client.db("wad-01");
    const { id } = params;
    const result = await db.collection("user").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404, headers: corsHeaders });
    }
    return NextResponse.json({ deletedCount: result.deletedCount }, { headers: corsHeaders });
  } catch (err) {
    console.log("DELETE user exception", err?.toString?.() || err);
    return NextResponse.json({ message: err?.toString?.() || "Error" }, { status: 400, headers: corsHeaders });
  }
}