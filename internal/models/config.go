package models

type ConnectConfig struct {
	Namespace                  string `json:"namespace"`
	Name                       string `json:"name"`
	ManagerNamespace           string `json:"manager-namespace"`
	Docker                     bool   `json:"docker"`
	MappedNamespaces           string `json:"mapped-namespaces"`
	ProxyVia                   string `json:"proxy-via"`
	AlsoProxy                  string `json:"also-proxy"`
	NeverProxy                 string `json:"never-proxy"`
	RerouteLocal               string `json:"reroute-local"`
	RerouteRemote              string `json:"reroute-remote"`
	VirtualNAT                 string `json:"vnat"`
	AllowConflictingSubnets    string `json:"allow-conflicting-subnets"`
	ExposePorts                string `json:"expose"`
	Hostname                   string `json:"hostname"`
	Kubeconfig                 string `json:"kubeconfig"`
	Context                    string `json:"context"`
	Cluster                    string `json:"cluster"`
	APIServer                  string `json:"server"`
	BearerToken                string `json:"token"`
	User                       string `json:"user"`
	ImpersonateUser            string `json:"as"`
	ImpersonateGroup           string `json:"as-group"`
	ImpersonateUID             string `json:"as-uid"`
	ClientCertificate          string `json:"client-certificate"`
	ClientKey                  string `json:"client-key"`
	SkipTLSVerify              bool   `json:"insecure-skip-tls-verify"`
	TLSServerName              string `json:"tls-server-name"`
	TelepresenceConfigPath     string `json:"config"`
	RequestTimeout             string `json:"request-timeout"`
	DisableResponseCompression bool   `json:"disable-compression"`
}

type InterceptConfig struct {
	Workload   string `json:"workload"`
	Port       string `json:"port"`
	EnvFile    string `json:"env_file"`
	EnvJSON    string `json:"env_json"`
	EnvSyntax  string `json:"env_syntax"`
	HTTPHeader string `json:"http_header"`
	Mount      string `json:"mount"`
	Container  string `json:"container"`
	Service    string `json:"service"`
	DockerRun  bool   `json:"docker_run"`
	DockerArgs string `json:"docker_args"`
}

type DetachConfig struct {
	AttachmentName string `json:"attachment_name"`
	Namespace      string `json:"namespace"`
}
