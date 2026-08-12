import { ConnectForm } from "@/components/connect-form";
import { LogPanel } from "@/components/log-panel";

interface ConnectPageProps {
    onConnectSuccess: () => void
}

export function ConnectPage({ onConnectSuccess }: ConnectPageProps) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <ConnectForm onConnectSuccess={onConnectSuccess} />
        </div>
    )
}