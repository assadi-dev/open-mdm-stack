import { Metadata } from "next"

export type PageProps<
    Params extends Record<string, string> = Record<string, never>,
    SearchParams extends Record<string, string | string[] | undefined> = Record<string, string | string[] | undefined>
> = {
    params: Promise<Params>
    searchParams: Promise<SearchParams>
}

export const generateTitleMetadata = ({ title, description }: { title: string, description?: string }): Metadata => {
    return {
        title: `Open MDM ${title ? `- ${title}` : ''}`.trim(),
        description,
    }
}