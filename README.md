# Meme-Folder
Meme-Folder is designed to be a clean, easy-to-use gallery viewer for videos, GIFs, and images (displayed in a masonry layout). It lets you organize your media using tags and quickly filter or manage them.

You can easily add or remove tags from any photo and search using those tags. The app supports union search, which displays all items that contain at least one of the selected tags. If you toggle off union search, it will display only the items that contain all selected tags — the main feature I wanted but couldn’t find anywhere else.

You can ctrl + c or right click copy image to put the file in clipboard so you find your reaction and send them to your chat of choice

<img width="1000" height="755" alt="image" src="https://github.com/user-attachments/assets/3f844693-a38f-4b39-9705-e84b418dfcc2" />
<img width="1010" height="761" alt="image" src="https://github.com/user-attachments/assets/f3b13235-1302-41fb-8071-92720c53c54b" />

Known bugs
- Sometimes videos stutter or clip due to the React loading library.

Planned features
- Improved path-input interface:
  - “Open file” button that opens a folder using the Windows Explorer dialog
  - Cleaner path display (likely using breadcrumbs)
- App registration with Microsoft so antivirus warnings stop appearing
- Ability to add a photo from a URL and have it automatically downloaded into the selected folder
- Drag-and-drop support for adding images directly into the current folder
- “Hide” option for each image, along with a setting to toggle visibility of hidden items
- Option to merge all “favorite” folders into a single unified view
- AI integration to scan media and suggest tags automatically

Annoying stuff that i'm still trying to find solutions for
- Wails currently loads all files through the server layer, which uses a lot of processing power for large files. This creates limitations.

Eventual solution:
- Migrate to Tauri, which uses the assets protocol (though I’m not a fan of Rust)
- Wait for Wails to add support for the assets protocol
- Switch to the Qt framework

Windows Defender Exclusion (because the app it's using the terminal for clipboard):
1. Open Windows Security
2. Virus & threat protection → Manage settings
3. Scroll down to Exclusions → Add or remove exclusions
4. Click Add an exclusion → Folder
5. Add your entire project folder: C:\Users\gabe\projects\meme-folder-\
This tells Defender to ignore everything in that folder.
