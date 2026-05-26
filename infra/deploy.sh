#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

# Configurable Variables - Customize these for your environment
AWS_ACCOUNT_ID="123456789012"
AWS_REGION="ap-south-1"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
BACKEND_ECR_REPO="subscription-tracker-backend"
S3_BUCKET_NAME="subscription-tracker-frontend-bucket"
CLOUDFRONT_DIST_ID="E123456789ABCD"
ECS_CLUSTER_NAME="subscription-tracker-cluster"
ECS_SERVICE_NAME="subscription-tracker-service"

echo "========================================="
echo "Starting Subscription Tracker AWS Deploy"
echo "========================================="

echo "Step 1: Logging in to AWS ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

echo "Step 2: Building backend container..."
docker build -t ${BACKEND_ECR_REPO} ./backend

echo "Step 3: Tagging and pushing backend container to ECR..."
docker tag ${BACKEND_ECR_REPO}:latest ${ECR_REGISTRY}/${BACKEND_ECR_REPO}:latest
docker push ${ECR_REGISTRY}/${BACKEND_ECR_REPO}:latest

echo "Step 4: Compiling production frontend bundle..."
cd frontend
# Inject production backend API endpoint
VITE_API_URL="https://api.yourdomain.com" npm run build
cd ..

echo "Step 5: Syncing assets to AWS S3 bucket..."
aws s3 sync ./frontend/dist s3://${S3_BUCKET_NAME} --delete

echo "Step 6: Creating CloudFront cache invalidation..."
aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_DIST_ID} --paths "/*"

echo "Step 7: Forcing AWS ECS Fargate task service deployment..."
aws ecs update-service --cluster ${ECS_CLUSTER_NAME} --service ${ECS_SERVICE_NAME} --force-new-deployment

echo "========================================="
echo "Deploy Completed Successfully!"
echo "========================================="
