#!/bin/bash

# Validate changelog files
# This script checks that all changelog files in the changelogs/ directory have 'public: true'

set -e

echo "Validating changelog files..."

VALIDATION_FAILED=false

# Check if changelogs directory exists
if [ ! -d "changelogs" ]; then
    echo "Error: changelogs directory does not exist"
    exit 1
fi

# Find all changelog files
CHANGELOG_FILES=$(find changelogs -name "*.yml" -o -name "*.yaml" | sort)

if [ -z "$CHANGELOG_FILES" ]; then
    echo "No changelog files found in changelogs/ directory"
    echo "Please add at least one changelog file in the /changelogs directory"
    echo "Each changelog file must have 'public: true' set"
    exit 1
fi

echo "Found changelog files:"
echo "$CHANGELOG_FILES"
echo ""

# Validate each changelog file
for file in $CHANGELOG_FILES; do
    echo "Checking file: $file"
    
    # Check if file exists and is readable
    if [ ! -f "$file" ]; then
        echo "Error: File $file does not exist"
        VALIDATION_FAILED=true
        continue
    fi
    
    # Check for 'public: true' (case sensitive, exact match)
    if ! grep -q "^public: true$" "$file"; then
        echo "Error: File $file does not have public: true"
        echo "Current public line: $(grep '^public:' "$file" || echo 'not found')"
        VALIDATION_FAILED=true
    else
        echo "File $file is valid (public: true)"
    fi
    echo ""
done

if [ "$VALIDATION_FAILED" = true ]; then
    echo "Changelog validation failed"
    exit 1
else
    echo "All changelog files are valid"
fi
