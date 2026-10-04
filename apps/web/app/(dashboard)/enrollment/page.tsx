import type { ResolvingMetadata } from "next";
import { ENROLLMENT } from "@/constants/enrollment";
import { generateTitleMetadata, type PageProps } from "@/lib/page-metadata";
import { EnrollmentPageClient } from "./_components/EnrollmentPageClient";

export const generateMetadata = async (props: PageProps, parent: ResolvingMetadata) => {
    const prevMetadata = await parent;
    const metadata = generateTitleMetadata({ title: ENROLLMENT.page.title });

    return {
        ...prevMetadata,
        ...metadata,
    };
};

const EnrollmentPage = async () => {
    return <EnrollmentPageClient />;
};

export default EnrollmentPage;
