import { ConnectForm } from "@/components/connect-form";

interface ConnectPageProps {
  onConnectSuccess: () => void;
}

export function ConnectPage({ onConnectSuccess }: ConnectPageProps) {
  return (
    <div className="flex items-center justify-center">
      <ConnectForm onConnectSuccess={onConnectSuccess} />
    </div>
  );
}
