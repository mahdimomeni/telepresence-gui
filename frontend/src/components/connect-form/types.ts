import { main as models } from "@/../wailsjs/go/models"

export interface ConnectFormProps {
    onConnectSuccess: () => void
}

export interface TabProps {
  values: models.ConnectConfig
  onChange: (key: keyof models.ConnectConfig, value: any) => void
  onBrowse: (key: keyof models.ConnectConfig, message: string) => void
  availableContexts?: string[]
}

export const DEFAULT_VALUES: models.ConnectConfig = {
    namespace: "default",
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