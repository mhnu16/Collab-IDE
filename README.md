# Collab-IDE

Collab-IDE is a collaborative IDE web application that allows multiple users to code together in real-time.

## Project Structure

The project is divided into two main parts:

1. `frontend`: This is the client-side of the application, built with Vite, React and TypeScript. It contains everything related to what the user can see in the browser.

2. `backend`: This is the server-side of the application, written in Python. It includes various modules like `api`, `database`, and `utils`. The `api` module contains the servers that handle the requests from the frontend. The `database` module contains the database models and provides an interface to interact with the database. The `utils` module contains utilities like constants.

## Prerequisites

Before you begin, ensure you have met the following requirements:
- You have a Windows machine.
- You have [Node.js/NPM](https://nodejs.org/en/download/) installed and **added to your PATH**. Developed using NPM v10.5.0, May not work with older versions.
- You have [Python](https://www.python.org/downloads/) installed and **added to your PATH**. Developed using Python 3.12.2, May not work with older versions.

## Getting Started

To get started with the project, follow these steps:

1. Clone this repository to your local machine.

2. Run the [install_dependencies.py](install_dependencies.py) script to automatically install the required dependencies for the project. This script will install the required Python packages and Node.js packages and download the required nginx version.

3. [(*)]() Run the [main.py](main.py) script to start the development server. This script will start nginx, the flask server and the vite development server.

4. Navigate to https://localhost in your browser. You should see the Collab-IDE homepage or the Login page.

#### (*) Note: Alternatively, you can run the following commands manually, each in a separate terminal window:
Setup the backend:
```bash
pip install -r requirements.txt
cd backend/src
python main.py
```
Setup the frontend:
```bash
npm install
cd frontend
npm run dev
```
Run the nginx server:
```bash
cd nginx-1.25.4
./nginx -c ../nginx.conf
```