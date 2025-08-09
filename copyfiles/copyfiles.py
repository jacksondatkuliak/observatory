import os
import shutil
import time

SOURCE_DIR = r"C:\path\to\watch"
DEST_DIR = r"\\server\share\path"  # network share UNC path
CHECK_INTERVAL = 10  # seconds between checks

def copy_missing_files():
    for root, dirs, files in os.walk(SOURCE_DIR):
        # Map source root to destination root
        rel_path = os.path.relpath(root, SOURCE_DIR)
        dest_root = os.path.normpath(os.path.join(DEST_DIR, rel_path))

        # Ensure destination directory exists
        if not os.path.exists(dest_root):
            try:
                os.makedirs(dest_root)
                print(f"Created directory: {dest_root}")
            except Exception as e:
                print(f"Error creating directory {dest_root}: {e}")

        # Copy any missing files
        for file in files:
            src_file = os.path.join(root, file)
            dest_file = os.path.join(dest_root, file)
            if not os.path.exists(dest_file):
                try:
                    shutil.copy2(src_file, dest_file)
                    print(f"Copied: {src_file} → {dest_file}")
                except Exception as e:
                    print(f"Error copying {src_file}: {e}")

if __name__ == "__main__":
    print(f"Syncing {SOURCE_DIR} → {DEST_DIR} every {CHECK_INTERVAL} seconds...")
    while True:
        copy_missing_files()
        time.sleep(CHECK_INTERVAL)
