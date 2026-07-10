import { invoke } from "@tauri-apps/api/core"
import { useEffect, useState } from "react"

export type NetworkInterface = {
    name: string
    ipv4: string[]
    ipv6: string[]
}

export default function useGetNetwork() {
    const [networkInterfaces, setNetworkInterfaces] = useState<NetworkInterface[]>([])

    useEffect(() => {
        invoke("get_network_addresses").then((data: any) => {
            setNetworkInterfaces(data)
        })
    }, [])

    return networkInterfaces
}