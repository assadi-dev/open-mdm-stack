import type { ResolvingMetadata } from "next";
import { DEVICE } from "@/constants/device";
import { generateTitleMetadata, type PageProps } from "@/lib/page-metadata";
import { DevicesPageClient } from "./_components/DevicesPageClient";

export const generateMetadata = async (props: PageProps, parent: ResolvingMetadata) => {
    const prevMetadata = await parent;
    const metadata = generateTitleMetadata({ title: DEVICE.page.title });

    return {
        ...prevMetadata,
        ...metadata,
    };
};

const DevicesPage = async () => {
    return <DevicesPageClient />;
};

export default DevicesPage;
