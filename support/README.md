# Git hooks script

## Automatically zip the publish directory for upload

- Move the post-commit script to the `.git/hooks` directory. From the `./support` directory:
  `cp post-commit ../.git/hooks/post-commit`
- Commit normally, the script will automatically create `chrome-extension.zip`
