//go:build !linux

package services

func getAbiTag() string {
	return ""
}
