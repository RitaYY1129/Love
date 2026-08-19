# GitHub Releases

This repository can build an installable Android APK on GitHub without a local
Android SDK.

## Create a release

1. Open **Actions** in the GitHub repository.
2. Select **Build Android APK and publish Release**.
3. Select **Run workflow**.
4. Enter a version such as `v0.1.0`.
5. Enter the public HTTPS backend API URL, ending in `/api`.
6. Wait for the workflow to finish.
7. Open **Releases** and download `LoveDiary-v0.1.0.apk`.

The generated APK is an internal-test build. Android may ask the user to allow
installation from the browser or file manager.

The app still needs a reachable backend for login, chat, synchronization, and
calls. For a tag-triggered release, configure the repository Actions variable
`VITE_API_BASE`.

The current internal-test default is `http://192.168.31.128:3000/api`. The
phone must be on the same Wi-Fi as the backend computer. Replace it with the
public HTTPS backend URL before sharing the APK outside the local network.
