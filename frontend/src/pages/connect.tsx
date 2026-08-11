import { ConnectForm } from "@/components/connect-form";
import { LogPanel } from "@/components/log-panel";

export function ConnectPage() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <ConnectForm />
            <LogPanel />
        </div>
    )
}