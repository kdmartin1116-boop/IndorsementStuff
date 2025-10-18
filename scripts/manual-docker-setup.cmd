# Manual Docker Desktop Installation Commands
# Run these in Command Prompt as Administrator

# Enable WSL
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# Enable Virtual Machine Platform
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Enable Hyper-V (if available)
dism.exe /online /enable-feature /featurename:Microsoft-Hyper-V-All /all /norestart

# Restart computer after running these commands
shutdown /r /t 0