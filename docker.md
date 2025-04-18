docker build -t my-nestjs-app .
docker run -p 3000:3000 my-nestjs-app

docker login # Log in to your Docker registry
docker tag my-nestjs-app your-dockerhub-username/my-nestjs-app # Tag your image
docker push your-dockerhub-username/my-nestjs-app # Push your image