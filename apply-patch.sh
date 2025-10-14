#!/bin/bash
# Apply the patch to fix interactive prompts in GitHub Actions

echo "Applying patch to fix interactive prompts in GitHub Actions..."
git apply fix-interactive-prompt.patch

if [ $? -eq 0 ]; then
  echo "Patch applied successfully!"
else
  echo "Failed to apply patch. Please check the patch file and try again."
  exit 1
fi

echo "Done!"
