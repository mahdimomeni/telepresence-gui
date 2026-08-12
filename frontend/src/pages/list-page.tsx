import { useEffect, useState } from "react"
import { RefreshCw, ServerOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ModeToggle } from "@/components/mode-toggle"
import { InterceptDialog } from "@/components/intercept-dialog"
import { ListWorkloads, StopTelepresence } from "../../wailsjs/go/main/App"

// Telepresence JSON structure often looks like a map or array of workloads.
// Adjust this interface based on the exact shape of your telepresence version's JSON output.
interface Workload {
  name: string
  kind: string
  namespace: string
  // If a workload is already intercepted, it might contain intercept info
  intercepted?: boolean 
}

export function ListPage({ onDisconnect }: { onDisconnect: () => void }) {
  const [workloads, setWorkloads] = useState<Workload[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchWorkloads = async () => {
    setLoading(true)
    setError("")
    
    try {
      const rawJson = await ListWorkloads()
      if (rawJson) {
        // Parse the JSON string returned from Go
        const data = JSON.parse(rawJson)
        
        // Note: 'telepresence list' JSON output varies by version. 
        // If it returns an object of objects, map it to an array:
        const parsedWorkloads = Array.isArray(data) 
            ? data 
            : Object.values(data)
            
        setWorkloads(parsedWorkloads as Workload[])
      } else {
        setWorkloads([])
      }
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
          <div className="grid gap-3">
            {workloads.map((workload, index) => (
              <div 
                key={`${workload.name}-${index}`} 
                className="flex items-center justify-between p-4 border rounded-lg bg-card text-card-foreground shadow-sm transition-colors hover:bg-accent/50"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-lg">{workload.name}</h4>
                    {workload.intercepted && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-500/10 text-green-500 rounded-full border border-green-500/20">
                        Active Intercept
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground flex gap-3">
                    <span>Kind: {workload.kind || "Unknown"}</span>
                    <span>Namespace: {workload.namespace || "default"}</span>
                  </div>
                </div>

                <div>
                  <InterceptDialog 
                    workloadName={workload.name} 
                    onSuccess={fetchWorkloads} 
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}