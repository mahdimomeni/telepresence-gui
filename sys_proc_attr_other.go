//go:build !windows

package main

import "syscall"

// getSysProcAttr returns default execution attributes for non-Windows platforms.
func getSysProcAttr() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{}
}
