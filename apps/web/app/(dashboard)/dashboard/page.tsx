import type { ResolvingMetadata } from "next";
import { DASHBOARD } from "@/constants/dashboard";
import { generateTitleMetadata, type PageProps } from "@/lib/page-metadata";
import { DashboardPageClient } from "./_components/DashboardPageClient";

export const generateMetadata = async (props: PageProps, parent: ResolvingMetadata) => {
    const prevMetadata = await parent;
    const metadata = generateTitleMetadata({ title: DASHBOARD.page.title });

    return {
        ...prevMetadata,
        ...metadata,
    };
};

const DashboardPage = async () => {
    return <DashboardPageClient />;
};

export default DashboardPage;
