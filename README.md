# Websocket Server API for remote Gatsby Build

This is a simple websocket API for triggering Gatsby builds remotely.

## Requirements

In order to run the server, you need to have the Node.js runtime installed on your machine. You can download it from [here](https://nodejs.org/en/download/).

### Clone the repository

First, you need to clone the repository to your machine.

```bash
git clone https://github.com/martinholecekmax/gatsby-websocket-api.git
```

### Install the dependencies

Then, you need to install the dependencies.

```bash
npm install
```

### Environment variables

The project uses environment variables to store the configuration. You need to either create a `.env` file in the root directory of the project or rename the `.env.example` file to `.env` and fill in the values.

You can find the list of the environment variables in the `.env.example` file.

### Bull Queue with Redis

The project implements a [Bull Queue](https://github.com/OptimalBits/bull) to handle the build requests. You need to have a Redis server running on your machine. You can download it from [here](https://redis.io/docs/getting-started/installation/).

To connect to the Redis server, you have to set the following environment variables:

```bash
REDIS_PORT=6379
REDIS_HOST='127.0.0.1'
REDIS_PASSWORD=''
```

**Note:** Use the strong password for the `REDIS_PASSWORD` variable in production.

You can test the connection to the Redis server by running the following command:

```bash
node test-redis.js
```

This command should print `Redis connection successful` if the connection was successful.

### MongoDB

To store the build logs, the project uses [MongoDB](https://www.mongodb.com/). You need to have a MongoDB server running on your machine or you can use a cloud service like [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

You can download and install MongoDB on your machine from [here](https://www.mongodb.com/download-center/community).

To connect to the MongoDB server, you have to set the following environment variables:

```bash
MONGO_DB_DATABASE=logger
MONGO_DB_USER=test
MONGO_DB_PASSWORD='password'
MONGO_DB_PORT=27017
MONGO_DB_URL=127.0.0.1
```

You can create a user in the MongoDB shell by running the following commands:

```bash
use logger
db.createUser({"user" : "test","pwd": "password","roles" : [{"role" : "read","db" : "logger"},{"role" : "readWrite","db" : "logger"}],"mechanisms" : ["SCRAM-SHA-1","SCRAM-SHA-256"]})
```

**Note:** Use the strong password for the `MONGO_DB_PASSWORD` variable in production.

### Gatsby Project

You also need to have a Gatsby project on your machine that you want to build remotely. You can start a new Gatsby project from [here](https://www.gatsbyjs.org/docs/quick-start/).

You need to set the `GATSBY_PROJECT_PATH` environment variable to the path of your Gatsby project.

This project uses the [Gatsby CLI](https://www.gatsbyjs.org/docs/gatsby-cli/) to build the Gatsby project. Make sure that you have the Gatsby CLI installed on your machine.

```bash
npm install -g gatsby-cli
```

You will also need to set the `BUILD_OUTPUT_DIR` environment variable to the path of the directory where you want to store generated static files of your Gatsby project. The build process will copy the generated static files into gatsby public directory. The public directory will be then copied into the `BUILD_OUTPUT_DIR` directory (typically `/var/www/html` on the linux server). This will be further explained in the next section.

### Project recommended structure

The project is designed to be used on the linux server because it is the most common server environment. However, you can also use it on Windows. The only difference is that you will need to use relative paths to set the environment variables. You can also use the WSL to run the server on your machine and use the linux paths. This will be explained in the detail in the this section.

#### Linux server

Typically, on the linux server, you will have the following structure:

```bash
├── /home/ubuntu/
│   ├── /gatsby-websocket-api/
│   └── /gatsby-project/
└── /var/www/html/
```

The `/var/www/html` directory is the directory where you will store the generated static files of your Gatsby project. This folder is usually the root directory of your web server.

In this case, you will have the following environment variables:

```bash
GATSBY_PROJECT_PATH=/home/ubuntu/gatsby-project
BUILD_OUTPUT_DIR=/var/www/html
```

#### Windows

If you develop on Windows, you can either use [WSL](https://docs.microsoft.com/en-us/windows/wsl/install-win10) to run the server on your machine or you can use relative paths. If you use the WSL, you can use the same environment variables as on the linux server. If you use relative paths, you need to use the relative paths to the Gatsby project and the output directory.

For example, if you have the following structure.

```bash
└── /Users/Martin/Desktop/project/
    ├── /gatsby-websocket-api/
    └── /gatsby-project/
```

You can set the following environment variables:

```bash
GATSBY_PROJECT_PATH='../gatsby-project'
BUILD_OUTPUT_DIR='../public-directory'
```

Both `GATSBY_PROJECT_PATH` and `BUILD_OUTPUT_DIR` are relative to the `gatsby-websocket-api` directory.

If you set the `BUILD_OUTPUT_DIR` to the `../public-directory` directory, the project will create the `public-directory` directory in the parent directory of the `gatsby-websocket-api` directory. Here is the structure of the parent directory after the build process:

```bash
└── /Users/Martin/Desktop/project/
    ├── /gatsby-websocket-api/
    ├── /gatsby-project/
    └── /public-directory/
```

#### Important note

The build process will delete all the files in the `BUILD_OUTPUT_DIR` directory before copying the generated static files into it. Make sure that you have correctly set the `BUILD_OUTPUT_DIR` environment variable to the directory where you want to store the generated static files, otherwise, you can lose your data.

Internally, the project uses `rm -rf` command to delete all the files in the `BUILD_OUTPUT_DIR` directory.

## Starting the build process

1.  The client sends the `POST /trigger-build` request to the server to trigger the build process.
2.  The server creates a new build log in the MongoDB database and adds the new build to the Bull queue.
3.  The server broadcasts the new build to all the connected clients.
4.  The server starts the build process job from the Bull queue. Rundown of the build process job is explained in the [Build process job](#build-process-job) section.
5.  When the build process job is finished, the server updates the build log in the MongoDB database.
6.  The server broadcasts the updated build to all the connected clients.

### Build process job

The build process does the following:

1. Clears the cache of the Gatsby project if the client sends the `clearCache` parameter in the `POST /trigger-build` request.
2. Runs the `gatsby build` command in the `GATSBY_PROJECT_PATH` directory.
3. Removes the `BUILD_OUTPUT_DIR` directory if it exists by running the `rm -rf` command.
4. Runs the `mkdir` command to create the `BUILD_OUTPUT_DIR` directory.
5. Copies the generated static files into the `BUILD_OUTPUT_DIR` directory.

**Note:** The build process uses the `rm -rf` command to delete the `BUILD_OUTPUT_DIR` directory. Make sure that you have correctly set the `BUILD_OUTPUT_DIR` environment variable to the directory where you want to store the generated static files, otherwise, you can lose your data.

### Canceling the build process

You can also cancel the build process by sending the `POST /cancel-build` request to the server. The build process will be canceled after the current step is finished except for the `gatsby build` command.

The `gatsby build` command can be canceled during the generation of a static file. In this case, the build process will be canceled immediately.

Other steps of the build process can be canceled after the current step is finished. For example, if the build process is in the `rm -rf` step, it will be canceled after the `rm -rf` command is finished.

The reason why only the `gatsby build` command can be canceled during the generation of a static file is that the `gatsby build` command is the most time-consuming step of the build process. The other steps are usually very fast and it could lead to unexpected behavior if the build process is canceled during the other steps.

Once the build process is canceled, the server will send the `buildCanceled` event to all the connected clients.

## Starting the server

To start the server, run the following command:

```bash
npm start // nodemon server.js
```

Note: The server runs `nodemon` command to start the server. If you don't have `nodemon` installed, you can install it by running the `npm install -g nodemon` command.

The server will start on the port 3001 by default. You can change the port by setting the `PORT` environment variable.

## Using the client

You can find the client code in following repository: [Gatsby Build Tracking Website](https://github.com/martinholecekmax/gatsby-build-tracking-website).

The client is a simple React application that allows you to trigger the build process and see the build logs. The client is not a part of the `gatsby-websocket-api` project. You can use the client or you can create your own client.

## Contributing

If you want to contribute to the project, you can create a pull request. If you find a bug, you can create an issue.
