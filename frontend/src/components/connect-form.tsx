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
import { SelectFile, StartTelepresence, GetKubeInfo, SaveConnectConfig } from "../../wailsjs/go/main/App"
import { main as models } from "../../wailsjs/go/models"
import { ChangeEvent, SyntheticEvent, useEffect, useRef, useState, type SubmitEvent } from "react"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { AlertCircleIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { SwitchRoot } from "@base-ui/react/switch"

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
    "disable-compression": false,
}

export function ConnectForm({ onConnectSuccess }: ConnectFormProps) {
    const formRef = useRef<HTMLFormElement>(null)
    const [loading, setLoading] = useState(false)
    const [apiError, setApiError] = useState("")

    const [connectConfig, setConnectConfig] = useState(new models.ConnectConfig(DEFAULT_VALUES))
    const [availableContexts, setAvailableContexts] = useState<string[]>([])

    useEffect(() => {
        const fetchKubeData = async () => {
            setLoading(true)
            try {
                const info = await GetKubeInfo("")

                if (info.contexts && info.contexts.length > 0) {
                    setAvailableContexts(info.contexts)
                }

                if (info.savedConfig) {
                    setConnectConfig(info.savedConfig)
                } else {
                    setConnectConfig((prevData) => ({
                        ...prevData,
                        kubeconfig: info.kubeconfigPath,
                        context: info.currentContext,
                        namespace: info.namespace
                    }))
                }
            } catch (error) {
                console.warn("Could not load kubeconfig defaults:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchKubeData()
    }, [])

    useEffect(() => {
        const fetchKubeData = async () => {
            setLoading(true)
            try {
                const info = await GetKubeInfo(connectConfig.kubeconfig)

                console.log(connectConfig.kubeconfig)
                console.log(info)

                if (info.contexts && info.contexts.length > 0) {
                    setAvailableContexts(info.contexts)
                }

                setConnectConfig((prevData) => ({
                    ...prevData,
                    kubeconfig: info.kubeconfigPath,
                    context: info.currentContext,
                    namespace: info.namespace
                }))
            } catch (error) {
                console.warn("Could not load kubeconfig defaults:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchKubeData()
    }, [connectConfig.kubeconfig])

    const handleReset = async (event: SyntheticEvent<HTMLFormElement>) => {
        setConnectConfig(new models.ConnectConfig(DEFAULT_VALUES))
        toast.add({
            type: "success",
            description: "Options reseted successfully."
        })

        setLoading(true)

        setConnectConfig(new models.ConnectConfig(DEFAULT_VALUES))

        try {
            const info = await GetKubeInfo("")

            if (info.contexts && info.contexts.length > 0) {
                setAvailableContexts(info.contexts)
            }

            setConnectConfig((prevData) => ({
                ...prevData,
                context: info.currentContext,
                namespace: info.namespace,
                kubeconfig: info.kubeconfigPath,
            }))
        } catch (error) {
            console.warn("Could not load kubeconfig defaults:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleBrowseKubeconfig = async () => {
        const path = await SelectFile("Select Kubeconfig File")
        if (path) {
            setConnectConfig((prevData) => ({
                ...prevData,
                kubeconfig: path
            }))
        }
    }

    const handleBrowseClientCertificate = async () => {
        const path = await SelectFile("Select Client Certificate File")
        if (path) {
            setConnectConfig((prevData) => ({
                ...prevData,
                "client-certificate": path
            }))
        }
    }

    const handleBrowseClientKey = async () => {
        const path = await SelectFile("Select Client Key File")
        if (path) {
            setConnectConfig((prevData) => ({
                ...prevData,
                "client-key": path
            }))
        }
    }

    const handleBrowseTelepresenceConfig = async () => {
        const path = await SelectFile("Select Telepresence Config File")
        if (path) {
            setConnectConfig((prevData) => ({
                ...prevData,
                config: path
            }))
        }
    }

    const handleInputChange = (e: ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
        const { name, value } = e.target

        setConnectConfig((prevData) => ({
            ...prevData,
            [name]: value
        }))
    }

    const handleSwitchChange = (name: string) => (checked: boolean) => {
        setConnectConfig((prevData) => ({
            ...prevData,
            [name]: checked
        }))
    }

    const handleConnect = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        setApiError("")
        setLoading(true)

        try {
            await SaveConnectConfig(connectConfig)
            await StartTelepresence(connectConfig)
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
        <Card className="w-2xl m-5">
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
                                                <Input
                                                    id="namespace"
                                                    name="namespace"
                                                    placeholder="default"
                                                    value={connectConfig.namespace}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="name">Connection Name</Label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    placeholder="my-connection"
                                                    value={connectConfig.name}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="manager-namespace">Manager Namespace</Label>
                                                <Input
                                                    id="manager-namespace"
                                                    name="manager-namespace"
                                                    placeholder="Override default manager namespace"
                                                    value={connectConfig["manager-namespace"]}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="flex items-center space-x-2 pt-6">
                                                <Switch
                                                    id="docker"
                                                    name="docker"
                                                    checked={connectConfig.docker}
                                                    onCheckedChange={handleSwitchChange("docker")}
                                                />
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
                                            <Input
                                                id="mapped-namespaces"
                                                name="mapped-namespaces"
                                                placeholder="comma, separated, namespaces"
                                                value={connectConfig["mapped-namespaces"]}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="proxy-via">Proxy Via</Label>
                                            <Input
                                                id="proxy-via"
                                                name="proxy-via"
                                                placeholder="CIDR=WORKLOAD"
                                                value={connectConfig["proxy-via"]}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="also-proxy">Also Proxy</Label>
                                            <Input
                                                id="also-proxy"
                                                name="also-proxy"
                                                placeholder="Comma-separated CIDRs"
                                                value={connectConfig["also-proxy"]}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="never-proxy">Never Proxy</Label>
                                            <Input
                                                id="never-proxy"
                                                name="never-proxy"
                                                placeholder="Comma-separated CIDRs"
                                                value={connectConfig["never-proxy"]}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="reroute-local">Reroute Local</Label>
                                            <Input
                                                id="reroute-local"
                                                name="reroute-local"
                                                placeholder="<local port>:<host>:<port>"
                                                value={connectConfig["reroute-local"]}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="reroute-remote">Reroute Remote</Label>
                                            <Input
                                                id="reroute-remote"
                                                name="reroute-remote"
                                                placeholder="<host>:<port>:<new port>"
                                                value={connectConfig["reroute-remote"]}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="vnat">Virtual NAT (vnat)</Label>
                                            <Input
                                                id="vnat"
                                                name="vnat"
                                                placeholder="Comma-separated CIDRs or symbolic names"
                                                value={connectConfig.vnat}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="allow-conflicting-subnets">Allow Conflicting Subnets</Label>
                                            <Input
                                                id="allow-conflicting-subnets"
                                                name="allow-conflicting-subnets"
                                                placeholder="Comma-separated CIDRs"
                                                value={connectConfig["allow-conflicting-subnets"]}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="expose">Expose Ports</Label>
                                            <Input
                                                id="expose"
                                                name="expose"
                                                placeholder="e.g., 8080:80"
                                                value={connectConfig.expose}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="hostname">Hostname</Label>
                                            <Input
                                                id="hostname"
                                                name="hostname"
                                                placeholder="Containerized daemon hostname"
                                                value={connectConfig.hostname}
                                                onChange={handleInputChange}
                                            />
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
                                                    value={connectConfig.kubeconfig}
                                                    onChange={handleInputChange}
                                                    placeholder="/path/to/kubeconfig"
                                                />
                                                <Button type="button" variant="secondary" onClick={handleBrowseKubeconfig}>
                                                    Browse
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="context">Context</Label>
                                            {availableContexts.length > 0 ? (
                                                <Select
                                                    value={connectConfig.context}
                                                    onValueChange={(value) => {
                                                        if (value != null) {
                                                            setConnectConfig((prevData) => ({
                                                                ...prevData,
                                                                context: value
                                                            }))
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger id="context">
                                                        <SelectValue placeholder="Select a context" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableContexts.map((ctxName) => (
                                                            <SelectItem key={ctxName} value={ctxName}>
                                                                {ctxName}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Input
                                                    id="context"
                                                    value={connectConfig.context}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g., minikube"
                                                />
                                            )}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="cluster">Cluster</Label>
                                            <Input
                                                id="cluster"
                                                name="cluster"
                                                placeholder="Cluster name"
                                                value={connectConfig.cluster}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="server">API Server</Label>
                                            <Input
                                                id="server"
                                                name="server"
                                                placeholder="https://..." type="url"
                                                value={connectConfig.server}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="token">Bearer Token</Label>
                                            <Input
                                                id="token"
                                                name="token"
                                                type="password"
                                                placeholder="••••••••••••"
                                                value={connectConfig.token}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="user">User</Label>
                                            <Input
                                                id="user"
                                                name="user"
                                                placeholder="Kubeconfig user"
                                                value={connectConfig.user}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="as">Impersonate User (--as)</Label>
                                            <Input
                                                id="as"
                                                name="as"
                                                placeholder="Username or service account"
                                                value={connectConfig.as}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="as-group">Impersonate Group</Label>
                                            <Input
                                                id="as-group"
                                                name="as-group"
                                                placeholder="Comma-separated groups"
                                                value={connectConfig["as-group"]}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="as-uid">Impersonate UID</Label>
                                            <Input
                                                id="as-uid"
                                                name="as-uid"
                                                placeholder="UID"
                                                value={connectConfig["as-uid"]}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="client-certificate">Client Certificate</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="client-certificate"
                                                    name="client-certificate"
                                                    type="text"
                                                    value={connectConfig["client-certificate"]}
                                                    onChange={handleInputChange}
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
                                                    value={connectConfig["client-key"]}
                                                    onChange={handleInputChange}
                                                    placeholder="/path/to/client/key"
                                                />
                                                <Button type="button" variant="secondary" onClick={handleBrowseClientKey}>
                                                    Browse
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2 pt-6">
                                            <Switch
                                                id="insecure-skip-tls-verify"
                                                name="insecure-skip-tls-verify"
                                                checked={connectConfig["insecure-skip-tls-verify"]}
                                                onCheckedChange={handleSwitchChange("insecure-skip-tls-verify")}
                                            />
                                            <Label htmlFor="insecure-skip-tls-verify" className="text-destructive">Skip TLS Verify</Label>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="tls-server-name">TLS Server Name</Label>
                                            <Input
                                                id="tls-server-name"
                                                name="tls-server-name"
                                                placeholder="Server name for validation"
                                                value={connectConfig["tls-server-name"]}
                                                onChange={handleInputChange}
                                            />
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
                                                    value={connectConfig["client-key"]}
                                                    onChange={handleInputChange}
                                                    placeholder="/path/to/telepresence/config"
                                                />
                                                <Button type="button" variant="secondary" onClick={handleBrowseTelepresenceConfig}>
                                                    Browse
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="request-timeout">Request Timeout</Label>
                                            <Input
                                                id="request-timeout"
                                                name="request-timeout"
                                                placeholder="e.g., 2m, 3h"
                                                value={connectConfig["request-timeout"]}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="flex items-center space-x-2 pt-6">
                                            <Switch
                                                id="disable-compression"
                                                name="disable-compression"
                                                checked={connectConfig["disable-compression"]}
                                                onCheckedChange={handleSwitchChange("disable-compression")}
                                            />
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
