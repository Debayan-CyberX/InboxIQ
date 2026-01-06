# Troubleshooting White Screen Issues

## Quick Fixes

### 1. Restart the Dev Server
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### 2. Clear Browser Cache
- Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac) to hard refresh
- Or open DevTools (F12) → Application → Clear Storage → Clear site data

### 3. Check Browser Console
1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for red error messages
4. Common errors:
   - Module not found → Run `npm install`
   - Syntax errors → Check the file mentioned
   - Network errors → Check if server is running

### 4. Verify Dev Server is Running
- Check terminal for: `Local: http://localhost:8080`
- Make sure port 8080 is not blocked
- Try accessing: `http://localhost:8080`

### 5. Check for Missing Dependencies
```bash
npm install
```

### 6. Verify Environment Variables
Make sure `.env.local` exists in the project root:
```env
VITE_SUPABASE_URL=your_url_here
VITE_SUPABASE_ANON_KEY=your_key_here
```

## Common Issues

### White Screen with No Errors
- **Cause**: React app failed to mount
- **Fix**: Check `src/main.tsx` and `src/App.tsx` for syntax errors

### Module Not Found Errors
- **Cause**: Missing npm packages
- **Fix**: Run `npm install`

### Port Already in Use
- **Cause**: Another process using port 8080
- **Fix**: 
  ```bash
  # Kill process on port 8080 (Windows)
  netstat -ano | findstr :8080
  taskkill /PID <PID> /F
  
  # Or change port in vite.config.ts
  ```

### CSS Not Loading
- **Cause**: Tailwind not configured properly
- **Fix**: Check `tailwind.config.ts` and `postcss.config.js`

## Still Not Working?

1. **Delete node_modules and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check Vite build**:
   ```bash
   npm run build
   ```

3. **Check for TypeScript errors**:
   ```bash
   npx tsc --noEmit
   ```

4. **Check browser compatibility**: Make sure you're using a modern browser (Chrome, Firefox, Edge)

## Getting Help

If none of these work, check:
- Browser console for specific error messages
- Terminal output for build errors
- Network tab in DevTools for failed requests










