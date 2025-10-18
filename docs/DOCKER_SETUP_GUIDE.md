# 🐳 Docker Desktop Installation & Setup Guide

## Step 1: Download and Install Docker Desktop

### Download Docker Desktop
1. **Go to**: https://www.docker.com/products/docker-desktop/
2. **Click**: "Download for Windows"
3. **Run**: The downloaded `Docker Desktop Installer.exe`

### Installation Steps
1. **Run Installer** as Administrator
2. **Configuration Options**:
   - ✅ Enable Hyper-V Windows Features
   - ✅ Install required Windows components for WSL 2
   - ✅ Add shortcut to desktop
3. **Click**: "Ok" to proceed with installation
4. **Restart** your computer when prompted

## Step 2: Initial Docker Desktop Setup

### First Launch
1. **Start**: Docker Desktop from Start menu or desktop shortcut
2. **Accept**: License agreement
3. **Choose**: "Use WSL 2 instead of Hyper-V" (recommended)
4. **Skip**: Docker Hub login (optional for local development)

### Verify Installation
Open PowerShell and run:
```powershell
docker --version
docker info
```

Expected output:
```
Docker version 24.0.x, build xxxxxxx
```

## Step 3: Enable Kubernetes in Docker Desktop

### Enable Kubernetes
1. **Click**: Docker Desktop system tray icon
2. **Select**: "Settings" (gear icon)
3. **Go to**: "Kubernetes" tab
4. **Check**: ✅ "Enable Kubernetes"
5. **Check**: ✅ "Deploy Docker Stacks to Kubernetes by default"
6. **Click**: "Apply & Restart"

⏱️ **Wait**: 5-10 minutes for Kubernetes to download and start

### Verify Kubernetes
```powershell
kubectl version --client
kubectl cluster-info
kubectl get nodes
```

Expected output:
```
NAME             STATUS   ROLES           AGE   VERSION
docker-desktop   Ready    control-plane   1m    v1.28.x
```

## Step 4: Configure Docker Desktop Resources

### Recommended Settings
1. **Go to**: Settings → Resources → Advanced
2. **Configure**:
   - **CPUs**: 4 (minimum)
   - **Memory**: 8 GB (minimum)
   - **Swap**: 2 GB
   - **Disk image size**: 100 GB

### Apply Changes
1. **Click**: "Apply & Restart"
2. **Wait**: For Docker Desktop to restart

## Step 5: Test Installation

### Quick Test
```powershell
# Test Docker
docker run hello-world

# Test Kubernetes
kubectl get pods --all-namespaces

# Test our deployment tools
cd C:\Users\xxcha\OneDrive\Desktop\IndorsementStuff\new
.\scripts\prepare-infrastructure.ps1 -CheckDocker
.\scripts\prepare-infrastructure.ps1 -CheckKubernetes
```

## Troubleshooting

### Common Issues

#### Issue: "Docker Desktop failed to start"
**Solution**: 
1. Enable Windows features: Hyper-V and Containers
2. Restart computer
3. Run Docker Desktop as Administrator

#### Issue: "Kubernetes is starting..." (stuck)
**Solution**:
1. Reset Kubernetes: Settings → Kubernetes → Reset Kubernetes Cluster
2. Wait 10-15 minutes for fresh installation
3. Restart Docker Desktop

#### Issue: "WSL 2 installation is incomplete"
**Solution**:
```powershell
# Run in Administrator PowerShell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Restart computer
# Download and install WSL2 Linux kernel update package from Microsoft
```

#### Issue: "Not enough resources"
**Solution**:
1. Close other applications
2. Increase Docker Desktop memory allocation
3. Free up disk space (20+ GB recommended)

## Verification Checklist

After installation, verify everything works:

- [ ] Docker Desktop starts successfully
- [ ] Docker commands work (`docker --version`)
- [ ] Kubernetes is enabled and running
- [ ] kubectl commands work (`kubectl get nodes`)
- [ ] Resource allocation is sufficient (8GB+ RAM)
- [ ] No error messages in Docker Desktop

## Next Steps

Once Docker Desktop with Kubernetes is running:

1. **Test local deployment**:
   ```powershell
   .\scripts\prepare-infrastructure.ps1 -SetupLocal
   ```

2. **Run deployment checker**:
   ```powershell
   .\scripts\deployment-checker.ps1 -CheckReadiness
   ```

3. **Proceed to credential configuration**

---

**Need Help?** 
- Docker Desktop Documentation: https://docs.docker.com/desktop/
- Kubernetes Documentation: https://kubernetes.io/docs/
- Windows WSL2 Guide: https://docs.microsoft.com/en-us/windows/wsl/