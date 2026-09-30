import { handleApiError } from "@/lib/api/api-handlers";
import { NextResponse } from "next/server";


export const GET = async () => {

    try {



        return NextResponse.json({
            message: "OK"
        });
    } catch (error) {
        return handleApiError(error);
    }
}