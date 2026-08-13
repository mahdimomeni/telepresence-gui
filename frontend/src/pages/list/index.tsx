import { useEffect, useState } from "react"
import { RefreshCw, ServerOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ModeToggle } from "@/components/mode-toggle"
import { ListWorkloads, StopTelepresence } from "@/../wailsjs/go/main/App"
import { main as models } from "@/../wailsjs/go/models"
import { getColumns } from "./columns"
import { DataTable } from "./data-table"



export function ListPage({ onDisconnect }: { onDisconnect: () => void }) {
  const [workloads, setWorkloads] = useState<models.Workload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchWorkloads = async () => {
    setLoading(true)
    setError("")

    try {
      const data = await ListWorkloads()
      setWorkloads(data)
    } catch (err) {
      console.error(err)
      setError(String(err))
      toast.add({
        type: "error",
        description: "Failed to fetch workloads.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await StopTelepresence()
      toast.add({
        type: "success",
        description: "Disconnected successfully.",
      })
      onDisconnect()
    } catch (err) {
      toast.add({
        type: "error",
        description: `Failed to disconnect: ${String(err)}`,
      })
    }
  }

  // Fetch data on initial component mount
  useEffect(() => {
    fetchWorkloads()
  }, [])

  return (
    <Card className="w-full max-w-4xl m-5 min-h-125 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
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
          <Button variant="destructive" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto">
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
          <DataTable columns={getColumns(fetchWorkloads)} data={workloads} />
        )}
      </CardContent>
    </Card>
  )
}