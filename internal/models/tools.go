package models

type ToolCheckResult struct {
	Name        string `json:"name"`
	DisplayName string `json:"displayName"`
	Description string `json:"description"`
	Required    bool   `json:"required"`
	Installed   bool   `json:"installed"`
	Version     string `json:"version,omitempty"`
	Path        string `json:"path,omitempty"`
	Error       string `json:"error,omitempty"`
	DocsURL     string `json:"docsUrl"`
}

type SystemToolsReport struct {
	AllInstalled bool              `json:"allInstalled"`
	MissingCount int               `json:"missingCount"`
	Tools        []ToolCheckResult `json:"tools"`
}
