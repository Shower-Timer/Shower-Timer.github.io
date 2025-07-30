# Deployment Guide

This project uses GitHub Actions for CI/CD deployment to GitHub Pages.

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to your repository settings on GitHub
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select "GitHub Actions"
4. This will enable the GitHub Actions workflow to deploy to Pages

### 2. Repository Settings

Make sure your repository has the following settings:

- **Repository name**: `Shower-Timer.github.io` (for custom domain) or any name
- **Visibility**: Public (required for GitHub Pages with free accounts)
- **Branch**: `main` or `master` (the workflow supports both)

### 3. GitHub Actions Workflow

The workflow file `.github/workflows/deploy.yml` is already configured and will:

- **Trigger**: On push/PR to main/master branch with changes in `web-app/` directory
- **Build**: Install dependencies, run linting, formatting checks, and build the React app
- **Deploy**: Automatically deploy to GitHub Pages on successful build

### 4. Manual Deployment

To manually trigger a deployment:

1. Make changes to files in the `web-app/` directory
2. Commit and push to the main/master branch
3. The workflow will automatically run and deploy

### 5. Viewing the Deployment

- **Live site**: https://macmichael01.github.io/Shower-Timer.github.io
- **Workflow status**: Check the "Actions" tab in your GitHub repository
- **Deployment logs**: Available in the Actions tab for debugging

## Workflow Features

- **Path-based triggers**: Only runs when `web-app/` files change
- **Quality checks**: Runs linting and formatting checks before build
- **Caching**: Uses npm cache for faster builds
- **Concurrency control**: Prevents multiple deployments running simultaneously
- **Environment protection**: Uses GitHub Pages environment for deployment

## Troubleshooting

### Common Issues

1. **Build fails**: Check the Actions tab for error logs
2. **Deployment not working**: Ensure GitHub Pages is enabled with "GitHub Actions" source
3. **Site not updating**: Check if the workflow completed successfully
4. **Permission errors**: Ensure the repository has proper permissions for GitHub Actions

### Local Testing

Before pushing, test locally:

```bash
cd web-app
npm install
npm run lint:check
npm run format:check
npm run build
```

## File Structure

```
Shower-Timer.github.io/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD workflow
├── web-app/                    # React application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── android-app/                # Ignored by deployment
├── bluetooth-arduino/          # Ignored by deployment
└── README.md
```

The workflow only processes the `web-app/` directory and ignores the Android and Bluetooth folders as requested. 