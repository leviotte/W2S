#!/bin/bash

# Frontend folders
mkdir -p src/app/api/amazon
mkdir -p src/components/amazon
mkdir -p src/components/bol
mkdir -p src/components/shared/ui
mkdir -p src/components/chat
mkdir -p src/components/event
mkdir -p src/components/profile
mkdir -p src/components/routes
mkdir -p src/components/ui
mkdir -p src/lib
mkdir -p src/hooks
mkdir -p src/services
mkdir -p src/store/slices
mkdir -p src/types
mkdir -p src/utils
mkdir -p public/images

# Backend folders (API/functions)
mkdir -p functions
mkdir -p src/batchProcessing
mkdir -p src/config
mkdir -p src/middlewares
mkdir -p src/routes
mkdir -p src/services
mkdir -p src/utils

# Optional: init some placeholder files so git tracks them
touch src/app/api/amazon/.gitkeep
touch src/components/amazon/.gitkeep
touch src/components/bol/.gitkeep
touch src/components/shared/ui/.gitkeep
touch src/components/chat/.gitkeep
touch src/components/event/.gitkeep
touch src/components/profile/.gitkeep
touch src/components/routes/.gitkeep
touch src/components/ui/.gitkeep
touch src/lib/.gitkeep
touch src/hooks/.gitkeep
touch src/services/.gitkeep
touch src/store/slices/.gitkeep
touch src/types/.gitkeep
touch src/utils/.gitkeep
touch public/images/.gitkeep
touch functions/.gitkeep
touch src/batchProcessing/.gitkeep
touch src/config/.gitkeep
touch src/middlewares/.gitkeep
touch src/routes/.gitkeep
touch src/services/.gitkeep
touch src/utils/.gitkeep

echo "Folders and placeholders created successfully."
