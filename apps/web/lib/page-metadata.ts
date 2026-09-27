import { Metadata } from "next"



export const generateTitleMetadata = ({ title, description }: { title: string, description?: string }): Metadata => {
    return {
        title: `Open MDM ${title ? `- ${title}` : ''}`.trim(),
        description,
    }
}