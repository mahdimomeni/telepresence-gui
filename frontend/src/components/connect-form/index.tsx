import { Button } from "@/components/ui/button"
import {
    Card,
    CardAction,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ModeToggle } from "@/components/mode-toggle"
import { models } from "@/../wailsjs/go/models"
import { SyntheticEvent, useEffect, useRef, useState, type SubmitEvent } from "react"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircleIcon } from "lucide-react"
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
    }, [])

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
    }, [connectConfig.kubeconfig])

    const handleReset = async (event: SyntheticEvent<HTMLFormElement>) => {
        setConnectConfig(new models.ConnectConfig(DEFAULT_VALUES))
        CoreService.notify("Telepresence Config Reset", "Options reseted successfully.")

        startLoading("kube-info")

        setConnectConfig(new models.ConnectConfig(DEFAULT_VALUES))

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
    }

    const handleFieldChange = (key: keyof models.ConnectConfig, value: any) => {
        setConnectConfig((prev) => ({ ...prev, [key]: value }))
    }

    const handleBrowseFile = (key: keyof models.ConnectConfig, message: string) => {
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
    }

    const handleConnect = async (event: SubmitEvent<HTMLFormElement>) => {
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
    }

    return (
        <Card className="w-2xl m-5 bg-card/80 backdrop-blur-md border-border/50 shadow-2xl shadow-black/20">
            <CardHeader>
                <CardTitle>Start a Connection</CardTitle>
                <CardAction>
                    <ModeToggle />
                </CardAction>
            </CardHeader>
            <form ref={formRef} onSubmit={handleConnect} onReset={handleReset}>
                <fieldset disabled={loading} className="space-y-0 border-0 p-0 m-0 min-w-0">
                    <CardContent className="pb-2">
                        <Tabs defaultValue="core" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="core">Core Connection</TabsTrigger>
                                <TabsTrigger value="network">Network Routing</TabsTrigger>
                                <TabsTrigger value="cluster">Cluster & Auth</TabsTrigger>
                                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                            </TabsList>

                            <TabsContent value="core">
                                <CoreTab
                                    values={connectConfig}
                                    onChange={handleFieldChange}
                                    onBrowse={handleBrowseFile}
                                />
                            </TabsContent>

                            <TabsContent value="network">
                                <NetworkTab
                                    values={connectConfig}
                                    onChange={handleFieldChange}
                                    onBrowse={handleBrowseFile}
                                />
                            </TabsContent>

                            <TabsContent value="cluster">
                                <ClusterAuthTab
                                    values={connectConfig}
                                    onChange={handleFieldChange}
                                    onBrowse={handleBrowseFile}
                                    availableContexts={availableContexts}
                                />
                            </TabsContent>

                            <TabsContent value="advanced">
                                <AdvancedTab
                                    values={connectConfig}
                                    onChange={handleFieldChange}
                                    onBrowse={handleBrowseFile}
                                />
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
                </fieldset>
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
