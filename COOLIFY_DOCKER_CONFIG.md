# Coolify Docker Configuration Fix

## Issue
Coolify is auto-detecting the project as Node.js and using Nixpacks with Node.js 18 instead of our Dockerfile with Node.js 22.

## Solution
Force Coolify to use Docker build mode:

### Steps in Coolify Dashboard:

1. **Go to Project Settings**
   - Navigate to your MEMOPYK project in Coolify
   - Click on the "Configuration" tab

2. **Change Build Pack**
   - Look for "Build Pack" or "Build Method" setting
   - Change from "Nixpacks" to "Docker" or "Dockerfile"
   - If you see "Auto-detect", disable it and select "Docker" explicitly

3. **Verify Settings**
   - Ensure "Dockerfile" is selected as build method
   - Confirm the Dockerfile path is set to `./Dockerfile` (default)

4. **Deploy with Docker**
   - Save configuration changes
   - Click "Deploy" to trigger new build with Dockerfile

### Expected Result:
- Build will use Node.js 22 (from Dockerfile)
- Static files will serve correctly
- import.meta.dirname will work properly
- Site will be accessible at new.memopyk.com

### Latest Commit:
- Commit `dbde6fa` includes all deployment fixes
- Ready for Docker build deployment