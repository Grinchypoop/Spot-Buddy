# Spot Buddy - Azure Deployment Guide

## Prerequisites

1. **Azure Account** - Free tier or paid subscription
2. **Azure CLI** - Install from https://docs.microsoft.com/cli/azure/install-azure-cli
3. **Git** - For pushing code to Azure
4. **Telegram Bot Token** - Already have this ✅
5. **Supabase Project** - Already have this ✅

## Step-by-Step Deployment

### 1. Prepare Your Code

```bash
cd /Users/mehtaz/Spot

# Make sure all files are committed to git
git add .
git commit -m "Prepare for Azure deployment"
```

### 2. Create Azure Resources

#### Login to Azure
```bash
az login
```

#### Create Resource Group
```bash
az group create \
  --name spot-buddy-rg \
  --location eastus
```

#### Create App Service Plan
```bash
az appservice plan create \
  --name spot-buddy-plan \
  --resource-group spot-buddy-rg \
  --sku B1 \
  --is-linux
```

#### Create Web App
```bash
az webapp create \
  --resource-group spot-buddy-rg \
  --plan spot-buddy-plan \
  --name spot-buddy-app \
  --runtime "node|18-lts"
```

### 3. Configure Environment Variables

```bash
az webapp config appsettings set \
  --resource-group spot-buddy-rg \
  --name spot-buddy-app \
  --settings \
    TELEGRAM_BOT_TOKEN="your_bot_token_here" \
    SUPABASE_URL="your_supabase_url" \
    SUPABASE_KEY="your_supabase_key" \
    PORT=3000 \
    NODE_ENV=production \
    MINI_APP_URL="https://spot-buddy-app.azurewebsites.net"
```

Replace with your actual values:
- `your_bot_token_here` - Your Telegram bot token
- `your_supabase_url` - Your Supabase URL
- `your_supabase_key` - Your Supabase anon key

### 4. Deploy Code

#### Option A: Deploy from Local Git

```bash
# Configure deployment user (one-time setup)
az webapp deployment user set \
  --user-name spot-buddy-deploy \
  --password YourSecurePassword123!

# Add Azure remote to your git repo
az webapp deployment source config-local-git \
  --resource-group spot-buddy-rg \
  --name spot-buddy-app

# This will output a git URL like:
# https://spot-buddy-deploy@spot-buddy-app.scm.azurewebsites.net/spot-buddy-app.git

# Add the remote and push
git remote add azure <git-url-from-above>
git push azure main
```

#### Option B: Deploy from GitHub (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repo to Azure:

```bash
az webapp deployment source config \
  --resource-group spot-buddy-rg \
  --name spot-buddy-app \
  --repo-url https://github.com/yourusername/spot-buddy.git \
  --branch main \
  --git-token <your_github_token>
```

### 5. Update Telegram Webhook

Get your Azure app URL:
```bash
az webapp show \
  --resource-group spot-buddy-rg \
  --name spot-buddy-app \
  --query "defaultHostName" \
  --output tsv
```

Then update your Telegram bot webhook:

```bash
WEBHOOK_URL="https://spot-buddy-app.azurewebsites.net/webhook"

curl -X POST \
  https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -d url=$WEBHOOK_URL
```

### 6. Verify Deployment

Check app status:
```bash
az webapp show \
  --resource-group spot-buddy-rg \
  --name spot-buddy-app \
  --query "state"
```

View logs:
```bash
az webapp log tail \
  --resource-group spot-buddy-rg \
  --name spot-buddy-app
```

Visit your app:
```
https://spot-buddy-app.azurewebsites.net/health
```

Should return: `{"status": "ok"}`

## Monitoring

### Enable Application Insights

```bash
az monitor app-insights component create \
  --app spot-buddy-insights \
  --location eastus \
  --resource-group spot-buddy-rg \
  --application-type web
```

### View Logs

```bash
az webapp log tail \
  --resource-group spot-buddy-rg \
  --name spot-buddy-app \
  --follow
```

## Environment Variables Reference

| Variable | Value | Notes |
|----------|-------|-------|
| TELEGRAM_BOT_TOKEN | Your bot token | Keep secret in Azure Settings |
| SUPABASE_URL | Your Supabase URL | Found in Supabase settings |
| SUPABASE_KEY | Your Supabase anon key | Found in Supabase settings |
| PORT | 3000 | Azure assigns this |
| NODE_ENV | production | For production deployment |
| MINI_APP_URL | https://spot-buddy-app.azurewebsites.net | Your Azure app URL |

## Troubleshooting

### App Not Starting
```bash
# Check logs
az webapp log tail --resource-group spot-buddy-rg --name spot-buddy-app

# Restart app
az webapp restart --resource-group spot-buddy-rg --name spot-buddy-app
```

### Webhook Not Working
- Verify webhook URL is set correctly
- Check that PORT is 3000
- Ensure /webhook endpoint is accessible

### Environment Variables Not Loading
```bash
# List current settings
az webapp config appsettings list \
  --resource-group spot-buddy-rg \
  --name spot-buddy-app
```

## Updating Code

After making changes locally:

```bash
git add .
git commit -m "Your changes"
git push azure main  # If using local git
# or
git push origin main  # If using GitHub
```

Azure will automatically deploy your changes!

## Cost Estimation (Monthly)

- **App Service Plan (B1)**: ~$15/month
- **Storage**: Minimal
- **Bandwidth**: Included
- **Total**: ~$15-20/month

## Next Steps

1. Deploy to Azure following this guide
2. Update Telegram webhook URL
3. Add bot to your groups and test
4. Monitor logs in Azure portal
5. Set up auto-scaling if needed (optional)

## Support

For Azure CLI help:
```bash
az webapp --help
az appservice plan --help
```

For Telegram API help:
- https://core.telegram.org/bots/api
- https://core.telegram.org/bots/webhooks
