import { NextResponse } from "next/server";

export const handleResponse = <T>(response: Response): Promise<T> => {
    const json = response.json();
    if (!response.ok) {
        throw json;
    }
    return json;
}


export const handleApiError = async (error: unknown) => {
    if (error instanceof Error) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        )
    }
    return NextResponse.json(
        { message: "internal error" },
        { status: 500 }
    )
}
