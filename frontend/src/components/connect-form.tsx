import { Button } from "@/components/ui/button"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ModeToggle } from "./mode-toggle"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { SelectFile, StartTelepresence } from "../../wailsjs/go/main/App"
import { SyntheticEvent, useRef, useState, type SubmitEvent } from "react"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { AlertCircleIcon } from "lucide-react"

interface ConnectFormProps {
    onConnectSuccess: () => void
}

const DEFAULT_VALUES = {
    namespace: "",
    name: "",
    "manager-namespace": "",
    docker: false,
    "mapped-namespaces": "",
    "proxy-via": "",
    "also-proxy": "",
    "never-proxy": "",
    "reroute-local": "",
    "reroute-remote": "",
    vnat: "",
    "allow-conflicting-subnets": "",
    expose: "",
    hostname: "",
    kubeconfig: "",
    context: "",
    cluster: "",
    server: "",
    token: "",
    user: "",
    as: "",
    "as-group": "",
    "as-uid": "",
    "client-certificate": "",
    "client-key": "",
    "insecure-skip-tls-verify": false,
    "tls-server-name": "",
    config: "",
    "request-timeout": "",
    "disable-compression": "",
}

export function ConnectForm({ onConnectSuccess }: ConnectFormProps) {
    const formRef = useRef<HTMLFormElement>(null)

    const [loading, setLoading] = useState(false)
    const [apiError, setApiError] = useState("")
    const [kubeconfigPath, setKubeconfigPath] = useState(DEFAULT_VALUES.kubeconfig)
    const [clientCertificatePath, setClientCertificatePath] = useState(DEFAULT_VALUES["client-certificate"])
    const [clientKeyPath, setClientKeyPath] = useState(DEFAULT_VALUES["client-key"])
    const [telepresenceConfigPath, setTelepresenceConfigPath] = useState(DEFAULT_VALUES.config)

    const handleReset = (event: SyntheticEvent<HTMLFormElement>) => {
        setKubeconfigPath(DEFAULT_VALUES.kubeconfig)
        setClientCertificatePath(DEFAULT_VALUES["client-certificate"])
        setClientKeyPath(DEFAULT_VALUES["client-key"])
        setTelepresenceConfigPath(DEFAULT_VALUES.config)
        toast.add({
            type: "success",
            description: "Options reseted successfully."
        })
    }

    const handleBrowseKubeconfig = async () => {
        const path = await SelectFile("Select Kubeconfig File")
        if (path) setKubeconfigPath(path)
    }

    const handleBrowseClientCertificate = async () => {
        const path = await SelectFile("Select Client Certificate File")
        if (path) setClientCertificatePath(path)
    }

    const handleBrowseClientKey = async () => {
        const path = await SelectFile("Select Client Key File")
        if (path) setClientKeyPath(path)
    }

    const handleBrowseTelepresenceConfig = async () => {
        const path = await SelectFile("Select Telepresence Config File")
        if (path) setTelepresenceConfigPath(path)
    }

    const handleConnect = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        
        setApiError("")
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        const rawData = Object.fromEntries(formData.entries())

        const config = {
            namespace: rawData["namespace"] as string,
            name: rawData["name"] as string,
            "manager-namespace": rawData["manager-namespace"] as string,
            docker: formData.has("docker"),
            "mapped-namespaces": rawData["mapped-namespaces"] as string,
            "proxy-via": rawData["proxy-via"] as string,
            "also-proxy": rawData["also-proxy"] as string,
            "never-proxy": rawData["never-proxy"] as string,
            "reroute-local": rawData["reroute-local"] as string,
            "reroute-remote": rawData["reroute-remote"] as string,
            vnat: rawData["vnat"] as string,
            "allow-conflicting-subnets": rawData["allow-conflicting-subnets"] as string,
            expose: rawData["expose"] as string,
            hostname: rawData["hostname"] as string,
            kubeconfig: rawData["kubeconfig"] as string,
            context: rawData["context"] as string,
            cluster: rawData["cluster"] as string,
            server: rawData["server"] as string,
            token: rawData["token"] as string,
            user: rawData["user"] as string,
            as: rawData["as"] as string,
            "as-group": rawData["as-group"] as string,
            "as-uid": rawData["as-uid"] as string,
            "client-certificate": rawData["client-certificate"] as string,
            "client-key": rawData["client-key"] as string,
            "insecure-skip-tls-verify": formData.has("insecure-skip-tls-verify"),
            "tls-server-name": rawData["tls-server-name"] as string,
            config: rawData["config"] as string,
            "request-timeout": rawData["request-timeout"] as string,
            "disable-compression": formData.has("disable-compression"),
        }
        try {
            console.log("Starting Telepresence with config:", config)
            await StartTelepresence(config);
            console.log("Telepresence started");
            toast.add({
                type: "success",
                description: "Telepresence started successfully."
            })

            onConnectSuccess()
        } catch (error) {
            console.error("Failed to start Telepresence:", error);
            setApiError(String(error))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-3xl m-5">
            <CardHeader>
                <CardTitle>Start a Connection</CardTitle>
                <CardAction>
                    <ModeToggle />
                </CardAction>
            </CardHeader>
            <form ref={formRef} onSubmit={handleConnect} onReset={handleReset}>
                <CardContent className="pb-2">
                    <Tabs defaultValue="core" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="core">Core Connection</TabsTrigger>
                            <TabsTrigger value="network">Network Routing</TabsTrigger>
                            <TabsTrigger value="cluster">Cluster & Auth</TabsTrigger>
                            <TabsTrigger value="advanced">Advanced</TabsTrigger>
                        </TabsList>

                        <TabsContent value="core">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Core Connection</CardTitle>
                                    <CardDescription>
                                        Essential settings to establish your development session and intercept traffic.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    <div className="grid gap-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="namespace">Namespace</Label>
                                                <Input id="namespace" name="namespace" placeholder="default" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="name">Connection Name</Label>
                                                <Input id="name" name="name" placeholder="my-connection" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="manager-namespace">Manager Namespace</Label>
                                                <Input id="manager-namespace" name="manager-namespace" placeholder="Override default manager namespace" />
                                            </div>
                                            <div className="flex items-center space-x-2 pt-6">
                                                <Switch id="docker" name="docker" />
                                                <Label htmlFor="docker">Start daemon in Docker container</Label>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="network">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Network Routing</CardTitle>
                                    <CardDescription>
                                        Configure CIDRs, port forwarding, and namespace mapping for outbound connections.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="mapped-namespaces">Mapped Namespaces</Label>
                                            <Input id="mapped-namespaces" name="mapped-namespaces" placeholder="comma, separated, namespaces" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="proxy-via">Proxy Via</Label>
                                            <Input id="proxy-via" name="proxy-via" placeholder="CIDR=WORKLOAD" />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="also-proxy">Also Proxy</Label>
                                            <Input id="also-proxy" name="also-proxy" placeholder="Comma-separated CIDRs" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="never-proxy">Never Proxy</Label>
                                            <Input id="never-proxy" name="never-proxy" placeholder="Comma-separated CIDRs" />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="reroute-local">Reroute Local</Label>
                                            <Input id="reroute-local" name="reroute-local" placeholder="<local port>:<host>:<port>" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="reroute-remote">Reroute Remote</Label>
                                            <Input id="reroute-remote" name="reroute-remote" placeholder="<host>:<port>:<new port>" />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="vnat">Virtual NAT (vnat)</Label>
                                            <Input id="vnat" name="vnat" placeholder="Comma-separated CIDRs or symbolic names" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="allow-conflicting-subnets">Allow Conflicting Subnets</Label>
                                            <Input id="allow-conflicting-subnets" name="allow-conflicting-subnets" placeholder="Comma-separated CIDRs" />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="expose">Expose Ports</Label>
                                            <Input id="expose" name="expose" placeholder="e.g., 8080:80" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="hostname">Hostname</Label>
                                            <Input id="hostname" name="hostname" placeholder="Containerized daemon hostname" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="cluster">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Cluster & Authentication</CardTitle>
                                    <CardDescription>
                                        Provide Kubeconfig paths, impersonation settings, and TLS credentials.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2 grid gap-2">
                                            <div className="flex gap-2">
                                                <Input
                                                    id="kubeconfig"
                                                    name="kubeconfig"
                                                    type="text"
                                                    value={kubeconfigPath}
                                                    onChange={(e) => setKubeconfigPath(e.target.value)}
                                                    placeholder="/path/to/kubeconfig"
                                                />
                                                <Button type="button" variant="secondary" onClick={handleBrowseKubeconfig}>
                                                    Browse
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="context">Context</Label>
                                            <Input id="context" name="context" placeholder="Kubeconfig context" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="cluster">Cluster</Label>
                                            <Input id="cluster" name="cluster" placeholder="Cluster name" />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="server">API Server</Label>
                                            <Input id="server" name="server" placeholder="https://..." type="url" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="token">Bearer Token</Label>
                                            <Input id="token" name="token" type="password" placeholder="••••••••••••" />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="user">User</Label>
                                            <Input id="user" name="user" placeholder="Kubeconfig user" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="as">Impersonate User (--as)</Label>
                                            <Input id="as" name="as" placeholder="Username or service account" />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="as-group">Impersonate Group</Label>
                                            <Input id="as-group" name="as-group" placeholder="Comma-separated groups" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="as-uid">Impersonate UID</Label>
                                            <Input id="as-uid" name="as-uid" placeholder="UID" />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="client-certificate">Client Certificate</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="client-certificate"
                                                    name="client-certificate"
                                                    type="text"
                                                    value={clientCertificatePath}
                                                    onChange={(e) => setClientCertificatePath(e.target.value)}
                                                    placeholder="/path/to/client/certificate"
                                                />
                                                <Button type="button" variant="secondary" onClick={handleBrowseClientCertificate}>
                                                    Browse
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="client-key">Client Key</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="client-key"
                                                    name="client-key"
                                                    type="text"
                                                    value={clientKeyPath}
                                                    onChange={(e) => setClientKeyPath(e.target.value)}
                                                    placeholder="/path/to/client/key"
                                                />
                                                <Button type="button" variant="secondary" onClick={handleBrowseClientKey}>
                                                    Browse
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2 pt-6">
                                            <Switch id="insecure-skip-tls-verify" name="insecure-skip-tls-verify" />
                                            <Label htmlFor="insecure-skip-tls-verify" className="text-destructive">Skip TLS Verify</Label>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="tls-server-name">TLS Server Name</Label>
                                            <Input id="tls-server-name" name="tls-server-name" placeholder="Server name for validation" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="advanced">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Advanced Settings</CardTitle>
                                    <CardDescription>
                                        Global CLI configurations and network tuning.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2 grid gap-2">
                                            <Label htmlFor="config">Telepresence Config Path</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="config"
                                                    name="config"
                                                    type="text"
                                                    value={telepresenceConfigPath}
                                                    onChange={(e) => setTelepresenceConfigPath(e.target.value)}
                                                    placeholder="/path/to/telepresence/config"
                                                />
                                                <Button type="button" variant="secondary" onClick={handleBrowseTelepresenceConfig}>
                                                    Browse
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="request-timeout">Request Timeout</Label>
                                            <Input id="request-timeout" name="request-timeout" placeholder="e.g., 2m, 3h" />
                                        </div>

                                        <div className="flex items-center space-x-2 pt-6">
                                            <Switch id="disable-compression" name="disable-compression" />
                                            <Label htmlFor="disable-compression">Disable Response Compression</Label>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                    {apiError.length != 0 &&
                        <Alert variant="destructive" className="mt-2">
                            <AlertCircleIcon />
                            <AlertTitle>Connection failed</AlertTitle>
                            <AlertDescription>{apiError}</AlertDescription>
                        </Alert>
                    }
                </CardContent>
                <CardFooter className="flex-col gap-2">
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && (
                            <Spinner data-icon="inline-start" />
                        )}
                        Connect
                    </Button>
                    <Button type="reset" variant="outline" className="w-full" disabled={loading}>
                        {loading && (
                            <Spinner data-icon="inline-start" />
                        )}
                        Reset to Defualts
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
