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
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSeparator,
    FieldSet,
} from "@/components/ui/field"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { ModeToggle } from "./mode-toggle"
import { Label } from "./ui/label"
import { Switch } from "./ui/switch"

export function ConnectForm() {
    const telepCtx = [
        { label: "Development", value: "develop" },
        { label: "Production", value: "prod" },
    ]

    return (
        <Card className="w-full max-w-3xl m-5">
            <CardHeader>
                <CardTitle>Start a Connection</CardTitle>
                <CardAction>
                    <ModeToggle />
                </CardAction>
            </CardHeader>
            <CardContent>
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
                                <form className="grid gap-6">
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
                                </form>
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
                                <form className="grid grid-cols-2 gap-6">
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
                                </form>
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
                                <form className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2 grid gap-2">
                                        <Label htmlFor="kubeconfig">Kubeconfig Path</Label>
                                        <Input id="kubeconfig" name="kubeconfig" type="file" className="cursor-pointer" />
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
                                        <Input id="client-certificate" name="client-certificate" type="file" className="cursor-pointer" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="client-key">Client Key</Label>
                                        <Input id="client-key" name="client-key" type="file" className="cursor-pointer" />
                                    </div>

                                    <div className="flex items-center space-x-2 pt-6">
                                        <Switch id="insecure-skip-tls-verify" name="insecure-skip-tls-verify" />
                                        <Label htmlFor="insecure-skip-tls-verify" className="text-destructive">Skip TLS Verify</Label>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="tls-server-name">TLS Server Name</Label>
                                        <Input id="tls-server-name" name="tls-server-name" placeholder="Server name for validation" />
                                    </div>
                                </form>
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
                                <form className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2 grid gap-2">
                                        <Label htmlFor="config">Telepresence Config Path</Label>
                                        <Input id="config" name="config" type="file" className="cursor-pointer" />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="request-timeout">Request Timeout</Label>
                                        <Input id="request-timeout" name="request-timeout" placeholder="e.g., 2m, 3h" />
                                    </div>

                                    <div className="flex items-center space-x-2 pt-6">
                                        <Switch id="disable-compression" name="disable-compression" />
                                        <Label htmlFor="disable-compression">Disable Response Compression</Label>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <Button type="submit" className="w-full">
                    Connect
                </Button>
                <Button variant="outline" className="w-full">
                    Reset to Defualts
                </Button>
            </CardFooter>
        </Card>
    )
}
