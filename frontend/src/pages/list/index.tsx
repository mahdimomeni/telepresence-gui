import { useCallback, useEffect, useMemo, useState } from "react"
import { RefreshCw, ServerOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ModeToggle } from "@/components/mode-toggle"
import { models } from "@/../wailsjs/go/models"
import { getColumns } from "./columns"
import { DataTable } from "./data-table"
import { EventsOff, EventsOn } from "../../../wailsjs/runtime/runtime"
import { useLoadingStore } from "@/stores/useLoadingStore"
import { TelepresenceService } from "@/services/telepresence"
import { CoreService } from "@/services/core"
import { InterceptDialog } from "@/components/intercept-dialog"

export function ListPage({ onDisconnect }: { onDisconnect: () => void }) {
  const [workloads, setWorkloads] = useState<models.Workload[]>([])
  const [error, setError] = useState("")
  const [interceptTarget, setInterceptTarget] = useState<string | null>(null)

  const isScanning = useLoadingStore((state) => state.isLoading("workloads"))
  const isDisconnecting = useLoadingStore((state) => state.isLoading("connection"))
  const loading = isScanning || isDisconnecting

  const startLoading = useLoadingStore((state) => state.startLoading)
  const stopLoading = useLoadingStore((state) => state.stopLoading)
  const setLoading = useLoadingStore((state) => state.setLoading)

  const fetchWorkloads = useCallback(async () => {
    startLoading("workloads")
    setError("")

    try {
      const data = await TelepresenceService.listWorkloads()
      setWorkloads(data)
    } catch (err) {
      console.error(err)
      setError(String(err))
      CoreService.notify("Telepresence Workloads Fetch Error", String(err))
    } finally {
      stopLoading("workloads")
    }
  }, [startLoading, stopLoading])

  const handleDisconnect = useCallback(async () => {
    startLoading("connection")
    
    try {
      await TelepresenceService.disconnect()
      onDisconnect()
    } catch (err) {
      CoreService.notify("Telepresence Disconnection Error", String(err))
    } finally {
      stopLoading("connection")
    }
  }, [startLoading, stopLoading, onDisconnect])

  const handleOpenIntercept = useCallback((name: string) => {
    setInterceptTarget(name)
  }, [])

  const handleCloseIntercept = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setInterceptTarget(null)
    }
  }, [])

  const columns = useMemo(() => getColumns(fetchWorkloads, handleOpenIntercept), [fetchWorkloads, handleOpenIntercept])

  useEffect(() => {
    fetchWorkloads()

    EventsOn("workloads-changed", (updatedWorkloads: models.Workload[]) => {
      setWorkloads(updatedWorkloads)
    })

    EventsOn("connection-pending", (status: boolean) => {
      setLoading("connection", status)
    })

    return () => {
      EventsOff("workloads-changed")
      EventsOff("connection-pending")
    }
  }, [fetchWorkloads, setLoading])

  return (
    <Card className="w-full max-w-4xl m-5 min-h-125 flex flex-col bg-card/80 backdrop-blur-md border-border/50 shadow-2xl shadow-black/20">
      <CardHeader className="flex flex-row items-center justify-between shrink-0">
        <div>
          <CardTitle>Active Connection</CardTitle>
          <CardDescription>
            Workloads available for interception in the current namespace.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchWorkloads} disabled={loading} title="Refresh List">
            <RefreshCw className={loading ? "animate-spin" : ""} />
          </Button>
          <ModeToggle />
          <Button variant="destructive" onClick={handleDisconnect} disabled={loading}>
            Disconnect
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error Loading Workloads</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && workloads.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <Spinner className="size-32" />
            <span className="ml-3 text-muted-foreground">Scanning cluster...</span>
          </div>
        ) : workloads.length === 0 && !error ? (
          <div className="flex flex-col justify-center items-center h-40 text-muted-foreground">
            <ServerOff className="h-10 w-10 mb-2 opacity-50" />
            <p>No interceptable workloads found in this namespace.</p>
          </div>
        ) : (
          <DataTable columns={columns} data={workloads} />
        )}

        {interceptTarget && (
          <InterceptDialog
            workloadName={interceptTarget}
            open={Boolean(interceptTarget)}
            onOpenChange={handleCloseIntercept}
            onSuccess={fetchWorkloads}
          />
        )}
      </CardContent>
    </Card>
  )
}