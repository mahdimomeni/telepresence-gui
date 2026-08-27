import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { models } from "@/../wailsjs/go/models"
import { useCallback, SyntheticEvent, useEffect, useRef, useState, type SubmitEvent } from "react"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    AlertCircleIcon,
    Radio,
    Network,
    ShieldCheck,
    SlidersHorizontal,
    RotateCcw,
    Copy,
    Check,
    PlugZap,
} from "lucide-react"
import { CoreTab } from "@/components/connect-form/tabs/core-tab"
import { NetworkTab } from "@/components/connect-form/tabs/network-tab"
import { ClusterAuthTab } from "@/components/connect-form/tabs/cluster-auth-tab"
import { AdvancedTab } from "@/components/connect-form/tabs/advanced-tab"
import { ConnectFormProps, DEFAULT_VALUES } from "@/components/connect-form/types"
import { EventsOff, EventsOn } from "../../../wailsjs/runtime/runtime"
import { useLoadingStore } from "@/stores/useLoadingStore"
import { KubeService } from "@/services/kube"
import { CoreService } from "@/services/core"
import { TelepresenceService } from "@/services/telepresence"

export function ConnectForm({ onConnectSuccess }: ConnectFormProps) {
    const formRef = useRef<HTMLFormElement>(null)
    const lastLoadedKubeconfig = useRef<string | null>(null)
    const [apiError, setApiError] = useState("")
    const [copiedError, setCopiedError] = useState(false)

    const isConnecting = useLoadingStore((state) => state.isLoading("connection"))
    const isFetchingKube = useLoadingStore((state) => state.isLoading("kube-info"))
    const loading = isConnecting || isFetchingKube

    const startLoading = useLoadingStore((state) => state.startLoading)
    const stopLoading = useLoadingStore((state) => state.stopLoading)
    const setLoading = useLoadingStore((state) => state.setLoading)

    const [connectConfig, setConnectConfig] = useState(new models.ConnectConfig(DEFAULT_VALUES))
    const [availableContexts, setAvailableContexts] = useState<string[]>([])

    useEffect(() => {
        const unsubscribeConnectionPending = EventsOn("connection-pending", (status: boolean) => {
            setLoading("connection", status)
        })

        return () => {
            EventsOff("connection-pending")
        }
    }, [setLoading])

    useEffect(() => {
        // Guard: Prevent double-fetching and infinite state-update loops
        if (connectConfig.kubeconfig === lastLoadedKubeconfig.current) {
            return
        }

        const fetchKubeData = async () => {
            startLoading("kube-info")
            try {
                // Fetch using the current state's path (starts as "" on mount)
                const info = await KubeService.getInfo(connectConfig.kubeconfig)

                // 1. Update our ref so we don't fetch this exact path again
                lastLoadedKubeconfig.current = info.kubeconfigPath

                // 2. Populate available contexts
                if (info.contexts && info.contexts.length > 0) {
                    setAvailableContexts(info.contexts)
                }

                // 3. Handle Saved Config vs. CLI Defaults
                if (connectConfig.kubeconfig === "" && info.savedConfig) {
                    // Initial load ONLY: if a saved config exists, use it entirely
                    setConnectConfig(info.savedConfig)
                    // Ensure our guard knows about the saved config's path
                    lastLoadedKubeconfig.current = info.savedConfig.kubeconfig
                } else {
                    // Subsequent loads (or if no saved config exists): merge the CLI data
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
                stopLoading("kube-info")
            }
        }

        fetchKubeData()
    }, [connectConfig.kubeconfig, startLoading, stopLoading])

    const handleReset = useCallback(async (event: SyntheticEvent<HTMLFormElement>) => {
        setConnectConfig(new models.ConnectConfig(DEFAULT_VALUES))
        CoreService.notify("Telepresence Config Reset", "Options reset successfully.")

        startLoading("kube-info")

        try {
            const info = await KubeService.getInfo("")

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
            stopLoading("kube-info")
        }
    }, [startLoading, stopLoading])

    const handleFieldChange = useCallback((key: keyof models.ConnectConfig, value: any) => {
        setConnectConfig((prev) => ({ ...prev, [key]: value }))
    }, [])

    const handleBrowseFile = useCallback((key: keyof models.ConnectConfig, message: string) => {
        const browseFile = async () => {
            const path = await CoreService.browseFile(message)
            if (path) {
                setConnectConfig((prevData) => ({
                    ...prevData,
                    [key]: path
                }))
            }
        }
        browseFile()
    }, [])

    const handleConnect = useCallback(async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        setApiError("")
        startLoading("connection")

        try {
            await TelepresenceService.connect(connectConfig)
            onConnectSuccess()
        } catch (error) {
            setApiError(String(error))
        } finally {
            stopLoading("connection")
        }
    }, [connectConfig, onConnectSuccess, startLoading, stopLoading])

    const handleCopyError = async () => {
        if (!apiError) return
        try {
            await navigator.clipboard.writeText(apiError)
            setCopiedError(true)
            setTimeout(() => setCopiedError(false), 2000)
        } catch (err) {
            console.error("Failed to copy error", err)
        }
    }

    return (
        <Card className="w-full max-w-2xl bg-card/90 backdrop-blur-md border-border/60 shadow-2xl shadow-black/25">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                        <PlugZap className="size-5" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">Establish Cluster Session</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-0.5">
                            Connect your workstation directly to your remote Kubernetes namespace.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <form ref={formRef} onSubmit={handleConnect} onReset={handleReset}>
                <fieldset disabled={loading} className="space-y-0 border-0 p-0 m-0 min-w-0">
                    <CardContent className="pb-2">
                        <Tabs defaultValue="core" className="w-full">
                            <TabsList className="grid w-full grid-cols-4 mb-4">
                                <TabsTrigger value="core" className="gap-1.5 text-xs">
                                    <Radio className="size-3.5" />
                                    <span>Core</span>
                                </TabsTrigger>
                                <TabsTrigger value="network" className="gap-1.5 text-xs">
                                    <Network className="size-3.5" />
                                    <span>Network</span>
                                </TabsTrigger>
                                <TabsTrigger value="cluster" className="gap-1.5 text-xs">
                                    <ShieldCheck className="size-3.5" />
                                    <span>Cluster & Auth</span>
                                </TabsTrigger>
                                <TabsTrigger value="advanced" className="gap-1.5 text-xs">
                                    <SlidersHorizontal className="size-3.5" />
                                    <span>Advanced</span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="core" className="mt-0">
                                <CoreTab
                                    values={connectConfig}
                                    onChange={handleFieldChange}
                                    onBrowse={handleBrowseFile}
                                />
                            </TabsContent>

                            <TabsContent value="network" className="mt-0">
                                <NetworkTab
                                    values={connectConfig}
                                    onChange={handleFieldChange}
                                    onBrowse={handleBrowseFile}
                                />
                            </TabsContent>

                            <TabsContent value="cluster" className="mt-0">
                                <ClusterAuthTab
                                    values={connectConfig}
                                    onChange={handleFieldChange}
                                    onBrowse={handleBrowseFile}
                                    availableContexts={availableContexts}
                                />
                            </TabsContent>

                            <TabsContent value="advanced" className="mt-0">
                                <AdvancedTab
                                    values={connectConfig}
                                    onChange={handleFieldChange}
                                    onBrowse={handleBrowseFile}
                                />
                            </TabsContent>
                        </Tabs>

                        {apiError.length !== 0 && (
                            <Alert variant="destructive" className="mt-4 border-destructive/40 bg-destructive/10">
                                <AlertCircleIcon className="size-4 text-destructive" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <AlertTitle className="font-semibold text-sm">Connection Failed</AlertTitle>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleCopyError}
                                            className="h-6 px-2 text-[11px] gap-1 text-destructive hover:bg-destructive/20"
                                        >
                                            {copiedError ? (
                                                <Check className="size-3 text-emerald-500" />
                                            ) : (
                                                <Copy className="size-3" />
                                            )}
                                            <span>{copiedError ? "Copied" : "Copy Error"}</span>
                                        </Button>
                                    </div>
                                    <AlertDescription className="text-xs font-mono mt-1.5 max-h-32 overflow-y-auto whitespace-pre-wrap break-all select-all text-destructive-foreground/90 bg-background/50 p-2 rounded border border-destructive/20">
                                        {apiError}
                                    </AlertDescription>
                                </div>
                            </Alert>
                        )}
                    </CardContent>
                </fieldset>

                <CardFooter className="flex-col gap-2 pt-3">
                    <Button
                        type="submit"
                        className="w-full h-10 text-sm font-semibold shadow-md gap-2"
                        disabled={loading}
                    >
                        {isConnecting ? (
                            <>
                                <Spinner className="size-4" />
                                <span>Establishing Connection...</span>
                            </>
                        ) : isFetchingKube ? (
                            <>
                                <Spinner className="size-4" />
                                <span>Loading Cluster Defaults...</span>
                            </>
                        ) : (
                            <>
                                <PlugZap className="size-4" />
                                <span>Connect Session</span>
                            </>
                        )}
                    </Button>
                    <Button
                        type="reset"
                        variant="outline"
                        className="w-full h-9 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                        disabled={loading}
                    >
                        <RotateCcw className="size-3.5" />
                        <span>Reset to Defaults</span>
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}

