//go:build linux && webkit2_41

package services

func getAbiTag() string {
	return "_webkit41"
}
