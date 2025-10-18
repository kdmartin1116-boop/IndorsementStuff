# 🔐 Credential Configuration Guide

This guide will walk you through setting up all required credentials for the Indorsement Platform production deployment.

## 📋 **Quick Start**

Run the interactive credential manager:
```powershell
.\scripts\configure-credentials.ps1 -InteractiveSetup
```

Or configure specific services:
```powershell
# Configure OAuth only
.\scripts\configure-credentials.ps1 -ConfigureOAuth

# Configure cloud services only
.\scripts\configure-credentials.ps1 -ConfigureCloud

# Show all setup guides
.\scripts\configure-credentials.ps1 -ShowGuides

# Validate all credentials
.\scripts\configure-credentials.ps1 -ValidateAll
```

---

## 🔑 **OAuth Setup (Required)**

### Google OAuth 2.0
1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**: "Indorsement Platform"
3. **Enable APIs**:
   - Google+ API
   - Gmail API (for email verification)
4. **Configure OAuth Consent Screen**:
   - User Type: External
   - App Name: Indorsement Platform
   - User Support Email: your-email@domain.com
5. **Create OAuth Credentials**:
   - Type: Web Application
   - Name: Indorsement Web App
   - Redirect URIs:
     - `http://localhost:3000/auth/google/callback`
     - `https://api.indorsement.com/auth/google/callback`
6. **Save Client ID & Secret**

### Microsoft OAuth 2.0
1. **Go to Azure Portal**: https://portal.azure.com/
2. **Register Application**:
   - Azure AD → App registrations → New registration
   - Name: Indorsement Platform
   - Account types: Any organizational directory + personal Microsoft accounts
   - Redirect URI: `https://api.indorsement.com/auth/microsoft/callback`
3. **Create Client Secret**:
   - Certificates & secrets → New client secret
   - Description: Indorsement App Secret
   - Expires: 24 months
4. **Configure Permissions**:
   - API permissions → Microsoft Graph → Delegated
   - Add: User.Read, profile, openid, email

---

## ☁️ **Cloud Services Setup**

### AWS (Recommended)
1. **Create AWS Account**: https://aws.amazon.com/
2. **Create IAM User**:
   - User name: `indorsement-app`
   - Access type: Programmatic access
3. **Attach Policies**:
   - AmazonS3FullAccess
   - AmazonSESFullAccess
   - CloudWatchLogsFullAccess
4. **Create S3 Bucket**:
   - Name: `indorsement-documents-prod`
   - Region: `us-east-1`
   - Block public access: Enabled
5. **Save Access Keys**

### Azure (Alternative)
1. **Create Azure Account**: https://portal.azure.com/
2. **Create Service Principal**:
   - Azure AD → App registrations → New
3. **Create Storage Account**:
   - Name: `indorsementstorage`
   - Create container: `documents`

---

## 🌐 **External Services Setup**

### SendGrid (Email Service) - Required
1. **Create Account**: https://sendgrid.com/
2. **Create API Key**:
   - Settings → API Keys → Create API Key
   - Name: Indorsement Platform
   - Permissions: Full Access or Mail Send
3. **Verify Sender**: Configure domain or email authentication

### OpenAI (AI Features) - Optional
1. **Create Account**: https://platform.openai.com/
2. **Create API Key**:
   - API Keys → Create new secret key
   - Name: Indorsement Platform
3. **Set Usage Limits**: Configure monthly spending limits

### Monitoring Services - Optional

#### Sentry (Error Tracking)
1. **Sign up**: https://sentry.io/
2. **Create Project**: "Indorsement Platform"
3. **Copy DSN**: `https://xxxxx@sentry.io/xxxxx`

#### Mixpanel (Analytics)
1. **Sign up**: https://mixpanel.com/
2. **Create Project**: "Indorsement Platform"
3. **Copy Project Token**

---

## ✅ **Credential Validation**

The configuration script will validate:

✅ **OAuth Credentials**:
- Google Client ID format: `*.apps.googleusercontent.com`
- Microsoft Client ID format: UUID
- Client secrets are not empty

✅ **Cloud Services**:
- AWS Access Key format: `AKIA*` (20 chars)
- AWS Secret Key: 40+ characters
- S3 bucket name format

✅ **External Services**:
- SendGrid API Key format: `SG.*`
- OpenAI API Key format: `sk-*`
- Service URLs and tokens

---

## 🔒 **Security Best Practices**

1. **Environment Variables**: All secrets stored in `.env.production`
2. **Kubernetes Secrets**: Deployed as encrypted secrets
3. **Access Control**: Minimal required permissions
4. **Key Rotation**: Regular rotation of API keys
5. **Monitoring**: Track API usage and errors

---

## 🚨 **Troubleshooting**

### Common Issues:

**OAuth Redirect Mismatch**:
- Ensure redirect URIs match exactly
- Include both localhost (dev) and production URLs

**AWS Permission Denied**:
- Verify IAM user has required policies
- Check access key format and region

**SendGrid Authentication Failed**:
- Verify API key permissions
- Check sender verification status

**Environment File Not Found**:
- Run from project root directory
- Ensure `.env.production` exists

### Getting Help:

1. **Check Logs**: Review service-specific error logs
2. **Test Connectivity**: Use service health check endpoints
3. **Validate Format**: Ensure credential formats match requirements
4. **Contact Support**: Reach out to service providers for API issues

---

## 📝 **Configuration Files**

After setup, credentials will be stored in:

- **Environment**: `.env.production`
- **Kubernetes**: `deployment/k8s/secrets.yaml`
- **Docker**: Mounted as environment variables

All files are git-ignored for security.

---

## 🎯 **Next Steps**

After credential configuration:

1. ✅ **Validate All**: Run validation script
2. 🌐 **Domain Setup**: Configure SSL certificates
3. 🚀 **Deploy**: Execute deployment scripts
4. 🔍 **Monitor**: Check application health