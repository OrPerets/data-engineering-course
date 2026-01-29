#!/bin/bash

# PlantUML Diagram Renderer
# This script renders all PlantUML diagrams from the diagrams folder

echo "🎨 PlantUML Diagram Renderer"
echo "=============================="

# Set Java path - try multiple common locations
PLANTUML_JAR="diagrams/plantuml.jar"

# Try to find Java in common locations
JAVA_PATH=""
if [ -f "/opt/homebrew/Cellar/openjdk/25.0.1/libexec/openjdk.jdk/Contents/Home/bin/java" ]; then
    JAVA_PATH="/opt/homebrew/Cellar/openjdk/25.0.1/libexec/openjdk.jdk/Contents/Home/bin/java"
elif [ -f "/opt/homebrew/Cellar/openjdk/25/bin/java" ]; then
    JAVA_PATH="/opt/homebrew/Cellar/openjdk/25/bin/java"
elif command -v java &> /dev/null && java -version &> /dev/null; then
    JAVA_PATH=$(command -v java)
else
    # Try to find any openjdk installation
    JAVA_CANDIDATE=$(find /opt/homebrew/Cellar -name "java" -type f -path "*/openjdk/*/libexec/openjdk.jdk/Contents/Home/bin/java" 2>/dev/null | head -1)
    if [ -n "$JAVA_CANDIDATE" ] && [ -f "$JAVA_CANDIDATE" ]; then
        JAVA_PATH="$JAVA_CANDIDATE"
    fi
fi

# Check if Java was found
if [ -z "$JAVA_PATH" ] || [ ! -f "$JAVA_PATH" ]; then
    echo "❌ Java not found"
    echo "💡 Please install Java via Homebrew: brew install openjdk"
    echo "   Or update the JAVA_PATH in this script"
    exit 1
fi

if [ ! -f "$PLANTUML_JAR" ]; then
    echo "❌ PlantUML jar not found. Downloading..."
    curl -L -o diagrams/plantuml.jar https://github.com/plantuml/plantuml/releases/download/v1.2024.8/plantuml-1.2024.8.jar
    if [ $? -ne 0 ]; then
        echo "❌ Failed to download PlantUML jar"
        exit 1
    fi
fi


echo "📁 Found PlantUML files (diagrams/ and subfolders):"
find diagrams -name "*.puml" -type f 2>/dev/null | while read -r f; do echo "   $f"; done

echo ""
echo "🖼️  Rendering diagrams to PNG..."

# Render all .puml files in diagrams/ and subfolders
rendered_count=0
failed_count=0

while IFS= read -r -d '' file; do
    filename=$(basename "$file" .puml)
    dir=$(dirname "$file")
    echo "Rendering: $file"
    $JAVA_PATH -jar "$PLANTUML_JAR" "$file"
    if [ $? -eq 0 ]; then
        echo "✅ Generated: $dir/$filename.png"
        ((rendered_count++))
    else
        echo "❌ Failed: $file"
        ((failed_count++))
    fi
done < <(find diagrams -name "*.puml" -type f -print0 2>/dev/null)

echo ""
echo "🎉 Rendering complete!"
echo "📊 Summary:"
echo "   ✅ Successfully rendered: $rendered_count diagrams"
echo "   ❌ Failed: $failed_count diagrams"
echo ""
echo "📁 Check 'diagrams/' and subfolders for .png files"
echo ""
echo "📋 Generated files:"
find diagrams -name "*.png" -type f 2>/dev/null | while read -r f; do echo "   $f ($(wc -c < "$f" 2>/dev/null) bytes)"; done

# Create a summary file
echo "📝 Creating summary file..."
cat > diagrams/RENDER_SUMMARY.md << EOF
# PlantUML Diagrams Render Summary

Generated on: $(date)

## Summary
- Total diagrams processed: $((rendered_count + failed_count))
- Successfully rendered: $rendered_count
- Failed: $failed_count

## Generated Files
$(find diagrams -name "*.png" -type f 2>/dev/null | while read -r f; do echo "- $f"; done)

## Source Files
$(find diagrams -name "*.puml" -type f 2>/dev/null | while read -r f; do echo "- $f"; done)
EOF

echo "✅ Summary saved to: diagrams/RENDER_SUMMARY.md"
