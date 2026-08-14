package models

type Workload struct {
	Name                   string          `json:"name"`
	Namespace              string          `json:"namespace"`
	WorkloadResourceType   string          `json:"workload_resource_type"`
	UID                    string          `json:"uid"`
	DesiredReplicas        int             `json:"desired_replicas"`
	ReadyReplicas          int             `json:"ready_replicas"`
	AgentVersion           string          `json:"agent_version,omitempty"`
	NotInterceptableReason string          `json:"not_interceptable_reason,omitempty"`
	InterceptInfo          []InterceptInfo `json:"intercept_info,omitempty"`
}

type InterceptInfo struct {
	Spec              InterceptSpec     `json:"spec"`
	ID                string            `json:"id"`
	ClientSession     ClientSession     `json:"client_session"`
	Disposition       int               `json:"disposition"`
	PodName           string            `json:"pod_name"`
	APIPort           int               `json:"api_port"`
	PodIP             string            `json:"pod_ip"`
	SFTPPort          int               `json:"sftp_port"`
	FTPPort           int               `json:"ftp_port"`
	MountPoint        string            `json:"mount_point"`
	MechanismArgsDesc string            `json:"mechanism_args_desc"`
	Environment       map[string]string `json:"environment"`
	Mounts            map[string]int    `json:"mounts"`
	ModifiedAt        Timestamp         `json:"modified_at"`
}

type InterceptSpec struct {
	Name             string            `json:"name"`
	Client           string            `json:"client"`
	Agent            string            `json:"agent"`
	WorkloadKind     string            `json:"workload_kind"`
	Namespace        string            `json:"namespace"`
	Mechanism        string            `json:"mechanism"`
	TargetHost       string            `json:"target_host"`
	PortIdentifier   string            `json:"port_identifier"`
	ServicePortName  string            `json:"service_port_name"`
	ServicePort      int               `json:"service_port"`
	ServiceUID       string            `json:"service_uid"`
	Protocol         string            `json:"protocol"`
	ContainerName    string            `json:"container_name"`
	ContainerPort    int               `json:"container_port"`
	TargetPort       int               `json:"target_port"`
	RoundtripLatency int64             `json:"roundtrip_latency"`
	DialTimeout      int64             `json:"dial_timeout"`
	Replace          bool              `json:"replace"`
	Wiretap          bool              `json:"wiretap"`
	NoDefaultPort    bool              `json:"no_default_port"`
	HeaderFilters    map[string]string `json:"header_filters"`
	Plaintext        bool              `json:"plaintext"`
	NodeAgent        bool              `json:"node_agent"`
}

type ClientSession struct {
	SessionID        string `json:"session_id"`
	ManagerInstallID string `json:"manager_install_id"`
	InstallID        string `json:"install_id"`
}

type Timestamp struct {
	Seconds int64 `json:"seconds"`
	Nanos   int32 `json:"nanos"`
}

type TelepresenceResponse struct {
	Error string
}

type TelepresenceStatusOutput struct {
	UserDaemon struct {
		Running           bool   `json:"running"`
		Status            string `json:"status"`
		KubernetesContext string `json:"kubernetes_context"`
		Namespace         string `json:"namespace"`
		ManagerNamespace  string `json:"manager_namespace"`
	} `json:"user_daemon"`
	RootDaemon struct {
		Running bool   `json:"running"`
		Name    string `json:"name"`
		Version string `json:"version"`
	} `json:"root_daemon"`
	TrafficManager struct {
		Name    string `json:"name"`
		Version string `json:"version"`
	} `json:"traffic_manager"`
}
