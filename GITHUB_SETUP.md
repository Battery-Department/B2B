# GitHub Setup Guide for Battery Dashboard

## Steps to Deploy to GitHub

### 1. Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Configure your repository:
   - **Repository name**: `battery-dashboard` (or your preferred name)
   - **Description**: "B2B E-commerce platform for custom-engraved FlexVolt batteries with QR theft protection"
   - **Visibility**: Choose **Private** or **Public**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

### 2. Connect Your Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these in your terminal:

```bash
# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/battery-dashboard.git

# Verify remote was added
git remote -v

# Push your code to GitHub
git push -u origin main
```

### 3. If You Use SSH Instead of HTTPS

If you prefer SSH (recommended for regular use):

```bash
# Add GitHub as remote origin with SSH
git remote add origin git@github.com:YOUR_USERNAME/battery-dashboard.git

# Push your code
git push -u origin main
```

### 4. Set Up GitHub Secrets for Deployment

If you want to continue using Vercel deployment, add these secrets in your GitHub repository:

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:
   - `VERCEL_TOKEN` - Get from https://vercel.com/account/tokens
   - `VERCEL_ORG_ID` - Found in your Vercel project settings
   - `VERCEL_PROJECT_ID` - Found in your Vercel project settings

### 5. Create a README for GitHub

Create a `README.md` file in the root:

```markdown
# Battery Department - Custom Battery E-commerce Platform

A comprehensive B2B e-commerce platform specializing in custom-engraved FlexVolt batteries for contractors, featuring AI-powered design tools and QR-based theft protection.

## Features

- 🔋 Custom laser engraving on FlexVolt batteries
- 🛡️ QR code theft protection system
- 🤖 AI-powered design assistant
- 💰 10% deposit payment system
- 📱 Mobile-responsive design
- 🎥 360° battery preview

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **State Management**: Zustand
- **AI Integration**: Claude API
- **Database**: PostgreSQL with Prisma ORM
- **Payment**: Stripe (ready for integration)
- **Deployment**: Vercel

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Key Pages

- `/customer/design-with-ai` - AI design interface
- `/customer/engraving` - Manual battery customization
- `/customer/checkout` - Enhanced checkout with 10% deposit
- `/battery-tracking-demo` - QR protection demonstration

## Documentation

- `docs/BATTERY_DEPARTMENT_TRAINING_DATA.json` - Comprehensive business model documentation
- `docs/BATTERY_TRACKING_MODAL_GUIDE.md` - Modal component implementation guide

## License

Proprietary - All rights reserved
```

### 6. Push Everything to GitHub

After setting up the remote:

```bash
# Push all branches and tags
git push -u origin main

# Future pushes can simply use
git push
```

### 7. Recommended GitHub Settings

Once your repo is on GitHub:

1. **Branch Protection** (Settings → Branches):
   - Protect the `main` branch
   - Require pull request reviews
   - Dismiss stale reviews
   - Require status checks

2. **GitHub Actions** (Optional):
   - Set up CI/CD for automatic deployment
   - Add linting and testing workflows

3. **Issues & Projects**:
   - Enable Issues for bug tracking
   - Create a Project board for feature planning

## Common Issues & Solutions

### Permission Denied (publickey)
If you get this error with SSH:
```bash
# Test your SSH connection
ssh -T git@github.com

# If it fails, set up SSH keys:
# https://docs.github.com/en/authentication/connecting-to-github-with-ssh
```

### Large Files Warning
If you get warnings about large files:
```bash
# Check file sizes
find . -size +100M -type f

# Consider using Git LFS for large files
git lfs track "*.mp4"
```

### Existing Repository
If you already have a repository and want to change the remote:
```bash
# Remove existing remote
git remote remove origin

# Add new remote
git remote add origin YOUR_NEW_REPOSITORY_URL
```

## Next Steps

1. Set up GitHub Actions for CI/CD
2. Configure branch protection rules
3. Add collaborators if working with a team
4. Set up GitHub Pages for documentation (optional)
5. Configure webhooks for deployment notifications

## Security Notes

- Never commit `.env.local` or other environment files
- Use GitHub Secrets for sensitive variables
- Enable 2FA on your GitHub account
- Regularly review repository access

---

For more help, see the [GitHub documentation](https://docs.github.com)