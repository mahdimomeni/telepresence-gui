package models

type KubeInfo struct {
	CurrentContext string         `json:"currentContext"`
	Contexts       []string       `json:"contexts"`
	Namespace      string         `json:"namespace"`
	KubeconfigPath string         `json:"kubeconfigPath"`
	SavedConfig    *ConnectConfig `json:"savedConfig"`
}
