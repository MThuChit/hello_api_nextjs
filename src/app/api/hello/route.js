import { NextResponse } from "next/server";
import corsHeaders from "@/lib/cors";

export async function OPTIONS(req) {
    return new Response(null, {
        status: 200,
        headers: corsHeaders,
    });
}

export async function GET() {
    const message = { message: "Hello, World!" };
    return NextResponse.json(message, { headers: corsHeaders });
}
