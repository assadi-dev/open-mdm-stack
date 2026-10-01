import { SidebarTrigger } from "@/components/sidebar/Sidebar";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationButton } from "./NotificationButton";
import { AccountButton } from "./AccountButton";
import { HEADER } from "@/constants/header";



const Navbar = () => (
    <header className="sticky top-0 z-20 flex items-center gap-3 justify-between rounded-2xl border border-card-border bg-card py-4 pr-4 pl-4 backdrop-blur-[6px] md:gap-6 md:pl-6">
        <SidebarTrigger className="" aria-label={HEADER.sidebar.toggle} />

        <div className="flex shrink-0 items-center gap-3">
            <GlobalSearch />
            <NotificationButton />
            <AccountButton />
        </div>
    </header>
);

export default Navbar;