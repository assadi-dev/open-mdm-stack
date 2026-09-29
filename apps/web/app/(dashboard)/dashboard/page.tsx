import type { ResolvingMetadata } from "next";
import { DASHBOARD } from "@/constants/dashboard";
import { generateTitleMetadata, type PageProps } from "@/lib/page-metadata";
import { PageHeader } from "../_components/PageHeader";

export const generateMetadata = async (props: PageProps, parent: ResolvingMetadata) => {
    const prevMetadata = await parent;
    const metadata = generateTitleMetadata({ title: DASHBOARD.page.title });

    return {
        ...prevMetadata,
        ...metadata,
    };
};

const DashboardPage = async () => {
    return <PageHeader title={DASHBOARD.page.title} />;
};

export default DashboardPage;
