<img src="extension/Images/icon.iconset/icon_1024.png" width="237" alt="App icon" align="left"/>

<div>
<h3>Windowed - for Apple Safari</h3>
<p>
  Changes fullscreen buttons to go into a popup. 
  It has the same functionality as the <a href="https://chromewebstore.google.com/detail/windowed-floating-youtube/gibipneadnbflmkebnmcbgjdkngkbklb">Chrome extension</a>.
  It is released with the universal arch - Apple Silicon (M-Chip) and Intel (x86_64 Chip).
  It also supports dark mode.
</p>
<a href="https://github.com/kaiyuyue/Windowed-Safari/releases"><img src="assets/macos_badge_noborder.png" width="175" alt="Download for macOS"/></a>
</div>

<br/><br/>

> [!IMPORTANT]
> The distributed app is directly compiled with the code in this repo. It **DOES NOT** collect any data from any location running in the Safari on MacOS. Same as the Chrome extension in the [original disclaimer](PrivacyPolicy.md).

## Updates

Mar 6, 2026: Support Liquid Glass on MacOS

<img width="1392" height="1161" alt="Screenshot 2026-03-07 at 12 28 19 PM" src="https://github.com/user-attachments/assets/5f264f37-9a3f-4549-90fa-a37b6a30d75b" />


## Installation

- Download the file `Windowed.app.zip` from [latest release](https://github.com/kaiyuyue/Windowed-Safari/releases).
- Unzip the file and drag it to your `Applications` folder.
- **In the Applications folder, right-click** the `Windowed.app` and select `Open`. Then it will pop up the app like this:

<p align="center">
  <img src="./assets/open.png" width=384>
  <br>
</p>

- After that, you can open the app normally.

<p align="center">
  <img src="./assets/intro.png" width=512>
  <br>
</p>

## New UI

- **Toolbar Button**

<p align="center">
  <img src="./assets/pop-up-toolbar.png">
  <br>
</p>

- **Pop-up** 

<p align="center">
  <img src="./assets/pop-up-video.png">
  <br>
</p>

- **In-Window Mode**

<p align="center">
  <img src="./assets/in-window.png">
  <br>
</p>

- **Picture-in-Picture Mode**

<p align="center">
  <img src="./assets/pic-in-pic.png">
  <br>
</p>

## Development

- Clone the repo 

```bash
git clone https://github.com/kaiyuyue/windowed-safari.git
```

- Then open the terminal and run the following command to launch xcode project

```bash
cd windowed-safari && ./xcode_run.sh
```

- It will automatically open the project in Xcode. Happy coding!

- Contributions and PRs are welcome to make it better for Safari.

> [!NOTE]
> The released extension is signed with my own Apple Developer ID without any verification from the Apple Developer Program. So it won't show up in the Apple Extension Gallery - App Store. It would be great if someone can help me to sign the extension with a verified Apple Developer ID to distribute it in the App Store. Please get in touch with me if you are willing to help. :bowtie:

## Credits

- [Windowed](https://github.com/dralletje/Windowed)
