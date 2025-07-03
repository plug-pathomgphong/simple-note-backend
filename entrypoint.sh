echo "Running Prisma migrate..."
npx prisma migrate deploy
npx prisma generate

echo "Starting app..."
node dist/main