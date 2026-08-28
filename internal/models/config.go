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
	Workload       string   `json:"workload"`
	Port           string   `json:"port"`
	Address        string   `json:"address"`
	Container      string   `json:"container"`
	Service        string   `json:"service"`
	Namespace      string   `json:"namespace"`
	HTTPHeader     string   `json:"http_header"`
	HTTPPathPrefix string   `json:"http_path_prefix"`
	Mount          string   `json:"mount"`
	LocalMountPort int      `json:"local_mount_port"`
	ToPod          []string `json:"to_pod"`
	EnvFile        string   `json:"env_file"`
	EnvJSON        string   `json:"env_json"`
	EnvSyntax      string   `json:"env_syntax"`
	DockerRun      bool     `json:"docker_run"`
	DockerArgs     string   `json:"docker_args"`
	DockerBuild    string   `json:"docker_build"`
	DockerBuildOpt []string `json:"docker_build_opt"`
	DockerDebug    string   `json:"docker_debug"`
	DockerMount    string   `json:"docker_mount"`
}

type DetachConfig struct {
	AttachmentName string `json:"attachment_name"`
	Namespace      string `json:"namespace"`
}

type ReplaceConfig struct {
	Workload       string   `json:"workload"`
	Port           string   `json:"port"`
	Container      string   `json:"container"`
	Address        string   `json:"address"`
	Mount          string   `json:"mount"`
	LocalMountPort int      `json:"local_mount_port"`
	ToPod          []string `json:"to_pod"`
	EnvFile        string   `json:"env_file"`
	EnvJSON        string   `json:"env_json"`
	EnvSyntax      string   `json:"env_syntax"`
	DockerRun      bool     `json:"docker_run"`
	DockerArgs     string   `json:"docker_args"`
	DockerBuild    string   `json:"docker_build"`
	DockerBuildOpt []string `json:"docker_build_opt"`
	DockerDebug    string   `json:"docker_debug"`
	DockerMount    string   `json:"docker_mount"`
	Namespace      string   `json:"namespace"`
}

type AppSettings struct {
	// General & Appearance
	Theme             string `json:"theme"`             // "dark" | "light" | "system"
	EnableGlowEffects bool   `json:"enableGlowEffects"` // Ambient aurora glows
	ShowSplashScreen  bool   `json:"showSplashScreen"`  // Show splash animation on startup
	CloseToTray       bool   `json:"closeToTray"`       // Hide to tray on close vs quit
	StartMinimized    bool   `json:"startMinimized"`    // Start minimized to tray

	// Desktop Notifications
	EnableNotifications bool `json:"enableNotifications"` // Master notification switch
	NotifyOnConnect     bool `json:"notifyOnConnect"`     // Notify on connect/disconnect
	NotifyOnIntercept   bool `json:"notifyOnIntercept"`   // Notify on intercept/replace/detach

	// Updates
	AutoCheckUpdates bool `json:"autoCheckUpdates"` // Check for updates on startup

	// Telepresence Defaults & Connectivity
	DefaultNamespace      string `json:"defaultNamespace"`
	DefaultKubeconfig     string `json:"defaultKubeconfig"`
	DefaultContext        string `json:"defaultContext"`
	ManagerNamespace      string `json:"managerNamespace"`
	RequestTimeoutSeconds int    `json:"requestTimeoutSeconds"` // default 60
	PollIntervalSeconds   int    `json:"pollIntervalSeconds"`   // default 4
	DockerDaemonMode      bool   `json:"dockerDaemonMode"`
	DisableCompression    bool   `json:"disableCompression"`
	InsecureSkipTLS       bool   `json:"insecureSkipTLS"`

	// Log Console Preferences
	MaxLogLines     int    `json:"maxLogLines"`     // default 2000
	AutoScrollLogs  bool   `json:"autoScrollLogs"`  // default true
	WrapLogLines    bool   `json:"wrapLogLines"`    // default true
	DefaultLogLevel string `json:"defaultLogLevel"` // "all", "error", "warn", "info", "commands", "daemon"
}

func DefaultAppSettings() AppSettings {
	return AppSettings{
		Theme:                 "dark",
		EnableGlowEffects:     true,
		ShowSplashScreen:      true,
		CloseToTray:           true,
		StartMinimized:        false,
		EnableNotifications:   true,
		NotifyOnConnect:       true,
		NotifyOnIntercept:     true,
		AutoCheckUpdates:      true,
		DefaultNamespace:      "default",
		DefaultKubeconfig:     "",
		DefaultContext:        "",
		ManagerNamespace:      "",
		RequestTimeoutSeconds: 60,
		PollIntervalSeconds:   4,
		DockerDaemonMode:      false,
		DisableCompression:    false,
		InsecureSkipTLS:       false,
		MaxLogLines:           2000,
		AutoScrollLogs:        true,
		WrapLogLines:          true,
		DefaultLogLevel:       "all",
	}
}

