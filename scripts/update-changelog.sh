#!/bin/bash

# update-changelog.sh - Updates CHANGELOG.md from YML files in ./changelogs
# Usage: ./scripts/update-changelog.sh [--clean]

set -e

CHANGELOG_DIR="./changelogs"
CHANGELOG_FILE="./CHANGELOG.md"
TEMP_FILE=$(mktemp)

# Function to extract date from filename (format: YYYY-MM-DD-HHMMSS.yml)
extract_date() {
    local filename=$(basename "$1")
    echo "${filename%.yml}" | cut -d'-' -f1-3
}

# Function to parse YML file and extract type, description, and tags
parse_yml() {
    local file="$1"
    local type=$(grep "^type:" "$file" | cut -d' ' -f2-)
    local description=$(grep "^description:" "$file" | cut -d' ' -f2-)
    
    # Extract tags (skip lines that are just "tags:" and get the list items)
    local tags=""
    local in_tags=false
    while IFS= read -r line; do
        if echo "$line" | grep -q "^tags:"; then
            in_tags=true
            continue
        fi
        if [ "$in_tags" = true ]; then
            # Check if this is a tag line (starts with "  - ")
            if echo "$line" | grep -q "^  - "; then
                local tag=$(echo "$line" | sed 's/^  - //' | tr -d ' ')
                if [ "$tag" != "None" ] && [ -n "$tag" ]; then
                    if [ -z "$tags" ]; then
                        tags="$tag"
                    else
                        tags="$tags,$tag"
                    fi
                fi
            else
                # End of tags section
                break
            fi
        fi
    done < "$file"
    
    # Format tags with brackets if they exist
    if [ -n "$tags" ]; then
        tags="[$tags] "
    fi
    
    echo "$type|$tags$description"
}

# Function to clean up YML files
clean_yml_files() {
    if [ "$1" = "--clean" ]; then
        echo "Cleaning up changelog files in $CHANGELOG_DIR..."
        rm -f "$CHANGELOG_DIR"/*.yml
        echo "Changelog files cleaned up."
        return 0
    fi
}

# Check if changelogs directory exists
if [ ! -d "$CHANGELOG_DIR" ]; then
    echo "Error: $CHANGELOG_DIR directory not found"
    exit 1
fi

# Check if CHANGELOG.md exists
if [ ! -f "$CHANGELOG_FILE" ]; then
    echo "Error: $CHANGELOG_FILE not found"
    exit 1
fi

# Find all changelog files and group by date
echo "Processing changelog files..."

# Create temporary files for grouping
DATE_TEMP=$(mktemp)
TYPE_TEMP=$(mktemp)

# Process each YML file and group by date
for yml_file in "$CHANGELOG_DIR"/*.yml; do
    if [ -f "$yml_file" ]; then
        date=$(extract_date "$yml_file")
        parsed=$(parse_yml "$yml_file")
        type=$(echo "$parsed" | cut -d'|' -f1)
        description=$(echo "$parsed" | cut -d'|' -f2)
        
        echo "$date|$type|$description" >> "$DATE_TEMP"
    fi
done

# If no YML files found, exit
if [ ! -s "$DATE_TEMP" ]; then
    echo "No changelog files found in $CHANGELOG_DIR"
    rm -f "$DATE_TEMP" "$TYPE_TEMP" "$TEMP_FILE"
    exit 0
fi

# Read the existing CHANGELOG.md and preserve the title
head -n 1 "$CHANGELOG_FILE" > "$TEMP_FILE"
echo "" >> "$TEMP_FILE"

# Get unique dates and sort them in reverse order
unique_dates=$(cut -d'|' -f1 "$DATE_TEMP" | sort -u -r)

# Process each date
for date in $unique_dates; do
    echo "## $date" >> "$TEMP_FILE"
    echo "" >> "$TEMP_FILE"
    
    # Filter entries for this date
    grep "^$date|" "$DATE_TEMP" > "$TYPE_TEMP"
    
    # Group by type for this date
    for type in "Added" "Changed" "Removed" "Fixed" "Security" "Deprecated"; do
        # Check if this type exists for this date
        if grep -q "^$date|$type|" "$TYPE_TEMP"; then
            echo "### $type" >> "$TEMP_FILE"
            
            # Extract descriptions for this type
            grep "^$date|$type|" "$TYPE_TEMP" | cut -d'|' -f3 | while read -r desc; do
                if [ -n "$desc" ]; then
                    echo "- $desc" >> "$TEMP_FILE"
                fi
            done
            echo "" >> "$TEMP_FILE"
        fi
    done
done

# Replace the original file
mv "$TEMP_FILE" "$CHANGELOG_FILE"

echo "CHANGELOG.md updated successfully!"

# Show summary
echo ""
echo "Summary:"
for date in $unique_dates; do
    count=$(grep -c "^$date|" "$DATE_TEMP" 2>/dev/null || echo "0")
    echo "  $date: $count changes"
done

# Clean up temporary files
rm -f "$DATE_TEMP" "$TYPE_TEMP"

# Clean up YML files if --clean flag was provided
if [ "$1" = "--clean" ]; then
    clean_yml_files "$1"
fi
