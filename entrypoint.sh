#!/bin/sh

echo "🔁 Running Prisma migrate..."
npx prisma migrate deploy

#echo "🧬 Generating Prisma Client..."
#npx prisma generate

echo "🚀 Starting app..."
exec node dist/main.js
echo "App started successfully."